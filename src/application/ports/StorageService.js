/**
 * Port (Interface) for Storage Service
 * Defines the contract for file storage operations
 * This is part of the ports layer in hexagon architecture
 */
export class StorageService {
  /**
   * Saves a file to storage
   * @param {string} fileName - Name of the file
   * @param {string|Buffer} content - File content
   * @param {Object} options - Storage options
   * @returns {Promise<string>} The file path or URL
   */
  async saveFile(fileName, content, options = {}) {
    throw new Error("saveFile method must be implemented");
  }

  /**
   * Reads a file from storage
   * @param {string} fileName - Name of the file
   * @returns {Promise<string>} The file content
   */
  async readFile(fileName) {
    throw new Error("readFile method must be implemented");
  }

  /**
   * Lists all files in storage
   * @param {string} prefix - Optional prefix filter
   * @returns {Promise<Array<string>>} Array of file names
   */
  async listFiles(prefix = "") {
    throw new Error("listFiles method must be implemented");
  }

  /**
   * Deletes a file from storage
   * @param {string} fileName - Name of the file
   * @returns {Promise<boolean>} True if deletion was successful
   */
  async deleteFile(fileName) {
    throw new Error("deleteFile method must be implemented");
  }

  /**
   * Gets a presigned URL for file access
   * @param {string} fileName - Name of the file
   * @param {Object} options - URL options
   * @returns {Promise<string>} The presigned URL
   */
  async getPresignedUrl(fileName, options = {}) {
    throw new Error("getPresignedUrl method must be implemented");
  }
}
