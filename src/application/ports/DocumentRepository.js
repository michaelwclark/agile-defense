/**
 * Port (Interface) for Document Repository
 * Defines the contract for document persistence operations
 * This is part of the ports layer in hexagon architecture
 */
export class DocumentRepository {
  /**
   * Saves a document to the repository
   * @param {Document} document - The document to save
   * @returns {Promise<Document>} The saved document
   */
  async save(document) {
    throw new Error("save method must be implemented");
  }

  /**
   * Finds a document by its ID
   * @param {string} id - The document ID
   * @returns {Promise<Document|null>} The document or null if not found
   */
  async findById(id) {
    throw new Error("findById method must be implemented");
  }

  /**
   * Finds all documents with optional filtering and pagination
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of documents to return
   * @param {number} options.offset - Number of documents to skip
   * @param {string} options.status - Filter by status
   * @param {Array<string>} options.ids - Filter by document IDs
   * @returns {Promise<Array<Document>>} Array of documents
   */
  async findAll(options = {}) {
    throw new Error("findAll method must be implemented");
  }

  /**
   * Updates a document by ID
   * @param {string} id - The document ID
   * @param {Object} updates - The updates to apply
   * @returns {Promise<Document>} The updated document
   */
  async update(id, updates) {
    throw new Error("update method must be implemented");
  }

  /**
   * Deletes a document by ID
   * @param {string} id - The document ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async delete(id) {
    throw new Error("delete method must be implemented");
  }

  /**
   * Finds documents by status
   * @param {string} status - The status to filter by
   * @returns {Promise<Array<Document>>} Array of documents with the specified status
   */
  async findByStatus(status) {
    throw new Error("findByStatus method must be implemented");
  }

  /**
   * Finds documents by IDs
   * @param {Array<string>} ids - Array of document IDs
   * @returns {Promise<Array<Document>>} Array of documents
   */
  async findByIds(ids) {
    throw new Error("findByIds method must be implemented");
  }

  /**
   * Counts documents by status
   * @param {string} status - The status to count
   * @returns {Promise<number>} Number of documents with the specified status
   */
  async countByStatus(status) {
    throw new Error("countByStatus method must be implemented");
  }
}
