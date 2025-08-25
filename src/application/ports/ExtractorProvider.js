/**
 * Port (Interface) for Extractor Provider
 * Defines the contract for LLM-based extraction with schema validation
 * This is part of the ports layer in hexagon architecture
 */
export class ExtractorProvider {
  /**
   * Extracts structured data from text using the provided schema
   * @param {string} text - The text content to extract from
   * @param {ExtractionSchema} schema - The schema defining the extraction structure
   * @param {Object} options - Extraction options
   * @param {number} options.maxTokens - Maximum tokens for extraction
   * @param {number} options.temperature - Temperature for generation
   * @param {number} options.timeoutMs - Timeout in milliseconds
   * @returns {Promise<Object>} Extracted structured data
   */
  async extractWithSchema(text, schema, options = {}) {
    throw new Error("extractWithSchema method must be implemented");
  }

  /**
   * Extracts entities from text
   * @param {string} text - The text content to analyze
   * @param {Array<string>} entityTypes - Types of entities to extract
   * @returns {Promise<Array<Object>>} Array of extracted entities
   */
  async extractEntities(text, entityTypes = []) {
    throw new Error("extractEntities method must be implemented");
  }

  /**
   * Generates a summary from text
   * @param {string} text - The text content to summarize
   * @param {Object} options - Summary options
   * @param {number} options.maxLength - Maximum summary length
   * @returns {Promise<string>} The generated summary
   */
  async generateSummary(text, options = {}) {
    throw new Error("generateSummary method must be implemented");
  }

  /**
   * Extracts keywords from text
   * @param {string} text - The text content to analyze
   * @param {Object} options - Keyword extraction options
   * @param {number} options.maxKeywords - Maximum number of keywords
   * @returns {Promise<Array<string>>} Array of keywords
   */
  async extractKeywords(text, options = {}) {
    throw new Error("extractKeywords method must be implemented");
  }

  /**
   * Validates extracted data against schema
   * @param {Object} data - The extracted data
   * @param {ExtractionSchema} schema - The schema to validate against
   * @returns {Promise<Object>} Validation result with coerced data
   */
  async validateAndCoerce(data, schema) {
    throw new Error("validateAndCoerce method must be implemented");
  }

  /**
   * Checks if the provider is available and healthy
   * @returns {Promise<boolean>} True if provider is available
   */
  async isHealthy() {
    throw new Error("isHealthy method must be implemented");
  }

  /**
   * Gets provider information
   * @returns {Object} Provider information
   */
  getProviderInfo() {
    throw new Error("getProviderInfo method must be implemented");
  }
}
