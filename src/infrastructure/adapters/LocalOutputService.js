import { promises as fs } from "fs";
import path from "path";
import { OutputService } from "../../application/ports/OutputService.js";
import { getConfig } from "../../config/app.config.js";

/**
 * Local Implementation of Output Service
 * Writes extraction results to local files in JSONL format
 * This is an adapter in the hexagon architecture
 */
export class LocalOutputService extends OutputService {
  constructor() {
    super();
    this.outputStreams = new Map(); // Track open output streams
    this.outputMetadata = new Map(); // Track output metadata
    this.init();
  }

  /**
   * Initializes the output service
   */
  async init() {
    const outputDir = getConfig("output.outputDirectory", "./output");
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create output directory:", error);
    }
  }

  /**
   * Writes extraction results to output files
   * @param {string} jobId - The job ID
   * @param {Array<Object>} results - Array of extraction results
   * @param {Object} options - Output options
   * @returns {Promise<Object>} Output metadata
   */
  async writeResults(jobId, results, options = {}) {
    const startTime = Date.now();
    const outputDir =
      options.directory || getConfig("output.outputDirectory", "./output");
    const format = options.format || getConfig("output.outputFormat", "jsonl");
    const compression =
      options.compression !== false &&
      getConfig("output.compressionEnabled", true);
    const shardSize = options.shardSize || getConfig("output.shardSize", 10000);

    try {
      // Create job output directory
      const jobOutputDir = path.join(outputDir, jobId);
      await fs.mkdir(jobOutputDir, { recursive: true });

      // Split results into shards
      const shards = this.createShards(results, shardSize);
      const outputFiles = [];

      for (let i = 0; i < shards.length; i++) {
        const shard = shards[i];
        const fileName = this.generateFileName(jobId, i, format, compression);
        const filePath = path.join(jobOutputDir, fileName);

        await this.writeShard(filePath, shard, format, compression);
        outputFiles.push({
          fileName,
          filePath,
          recordCount: shard.length,
          size: await this.getFileSize(filePath),
        });
      }

      const metadata = {
        jobId,
        outputFiles,
        totalRecords: results.length,
        totalFiles: outputFiles.length,
        format,
        compression,
        processingTime: Date.now() - startTime,
        createdAt: new Date().toISOString(),
      };

      // Save metadata
      const metadataPath = path.join(jobOutputDir, "metadata.json");
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      this.outputMetadata.set(jobId, metadata);
      return metadata;
    } catch (error) {
      console.error("Failed to write results:", error);
      throw error;
    }
  }

  /**
   * Writes a single result to the output stream
   * @param {string} jobId - The job ID
   * @param {Object} result - Single extraction result
   * @param {Object} options - Output options
   * @returns {Promise<void>}
   */
  async writeResult(jobId, result, options = {}) {
    const outputDir =
      options.directory || getConfig("output.outputDirectory", "./output");
    const format = options.format || getConfig("output.outputFormat", "jsonl");
    const compression =
      options.compression !== false &&
      getConfig("output.compressionEnabled", true);

    try {
      // Get or create output stream
      let stream = this.outputStreams.get(jobId);
      if (!stream) {
        const jobOutputDir = path.join(outputDir, jobId);
        await fs.mkdir(jobOutputDir, { recursive: true });

        const fileName = this.generateFileName(jobId, 0, format, compression);
        const filePath = path.join(jobOutputDir, fileName);

        stream = {
          filePath,
          writeStream: fs.createWriteStream(filePath, { flags: "a" }),
          recordCount: 0,
          shardSize: getConfig("output.shardSize", 10000),
        };

        this.outputStreams.set(jobId, stream);
      }

      // Write result
      const line = this.formatResult(result, format);
      stream.writeStream.write(line + "\n");
      stream.recordCount++;

      // Check if we need to create a new shard
      if (stream.recordCount >= stream.shardSize) {
        await this.rotateShard(jobId, options);
      }
    } catch (error) {
      console.error("Failed to write result:", error);
      throw error;
    }
  }

  /**
   * Finalizes the output files for a job
   * @param {string} jobId - The job ID
   * @param {Object} options - Output options
   * @returns {Promise<Object>} Output metadata
   */
  async finalizeOutput(jobId, options = {}) {
    try {
      // Close any open streams
      const stream = this.outputStreams.get(jobId);
      if (stream) {
        stream.writeStream.end();
        this.outputStreams.delete(jobId);
      }

      // Get output info
      const outputInfo = await this.getOutputInfo(jobId);
      return outputInfo;
    } catch (error) {
      console.error("Failed to finalize output:", error);
      throw error;
    }
  }

  /**
   * Gets output file information for a job
   * @param {string} jobId - The job ID
   * @returns {Promise<Object>} Output file information
   */
  async getOutputInfo(jobId) {
    try {
      // Check if we have cached metadata
      if (this.outputMetadata.has(jobId)) {
        return this.outputMetadata.get(jobId);
      }

      const outputDir = getConfig("output.outputDirectory", "./output");
      const jobOutputDir = path.join(outputDir, jobId);
      const metadataPath = path.join(jobOutputDir, "metadata.json");

      try {
        const metadataContent = await fs.readFile(metadataPath, "utf8");
        const metadata = JSON.parse(metadataContent);
        this.outputMetadata.set(jobId, metadata);
        return metadata;
      } catch (error) {
        // No metadata file found, scan directory
        return await this.scanOutputDirectory(jobId);
      }
    } catch (error) {
      console.error("Failed to get output info:", error);
      throw error;
    }
  }

  /**
   * Reads output results for a job
   * @param {string} jobId - The job ID
   * @param {Object} options - Read options
   * @returns {Promise<Array<Object>>} Array of results
   */
  async readResults(jobId, options = {}) {
    try {
      const outputInfo = await this.getOutputInfo(jobId);
      const results = [];
      const limit = options.limit || Infinity;
      const offset = options.offset || 0;

      for (const fileInfo of outputInfo.outputFiles) {
        const fileContent = await fs.readFile(fileInfo.filePath, "utf8");
        const lines = fileContent.trim().split("\n");

        for (const line of lines) {
          if (line.trim()) {
            try {
              const result = JSON.parse(line);
              results.push(result);
            } catch (error) {
              console.warn("Failed to parse result line:", error);
            }
          }
        }
      }

      return results.slice(offset, offset + limit);
    } catch (error) {
      console.error("Failed to read results:", error);
      throw error;
    }
  }

  /**
   * Deletes output files for a job
   * @param {string} jobId - The job ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteOutput(jobId) {
    try {
      const outputDir = getConfig("output.outputDirectory", "./output");
      const jobOutputDir = path.join(outputDir, jobId);

      // Close any open streams
      const stream = this.outputStreams.get(jobId);
      if (stream) {
        stream.writeStream.end();
        this.outputStreams.delete(jobId);
      }

      // Remove directory
      await fs.rm(jobOutputDir, { recursive: true, force: true });

      // Clear metadata
      this.outputMetadata.delete(jobId);

      return true;
    } catch (error) {
      console.error("Failed to delete output:", error);
      throw error;
    }
  }

  /**
   * Lists all output files
   * @param {Object} options - List options
   * @returns {Promise<Array<string>>} Array of output file paths
   */
  async listOutputs(options = {}) {
    try {
      const outputDir = getConfig("output.outputDirectory", "./output");
      const prefix = options.prefix || "";

      const items = await fs.readdir(outputDir);
      const outputPaths = [];

      for (const item of items) {
        if (item.startsWith(prefix)) {
          const itemPath = path.join(outputDir, item);
          const stats = await fs.stat(itemPath);

          if (stats.isDirectory()) {
            outputPaths.push(itemPath);
          }
        }
      }

      return outputPaths;
    } catch (error) {
      console.error("Failed to list outputs:", error);
      throw error;
    }
  }

  /**
   * Creates shards from results array
   * @param {Array<Object>} results - Array of results
   * @param {number} shardSize - Size of each shard
   * @returns {Array<Array<Object>>} Array of shards
   */
  createShards(results, shardSize) {
    const shards = [];
    for (let i = 0; i < results.length; i += shardSize) {
      shards.push(results.slice(i, i + shardSize));
    }
    return shards;
  }

  /**
   * Generates filename for output file
   * @param {string} jobId - Job ID
   * @param {number} shardIndex - Shard index
   * @param {string} format - Output format
   * @param {boolean} compression - Whether to compress
   * @returns {string} Filename
   */
  generateFileName(jobId, shardIndex, format, compression) {
    const baseName = `results_${jobId}_shard_${shardIndex
      .toString()
      .padStart(4, "0")}`;
    const extension = format === "jsonl" ? "jsonl" : format;
    return compression
      ? `${baseName}.${extension}.gz`
      : `${baseName}.${extension}`;
  }

  /**
   * Writes a shard to file
   * @param {string} filePath - File path
   * @param {Array<Object>} shard - Shard data
   * @param {string} format - Output format
   * @param {boolean} compression - Whether to compress
   * @returns {Promise<void>}
   */
  async writeShard(filePath, shard, format, compression) {
    const content = shard
      .map((result) => this.formatResult(result, format))
      .join("\n");

    if (compression) {
      // For now, just write uncompressed. In a real implementation, you'd use gzip
      await fs.writeFile(filePath, content);
    } else {
      await fs.writeFile(filePath, content);
    }
  }

  /**
   * Formats a result for output
   * @param {Object} result - Result object
   * @param {string} format - Output format
   * @returns {string} Formatted result
   */
  formatResult(result, format) {
    switch (format) {
      case "jsonl":
        return JSON.stringify(result);
      case "json":
        return JSON.stringify(result, null, 2);
      case "csv":
        // Simple CSV formatting - in a real implementation, you'd use a proper CSV library
        return Object.values(result)
          .map((value) =>
            typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value
          )
          .join(",");
      default:
        return JSON.stringify(result);
    }
  }

  /**
   * Gets file size
   * @param {string} filePath - File path
   * @returns {Promise<number>} File size in bytes
   */
  async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Rotates to a new shard
   * @param {string} jobId - Job ID
   * @param {Object} options - Output options
   * @returns {Promise<void>}
   */
  async rotateShard(jobId, options) {
    const stream = this.outputStreams.get(jobId);
    if (!stream) return;

    // Close current stream
    stream.writeStream.end();

    // Create new shard
    const outputDir =
      options.directory || getConfig("output.outputDirectory", "./output");
    const format = options.format || getConfig("output.outputFormat", "jsonl");
    const compression =
      options.compression !== false &&
      getConfig("output.compressionEnabled", true);

    const jobOutputDir = path.join(outputDir, jobId);
    const shardIndex = Math.floor(stream.recordCount / stream.shardSize);
    const fileName = this.generateFileName(
      jobId,
      shardIndex,
      format,
      compression
    );
    const filePath = path.join(jobOutputDir, fileName);

    // Create new stream
    stream.filePath = filePath;
    stream.writeStream = fs.createWriteStream(filePath, { flags: "a" });
  }

  /**
   * Scans output directory for files
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Output metadata
   */
  async scanOutputDirectory(jobId) {
    const outputDir = getConfig("output.outputDirectory", "./output");
    const jobOutputDir = path.join(outputDir, jobId);

    try {
      const files = await fs.readdir(jobOutputDir);
      const outputFiles = [];
      let totalRecords = 0;

      for (const file of files) {
        if (
          file.endsWith(".jsonl") ||
          file.endsWith(".json") ||
          file.endsWith(".csv")
        ) {
          const filePath = path.join(jobOutputDir, file);
          const size = await this.getFileSize(filePath);

          // Count records (simple line count for JSONL)
          const content = await fs.readFile(filePath, "utf8");
          const recordCount = content
            .trim()
            .split("\n")
            .filter((line) => line.trim()).length;

          outputFiles.push({
            fileName: file,
            filePath,
            recordCount,
            size,
          });

          totalRecords += recordCount;
        }
      }

      return {
        jobId,
        outputFiles,
        totalRecords,
        totalFiles: outputFiles.length,
        format: "jsonl",
        compression: false,
        processingTime: 0,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        jobId,
        outputFiles: [],
        totalRecords: 0,
        totalFiles: 0,
        format: "jsonl",
        compression: false,
        processingTime: 0,
        createdAt: new Date().toISOString(),
      };
    }
  }
}
