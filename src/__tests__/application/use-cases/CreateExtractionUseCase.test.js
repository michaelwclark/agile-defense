import { CreateExtractionUseCase } from "../../../application/use-cases/CreateExtractionUseCase.js";
import { Extraction } from "../../../domain/entities/Extraction.js";
import { vi } from "vitest";

// Mock dependencies
const mockExtractionRepository = {
  save: vi.fn(),
};

const mockExtractionService = {
  processExtraction: vi.fn(),
};

const mockStorageService = {
  readFile: vi.fn(),
};

describe("CreateExtractionUseCase", () => {
  let useCase;

  beforeEach(() => {
    useCase = new CreateExtractionUseCase(
      mockExtractionRepository,
      mockExtractionService,
      mockStorageService
    );

    // Reset mocks
    vi.clearAllMocks();
  });

  describe("execute", () => {
    it("should create extraction with text content", async () => {
      const request = {
        text: "Test text content",
        extractionType: "entities",
      };

      const expectedResult = {
        entities: [{ type: "EMAIL", value: "test@example.com" }],
        keywords: [],
        summary: "",
        sections: [],
        metadata: {
          extractionType: "entities",
          processingTime: 1,
          textLength: 18,
        },
      };

      mockExtractionService.processExtraction.mockResolvedValue(expectedResult);
      mockExtractionRepository.save.mockImplementation((extraction) =>
        Promise.resolve(extraction)
      );

      const result = await useCase.execute(request);

      expect(mockExtractionService.processExtraction).toHaveBeenCalledWith(
        "Test text content",
        "entities"
      );
      expect(mockExtractionRepository.save).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Extraction);
      expect(result.text).toBe("Test text content");
      expect(result.extractionType).toBe("entities");
      expect(result.status).toBe("completed");
      expect(result.result).toEqual(expectedResult);
    });

    it("should create extraction with file content", async () => {
      const request = {
        fileName: "test.txt",
        extractionType: "full",
      };

      const fileContent = "File content for extraction";
      const expectedResult = {
        entities: [],
        keywords: ["file", "content", "extraction"],
        summary: "File content for extraction...",
        sections: [],
        metadata: {
          extractionType: "full",
          processingTime: 1,
          textLength: 25,
        },
      };

      mockStorageService.readFile.mockResolvedValue(fileContent);
      mockExtractionService.processExtraction.mockResolvedValue(expectedResult);
      mockExtractionRepository.save.mockImplementation((extraction) =>
        Promise.resolve(extraction)
      );

      const result = await useCase.execute(request);

      expect(mockStorageService.readFile).toHaveBeenCalledWith("test.txt");
      expect(mockExtractionService.processExtraction).toHaveBeenCalledWith(
        fileContent,
        "full"
      );
      expect(result.text).toBe(fileContent);
      expect(result.extractionType).toBe("full");
    });

    it("should use default extraction type when not provided", async () => {
      const request = {
        text: "Test text",
      };

      const expectedResult = {
        entities: [],
        keywords: [],
        summary: "",
        sections: [],
        metadata: {
          extractionType: "full",
          processingTime: 1,
          textLength: 9,
        },
      };

      mockExtractionService.processExtraction.mockResolvedValue(expectedResult);
      mockExtractionRepository.save.mockImplementation((extraction) =>
        Promise.resolve(extraction)
      );

      await useCase.execute(request);

      expect(mockExtractionService.processExtraction).toHaveBeenCalledWith(
        "Test text",
        "full"
      );
    });

    it("should throw error when neither text nor fileName is provided", async () => {
      const request = {};

      await expect(useCase.execute(request)).rejects.toThrow(
        "Either text or fileName is required"
      );
    });

    it("should handle extraction service errors", async () => {
      const request = {
        text: "Test text",
        extractionType: "entities",
      };

      const serviceError = new Error("Processing failed");
      mockExtractionService.processExtraction.mockRejectedValue(serviceError);
      mockExtractionRepository.save.mockImplementation((extraction) =>
        Promise.resolve(extraction)
      );

      const result = await useCase.execute(request);

      expect(result.status).toBe("failed");
      expect(result.metadata.error).toBe("Processing failed");
      expect(mockExtractionRepository.save).toHaveBeenCalled();
    });

    it("should handle repository save errors", async () => {
      const request = {
        text: "Test text",
      };

      const expectedResult = {
        entities: [],
        keywords: [],
        summary: "",
        sections: [],
        metadata: {
          extractionType: "full",
          processingTime: 1,
          textLength: 9,
        },
      };

      mockExtractionService.processExtraction.mockResolvedValue(expectedResult);
      const saveError = new Error("Save failed");
      mockExtractionRepository.save.mockRejectedValue(saveError);

      await expect(useCase.execute(request)).rejects.toThrow("Save failed");
    });
  });
});
