import { promises as fs } from "fs";
import path from "path";
import { StorageService } from "../../application/ports/StorageService.js";

/**
 * Local S3-Compatible Storage Service
 * Simulates S3 functionality using the local file system
 * This is an adapter in the hexagon architecture
 */
export class LocalS3StorageService extends StorageService {
  constructor() {
    super();
    this.baseDir = path.join(process.cwd(), "data", "storage");
    this.init();
  }

  /**
   * Initializes the storage service
   * @private
   */
  async init() {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch (error) {
      console.error("Failed to initialize local S3 storage:", error);
    }
  }

  /**
   * Saves a file to storage
   * @param {string} fileName - Name of the file
   * @param {string|Buffer} content - File content
   * @param {Object} options - Storage options
   * @param {string} options.bucket - Bucket name (creates subdirectory)
   * @param {string} options.contentType - MIME type of the file
   * @returns {Promise<string>} The file path
   */
  async saveFile(fileName, content, options = {}) {
    try {
      const { bucket = "default", contentType } = options;
      const bucketDir = path.join(this.baseDir, bucket);

      // Create bucket directory if it doesn't exist
      await fs.mkdir(bucketDir, { recursive: true });

      const filePath = path.join(bucketDir, fileName);

      // Save file content
      await fs.writeFile(filePath, content);

      // Save metadata if provided
      if (contentType) {
        const metadataPath = `${filePath}.metadata.json`;
        const metadata = {
          contentType,
          size: Buffer.byteLength(content),
          uploadedAt: new Date().toISOString(),
          bucket,
          fileName,
        };
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      }

      return filePath;
    } catch (error) {
      console.error("Failed to save file:", error);
      throw error;
    }
  }

  /**
   * Reads a file from storage
   * @param {string} fileName - Name of the file
   * @param {Object} options - Read options
   * @param {string} options.bucket - Bucket name
   * @returns {Promise<string>} The file content
   */
  async readFile(fileName, options = {}) {
    try {
      const { bucket = "default" } = options;
      const bucketDir = path.join(this.baseDir, bucket);
      const filePath = path.join(bucketDir, fileName);

      const content = await fs.readFile(filePath, "utf8");
      return content;
    } catch (error) {
      console.error("Failed to read file:", error);
      throw error;
    }
  }

  /**
   * Lists all files in storage
   * @param {string} prefix - Optional prefix filter
   * @param {Object} options - List options
   * @param {string} options.bucket - Bucket name
   * @returns {Promise<Array<string>>} Array of file names
   */
  async listFiles(prefix = "", options = {}) {
    try {
      const { bucket = "default" } = options;
      const bucketDir = path.join(this.baseDir, bucket);

      // Check if bucket directory exists
      try {
        await fs.access(bucketDir);
      } catch {
        return [];
      }

      const files = await fs.readdir(bucketDir);

      // Filter by prefix and exclude metadata files
      const filteredFiles = files
        .filter(
          (file) => file.startsWith(prefix) && !file.endsWith(".metadata.json")
        )
        .map((file) => `${bucket}/${file}`);

      return filteredFiles;
    } catch (error) {
      console.error("Failed to list files:", error);
      throw error;
    }
  }

  /**
   * Deletes a file from storage
   * @param {string} fileName - Name of the file
   * @param {Object} options - Delete options
   * @param {string} options.bucket - Bucket name
   * @returns {Promise<boolean>} True if deletion was successful
   */
  async deleteFile(fileName, options = {}) {
    try {
      const { bucket = "default" } = options;
      const bucketDir = path.join(this.baseDir, bucket);
      const filePath = path.join(bucketDir, fileName);

      // Delete the main file
      await fs.unlink(filePath);

      // Try to delete metadata file if it exists
      const metadataPath = `${filePath}.metadata.json`;
      try {
        await fs.unlink(metadataPath);
      } catch {
        // Metadata file doesn't exist, which is fine
      }

      return true;
    } catch (error) {
      console.error("Failed to delete file:", error);
      throw error;
    }
  }

  /**
   * Gets a presigned URL for file access
   * @param {string} fileName - Name of the file
   * @param {Object} options - URL options
   * @param {string} options.bucket - Bucket name
   * @param {number} options.expiresIn - Expiration time in seconds
   * @returns {Promise<string>} The presigned URL (simulated)
   */
  async getPresignedUrl(fileName, options = {}) {
    try {
      const { bucket = "default", expiresIn = 3600 } = options;
      const bucketDir = path.join(this.baseDir, bucket);
      const filePath = path.join(bucketDir, fileName);

      // Check if file exists
      await fs.access(filePath);

      // In a real S3 implementation, this would generate a presigned URL
      // For local implementation, we'll return a file:// URL
      const relativePath = path.relative(process.cwd(), filePath);
      const fileUrl = `file://${relativePath}`;

      return fileUrl;
    } catch (error) {
      console.error("Failed to generate presigned URL:", error);
      throw error;
    }
  }

  /**
   * Creates a new bucket
   * @param {string} bucketName - Name of the bucket
   * @returns {Promise<boolean>} True if bucket was created
   */
  async createBucket(bucketName) {
    try {
      const bucketDir = path.join(this.baseDir, bucketName);
      await fs.mkdir(bucketDir, { recursive: true });
      return true;
    } catch (error) {
      console.error("Failed to create bucket:", error);
      throw error;
    }
  }

  /**
   * Lists all buckets
   * @returns {Promise<Array<string>>} Array of bucket names
   */
  async listBuckets() {
    try {
      const items = await fs.readdir(this.baseDir);
      const buckets = [];

      for (const item of items) {
        const itemPath = path.join(this.baseDir, item);
        const stats = await fs.stat(itemPath);

        if (stats.isDirectory()) {
          buckets.push(item);
        }
      }

      return buckets;
    } catch (error) {
      console.error("Failed to list buckets:", error);
      throw error;
    }
  }

  /**
   * Deletes a bucket and all its contents
   * @param {string} bucketName - Name of the bucket
   * @returns {Promise<boolean>} True if bucket was deleted
   */
  async deleteBucket(bucketName) {
    try {
      const bucketDir = path.join(this.baseDir, bucketName);

      // Remove all files in the bucket
      const files = await fs.readdir(bucketDir);
      for (const file of files) {
        const filePath = path.join(bucketDir, file);
        await fs.unlink(filePath);
      }

      // Remove the bucket directory
      await fs.rmdir(bucketDir);

      return true;
    } catch (error) {
      console.error("Failed to delete bucket:", error);
      throw error;
    }
  }
}
