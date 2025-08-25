/**
 * Port (Interface) for Extraction Repository
 * Defines the contract for extraction data persistence
 * This is part of the ports layer in hexagon architecture
 */
export class ExtractionRepository {
  /**
   * Saves an extraction to the repository
   * @param {Extraction} extraction - The extraction entity to save
   * @returns {Promise<Extraction>} The saved extraction
   */
  async save(extraction) {
    throw new Error("save method must be implemented");
  }

  /**
   * Retrieves an extraction by its ID
   * @param {string} id - The extraction ID
   * @returns {Promise<Extraction|null>} The extraction or null if not found
   */
  async findById(id) {
    throw new Error("findById method must be implemented");
  }

  /**
   * Retrieves all extractions with optional pagination
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of results
   * @param {number} options.offset - Number of results to skip
   * @returns {Promise<Array<Extraction>>} Array of extractions
   */
  async findAll(options = {}) {
    throw new Error("findAll method must be implemented");
  }

  /**
   * Updates an existing extraction
   * @param {string} id - The extraction ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Extraction>} The updated extraction
   */
  async update(id, updates) {
    throw new Error("update method must be implemented");
  }

  /**
   * Deletes an extraction by its ID
   * @param {string} id - The extraction ID
   * @returns {Promise<boolean>} True if deletion was successful
   */
  async delete(id) {
    throw new Error("delete method must be implemented");
  }
}
