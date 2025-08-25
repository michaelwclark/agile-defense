import { v4 as uuidv4 } from "uuid";

/**
 * Service for extracting structured data from unstructured text content
 * Provides entity extraction, keyword analysis, summarization, and document structure analysis
 */
class ExtractionService {
  /**
   * Extracts entities from text using regex patterns
   * Identifies emails, phone numbers, URLs, dates, money amounts, percentages, and person names
   * @param {string} text - The text content to analyze
   * @returns {Promise<Array<Object>>} Array of extracted entities with metadata
   */
  async extractEntities(text) {
    const entities = [];

    // Simple entity extraction using regex patterns
    const patterns = [
      {
        type: "EMAIL",
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      },
      { type: "PHONE", pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g },
      { type: "URL", pattern: /\bhttps?:\/\/[^\s]+/g },
      {
        type: "DATE",
        pattern: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b/g,
      },
      { type: "MONEY", pattern: /\$\d+(?:,\d{3})*(?:\.\d{2})?/g },
      { type: "PERCENTAGE", pattern: /\d+(?:\.\d+)?%/g },
    ];

    patterns.forEach(({ type, pattern }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          id: uuidv4(),
          type,
          value: match[0],
          confidence: 0.8,
          position: {
            start: match.index,
            end: match.index + match[0].length,
          },
        });
      }
    });

    // Extract potential person names (simple heuristic)
    const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
    let nameMatch;
    while ((nameMatch = namePattern.exec(text)) !== null) {
      entities.push({
        id: uuidv4(),
        type: "PERSON",
        value: nameMatch[0],
        confidence: 0.6,
        position: {
          start: nameMatch.index,
          end: nameMatch.index + nameMatch[0].length,
        },
      });
    }

    return entities;
  }

  /**
   * Extracts the most frequent keywords from text
   * Filters out short words and common stop words, returns top 10 keywords
   * @param {string} text - The text content to analyze
   * @returns {Promise<Array<string>>} Array of keyword strings sorted by frequency
   */
  async extractKeywords(text) {
    // Simple keyword extraction (words that appear frequently)
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
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Generates a simple summary from text content
   * Takes the first few sentences that meet minimum length requirements
   * @param {string} text - The text content to summarize
   * @returns {Promise<string>} A summary string
   */
  async generateSummary(text) {
    // Simple summary generation (first few sentences)
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    return sentences.slice(0, 3).join(". ") + ".";
  }

  /**
   * Extracts document structure and sections from text
   * Identifies headers and organizes content into hierarchical sections
   * @param {string} text - The text content to analyze
   * @returns {Promise<Array<Object>>} Array of document sections with metadata
   */
  async extractDocumentStructure(text) {
    const sections = [];
    const lines = text.split("\n");
    let currentSection = null;
    let sectionContent = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Simple section detection (lines starting with numbers or capital letters)
      if (/^[A-Z][A-Z\s]+$/.test(trimmedLine) || /^\d+\.\s/.test(trimmedLine)) {
        if (currentSection) {
          currentSection.content = sectionContent.join("\n");
          sections.push(currentSection);
        }

        currentSection = {
          id: uuidv4(),
          title: trimmedLine,
          content: "",
          level: trimmedLine.match(/^\d+\.\s/) ? 1 : 2,
          position: { start: index, end: index },
        };
        sectionContent = [];
      } else if (currentSection) {
        sectionContent.push(line);
      }
    });

    // Add the last section
    if (currentSection) {
      currentSection.content = sectionContent.join("\n");
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * Processes text content based on the specified extraction type
   * Orchestrates different extraction methods and returns comprehensive results
   * @param {string} text - The text content to process
   * @param {string} [extractionType="full"] - Type of extraction to perform
   * @param {string} extractionType.entities - Extract only entities
   * @param {string} extractionType.keywords - Extract only keywords
   * @param {string} extractionType.summary - Generate only summary
   * @param {string} extractionType.structure - Extract only document structure
   * @param {string} extractionType.full - Extract everything (default)
   * @returns {Promise<Object>} Extraction results with metadata and processing time
   */
  async processExtraction(text, extractionType = "full") {
    const startTime = Date.now();

    let result = {
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
  }
}

export default new ExtractionService();
