import { container } from "../infrastructure/config/Container.js";
import { responses } from "../utils/response.js";

/**
 * Lambda handler for listing jobs
 * @param {Object} event - Lambda event
 * @param {Object} context - Lambda context
 * @returns {Promise<Object>} HTTP response
 */
export const handler = async (event, context) => {
  try {
    const controller = container.getJobController();
    return await controller.listJobs(event);
  } catch (error) {
    console.error("List jobs handler error:", error);
    return responses.internalError("Internal server error", error);
  }
};
