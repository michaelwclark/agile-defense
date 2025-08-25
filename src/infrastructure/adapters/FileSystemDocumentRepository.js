import fs from "fs/promises";
import path from "path";
import { Document } from "../../domain/entities/Document.js";

/**
 * File system implementation of document repository
 * This is part of the infrastructure layer in hexagon architecture
 */
export class FileSystemDocumentRepository {
  constructor() {
    this.documentsFile = path.join(process.cwd(), "data", "documents.json");
    this.lockFile = path.join(process.cwd(), "data", "documents.lock");
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
   * Saves a document to the file system
   * @param {Document} document - The document to save
   * @returns {Promise<Document>} The saved document
   */
  async save(document) {
    const lockAcquired = await this.acquireLock();
    try {
      const documents = await this.getAllDocuments();
      const existingIndex = documents.findIndex((d) => d.id === document.id);

      if (existingIndex >= 0) {
        documents[existingIndex] = document.toJSON();
      } else {
        documents.push(document.toJSON());
      }

      await fs.writeFile(
        this.documentsFile,
        JSON.stringify(documents, null, 2)
      );
      return document;
    } catch (error) {
      console.error("Failed to save document:", error);
      throw error;
    } finally {
      if (lockAcquired) {
        await this.releaseLock();
      }
    }
  }

  /**
   * Finds a document by its ID
   * @param {string} id - The document ID
   * @returns {Promise<Document|null>} The document or null if not found
   */
  async findById(id) {
    try {
      const documents = await this.getAllDocuments();
      const documentData = documents.find((doc) => doc.id === id);
      return documentData ? Document.fromJSON(documentData) : null;
    } catch (error) {
      console.error("Failed to find document:", error);
      throw error;
    }
  }

  /**
   * Retrieves all documents with optional filtering and pagination
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of results
   * @param {number} options.offset - Number of results to skip
   * @param {string} options.status - Filter by status
   * @returns {Promise<Array<Document>>} Array of documents
   */
  async findAll(options = {}) {
    try {
      const { limit = 50, offset = 0, status } = options;
      let documents = await this.getAllDocuments();

      // Filter by status if provided
      if (status) {
        documents = documents.filter((doc) => doc.status === status);
      }

      // Sort by creation date (newest first)
      const sortedDocuments = documents
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(offset, offset + limit)
        .map((docData) => Document.fromJSON(docData));

      return sortedDocuments;
    } catch (error) {
      console.error("Failed to find all documents:", error);
      throw error;
    }
  }

  /**
   * Updates a document by its ID
   * @param {string} id - The document ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Document>} The updated document
   */
  async update(id, updates) {
    const lockAcquired = await this.acquireLock();
    try {
      const documents = await this.getAllDocuments();
      const index = documents.findIndex((doc) => doc.id === id);

      if (index === -1) {
        throw new Error("Document not found");
      }

      documents[index] = { ...documents[index], ...updates };
      await fs.writeFile(
        this.documentsFile,
        JSON.stringify(documents, null, 2)
      );

      return Document.fromJSON(documents[index]);
    } catch (error) {
      console.error("Failed to update document:", error);
      throw error;
    } finally {
      if (lockAcquired) {
        await this.releaseLock();
      }
    }
  }

  /**
   * Deletes a document by its ID
   * @param {string} id - The document ID
   * @returns {Promise<boolean>} True if deletion was successful
   */
  async delete(id) {
    const lockAcquired = await this.acquireLock();
    try {
      const documents = await this.getAllDocuments();
      const filteredDocuments = documents.filter((doc) => doc.id !== id);

      if (filteredDocuments.length === documents.length) {
        throw new Error("Document not found");
      }

      await fs.writeFile(
        this.documentsFile,
        JSON.stringify(filteredDocuments, null, 2)
      );
      return true;
    } catch (error) {
      console.error("Failed to delete document:", error);
      throw error;
    } finally {
      if (lockAcquired) {
        await this.releaseLock();
      }
    }
  }

  /**
   * Finds documents by status
   * @param {string} status - The status to filter by
   * @returns {Promise<Array<Document>>} Array of documents with the specified status
   */
  async findByStatus(status) {
    try {
      const documents = await this.getAllDocuments();
      return documents
        .filter((doc) => doc.status === status)
        .map((docData) => Document.fromJSON(docData));
    } catch (error) {
      console.error("Failed to find documents by status:", error);
      throw error;
    }
  }

  /**
   * Finds documents by their IDs
   * @param {Array<string>} ids - Array of document IDs
   * @returns {Promise<Array<Document>>} Array of documents
   */
  async findByIds(ids) {
    try {
      const documents = await this.getAllDocuments();
      return documents
        .filter((doc) => ids.includes(doc.id))
        .map((docData) => Document.fromJSON(docData));
    } catch (error) {
      console.error("Failed to find documents by IDs:", error);
      throw error;
    }
  }

  /**
   * Counts documents by status
   * @param {string} status - The status to count
   * @returns {Promise<number>} Number of documents with the specified status
   */
  async countByStatus(status) {
    try {
      const documents = await this.getAllDocuments();
      return documents.filter((doc) => doc.status === status).length;
    } catch (error) {
      console.error("Failed to count documents by status:", error);
      throw error;
    }
  }

  /**
   * Gets all documents from the file system with robust error handling
   * @private
   * @returns {Promise<Array<Object>>} Array of document data
   */
  async getAllDocuments() {
    try {
      // Check if file exists
      try {
        await fs.access(this.documentsFile);
      } catch (error) {
        if (error.code === "ENOENT") {
          // File doesn't exist, create it with empty array
          await fs.mkdir(path.dirname(this.documentsFile), { recursive: true });
          await fs.writeFile(this.documentsFile, "[]");
          return [];
        }
        throw error;
      }

      const data = await fs.readFile(this.documentsFile, "utf8");

      // Handle empty file
      if (!data.trim()) {
        return [];
      }

      try {
        return JSON.parse(data);
      } catch (parseError) {
        console.error("JSON parse error, attempting to recover:", parseError);

        // Try to recover by reading the file and finding valid JSON
        const fileContent = await fs.readFile(this.documentsFile, "utf8");
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
        const backupFile = `${this.documentsFile}.backup.${Date.now()}`;
        await fs.copyFile(this.documentsFile, backupFile);
        console.warn(`Corrupted file backed up to: ${backupFile}`);

        await fs.writeFile(this.documentsFile, "[]");
        return [];
      }
    } catch (error) {
      console.error("Failed to read documents:", error);
      return [];
    }
  }
}
