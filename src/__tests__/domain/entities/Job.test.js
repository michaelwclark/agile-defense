import { describe, it, expect, beforeEach } from "vitest";
import { Job } from "../../../domain/entities/Job.js";

describe("Job Entity", () => {
  let validJobData;

  beforeEach(() => {
    validJobData = {
      id: "test-job-id",
      name: "Test Job",
      extractionConfig: {
        type: "schema",
        schema: {
          id: "test-schema",
          name: "Test Schema",
          fields: [
            { name: "title", type: "string", required: true },
            { name: "amount", type: "number", required: false },
          ],
        },
      },
      documentIds: ["doc1", "doc2"],
      status: "pending",
      metadata: { priority: "high" },
    };
  });

  describe("constructor", () => {
    it("should create a job with valid data", () => {
      const job = new Job(validJobData);

      expect(job.id).toBe(validJobData.id);
      expect(job.name).toBe(validJobData.name);
      expect(job.extractionConfig).toEqual(validJobData.extractionConfig);
      expect(job.documentIds).toEqual(validJobData.documentIds);
      expect(job.status).toBe(validJobData.status);
      expect(job.metadata).toEqual(validJobData.metadata);
      expect(job.createdAt).toBeDefined();
      expect(job.updatedAt).toBeDefined();
    });

    it("should set default values when not provided", () => {
      const job = new Job({
        id: "test-id",
        name: "Test Job",
        extractionConfig: { type: "entities" },
      });

      expect(job.documentIds).toEqual([]);
      expect(job.status).toBe("pending");
      expect(job.metadata).toEqual({});
      expect(job.createdAt).toBeDefined();
      expect(job.updatedAt).toBeDefined();
    });
  });

  describe("validate", () => {
    it("should validate a job with valid data", () => {
      const job = new Job(validJobData);
      expect(() => job.validate()).not.toThrow();
    });

    it("should throw error when id is missing", () => {
      const jobData = { ...validJobData, id: undefined };
      const job = new Job(jobData);
      expect(() => job.validate()).toThrow("Job ID is required");
    });

    it("should throw error when name is missing", () => {
      const jobData = { ...validJobData, name: undefined };
      const job = new Job(jobData);
      expect(() => job.validate()).toThrow("Job name is required");
    });

    it("should throw error when extractionConfig is missing", () => {
      const jobData = { ...validJobData, extractionConfig: undefined };
      const job = new Job(jobData);
      expect(() => job.validate()).toThrow(
        "Extraction configuration is required"
      );
    });

    it("should throw error when documentIds is not an array", () => {
      const jobData = { ...validJobData, documentIds: "not-an-array" };
      const job = new Job(jobData);
      expect(() => job.validate()).toThrow("Document IDs must be an array");
    });
  });

  describe("status management", () => {
    it("should mark job as processing", () => {
      const job = new Job(validJobData);
      const originalStatus = job.status;

      job.markProcessing();

      expect(job.status).toBe("processing");
      expect(job.status).not.toBe(originalStatus);
      expect(job.updatedAt).toBeDefined();
    });

    it("should mark job as completed", () => {
      const job = new Job(validJobData);
      const result = { processedDocuments: 10, totalDocuments: 10 };

      job.markCompleted(result);

      expect(job.status).toBe("completed");
      expect(job.metadata.result).toEqual(result);
    });

    it("should mark job as failed", () => {
      const job = new Job(validJobData);
      const error = "Processing failed";

      job.markFailed(error);

      expect(job.status).toBe("failed");
      expect(job.metadata.error).toBe(error);
    });
  });

  describe("serialization", () => {
    it("should convert job to JSON", () => {
      const job = new Job(validJobData);
      const json = job.toJSON();

      expect(json).toEqual({
        id: job.id,
        name: job.name,
        extractionConfig: job.extractionConfig,
        documentIds: job.documentIds,
        status: job.status,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        metadata: job.metadata,
      });
    });

    it("should create job from JSON", () => {
      const job = new Job(validJobData);
      const json = job.toJSON();
      const recreatedJob = Job.fromJSON(json);

      expect(recreatedJob.id).toBe(job.id);
      expect(recreatedJob.name).toBe(job.name);
      expect(recreatedJob.extractionConfig).toEqual(job.extractionConfig);
      expect(recreatedJob.documentIds).toEqual(job.documentIds);
      expect(recreatedJob.status).toBe(job.status);
      expect(recreatedJob.metadata).toEqual(job.metadata);
    });
  });
});
