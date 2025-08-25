import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Service for managing file system operations and extraction data persistence
 * Handles CRUD operations for extractions and file storage in the local file system
 */
class FileService {
  /**
   * Initializes the FileService with data directory and extractions file paths
   * Sets up the data directory structure and initializes the extractions storage file
   */
  constructor() {
    this.dataDir = path.join(process.cwd(), "data");
    this.extractionsFile = path.join(this.dataDir, "extractions.json");
    this.init();
  }

  /**
   * Initializes the data directory and extractions file
   * Creates the data directory if it doesn't exist and initializes an empty extractions file
   * @private
   */
  async init() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });

      // Initialize extractions file if it doesn't exist
      try {
        await fs.access(this.extractionsFile);
      } catch {
        await fs.writeFile(this.extractionsFile, JSON.stringify([]));
      }
    } catch (error) {
      console.error("Failed to initialize file service:", error);
    }
  }

  /**
   * Saves an extraction record to the file system
   * @param {Object} extraction - The extraction object to save
   * @param {string} extraction.id - Unique identifier for the extraction
   * @param {string} extraction.text - The original text content
   * @param {string} extraction.extractionType - Type of extraction performed
   * @param {Object} extraction.result - The extraction results
   * @param {string} extraction.status - Status of the extraction
   * @param {string} extraction.createdAt - ISO timestamp of creation
   * @param {Object} extraction.metadata - Additional metadata
   * @returns {Promise<Object>} The saved extraction object
   * @throws {Error} If saving fails
   */
  async saveExtraction(extraction) {
    try {
      const extractions = await this.getAllExtractions();
      extractions.push(extraction);
      await fs.writeFile(
        this.extractionsFile,
        JSON.stringify(extractions, null, 2)
      );
      return extraction;
    } catch (error) {
      console.error("Failed to save extraction:", error);
      throw error;
    }
  }

  /**
   * Retrieves a specific extraction by its ID
   * @param {string} id - The unique identifier of the extraction
   * @returns {Promise<Object|null>} The extraction object or null if not found
   * @throws {Error} If reading fails
   */
  async getExtraction(id) {
    try {
      const extractions = await this.getAllExtractions();
      return extractions.find((extraction) => extraction.id === id) || null;
    } catch (error) {
      console.error("Failed to get extraction:", error);
      throw error;
    }
  }

  /**
   * Retrieves all extraction records from the file system
   * @returns {Promise<Array<Object>>} Array of all extraction objects
   */
  async getAllExtractions() {
    try {
      const data = await fs.readFile(this.extractionsFile, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Failed to read extractions:", error);
      return [];
    }
  }

  /**
   * Updates an existing extraction record
   * @param {string} id - The unique identifier of the extraction to update
   * @param {Object} updates - Object containing the fields to update
   * @returns {Promise<Object>} The updated extraction object
   * @throws {Error} If extraction not found or update fails
   */
  async updateExtraction(id, updates) {
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
      return extractions[index];
    } catch (error) {
      console.error("Failed to update extraction:", error);
      throw error;
    }
  }

  /**
   * Deletes an extraction record by its ID
   * @param {string} id - The unique identifier of the extraction to delete
   * @returns {Promise<boolean>} True if deletion was successful
   * @throws {Error} If extraction not found or deletion fails
   */
  async deleteExtraction(id) {
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
    }
  }

  /**
   * Saves a file to the data directory
   * @param {string} fileName - Name of the file to save
   * @param {string|Buffer} content - Content to write to the file
   * @returns {Promise<string>} The full path of the saved file
   * @throws {Error} If saving fails
   */
  async saveFile(fileName, content) {
    try {
      const filePath = path.join(this.dataDir, fileName);
      await fs.writeFile(filePath, content);
      return filePath;
    } catch (error) {
      console.error("Failed to save file:", error);
      throw error;
    }
  }

  /**
   * Reads a file from the data directory
   * @param {string} fileName - Name of the file to read
   * @returns {Promise<string>} The content of the file as a string
   * @throws {Error} If file not found or reading fails
   */
  async readFile(fileName) {
    try {
      const filePath = path.join(this.dataDir, fileName);
      return await fs.readFile(filePath, "utf8");
    } catch (error) {
      console.error("Failed to read file:", error);
      throw error;
    }
  }

  /**
   * Lists all files in the data directory (excluding extractions.json)
   * @returns {Promise<Array<string>>} Array of file names
   */
  async listFiles() {
    try {
      const files = await fs.readdir(this.dataDir);
      return files.filter((file) => file !== "extractions.json");
    } catch (error) {
      console.error("Failed to list files:", error);
      return [];
    }
  }
}

export default new FileService();
