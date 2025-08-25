/**
 * Document entity representing a document to be processed
 * This is a core domain entity in the hexagon architecture
 */
export class Document {
  /**
   * Creates a new Document instance
   * @param {Object} params - Document parameters
   * @param {string} params.id - Unique identifier
   * @param {string} params.name - Document name
   * @param {string} params.content - Document content
   * @param {string} params.contentType - MIME type of the document
   * @param {string} params.source - Source of the document (file path, URL, etc.)
   * @param {string} params.status - Current status (pending, processing, completed, failed)
   * @param {string} params.createdAt - ISO timestamp
   * @param {string} params.updatedAt - ISO timestamp
   * @param {Object} params.metadata - Additional metadata
   */
  constructor({
    id,
    name,
    content,
    contentType = "text/plain",
    source,
    status = "pending",
    createdAt,
    updatedAt,
    metadata = {},
  }) {
    this.id = id;
    this.name = name;
    this.content = content;
    this.contentType = contentType;
    this.source = source;
    this.status = status;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
    this.metadata = metadata;
  }

  /**
   * Validates the document entity
   * @returns {boolean} True if valid
   * @throws {Error} If validation fails
   */
  validate() {
    if (!this.id) {
      throw new Error("Document ID is required");
    }
    if (!this.name) {
      throw new Error("Document name is required");
    }
    if (!this.content) {
      throw new Error("Document content is required");
    }
    return true;
  }

  /**
   * Marks the document as processing
   */
  markProcessing() {
    this.status = "processing";
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Marks the document as completed
   * @param {Object} result - Processing result
   */
  markCompleted(result) {
    this.status = "completed";
    this.updatedAt = new Date().toISOString();
    this.metadata.result = result;
  }

  /**
   * Marks the document as failed
   * @param {string} error - Error message
   */
  markFailed(error) {
    this.status = "failed";
    this.updatedAt = new Date().toISOString();
    this.metadata.error = error;
  }

  /**
   * Gets the document size in characters
   * @returns {number} Document size
   */
  getSize() {
    return this.content ? this.content.length : 0;
  }

  /**
   * Checks if the document needs chunking based on size
   * @param {number} maxChunkSize - Maximum chunk size in characters
   * @returns {boolean} True if chunking is needed
   */
  needsChunking(maxChunkSize = 4000) {
    return this.getSize() > maxChunkSize;
  }

  /**
   * Chunks the document content
   * @param {number} maxChunkSize - Maximum chunk size in characters
   * @param {number} overlap - Overlap between chunks in characters
   * @returns {Array<string>} Array of text chunks
   */
  chunkContent(maxChunkSize = 4000, overlap = 200) {
    if (!this.needsChunking(maxChunkSize)) {
      return [this.content];
    }

    const chunks = [];
    let start = 0;

    while (start < this.content.length) {
      let end = start + maxChunkSize;

      // Try to break at a sentence boundary
      if (end < this.content.length) {
        const lastPeriod = this.content.lastIndexOf(".", end);
        const lastNewline = this.content.lastIndexOf("\n", end);
        const breakPoint = Math.max(lastPeriod, lastNewline);

        if (breakPoint > start + maxChunkSize * 0.8) {
          end = breakPoint + 1;
        }
      }

      chunks.push(this.content.substring(start, end));
      start = end - overlap;
    }

    return chunks;
  }

  /**
   * Converts the document to a plain object
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      content: this.content,
      contentType: this.contentType,
      source: this.source,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: this.metadata,
    };
  }

  /**
   * Creates a document from a plain object
   * @param {Object} data - Plain object data
   * @returns {Document} Document instance
   */
  static fromJSON(data) {
    return new Document(data);
  }
}
