/**
 * Utility functions for standardizing HTTP responses
 */

/**
 * Creates a successful response
 * @param {number} statusCode - HTTP status code
 * @param {any} data - Response data
 * @param {string} message - Optional success message
 * @returns {Object} Standardized response object
 */
export const success = (
  statusCode = 200,
  data = null,
  message = "Success"
) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true,
  },
  body: JSON.stringify({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  }),
});

/**
 * Creates an error response
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {any} error - Optional error details
 * @returns {Object} Standardized error response object
 */
export const error = (
  statusCode = 500,
  message = "Internal Server Error",
  error = null
) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true,
  },
  body: JSON.stringify({
    success: false,
    message,
    error: error?.message || error,
    timestamp: new Date().toISOString(),
  }),
});

/**
 * Common response helpers
 */
export const responses = {
  ok: (data, message) => success(200, data, message),
  created: (data, message) => success(201, data, message),
  noContent: () => success(204),
  badRequest: (message, details) => error(400, message, details),
  unauthorized: (message) => error(401, message),
  forbidden: (message) => error(403, message),
  notFound: (message) => error(404, message),
  conflict: (message) => error(409, message),
  unprocessable: (message, details) => error(422, message, details),
  internalError: (message, error) => error(500, message, error),
  serviceUnavailable: (message) => error(503, message),
};
