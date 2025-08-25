import { CreateExtractionUseCase } from "../../application/use-cases/CreateExtractionUseCase.js";
import { GetExtractionUseCase } from "../../application/use-cases/GetExtractionUseCase.js";
import { ListExtractionsUseCase } from "../../application/use-cases/ListExtractionsUseCase.js";
import { responses } from "../../utils/response.js";

/**
 * HTTP Controller for Extraction endpoints
 * This is part of the interfaces layer in hexagon architecture
 */
export class ExtractionController {
  /**
   * Creates a new ExtractionController instance
   * @param {CreateExtractionUseCase} createExtractionUseCase - Use case for creating extractions
   * @param {GetExtractionUseCase} getExtractionUseCase - Use case for getting extractions
   * @param {ListExtractionsUseCase} listExtractionsUseCase - Use case for listing extractions
   */
  constructor(
    createExtractionUseCase,
    getExtractionUseCase,
    listExtractionsUseCase
  ) {
    this.createExtractionUseCase = createExtractionUseCase;
    this.getExtractionUseCase = getExtractionUseCase;
    this.listExtractionsUseCase = listExtractionsUseCase;
  }

  /**
   * Handles POST /extract requests
   * @param {Object} event - Lambda event object
   * @returns {Promise<Object>} HTTP response
   */
  async createExtraction(event) {
    try {
      const body = JSON.parse(event.body || "{}");
      const { text, fileName, extractionType } = body;

      // Validate request
      if (!text && !fileName) {
        return responses.badRequest("Either text or fileName is required");
      }

      // Execute use case
      const extraction = await this.createExtractionUseCase.execute({
        text,
        fileName,
        extractionType,
      });

      return responses.ok(
        extraction.toJSON(),
        "Extraction completed successfully"
      );
    } catch (error) {
      console.error("Create extraction error:", error);
      return responses.internalError("Internal server error", error);
    }
  }

  /**
   * Handles GET /extract/{id} requests
   * @param {Object} event - Lambda event object
   * @returns {Promise<Object>} HTTP response
   */
  async getExtraction(event) {
    try {
      const { id } = event.pathParameters || {};

      if (!id) {
        return responses.badRequest("Extraction ID is required");
      }

      // Execute use case
      const extraction = await this.getExtractionUseCase.execute(id);

      if (!extraction) {
        return responses.notFound("Extraction not found");
      }

      return responses.ok(extraction.toJSON());
    } catch (error) {
      console.error("Get extraction error:", error);
      return responses.internalError("Internal server error", error);
    }
  }

  /**
   * Handles GET /extract requests (list)
   * @param {Object} event - Lambda event object
   * @returns {Promise<Object>} HTTP response
   */
  async listExtractions(event) {
    try {
      const { limit, offset } = event.queryStringParameters || {};

      // Execute use case
      const result = await this.listExtractionsUseCase.execute({
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      });

      return responses.ok({
        extractions: result.extractions.map((extraction) =>
          extraction.toJSON()
        ),
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("List extractions error:", error);
      return responses.internalError("Internal server error", error);
    }
  }
}
