/**
 * Use Case: Get Extraction
 * Orchestrates the retrieval of an extraction by ID
 * This is part of the application layer in hexagon architecture
 */
export class GetExtractionUseCase {
  /**
   * Creates a new GetExtractionUseCase instance
   * @param {ExtractionRepository} extractionRepository - Repository for extractions
   */
  constructor(extractionRepository) {
    this.extractionRepository = extractionRepository;
  }

  /**
   * Executes the get extraction use case
   * @param {string} id - The extraction ID
   * @returns {Promise<Extraction|null>} The extraction or null if not found
   */
  async execute(id) {
    if (!id) {
      throw new Error("Extraction ID is required");
    }

    const extraction = await this.extractionRepository.findById(id);
    return extraction;
  }
}
