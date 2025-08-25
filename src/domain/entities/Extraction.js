/**
 * Core Extraction entity representing the business domain
 * This is the central entity in the hexagon architecture
 */
export class Extraction {
  /**
   * Creates a new Extraction instance
   * @param {Object} params - Extraction parameters
   * @param {string} params.id - Unique identifier
   * @param {string} params.text - Original text content
   * @param {string} params.extractionType - Type of extraction performed
   * @param {Object} params.result - Extraction results
   * @param {string} params.status - Current status
   * @param {string} params.createdAt - ISO timestamp
   * @param {Object} params.metadata - Additional metadata
   */
  constructor({
    id,
    text,
    extractionType,
    result,
    status = "pending",
    createdAt,
    metadata = {},
  }) {
    this.id = id;
    this.text = text;
    this.extractionType = extractionType;
    this.result = result;
    this.status = status;
    this.createdAt = createdAt || new Date().toISOString();
    this.metadata = metadata;
  }

  /**
   * Validates the extraction entity
   * @returns {boolean} True if valid
   * @throws {Error} If validation fails
   */
  validate() {
    if (!this.id) {
      throw new Error("Extraction ID is required");
    }
    if (!this.text) {
      throw new Error("Extraction text is required");
    }
    if (!this.extractionType) {
      throw new Error("Extraction type is required");
    }
    return true;
  }

  /**
   * Marks the extraction as completed
   * @param {Object} result - The extraction result
   */
  markCompleted(result) {
    this.result = result;
    this.status = "completed";
    this.metadata.processingTime =
      Date.now() - new Date(this.createdAt).getTime();
  }

  /**
   * Marks the extraction as failed
   * @param {string} error - Error message
   */
  markFailed(error) {
    this.status = "failed";
    this.metadata.error = error;
  }

  /**
   * Converts the entity to a plain object
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      text: this.text,
      extractionType: this.extractionType,
      result: this.result,
      status: this.status,
      createdAt: this.createdAt,
      metadata: this.metadata,
    };
  }

  /**
   * Creates an Extraction instance from a plain object
   * @param {Object} data - Plain object data
   * @returns {Extraction} New Extraction instance
   */
  static fromJSON(data) {
    return new Extraction(data);
  }
}
