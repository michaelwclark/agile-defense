import { LocalExtractionService } from "../../../infrastructure/adapters/LocalExtractionService.js";

describe("LocalExtractionService", () => {
  let service;

  beforeEach(() => {
    service = new LocalExtractionService();
  });

  describe("processExtraction", () => {
    it("should process full extraction by default", async () => {
      const text = "Contact us at test@example.com or call (555) 123-4567";
      const result = await service.processExtraction(text);

      expect(result.entities).toHaveLength(2); // email and phone
      expect(result.keywords).toHaveLength(4); // "contact", "test", "example", "call"
      expect(result.summary).toBeDefined();
      expect(result.sections).toBeDefined();
      expect(result.metadata.extractionType).toBe("full");
      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.metadata.textLength).toBe(text.length);
    });

    it("should process entities extraction only", async () => {
      const text = "Email: test@example.com, Phone: (555) 123-4567";
      const result = await service.processExtraction(text, "entities");

      expect(result.entities).toHaveLength(2);
      expect(result.keywords).toHaveLength(0);
      expect(result.summary).toBe("");
      expect(result.sections).toHaveLength(0);
      expect(result.metadata.extractionType).toBe("entities");
    });

    it("should process keywords extraction only", async () => {
      const text = "This is a test document with important keywords";
      const result = await service.processExtraction(text, "keywords");

      expect(result.entities).toHaveLength(0);
      expect(result.keywords).toHaveLength(6); // "this", "test", "document", "with", "important", "keywords"
      expect(result.summary).toBe("");
      expect(result.sections).toHaveLength(0);
      expect(result.metadata.extractionType).toBe("keywords");
    });

    it("should process summary extraction only", async () => {
      const text =
        "This is a long text that should be summarized. It contains multiple sentences and should be truncated appropriately.";
      const result = await service.processExtraction(text, "summary");

      expect(result.entities).toHaveLength(0);
      expect(result.keywords).toHaveLength(0);
      expect(result.summary).toBe(text); // Text is not long enough to be truncated
      expect(result.sections).toHaveLength(0);
      expect(result.metadata.extractionType).toBe("summary");
    });

    it("should process structure extraction only", async () => {
      const text =
        "INTRODUCTION\nThis is the intro.\n\nMETHODS\nThis describes methods.\n\nRESULTS\nThese are the results.";
      const result = await service.processExtraction(text, "structure");

      expect(result.entities).toHaveLength(0);
      expect(result.keywords).toHaveLength(0);
      expect(result.summary).toBe("");
      expect(result.sections).toHaveLength(3); // INTRODUCTION, METHODS, RESULTS
      expect(result.metadata.extractionType).toBe("structure");
    });
  });

  describe("extractEntities", () => {
    it("should extract email addresses", async () => {
      const text = "Contact us at test@example.com or support@company.org";
      const entities = await service.extractEntities(text);

      const emailEntities = entities.filter((e) => e.type === "EMAIL");
      expect(emailEntities).toHaveLength(2);
      expect(emailEntities[0].value).toBe("test@example.com");
      expect(emailEntities[1].value).toBe("support@company.org");
      expect(emailEntities[0].confidence).toBe(0.8);
    });

    it("should extract phone numbers", async () => {
      const text = "Call us at (555) 123-4567 or +1-555-987-6543";
      const entities = await service.extractEntities(text);

      const phoneEntities = entities.filter((e) => e.type === "PHONE");
      expect(phoneEntities).toHaveLength(2);
      expect(phoneEntities[0].value).toBe("(555) 123-4567");
      expect(phoneEntities[1].value).toBe("+1-555-987-6543");
      expect(phoneEntities[0].confidence).toBe(0.7);
    });

    it("should extract URLs", async () => {
      const text = "Visit https://example.com or http://test.org/path";
      const entities = await service.extractEntities(text);

      const urlEntities = entities.filter((e) => e.type === "URL");
      expect(urlEntities).toHaveLength(2);
      expect(urlEntities[0].value).toBe("https://example.com");
      expect(urlEntities[1].value).toBe("http://test.org/path");
      expect(urlEntities[0].confidence).toBe(0.9);
    });

    it("should extract dates", async () => {
      const text = "Meeting on 12/25/2023 or 2023-12-25";
      const entities = await service.extractEntities(text);

      const dateEntities = entities.filter((e) => e.type === "DATE");
      expect(dateEntities).toHaveLength(2);
      expect(dateEntities[0].value).toBe("12/25/2023");
      expect(dateEntities[1].value).toBe("2023-12-25");
      expect(dateEntities[0].confidence).toBe(0.6);
    });

    it("should extract money amounts", async () => {
      const text = "Price is $1,234.56 or 500 dollars";
      const entities = await service.extractEntities(text);

      const moneyEntities = entities.filter((e) => e.type === "MONEY");
      expect(moneyEntities).toHaveLength(2);
      expect(moneyEntities[0].value).toBe("$1,234.56");
      expect(moneyEntities[1].value).toBe("500 dollars");
      expect(moneyEntities[0].confidence).toBe(0.7);
    });

    it("should extract percentages", async () => {
      const text = "Growth of 15.5% and 25% increase";
      const entities = await service.extractEntities(text);

      const percentageEntities = entities.filter(
        (e) => e.type === "PERCENTAGE"
      );
      expect(percentageEntities).toHaveLength(2);
      expect(percentageEntities[0].value).toBe("15.5%");
      expect(percentageEntities[1].value).toBe("25%");
      expect(percentageEntities[0].confidence).toBe(0.8);
    });

    it("should extract person names", async () => {
      const text = "John Smith and Mary Johnson attended the meeting";
      const entities = await service.extractEntities(text);

      const personEntities = entities.filter((e) => e.type === "PERSON");
      expect(personEntities.length).toBeGreaterThan(0);
      expect(personEntities[0].confidence).toBe(0.5);
    });
  });

  describe("extractKeywords", () => {
    it("should extract keywords from text", async () => {
      const text =
        "This document discusses important topics like machine learning and artificial intelligence. Machine learning is a key technology.";
      const keywords = await service.extractKeywords(text);

      expect(keywords).toHaveLength(10); // Top 10 keywords
      expect(keywords.length).toBeLessThanOrEqual(10);
      expect(keywords).toContain("machine");
      expect(keywords).toContain("learning");
    });

    it("should filter out short words", async () => {
      const text = "A the and or but if in on at to for of with by";
      const keywords = await service.extractKeywords(text);

      expect(keywords).toHaveLength(1); // "with" is 4 characters, so it's included
    });

    it("should return empty array for empty text", async () => {
      const keywords = await service.extractKeywords("");
      expect(keywords).toHaveLength(0);
    });
  });

  describe("generateSummary", () => {
    it("should generate summary for long text", async () => {
      const text =
        "This is a very long text that contains many sentences. It should be summarized to a shorter version. The summary should be around 150 characters and end with ellipsis.";
      const summary = await service.generateSummary(text);

      expect(summary.length).toBeLessThanOrEqual(153); // 150 + 3 for "..."
      expect(summary).toContain("...");
    });

    it("should return full text for short text", async () => {
      const text = "Short text";
      const summary = await service.generateSummary(text);

      expect(summary).toBe(text);
    });

    it("should handle text exactly at limit", async () => {
      const text = "A".repeat(150);
      const summary = await service.generateSummary(text);

      expect(summary).toBe(text);
    });
  });

  describe("extractDocumentStructure", () => {
    it("should extract sections from structured text", async () => {
      const text =
        "INTRODUCTION\nThis is the introduction.\n\nMETHODS\nThis describes the methods.\n\nRESULTS\nThese are the results.";
      const sections = await service.extractDocumentStructure(text);

      expect(sections).toHaveLength(3);
      expect(sections[0].title).toBe("INTRODUCTION");
      expect(sections[1].title).toBe("METHODS");
      expect(sections[2].title).toBe("RESULTS");
      expect(sections[0].content).toBe("This is the introduction.");
    });

    it("should handle text without clear sections", async () => {
      const text =
        "This is just regular text without any clear section headers.";
      const sections = await service.extractDocumentStructure(text);

      expect(sections).toHaveLength(0);
    });

    it("should handle empty text", async () => {
      const sections = await service.extractDocumentStructure("");
      expect(sections).toHaveLength(0);
    });
  });
});
