import { v4 as uuidv4 } from "uuid";
import { getConfig } from "../../config/app.config.js";

/**
 * Use Case for Processing Jobs
 * Orchestrates the complete document processing workflow
 * This is part of the application layer in hexagon architecture
 */
export class ProcessJobUseCase {
  /**
   * Creates a new ProcessJobUseCase instance
   * @param {JobRepository} jobRepository - Repository for jobs
   * @param {DocumentRepository} documentRepository - Repository for documents
   * @param {StorageService} storageService - Service for file storage
   * @param {ExtractorProvider} extractorProvider - Provider for extraction
   * @param {OutputService} outputService - Service for output
   */
  constructor(
    jobRepository,
    documentRepository,
    storageService,
    extractorProvider,
    outputService
  ) {
    this.jobRepository = jobRepository;
    this.documentRepository = documentRepository;
    this.storageService = storageService;
    this.extractorProvider = extractorProvider;
    this.outputService = outputService;
  }

  /**
   * Executes the job processing use case
   * @param {string} jobId - The job ID to process
   * @returns {Promise<Object>} Processing result
   */
  async execute(jobId) {
    const startTime = Date.now();

    try {
      // 1. Get the job
      const job = await this.jobRepository.findById(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      // 2. Mark job as processing
      job.markProcessing();
      await this.jobRepository.save(job);

      // 3. Get documents for the job
      const documents = await this.getDocumentsForJob(job);
      if (documents.length === 0) {
        throw new Error(`No documents found for job ${jobId}`);
      }

      // 4. Process documents with batching and backpressure
      const results = await this.processDocuments(job, documents);

      // 5. Write results to output
      const outputMetadata = await this.outputService.writeResults(
        jobId,
        results
      );

      // 6. Mark job as completed
      const processingResult = {
        jobId,
        totalDocuments: documents.length,
        processedDocuments: results.length,
        failedDocuments: documents.length - results.length,
        processingTime: Date.now() - startTime,
        outputMetadata,
      };

      job.markCompleted(processingResult);
      await this.jobRepository.save(job);

      return processingResult;
    } catch (error) {
      console.error(`Job processing failed for ${jobId}:`, error);

      // Mark job as failed
      const job = await this.jobRepository.findById(jobId);
      if (job) {
        job.markFailed(error.message);
        await this.jobRepository.save(job);
      }

      throw error;
    }
  }

  /**
   * Gets documents for a job
   * @param {Job} job - The job
   * @returns {Promise<Array<Document>>} Array of documents
   */
  async getDocumentsForJob(job) {
    if (job.documentIds.length === 0) {
      return [];
    }

    return await this.documentRepository.findByIds(job.documentIds);
  }

  /**
   * Processes documents with batching and backpressure
   * @param {Job} job - The job
   * @param {Array<Document>} documents - Array of documents
   * @returns {Promise<Array<Object>>} Array of processing results
   */
  async processDocuments(job, documents) {
    const maxBatchSize = getConfig("batching.maxBatchSize", 100);
    const maxConcurrentBatches = getConfig("batching.maxConcurrentBatches", 10);
    const maxConcurrentWorkers = getConfig(
      "concurrency.maxConcurrentWorkers",
      50
    );
    const rateLimitPerSecond = getConfig("concurrency.rateLimitPerSecond", 100);

    // Create batches
    const batches = this.createBatches(documents, maxBatchSize);
    const results = [];

    // Process batches with concurrency control
    for (let i = 0; i < batches.length; i += maxConcurrentBatches) {
      const batchGroup = batches.slice(i, i + maxConcurrentBatches);

      // Process batch group concurrently
      const batchPromises = batchGroup.map((batch) =>
        this.processBatch(job, batch, maxConcurrentWorkers, rateLimitPerSecond)
      );

      const batchResults = await Promise.allSettled(batchPromises);

      // Collect results
      batchResults.forEach((result) => {
        if (result.status === "fulfilled") {
          results.push(...result.value);
        } else {
          console.error("Batch processing failed:", result.reason);
        }
      });

      // Apply backpressure if needed
      await this.applyBackpressure();
    }

    return results;
  }

  /**
   * Creates batches from documents
   * @param {Array<Document>} documents - Array of documents
   * @param {number} batchSize - Size of each batch
   * @returns {Array<Array<Document>>} Array of batches
   */
  createBatches(documents, batchSize) {
    const batches = [];
    for (let i = 0; i < documents.length; i += batchSize) {
      batches.push(documents.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Processes a batch of documents
   * @param {Job} job - The job
   * @param {Array<Document>} batch - Batch of documents
   * @param {number} maxConcurrentWorkers - Maximum concurrent workers
   * @param {number} rateLimitPerSecond - Rate limit per second
   * @returns {Promise<Array<Object>>} Array of processing results
   */
  async processBatch(job, batch, maxConcurrentWorkers, rateLimitPerSecond) {
    const results = [];
    const rateLimiter = this.createRateLimiter(rateLimitPerSecond);

    // Process documents with concurrency control
    for (let i = 0; i < batch.length; i += maxConcurrentWorkers) {
      const workerGroup = batch.slice(i, i + maxConcurrentWorkers);

      // Process worker group concurrently
      const workerPromises = workerGroup.map(async (document) => {
        await rateLimiter();
        return this.processDocument(job, document);
      });

      const workerResults = await Promise.allSettled(workerPromises);

      // Collect results
      workerResults.forEach((result) => {
        if (result.status === "fulfilled" && result.value) {
          results.push(result.value);
        } else if (result.status === "rejected") {
          console.error("Document processing failed:", result.reason);
        }
      });
    }

    return results;
  }

  /**
   * Processes a single document
   * @param {Job} job - The job
   * @param {Document} document - The document to process
   * @returns {Promise<Object|null>} Processing result or null if failed
   */
  async processDocument(job, document) {
    const maxRetries = getConfig("retry.maxRetries", 3);
    const initialBackoffMs = getConfig("retry.initialBackoffMs", 1000);
    const maxBackoffMs = getConfig("retry.maxBackoffMs", 30000);

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Mark document as processing
        document.markProcessing();
        await this.documentRepository.save(document);

        // Process the document
        const result = await this.extractFromDocument(job, document);

        // Mark document as completed
        document.markCompleted(result);
        await this.documentRepository.save(document);

        return {
          documentId: document.id,
          documentName: document.name,
          result,
          processingTime: Date.now() - new Date(document.updatedAt).getTime(),
          attempts: attempt + 1,
        };
      } catch (error) {
        lastError = error;
        console.error(
          `Document processing failed (attempt ${attempt + 1}):`,
          error
        );

        if (attempt < maxRetries) {
          // Calculate backoff with jitter
          const backoffMs = Math.min(
            initialBackoffMs * Math.pow(2, attempt) * (1 + Math.random() * 0.1),
            maxBackoffMs
          );

          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }

    // All retries failed
    document.markFailed(lastError.message);
    await this.documentRepository.save(document);

    return null;
  }

  /**
   * Extracts data from a document using the job's extraction configuration
   * @param {Job} job - The job
   * @param {Document} document - The document
   * @returns {Promise<Object>} Extraction result
   */
  async extractFromDocument(job, document) {
    const extractionConfig = job.extractionConfig;
    let schema = extractionConfig.schema;
    const extractionType = extractionConfig.type || "schema";

    // Ensure schema is an ExtractionSchema instance
    if (
      schema &&
      typeof schema === "object" &&
      !schema.validateAndCoerceField
    ) {
      const { ExtractionSchema } = await import(
        "../../domain/entities/ExtractionSchema.js"
      );
      schema = ExtractionSchema.fromJSON(schema);
    }

    // Check if document needs chunking
    const maxChunkSize = getConfig("document.maxChunkSize", 4000);
    const enableChunking = getConfig("extraction.enableChunking", true);

    let chunks = [document.content];
    if (enableChunking && document.needsChunking(maxChunkSize)) {
      chunks = document.chunkContent(maxChunkSize);
    }

    const results = [];

    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      let chunkResult;

      switch (extractionType) {
        case "schema":
          chunkResult = await this.extractorProvider.extractWithSchema(
            chunk,
            schema
          );
          break;
        case "entities":
          chunkResult = await this.extractorProvider.extractEntities(chunk);
          break;
        case "summary":
          chunkResult = await this.extractorProvider.generateSummary(chunk);
          break;
        case "keywords":
          chunkResult = await this.extractorProvider.extractKeywords(chunk);
          break;
        default:
          throw new Error(`Unsupported extraction type: ${extractionType}`);
      }

      results.push({
        chunkIndex: i,
        chunkSize: chunk.length,
        result: chunkResult,
      });
    }

    // Combine results from all chunks
    return this.combineChunkResults(results, extractionType);
  }

  /**
   * Combines results from multiple chunks
   * @param {Array<Object>} chunkResults - Array of chunk results
   * @param {string} extractionType - Type of extraction
   * @returns {Object} Combined result
   */
  combineChunkResults(chunkResults, extractionType) {
    if (chunkResults.length === 1) {
      return chunkResults[0].result;
    }

    switch (extractionType) {
      case "schema":
        // For schema extraction, merge the data from all chunks
        const combinedData = {};
        chunkResults.forEach((chunkResult) => {
          if (chunkResult.result && chunkResult.result.data) {
            Object.assign(combinedData, chunkResult.result.data);
          }
        });
        return {
          data: combinedData,
          confidence:
            chunkResults.reduce(
              (sum, cr) => sum + (cr.result.confidence || 0),
              0
            ) / chunkResults.length,
          chunks: chunkResults.length,
        };

      case "entities":
        // For entities, concatenate all entities
        const allEntities = [];
        chunkResults.forEach((chunkResult) => {
          if (Array.isArray(chunkResult.result)) {
            allEntities.push(...chunkResult.result);
          }
        });
        return allEntities;

      case "summary":
        // For summary, use the first chunk's summary
        return chunkResults[0].result;

      case "keywords":
        // For keywords, merge and deduplicate
        const allKeywords = new Set();
        chunkResults.forEach((chunkResult) => {
          if (Array.isArray(chunkResult.result)) {
            chunkResult.result.forEach((keyword) => allKeywords.add(keyword));
          }
        });
        return Array.from(allKeywords);

      default:
        return chunkResults;
    }
  }

  /**
   * Creates a rate limiter
   * @param {number} rateLimitPerSecond - Rate limit per second
   * @returns {Function} Rate limiter function
   */
  createRateLimiter(rateLimitPerSecond) {
    const interval = 1000 / rateLimitPerSecond;
    let lastCall = 0;

    return async () => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCall;

      if (timeSinceLastCall < interval) {
        await new Promise((resolve) =>
          setTimeout(resolve, interval - timeSinceLastCall)
        );
      }

      lastCall = Date.now();
    };
  }

  /**
   * Applies backpressure if needed
   * @returns {Promise<void>}
   */
  async applyBackpressure() {
    const pressureThreshold = getConfig("backpressure.pressureThreshold", 0.8);
    const maxQueueSize = getConfig("backpressure.maxQueueSize", 1000);

    // Simple backpressure implementation
    // In a real system, you'd check actual queue sizes and processing rates
    const currentPressure = Math.random(); // Mock pressure calculation

    if (currentPressure > pressureThreshold) {
      const backoffMs = Math.random() * 1000 + 100;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
}
