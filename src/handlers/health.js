import { v4 as uuidv4 } from "uuid";
import { success, responses } from "../utils/response.js";

/**
 * Health check handler for monitoring service status
 * Returns service health information including timestamp and request ID
 * @param {Object} event - API Gateway event object
 * @param {Object} event.headers - Request headers
 * @param {Object} event.queryStringParameters - Query parameters
 * @returns {Promise<Object>} API Gateway response with health status
 */
const handler = async (event) => {
  try {
    const healthData = {
      requestId: uuidv4(),
      stage: process.env.STAGE || "dev",
    };

    return success(200, healthData, "Extraction service is healthy");
  } catch (error) {
    console.error("Health check error:", error);
    return responses.internalError("Service is unhealthy", error);
  }
};

export { handler };
