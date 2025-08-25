import fs from "fs/promises";
import path from "path";
import { Extraction } from "../../domain/entities/Extraction.js";

/**
 * File system implementation of extraction repository
 * This is part of the infrastructure layer in hexagon architecture
 */
export class FileSystemExtractionRepository {
  constructor() {
    this.extractionsFile = path.join(process.cwd(), "data", "extractions.json");
    this.lockFile = path.join(process.cwd(), "data", "extractions.lock");
  }

  /**
   * Acquires a file lock to prevent concurrent access
   * @private
   * @returns {Promise<boolean>} True if lock was acquired
   */
  async acquireLock() {
    try {
      await fs.writeFile(this.lockFile, Date.now().toString(), { flag: "wx" });
      return true;
    } catch (error) {
      if (error.code === "EEXIST") {
        // Lock already exists, wait a bit and try again
        await new Promise((resolve) => setTimeout(resolve, 10));
        return this.acquireLock();
      }
      throw error;
    }
  }

  /**
   * Releases the file lock
   * @private
   */
  async releaseLock() {
    try {
      await fs.unlink(this.lockFile);
    } catch (error) {
      // Ignore errors when releasing lock
    }
  }

  /**
   * Saves an extraction to the file system
   * @param {Extraction} extraction - The extraction to save
   * @returns {Promise<Extraction>} The saved extraction
   */
  async save(extraction) {
    const lockAcquired = await this.acquireLock();
    try {
      const extractions = await this.getAllExtractions();
      extractions.push(extraction.toJSON());

      await fs.writeFile(
        this.extractionsFile,
        JSON.stringify(extractions, null, 2)
      );

      return extraction;
    } catch (error) {
      console.error("Failed to save extraction:", error);
      throw error;
    } finally {
      if (lockAcquired) {
        await this.releaseLock();
      }
    }
  }

  /**
   * Finds an extraction by its ID
   * @param {string} id - The extraction ID
   * @returns {Promise<Extraction|null>} The extraction or null if not found
   */
  async findById(id) {
    try {
      const extractions = await this.getAllExtractions();
      const extractionData = extractions.find(
        (extraction) => extraction.id === id
      );

      return extractionData ? Extraction.fromJSON(extractionData) : null;
    } catch (error) {
      console.error("Failed to find extraction:", error);
      throw error;
    }
  }

  /**
   * Retrieves all extractions with optional pagination
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of results
   * @param {number} options.offset - Number of results to skip
   * @returns {Promise<Array<Extraction>>} Array of extractions
   */
  async findAll(options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;
      const extractions = await this.getAllExtractions();

      const sortedExtractions = extractions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(offset, offset + limit)
        .map((extractionData) => Extraction.fromJSON(extractionData));

      return sortedExtractions;
    } catch (error) {
      console.error("Failed to find all extractions:", error);
      throw error;
    }
  }

  /**
   * Updates an existing extraction
   * @param {string} id - The extraction ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Extraction>} The updated extraction
   */
  async update(id, updates) {
    const lockAcquired = await this.acquireLock();
    try {
      const extractions = await this.getAllExtractions();
      const index = extractions.findIndex((extraction) => extraction.id === id);

      if (index === -1) {
        throw new Error("Extraction not found");
      }

      extractions[index] = { ...extractions[index], ...updates };
      await fs.writeFile(
        this.extractionsFile,
        JSON.stringify(extractions, null, 2)
      );

      return Extraction.fromJSON(extractions[index]);
    } catch (error) {
      console.error("Failed to update extraction:", error);
      throw error;
    } finally {
      if (lockAcquired) {
        await this.releaseLock();
      }
    }
  }

  /**
   * Deletes an extraction by its ID
   * @param {string} id - The extraction ID
   * @returns {Promise<boolean>} True if deletion was successful
   */
  async delete(id) {
    const lockAcquired = await this.acquireLock();
    try {
      const extractions = await this.getAllExtractions();
      const filteredExtractions = extractions.filter(
        (extraction) => extraction.id !== id
      );

      if (filteredExtractions.length === extractions.length) {
        throw new Error("Extraction not found");
      }

      await fs.writeFile(
        this.extractionsFile,
        JSON.stringify(filteredExtractions, null, 2)
      );
      return true;
    } catch (error) {
      console.error("Failed to delete extraction:", error);
      throw error;
    } finally {
      if (lockAcquired) {
        await this.releaseLock();
      }
    }
  }

  /**
   * Gets all extractions from the file system with robust error handling
   * @private
   * @returns {Promise<Array<Object>>} Array of extraction data
   */
  async getAllExtractions() {
    try {
      // Check if file exists
      try {
        await fs.access(this.extractionsFile);
      } catch (error) {
        if (error.code === "ENOENT") {
          // File doesn't exist, create it with empty array
          await fs.mkdir(path.dirname(this.extractionsFile), {
            recursive: true,
          });
          await fs.writeFile(this.extractionsFile, "[]");
          return [];
        }
        throw error;
      }

      const data = await fs.readFile(this.extractionsFile, "utf8");

      // Handle empty file
      if (!data.trim()) {
        return [];
      }

      try {
        return JSON.parse(data);
      } catch (parseError) {
        console.error("JSON parse error, attempting to recover:", parseError);

        // Try to recover by reading the file and finding valid JSON
        const fileContent = await fs.readFile(this.extractionsFile, "utf8");
        const lines = fileContent.split("\n");
        const validLines = [];

        for (const line of lines) {
          try {
            JSON.parse(line);
            validLines.push(line);
          } catch (e) {
            // Skip invalid lines
          }
        }

        if (validLines.length > 0) {
          // Try to reconstruct valid JSON
          const recoveredData = `[${validLines.join(",")}]`;
          return JSON.parse(recoveredData);
        }

        // If recovery fails, backup the corrupted file and start fresh
        const backupFile = `${this.extractionsFile}.backup.${Date.now()}`;
        await fs.copyFile(this.extractionsFile, backupFile);
        console.warn(`Corrupted file backed up to: ${backupFile}`);

        await fs.writeFile(this.extractionsFile, "[]");
        return [];
      }
    } catch (error) {
      console.error("Failed to read extractions:", error);
      return [];
    }
  }
}
