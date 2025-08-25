import { v4 as uuidv4 } from "uuid";
import { Job } from "../../domain/entities/Job.js";
import { Document } from "../../domain/entities/Document.js";
import { ExtractionSchema } from "../../domain/entities/ExtractionSchema.js";
import { responses } from "../../utils/response.js";

/**
 * Job Controller for handling HTTP requests
 * This is part of the interfaces layer in hexagon architecture
 */
export class JobController {
  /**
   * Creates a new JobController instance
   * @param {JobRepository} jobRepository - Repository for jobs
   * @param {DocumentRepository} documentRepository - Repository for documents
   * @param {StorageService} storageService - Service for file storage
   * @param {ProcessJobUseCase} processJobUseCase - Use case for processing jobs
   */
  constructor(
    jobRepository,
    documentRepository,
    storageService,
    processJobUseCase
  ) {
    this.jobRepository = jobRepository;
    this.documentRepository = documentRepository;
    this.storageService = storageService;
    this.processJobUseCase = processJobUseCase;
  }

  /**
   * Creates a new job
   * @param {Object} event - HTTP event
   * @returns {Promise<Object>} HTTP response
   */
  async createJob(event) {
    try {
      const body = JSON.parse(event.body || "{}");
      const { name, extractionConfig, documentIds = [] } = body;

      // Validate input
      if (!name) {
        return responses.badRequest("Job name is required");
      }

      if (!extractionConfig) {
        return responses.badRequest("Extraction configuration is required");
      }

      // Create schema if provided
      if (extractionConfig.schemaType) {
        extractionConfig.schema = ExtractionSchema.createDefaultSchema(
          extractionConfig.schemaType
        );
      } else if (
        extractionConfig.schema &&
        typeof extractionConfig.schema === "object"
      ) {
        extractionConfig.schema = ExtractionSchema.fromJSON(
          extractionConfig.schema
        );
      }

      // Create job
      const job = new Job({
        id: uuidv4(),
        name,
        extractionConfig,
        documentIds,
      });

      // Validate the job
      job.validate();

      // Save the job
      const savedJob = await this.jobRepository.save(job);

      return responses.created(savedJob.toJSON(), "Job created successfully");
    } catch (error) {
      console.error("Create job error:", error);
      return responses.internalError("Internal server error", error);
    }
  }

  /**
   * Gets a job by ID
   * @param {Object} event - HTTP event
   * @returns {Promise<Object>} HTTP response
   */
  async getJob(event) {
    try {
      const jobId = event.pathParameters?.id;

      if (!jobId) {
        return responses.badRequest("Job ID is required");
      }

      const job = await this.jobRepository.findById(jobId);

      if (!job) {
        return responses.notFound("Job not found");
      }

      return responses.ok(job.toJSON());
    } catch (error) {
      console.error("Get job error:", error);
      return responses.internalError("Internal server error", error);
    }
  }

  /**
   * Lists all jobs
   * @param {Object} event - HTTP event
   * @returns {Promise<Object>} HTTP response
   */
  async listJobs(event) {
    try {
      const queryParams = event.queryStringParameters || {};
      const { limit = "50", offset = "0", status } = queryParams;

      const options = {
        limit: parseInt(limit),
        offset: parseInt(offset),
        status,
      };

      const jobs = await this.jobRepository.findAll(options);

      return responses.ok({
        jobs: jobs.map((job) => job.toJSON()),
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: jobs.length,
        },
      });
    } catch (error) {
      console.error("List jobs error:", error);
      return responses.internalError("Internal server error", error);
    }
  }

  /**
   * Processes a job
   * @param {Object} event - HTTP event
   * @returns {Promise<Object>} HTTP response
   */
  async processJob(event) {
    try {
      const jobId = event.pathParameters?.id;

      if (!jobId) {
        return responses.badRequest("Job ID is required");
      }

      // Check if job exists
      const job = await this.jobRepository.findById(jobId);
      if (!job) {
        return responses.notFound("Job not found");
      }

      // Process the job
      const result = await this.processJobUseCase.execute(jobId);

      return responses.ok(result, "Job processed successfully");
    } catch (error) {
      console.error("Process job error:", error);
      return responses.internalError("Internal server error", error);
    }
  }

  /**
   * Uploads documents for a job
   * @param {Object} event - HTTP event
   * @returns {Promise<Object>} HTTP response
   */
  async uploadDocuments(event) {
    try {
      const jobId = event.pathParameters?.id;
      const body = JSON.parse(event.body || "{}");
      const { documents = [] } = body;

      if (!jobId) {
        return responses.badRequest("Job ID is required");
      }

      if (!Array.isArray(documents) || documents.length === 0) {
        return responses.badRequest("Documents array is required");
      }

      // Check if job exists
      const job = await this.jobRepository.findById(jobId);
      if (!job) {
        return responses.notFound("Job not found");
      }

      const uploadedDocuments = [];

      // Process each document
      for (const docData of documents) {
        const { name, content, contentType = "text/plain", source } = docData;

        if (!name || !content) {
          continue; // Skip invalid documents
        }

        // Create document
        const document = new Document({
          id: uuidv4(),
          name,
          content,
          contentType,
          source,
        });

        // Validate and save document
        document.validate();
        const savedDocument = await this.documentRepository.save(document);
        uploadedDocuments.push(savedDocument);

        // Add document ID to job
        job.documentIds.push(savedDocument.id);
      }

      // Update job with new document IDs
      await this.jobRepository.save(job);

      return responses.ok(
        {
          uploadedDocuments: uploadedDocuments.map((doc) => doc.toJSON()),
          totalDocuments: job.documentIds.length,
        },
        `${uploadedDocuments.length} documents uploaded successfully`
      );
    } catch (error) {
      console.error("Upload documents error:", error);
      return responses.internalError("Internal server error", error);
    }
  }
}
