/**
 * Use Case: List Extractions
 * Orchestrates the retrieval of all extractions with pagination
 * This is part of the application layer in hexagon architecture
 */
export class ListExtractionsUseCase {
  /**
   * Creates a new ListExtractionsUseCase instance
   * @param {ExtractionRepository} extractionRepository - Repository for extractions
   */
  constructor(extractionRepository) {
    this.extractionRepository = extractionRepository;
  }

  /**
   * Executes the list extractions use case
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of results
   * @param {number} options.offset - Number of results to skip
   * @returns {Promise<Object>} Object containing extractions and pagination info
   */
  async execute(options = {}) {
    const { limit = 50, offset = 0 } = options;

    const extractions = await this.extractionRepository.findAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return {
      extractions,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: extractions.length, // Note: In a real implementation, you'd get total count separately
      },
    };
  }
}
