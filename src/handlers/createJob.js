import { container } from "../infrastructure/config/Container.js";
import { responses } from "../utils/response.js";

/**
 * Lambda handler for creating jobs
 * Uses the hexagon architecture with dependency injection
 * @param {Object} event - Lambda event object
 * @param {Object} context - Lambda context object
 * @returns {Promise<Object>} HTTP response
 */
const handler = async (event, context) => {
  try {
    const controller = container.getJobController();
    return await controller.createJob(event);
  } catch (error) {
    console.error("Handler error:", error);
    return responses.internalError("Internal server error", error);
  }
};

export { handler };
