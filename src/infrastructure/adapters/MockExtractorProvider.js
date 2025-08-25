import { ExtractorProvider } from "../../application/ports/ExtractorProvider.js";
import { ExtractionSchema } from "../../domain/entities/ExtractionSchema.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Mock Implementation of Extractor Provider
 * Simulates LLM-based extraction with schema validation and type coercion
 * This is an adapter in the hexagon architecture
 */
export class MockExtractorProvider extends ExtractorProvider {
  /**
   * Extracts structured data from text using the provided schema
   * @param {string} text - The text content to extract from
   * @param {ExtractionSchema} schema - The schema defining the extraction structure
   * @param {Object} options - Extraction options
   * @returns {Promise<Object>} Extracted structured data
   */
  async extractWithSchema(text, schema, options = {}) {
    try {
      // Simulate processing time
      await this.simulateProcessingDelay();

      // Ensure schema is an ExtractionSchema instance
      if (
        schema &&
        typeof schema === "object" &&
        !schema.validateAndCoerceField
      ) {
        const { ExtractionSchema } = await import(
          "../../domain/entities/ExtractionSchema.js"
        );
        schema = ExtractionSchema.fromJSON(schema);
      }

      // Generate mock data based on schema
      const extractedData = {};

      for (const field of schema.fields) {
        extractedData[field.name] = this.generateMockValue(field, text);
      }

      // Validate and coerce the data
      const validatedData = await this.validateAndCoerce(extractedData, schema);

      return {
        id: uuidv4(),
        data: validatedData,
        confidence: this.calculateConfidence(validatedData, schema),
        processingTime: Date.now(),
        metadata: {
          provider: "mock",
          schema: schema.name,
          textLength: text.length,
          options,
        },
      };
    } catch (error) {
      throw new Error(`Extraction failed: ${error.message}`);
    }
  }

  /**
   * Extracts entities from text
   * @param {string} text - The text content to analyze
   * @param {Array<string>} entityTypes - Types of entities to extract
   * @returns {Promise<Array<Object>>} Array of extracted entities
   */
  async extractEntities(text, entityTypes = []) {
    await this.simulateProcessingDelay();

    const entities = [];
    const defaultTypes = [
      "EMAIL",
      "PHONE",
      "URL",
      "DATE",
      "MONEY",
      "PERCENTAGE",
      "PERSON",
    ];
    const typesToExtract = entityTypes.length > 0 ? entityTypes : defaultTypes;

    // Email extraction
    if (typesToExtract.includes("EMAIL")) {
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      const emails = text.match(emailRegex) || [];
      emails.forEach((email) => {
        entities.push({
          id: uuidv4(),
          type: "EMAIL",
          value: email,
          confidence: 0.9,
          position: {
            start: text.indexOf(email),
            end: text.indexOf(email) + email.length,
          },
        });
      });
    }

    // Phone extraction
    if (typesToExtract.includes("PHONE")) {
      const phoneRegex =
        /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
      const phones = text.match(phoneRegex) || [];
      phones.forEach((phone) => {
        entities.push({
          id: uuidv4(),
          type: "PHONE",
          value: phone,
          confidence: 0.8,
          position: {
            start: text.indexOf(phone),
            end: text.indexOf(phone) + phone.length,
          },
        });
      });
    }

    // URL extraction
    if (typesToExtract.includes("URL")) {
      const urlRegex =
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
      const urls = text.match(urlRegex) || [];
      urls.forEach((url) => {
        entities.push({
          id: uuidv4(),
          type: "URL",
          value: url,
          confidence: 0.95,
          position: {
            start: text.indexOf(url),
            end: text.indexOf(url) + url.length,
          },
        });
      });
    }

    // Date extraction
    if (typesToExtract.includes("DATE")) {
      const dateRegex =
        /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/g;
      const dates = text.match(dateRegex) || [];
      dates.forEach((date) => {
        entities.push({
          id: uuidv4(),
          type: "DATE",
          value: date,
          confidence: 0.7,
          position: {
            start: text.indexOf(date),
            end: text.indexOf(date) + date.length,
          },
        });
      });
    }

    // Money extraction
    if (typesToExtract.includes("MONEY")) {
      const moneyRegex =
        /\$\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars?|USD)/gi;
      const money = text.match(moneyRegex) || [];
      money.forEach((amount) => {
        entities.push({
          id: uuidv4(),
          type: "MONEY",
          value: amount,
          confidence: 0.8,
          position: {
            start: text.indexOf(amount),
            end: text.indexOf(amount) + amount.length,
          },
        });
      });
    }

    // Percentage extraction
    if (typesToExtract.includes("PERCENTAGE")) {
      const percentageRegex = /\d+(?:\.\d+)?%/g;
      const percentages = text.match(percentageRegex) || [];
      percentages.forEach((percent) => {
        entities.push({
          id: uuidv4(),
          type: "PERCENTAGE",
          value: percent,
          confidence: 0.9,
          position: {
            start: text.indexOf(percent),
            end: text.indexOf(percent) + percent.length,
          },
        });
      });
    }

    // Person name extraction
    if (typesToExtract.includes("PERSON")) {
      const words = text.split(/\s+/);
      const capitalizedWords = words.filter(
        (word) =>
          word.length > 1 &&
          word[0] === word[0].toUpperCase() &&
          /^[A-Za-z]+$/.test(word)
      );

      for (let i = 0; i < capitalizedWords.length - 1; i++) {
        const name = `${capitalizedWords[i]} ${capitalizedWords[i + 1]}`;
        entities.push({
          id: uuidv4(),
          type: "PERSON",
          value: name,
          confidence: 0.6,
          position: {
            start: text.indexOf(name),
            end: text.indexOf(name) + name.length,
          },
        });
      }
    }

    return entities;
  }

  /**
   * Generates a summary from text
   * @param {string} text - The text content to summarize
   * @param {Object} options - Summary options
   * @returns {Promise<string>} The generated summary
   */
  async generateSummary(text, options = {}) {
    await this.simulateProcessingDelay();

    const maxLength = options.maxLength || 150;

    if (text.length <= maxLength) {
      return text;
    }

    const summary = text.substring(0, maxLength).trim();
    const lastSpace = summary.lastIndexOf(" ");

    if (lastSpace > 0) {
      return summary.substring(0, lastSpace) + "...";
    }

    return summary + "...";
  }

  /**
   * Extracts keywords from text
   * @param {string} text - The text content to analyze
   * @param {Object} options - Keyword extraction options
   * @returns {Promise<Array<string>>} Array of keywords
   */
  async extractKeywords(text, options = {}) {
    await this.simulateProcessingDelay();

    const maxKeywords = options.maxKeywords || 10;
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 3);

    const wordCount = {};
    words.forEach((word) => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  /**
   * Validates extracted data against schema
   * @param {Object} data - The extracted data
   * @param {ExtractionSchema} schema - The schema to validate against
   * @returns {Promise<Object>} Validation result with coerced data
   */
  async validateAndCoerce(data, schema) {
    const validatedData = {};
    const errors = [];

    for (const field of schema.fields) {
      try {
        const value = data[field.name];
        const coercedValue = schema.validateAndCoerceField(field.name, value);
        validatedData[field.name] = coercedValue;
      } catch (error) {
        errors.push(`Field '${field.name}': ${error.message}`);
        if (field.required !== false) {
          validatedData[field.name] = null;
        }
      }
    }

    return {
      data: validatedData,
      errors,
      isValid: errors.length === 0,
    };
  }

  /**
   * Checks if the provider is available and healthy
   * @returns {Promise<boolean>} True if provider is available
   */
  async isHealthy() {
    return true; // Mock provider is always healthy
  }

  /**
   * Gets provider information
   * @returns {Object} Provider information
   */
  getProviderInfo() {
    return {
      name: "Mock Extractor Provider",
      version: "1.0.0",
      capabilities: [
        "schema_extraction",
        "entity_extraction",
        "summarization",
        "keyword_extraction",
      ],
      maxTokens: 4000,
      supportedFormats: ["text", "json"],
    };
  }

  /**
   * Generates mock value for a field based on its type and text content
   * @param {Object} field - Field definition
   * @param {string} text - Text content
   * @returns {any} Mock value
   */
  generateMockValue(field, text) {
    const fieldName = field.name.toLowerCase();
    const fieldType = field.type.toLowerCase();

    // Try to extract real values first
    if (fieldName.includes("email") || fieldName.includes("mail")) {
      const emailMatch = text.match(
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
      );
      if (emailMatch) return emailMatch[0];
    }

    if (fieldName.includes("phone") || fieldName.includes("tel")) {
      const phoneMatch = text.match(
        /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/
      );
      if (phoneMatch) return phoneMatch[0];
    }

    if (fieldName.includes("date")) {
      const dateMatch = text.match(
        /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/
      );
      if (dateMatch) return dateMatch[0];
    }

    if (
      fieldName.includes("amount") ||
      fieldName.includes("total") ||
      fieldName.includes("price")
    ) {
      const moneyMatch = text.match(/\$\d+(?:,\d{3})*(?:\.\d{2})?/);
      if (moneyMatch) return moneyMatch[0];
    }

    if (fieldName.includes("name")) {
      const words = text.split(/\s+/);
      const capitalizedWords = words.filter(
        (word) =>
          word.length > 1 &&
          word[0] === word[0].toUpperCase() &&
          /^[A-Za-z]+$/.test(word)
      );
      if (capitalizedWords.length >= 2) {
        return `${capitalizedWords[0]} ${capitalizedWords[1]}`;
      }
    }

    // Generate mock values based on type
    switch (fieldType) {
      case "string":
        return `Mock ${field.name}`;
      case "number":
      case "integer":
        return Math.floor(Math.random() * 1000) + 1;
      case "boolean":
        return Math.random() > 0.5;
      case "date":
        return new Date().toISOString().split("T")[0];
      case "array":
        return ["item1", "item2", "item3"];
      case "object":
        return { key: "value" };
      default:
        return `Mock ${field.name}`;
    }
  }

  /**
   * Calculates confidence score for extracted data
   * @param {Object} data - Extracted data
   * @param {ExtractionSchema} schema - Schema used for extraction
   * @returns {number} Confidence score between 0 and 1
   */
  calculateConfidence(data, schema) {
    let totalFields = 0;
    let filledFields = 0;

    for (const field of schema.fields) {
      totalFields++;
      if (data[field.name] !== null && data[field.name] !== undefined) {
        filledFields++;
      }
    }

    return totalFields > 0 ? filledFields / totalFields : 0;
  }

  /**
   * Simulates processing delay
   * @returns {Promise<void>}
   */
  async simulateProcessingDelay() {
    const delay = Math.random() * 1000 + 100; // 100-1100ms
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}
