/**
 * Port (Interface) for Job Repository
 * Defines the contract for job persistence operations
 * This is part of the ports layer in hexagon architecture
 */
export class JobRepository {
  /**
   * Saves a job to the repository
   * @param {Job} job - The job to save
   * @returns {Promise<Job>} The saved job
   */
  async save(job) {
    throw new Error("save method must be implemented");
  }

  /**
   * Finds a job by its ID
   * @param {string} id - The job ID
   * @returns {Promise<Job|null>} The job or null if not found
   */
  async findById(id) {
    throw new Error("findById method must be implemented");
  }

  /**
   * Finds all jobs with optional filtering and pagination
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of jobs to return
   * @param {number} options.offset - Number of jobs to skip
   * @param {string} options.status - Filter by status
   * @returns {Promise<Array<Job>>} Array of jobs
   */
  async findAll(options = {}) {
    throw new Error("findAll method must be implemented");
  }

  /**
   * Updates a job by ID
   * @param {string} id - The job ID
   * @param {Object} updates - The updates to apply
   * @returns {Promise<Job>} The updated job
   */
  async update(id, updates) {
    throw new Error("update method must be implemented");
  }

  /**
   * Deletes a job by ID
   * @param {string} id - The job ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async delete(id) {
    throw new Error("delete method must be implemented");
  }

  /**
   * Finds jobs by status
   * @param {string} status - The status to filter by
   * @returns {Promise<Array<Job>>} Array of jobs with the specified status
   */
  async findByStatus(status) {
    throw new Error("findByStatus method must be implemented");
  }

  /**
   * Counts jobs by status
   * @param {string} status - The status to count
   * @returns {Promise<number>} Number of jobs with the specified status
   */
  async countByStatus(status) {
    throw new Error("countByStatus method must be implemented");
  }
}
