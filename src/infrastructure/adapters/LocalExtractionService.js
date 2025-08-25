import { ExtractionService } from "../../application/ports/ExtractionService.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Local Implementation of Extraction Service
 * This is an adapter in the hexagon architecture
 */
export class LocalExtractionService extends ExtractionService {
  /**
   * Processes text content for extraction
   * @param {string} text - The text content to process
   * @param {string} extractionType - Type of extraction to perform
   * @returns {Promise<Object>} The extraction results
   */
  async processExtraction(text, extractionType = "full") {
    const startTime = Date.now();

    const result = {
      entities: [],
      keywords: [],
      summary: "",
      sections: [],
      metadata: {
        extractionType,
        processingTime: 0,
        textLength: text.length,
      },
    };

    try {
      switch (extractionType) {
        case "entities":
          result.entities = await this.extractEntities(text);
          break;
        case "keywords":
          result.keywords = await this.extractKeywords(text);
          break;
        case "summary":
          result.summary = await this.generateSummary(text);
          break;
        case "structure":
          result.sections = await this.extractDocumentStructure(text);
          break;
        case "full":
        default:
          result.entities = await this.extractEntities(text);
          result.keywords = await this.extractKeywords(text);
          result.summary = await this.generateSummary(text);
          result.sections = await this.extractDocumentStructure(text);
          break;
      }

      result.metadata.processingTime = Date.now() - startTime;
      return result;
    } catch (error) {
      console.error("Extraction processing failed:", error);
      throw error;
    }
  }

  /**
   * Extracts entities from text
   * @param {string} text - The text content to analyze
   * @returns {Promise<Array<Object>>} Array of extracted entities
   */
  async extractEntities(text) {
    const entities = [];

    // Email extraction
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailRegex) || [];
    emails.forEach((email) => {
      entities.push({
        id: uuidv4(),
        type: "EMAIL",
        value: email,
        confidence: 0.8,
        position: {
          start: text.indexOf(email),
          end: text.indexOf(email) + email.length,
        },
      });
    });

    // Phone number extraction
    const phoneRegex =
      /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = text.match(phoneRegex) || [];
    phones.forEach((phone) => {
      entities.push({
        id: uuidv4(),
        type: "PHONE",
        value: phone,
        confidence: 0.7,
        position: {
          start: text.indexOf(phone),
          end: text.indexOf(phone) + phone.length,
        },
      });
    });

    // URL extraction
    const urlRegex =
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    const urls = text.match(urlRegex) || [];
    urls.forEach((url) => {
      entities.push({
        id: uuidv4(),
        type: "URL",
        value: url,
        confidence: 0.9,
        position: {
          start: text.indexOf(url),
          end: text.indexOf(url) + url.length,
        },
      });
    });

    // Date extraction
    const dateRegex =
      /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/g;
    const dates = text.match(dateRegex) || [];
    dates.forEach((date) => {
      entities.push({
        id: uuidv4(),
        type: "DATE",
        value: date,
        confidence: 0.6,
        position: {
          start: text.indexOf(date),
          end: text.indexOf(date) + date.length,
        },
      });
    });

    // Money extraction
    const moneyRegex =
      /\$\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars?|USD)/gi;
    const money = text.match(moneyRegex) || [];
    money.forEach((amount) => {
      entities.push({
        id: uuidv4(),
        type: "MONEY",
        value: amount,
        confidence: 0.7,
        position: {
          start: text.indexOf(amount),
          end: text.indexOf(amount) + amount.length,
        },
      });
    });

    // Percentage extraction
    const percentageRegex = /\d+(?:\.\d+)?%/g;
    const percentages = text.match(percentageRegex) || [];
    percentages.forEach((percent) => {
      entities.push({
        id: uuidv4(),
        type: "PERCENTAGE",
        value: percent,
        confidence: 0.8,
        position: {
          start: text.indexOf(percent),
          end: text.indexOf(percent) + percent.length,
        },
      });
    });

    // Person name extraction (simple heuristic)
    const words = text.split(/\s+/);
    const capitalizedWords = words.filter(
      (word) =>
        word.length > 1 &&
        word[0] === word[0].toUpperCase() &&
        /^[A-Za-z]+$/.test(word)
    );

    // Simple heuristic: consecutive capitalized words might be names
    for (let i = 0; i < capitalizedWords.length - 1; i++) {
      const name = `${capitalizedWords[i]} ${capitalizedWords[i + 1]}`;
      entities.push({
        id: uuidv4(),
        type: "PERSON",
        value: name,
        confidence: 0.5,
        position: {
          start: text.indexOf(name),
          end: text.indexOf(name) + name.length,
        },
      });
    }

    return entities;
  }

  /**
   * Extracts keywords from text
   * @param {string} text - The text content to analyze
   * @returns {Promise<Array<string>>} Array of keywords
   */
  async extractKeywords(text) {
    // Simple keyword extraction based on word frequency
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 3); // Filter out short words

    const wordCount = {};
    words.forEach((word) => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Get top 10 most frequent words
    const keywords = Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);

    return keywords;
  }

  /**
   * Generates a summary from text
   * @param {string} text - The text content to summarize
   * @returns {Promise<string>} The generated summary
   */
  async generateSummary(text) {
    // Simple summary: first 150 characters + "..."
    if (text.length <= 150) {
      return text;
    }

    const summary = text.substring(0, 150).trim();
    const lastSpace = summary.lastIndexOf(" ");

    if (lastSpace > 0) {
      return summary.substring(0, lastSpace) + "...";
    }

    return summary + "...";
  }

  /**
   * Extracts document structure from text
   * @param {string} text - The text content to analyze
   * @returns {Promise<Array<Object>>} Array of document sections
   */
  async extractDocumentStructure(text) {
    const sections = [];
    const lines = text.split("\n");

    let currentSection = null;
    let currentContent = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Simple heuristic: lines that are all caps or end with numbers might be headers
      const isHeader =
        trimmedLine.length > 0 &&
        (trimmedLine === trimmedLine.toUpperCase() ||
          /^[A-Z][A-Za-z\s]+\d*$/.test(trimmedLine));

      if (isHeader && currentSection) {
        // Save previous section
        currentSection.content = currentContent.join("\n").trim();
        sections.push(currentSection);

        // Start new section
        currentSection = {
          id: uuidv4(),
          title: trimmedLine,
          level: 1,
          startLine: index,
          content: "",
        };
        currentContent = [];
      } else if (isHeader && !currentSection) {
        // First section
        currentSection = {
          id: uuidv4(),
          title: trimmedLine,
          level: 1,
          startLine: index,
          content: "",
        };
      } else if (trimmedLine.length > 0) {
        currentContent.push(trimmedLine);
      }
    });

    // Add the last section
    if (currentSection) {
      currentSection.content = currentContent.join("\n").trim();
      sections.push(currentSection);
    }

    return sections;
  }
}
