import { Extraction } from "../../../domain/entities/Extraction.js";

describe("Extraction Entity", () => {
  let extraction;

  beforeEach(() => {
    extraction = new Extraction({
      id: "test-id",
      text: "Test text content",
      extractionType: "entities",
      result: { entities: [] },
      status: "pending",
      createdAt: "2023-01-01T00:00:00.000Z",
      metadata: { test: "data" },
    });
  });

  describe("constructor", () => {
    it("should create an extraction with all required fields", () => {
      expect(extraction.id).toBe("test-id");
      expect(extraction.text).toBe("Test text content");
      expect(extraction.extractionType).toBe("entities");
      expect(extraction.result).toEqual({ entities: [] });
      expect(extraction.status).toBe("pending");
      expect(extraction.createdAt).toBe("2023-01-01T00:00:00.000Z");
      expect(extraction.metadata).toEqual({ test: "data" });
    });

    it("should set default values when not provided", () => {
      const extractionWithDefaults = new Extraction({
        id: "test-id",
        text: "Test text",
        extractionType: "full",
      });

      expect(extractionWithDefaults.status).toBe("pending");
      expect(extractionWithDefaults.metadata).toEqual({});
      expect(extractionWithDefaults.createdAt).toBeDefined();
    });
  });

  describe("validate", () => {
    it("should return true for valid extraction", () => {
      expect(extraction.validate()).toBe(true);
    });

    it("should throw error when id is missing", () => {
      extraction.id = null;
      expect(() => extraction.validate()).toThrow("Extraction ID is required");
    });

    it("should throw error when text is missing", () => {
      extraction.text = null;
      expect(() => extraction.validate()).toThrow(
        "Extraction text is required"
      );
    });

    it("should throw error when extractionType is missing", () => {
      extraction.extractionType = null;
      expect(() => extraction.validate()).toThrow(
        "Extraction type is required"
      );
    });
  });

  describe("markCompleted", () => {
    it("should mark extraction as completed with result", () => {
      const result = {
        entities: [{ type: "EMAIL", value: "test@example.com" }],
      };
      extraction.markCompleted(result);

      expect(extraction.status).toBe("completed");
      expect(extraction.result).toEqual(result);
      expect(extraction.metadata.processingTime).toBeDefined();
    });
  });

  describe("markFailed", () => {
    it("should mark extraction as failed with error", () => {
      const error = "Processing failed";
      extraction.markFailed(error);

      expect(extraction.status).toBe("failed");
      expect(extraction.metadata.error).toBe(error);
    });
  });

  describe("toJSON", () => {
    it("should return plain object representation", () => {
      const json = extraction.toJSON();

      expect(json).toEqual({
        id: "test-id",
        text: "Test text content",
        extractionType: "entities",
        result: { entities: [] },
        status: "pending",
        createdAt: "2023-01-01T00:00:00.000Z",
        metadata: { test: "data" },
      });
    });
  });

  describe("fromJSON", () => {
    it("should create extraction from plain object", () => {
      const data = {
        id: "from-json-id",
        text: "From JSON text",
        extractionType: "full",
        result: { summary: "Test summary" },
        status: "completed",
        createdAt: "2023-01-02T00:00:00.000Z",
        metadata: { source: "json" },
      };

      const extractionFromJson = Extraction.fromJSON(data);

      expect(extractionFromJson.id).toBe("from-json-id");
      expect(extractionFromJson.text).toBe("From JSON text");
      expect(extractionFromJson.extractionType).toBe("full");
      expect(extractionFromJson.result).toEqual({ summary: "Test summary" });
      expect(extractionFromJson.status).toBe("completed");
      expect(extractionFromJson.createdAt).toBe("2023-01-02T00:00:00.000Z");
      expect(extractionFromJson.metadata).toEqual({ source: "json" });
    });
  });
});
