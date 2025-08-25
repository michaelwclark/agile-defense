/**
 * Job entity representing a document processing job
 * This is a core domain entity in the hexagon architecture
 */
export class Job {
  /**
   * Creates a new Job instance
   * @param {Object} params - Job parameters
   * @param {string} params.id - Unique identifier
   * @param {string} params.name - Job name
   * @param {Object} params.extractionConfig - Extraction configuration
   * @param {Array<string>} params.documentIds - Array of document IDs to process
   * @param {string} params.status - Current status (pending, processing, completed, failed)
   * @param {string} params.createdAt - ISO timestamp
   * @param {string} params.updatedAt - ISO timestamp
   * @param {Object} params.metadata - Additional metadata
   */
  constructor({
    id,
    name,
    extractionConfig,
    documentIds = [],
    status = "pending",
    createdAt,
    updatedAt,
    metadata = {},
  }) {
    this.id = id;
    this.name = name;
    this.extractionConfig = extractionConfig;
    this.documentIds = documentIds;
    this.status = status;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
    this.metadata = metadata;
  }

  /**
   * Validates the job entity
   * @returns {boolean} True if valid
   * @throws {Error} If validation fails
   */
  validate() {
    if (!this.id) {
      throw new Error("Job ID is required");
    }
    if (!this.name) {
      throw new Error("Job name is required");
    }
    if (!this.extractionConfig) {
      throw new Error("Extraction configuration is required");
    }
    if (!Array.isArray(this.documentIds)) {
      throw new Error("Document IDs must be an array");
    }
    return true;
  }

  /**
   * Marks the job as processing
   */
  markProcessing() {
    this.status = "processing";
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Marks the job as completed
   * @param {Object} result - Job completion result
   */
  markCompleted(result) {
    this.status = "completed";
    this.updatedAt = new Date().toISOString();
    this.metadata.result = result;
  }

  /**
   * Marks the job as failed
   * @param {string} error - Error message
   */
  markFailed(error) {
    this.status = "failed";
    this.updatedAt = new Date().toISOString();
    this.metadata.error = error;
  }

  /**
   * Converts the job to a plain object
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      extractionConfig: this.extractionConfig,
      documentIds: this.documentIds,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: this.metadata,
    };
  }

  /**
   * Creates a job from a plain object
   * @param {Object} data - Plain object data
   * @returns {Job} Job instance
   */
  static fromJSON(data) {
    return new Job(data);
  }
}
