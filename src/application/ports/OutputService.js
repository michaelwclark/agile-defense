/**
 * Port (Interface) for Output Service
 * Defines the contract for writing extraction results to output files
 * This is part of the ports layer in hexagon architecture
 */
export class OutputService {
  /**
   * Writes extraction results to output files
   * @param {string} jobId - The job ID
   * @param {Array<Object>} results - Array of extraction results
   * @param {Object} options - Output options
   * @param {string} options.format - Output format (jsonl, json, csv)
   * @param {string} options.directory - Output directory
   * @param {boolean} options.compression - Enable compression
   * @returns {Promise<Object>} Output metadata
   */
  async writeResults(jobId, results, options = {}) {
    throw new Error("writeResults method must be implemented");
  }

  /**
   * Writes a single result to the output stream
   * @param {string} jobId - The job ID
   * @param {Object} result - Single extraction result
   * @param {Object} options - Output options
   * @returns {Promise<void>}
   */
  async writeResult(jobId, result, options = {}) {
    throw new Error("writeResult method must be implemented");
  }

  /**
   * Finalizes the output files for a job
   * @param {string} jobId - The job ID
   * @param {Object} options - Output options
   * @returns {Promise<Object>} Output metadata
   */
  async finalizeOutput(jobId, options = {}) {
    throw new Error("finalizeOutput method must be implemented");
  }

  /**
   * Gets output file information for a job
   * @param {string} jobId - The job ID
   * @returns {Promise<Object>} Output file information
   */
  async getOutputInfo(jobId) {
    throw new Error("getOutputInfo method must be implemented");
  }

  /**
   * Reads output results for a job
   * @param {string} jobId - The job ID
   * @param {Object} options - Read options
   * @param {number} options.limit - Maximum number of results to read
   * @param {number} options.offset - Number of results to skip
   * @returns {Promise<Array<Object>>} Array of results
   */
  async readResults(jobId, options = {}) {
    throw new Error("readResults method must be implemented");
  }

  /**
   * Deletes output files for a job
   * @param {string} jobId - The job ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteOutput(jobId) {
    throw new Error("deleteOutput method must be implemented");
  }

  /**
   * Lists all output files
   * @param {Object} options - List options
   * @param {string} options.prefix - File prefix filter
   * @returns {Promise<Array<string>>} Array of output file paths
   */
  async listOutputs(options = {}) {
    throw new Error("listOutputs method must be implemented");
  }
}
