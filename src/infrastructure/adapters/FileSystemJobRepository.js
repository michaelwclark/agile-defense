import fs from "fs/promises";
import path from "path";
import { Job } from "../../domain/entities/Job.js";

/**
 * File system implementation of job repository
 * This is part of the infrastructure layer in hexagon architecture
 */
export class FileSystemJobRepository {
  constructor() {
    this.jobsFile = path.join(process.cwd(), "data", "jobs.json");
    this.lockFile = path.join(process.cwd(), "data", "jobs.lock");
  }

  /**
   * Acquires a file lock to prevent concurrent access
   * @private
   * @returns {Promise<boolean>} True if lock was acquired
   */
  async acquireLock() {
    try {
      await fs.writeFile(this.lockFile, Date.now().toString(), { flag: 'wx' });
      return true;
    } catch (error) {
      if (error.code === 'EEXIST') {
        // Lock already exists, wait a bit and try again
        await new Promise(resolve => setTimeout(resolve, 10));
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
   * Saves a job to the file system
   * @param {Job} job - The job to save
   * @returns {Promise<Job>} The saved job
   */
  async save(job) {
    const lockAcquired = await this.acquireLock();
    try {
      const jobs = await this.getAllJobs();
      const existingIndex = jobs.findIndex((j) => j.id === job.id);

      if (existingIndex >= 0) {
        jobs[existingIndex] = job.toJSON();
      } else {
        jobs.push(job.toJSON());
      }

      await fs.writeFile(this.jobsFile, JSON.stringify(jobs, null, 2));
      return job;
    } catch (error) {
      console.error("Failed to save job:", error);
      throw error;
    } finally {
      if (lockAcquired) {
        await this.releaseLock();
      }
    }
  }

  /**
   * Finds a job by its ID
   * @param {string} id - The job ID
   * @returns {Promise<Job|null>} The job or null if not found
   */
  async findById(id) {
    try {
      const jobs = await this.getAllJobs();
      const jobData = jobs.find((job) => job.id === id);
      return jobData ? Job.fromJSON(jobData) : null;
    } catch (error) {
      console.error("Failed to find job:", error);
      throw error;
    }
  }

  /**
   * Retrieves all jobs with optional filtering and pagination
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of results
   * @param {number} options.offset - Number of results to skip
   * @param {string} options.status - Filter by status
   * @returns {Promise<Array<Job>>} Array of jobs
   */
  async findAll(options = {}) {
    try {
      const { limit = 50, offset = 0, status } = options;
      let jobs = await this.getAllJobs();

      // Filter by status if provided
      if (status) {
        jobs = jobs.filter((job) => job.status === status);
      }

      // Sort by creation date (newest first)
      const sortedJobs = jobs
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(offset, offset + limit)
        .map((jobData) => Job.fromJSON(jobData));

      return sortedJobs;
    } catch (error) {
      console.error("Failed to find all jobs:", error);
      throw error;
    }
  }

  /**
   * Updates a job by its ID
   * @param {string} id - The job ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Job>} The updated job
   */
  async update(id, updates) {
    const lockAcquired = await this.acquireLock();
    try {
      const jobs = await this.getAllJobs();
      const index = jobs.findIndex((job) => job.id === id);

      if (index === -1) {
        throw new Error("Job not found");
      }

      jobs[index] = { ...jobs[index], ...updates };
      await fs.writeFile(this.jobsFile, JSON.stringify(jobs, null, 2));

      return Job.fromJSON(jobs[index]);
    } catch (error) {
      console.error("Failed to update job:", error);
      throw error;
    } finally {
      if (lockAcquired) {
        await this.releaseLock();
      }
    }
  }

  /**
   * Deletes a job by its ID
   * @param {string} id - The job ID
   * @returns {Promise<boolean>} True if deletion was successful
   */
  async delete(id) {
    const lockAcquired = await this.acquireLock();
    try {
      const jobs = await this.getAllJobs();
      const filteredJobs = jobs.filter((job) => job.id !== id);

      if (filteredJobs.length === jobs.length) {
        throw new Error("Job not found");
      }

      await fs.writeFile(this.jobsFile, JSON.stringify(filteredJobs, null, 2));
      return true;
    } catch (error) {
      console.error("Failed to delete job:", error);
      throw error;
    } finally {
      if (lockAcquired) {
        await this.releaseLock();
      }
    }
  }

  /**
   * Finds jobs by status
   * @param {string} status - The status to filter by
   * @returns {Promise<Array<Job>>} Array of jobs with the specified status
   */
  async findByStatus(status) {
    try {
      const jobs = await this.getAllJobs();
      return jobs
        .filter((job) => job.status === status)
        .map((jobData) => Job.fromJSON(jobData));
    } catch (error) {
      console.error("Failed to find jobs by status:", error);
      throw error;
    }
  }

  /**
   * Counts jobs by status
   * @param {string} status - The status to count
   * @returns {Promise<number>} Number of jobs with the specified status
   */
  async countByStatus(status) {
    try {
      const jobs = await this.getAllJobs();
      return jobs.filter((job) => job.status === status).length;
    } catch (error) {
      console.error("Failed to count jobs by status:", error);
      throw error;
    }
  }

  /**
   * Gets all jobs from the file system with robust error handling
   * @private
   * @returns {Promise<Array<Object>>} Array of job data
   */
  async getAllJobs() {
    try {
      // Check if file exists
      try {
        await fs.access(this.jobsFile);
      } catch (error) {
        if (error.code === 'ENOENT') {
          // File doesn't exist, create it with empty array
          await fs.mkdir(path.dirname(this.jobsFile), { recursive: true });
          await fs.writeFile(this.jobsFile, '[]');
          return [];
        }
        throw error;
      }

      const data = await fs.readFile(this.jobsFile, "utf8");
      
      // Handle empty file
      if (!data.trim()) {
        return [];
      }

      try {
        return JSON.parse(data);
      } catch (parseError) {
        console.error("JSON parse error, attempting to recover:", parseError);
        
        // Try to recover by reading the file and finding valid JSON
        const fileContent = await fs.readFile(this.jobsFile, "utf8");
        const lines = fileContent.split('\n');
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
          const recoveredData = `[${validLines.join(',')}]`;
          return JSON.parse(recoveredData);
        }
        
        // If recovery fails, backup the corrupted file and start fresh
        const backupFile = `${this.jobsFile}.backup.${Date.now()}`;
        await fs.copyFile(this.jobsFile, backupFile);
        console.warn(`Corrupted file backed up to: ${backupFile}`);
        
        await fs.writeFile(this.jobsFile, '[]');
        return [];
      }
    } catch (error) {
      console.error("Failed to read jobs:", error);
      return [];
    }
  }
}
