/**
 * Port (Interface) for Extraction Service
 * Defines the contract for extraction processing
 * This is part of the ports layer in hexagon architecture
 */
export class ExtractionService {
  /**
   * Processes text content for extraction
   * @param {string} text - The text content to process
   * @param {string} extractionType - Type of extraction to perform
   * @returns {Promise<Object>} The extraction results
   */
  async processExtraction(text, extractionType) {
    throw new Error("processExtraction method must be implemented");
  }

  /**
   * Extracts entities from text
   * @param {string} text - The text content to analyze
   * @returns {Promise<Array<Object>>} Array of extracted entities
   */
  async extractEntities(text) {
    throw new Error("extractEntities method must be implemented");
  }

  /**
   * Extracts keywords from text
   * @param {string} text - The text content to analyze
   * @returns {Promise<Array<string>>} Array of keywords
   */
  async extractKeywords(text) {
    throw new Error("extractKeywords method must be implemented");
  }

  /**
   * Generates a summary from text
   * @param {string} text - The text content to summarize
   * @returns {Promise<string>} The generated summary
   */
  async generateSummary(text) {
    throw new Error("generateSummary method must be implemented");
  }

  /**
   * Extracts document structure from text
   * @param {string} text - The text content to analyze
   * @returns {Promise<Array<Object>>} Array of document sections
   */
  async extractDocumentStructure(text) {
    throw new Error("extractDocumentStructure method must be implemented");
  }
}
