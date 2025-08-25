import { Extraction } from "../../domain/entities/Extraction.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Use Case: Create Extraction
 * Orchestrates the creation of a new extraction
 * This is part of the application layer in hexagon architecture
 */
export class CreateExtractionUseCase {
  /**
   * Creates a new CreateExtractionUseCase instance
   * @param {ExtractionRepository} extractionRepository - Repository for extractions
   * @param {ExtractionService} extractionService - Service for processing extractions
   * @param {StorageService} storageService - Service for file storage
   */
  constructor(extractionRepository, extractionService, storageService) {
    this.extractionRepository = extractionRepository;
    this.extractionService = extractionService;
    this.storageService = storageService;
  }

  /**
   * Executes the create extraction use case
   * @param {Object} request - The extraction request
   * @param {string} request.text - Text content to extract from
   * @param {string} request.fileName - File name to extract from (optional)
   * @param {string} request.extractionType - Type of extraction to perform
   * @returns {Promise<Extraction>} The created extraction
   */
  async execute(request) {
    const { text, fileName, extractionType = "full" } = request;

    // Validate input
    if (!text && !fileName) {
      throw new Error("Either text or fileName is required");
    }

    // Get text content
    let textContent = text;
    if (fileName) {
      textContent = await this.storageService.readFile(fileName);
    }

    // Create extraction entity
    const extraction = new Extraction({
      id: uuidv4(),
      text: textContent,
      extractionType,
      status: "processing",
    });

    // Validate the entity
    extraction.validate();

    // Process the extraction
    try {
      const result = await this.extractionService.processExtraction(
        textContent,
        extractionType
      );

      extraction.markCompleted(result);
    } catch (error) {
      extraction.markFailed(error.message);
    }

    // Save to repository
    const savedExtraction = await this.extractionRepository.save(extraction);

    return savedExtraction;
  }
}
