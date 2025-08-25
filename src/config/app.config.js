/**
 * Application configuration with hardcoded defaults
 * Handles scale & reliability settings for batching, concurrency, retry, and backpressure
 */
export const appConfig = {
  // Batching & Concurrency Settings
  batching: {
    maxBatchSize: 100, // Maximum documents per batch
    maxConcurrentBatches: 10, // Maximum concurrent batch processing
    batchTimeoutMs: 30000, // Batch timeout in milliseconds
    minBatchSize: 5, // Minimum documents to trigger batch processing
  },

  // Concurrency & Rate Limiting
  concurrency: {
    maxConcurrentWorkers: 50, // Maximum concurrent document processors
    workerTimeoutMs: 60000, // Worker timeout in milliseconds
    rateLimitPerSecond: 100, // Rate limit per second
    rateLimitBurst: 200, // Burst rate limit
  },

  // Retry & Backoff Settings
  retry: {
    maxRetries: 3, // Maximum retry attempts
    initialBackoffMs: 1000, // Initial backoff in milliseconds
    maxBackoffMs: 30000, // Maximum backoff in milliseconds
    backoffMultiplier: 2, // Exponential backoff multiplier
    jitterFactor: 0.1, // Jitter factor for backoff randomization
  },

  // Backpressure Settings
  backpressure: {
    maxQueueSize: 1000, // Maximum items in processing queue
    queueTimeoutMs: 60000, // Queue timeout in milliseconds
    pressureThreshold: 0.8, // Backpressure threshold (80% of queue)
    circuitBreakerThreshold: 0.9, // Circuit breaker threshold (90% of queue)
  },

  // Document Processing Settings
  document: {
    maxChunkSize: 4000, // Maximum chunk size in characters
    chunkOverlap: 200, // Overlap between chunks in characters
    maxDocumentSize: 10485760, // Maximum document size (10MB)
    supportedFormats: ["txt", "pdf", "docx", "json", "csv"],
  },

  // Extraction Settings
  extraction: {
    maxExtractionTimeMs: 300000, // Maximum extraction time (5 minutes)
    confidenceThreshold: 0.7, // Minimum confidence threshold
    enableValidation: true, // Enable field validation and coercion
    enableChunking: true, // Enable document chunking
  },

  // Output Settings
  output: {
    outputDirectory: "./output", // Output directory for results
    outputFormat: "jsonl", // Output format (jsonl, json, csv)
    compressionEnabled: true, // Enable output compression
    maxOutputFileSize: 104857600, // Maximum output file size (100MB)
    shardSize: 10000, // Number of records per shard
  },

  // Storage Settings
  storage: {
    localDataDir: "./data", // Local data directory
    tempDir: "./temp", // Temporary directory
    cleanupTempFiles: true, // Clean up temporary files
    maxStorageSize: 1073741824, // Maximum storage size (1GB)
  },

  // Monitoring & Observability
  monitoring: {
    enableMetrics: true, // Enable metrics collection
    enableTracing: true, // Enable request tracing
    logLevel: "info", // Log level (debug, info, warn, error)
    metricsIntervalMs: 60000, // Metrics collection interval
  },

  // LLM Provider Settings (for future use)
  llm: {
    provider: "mock", // LLM provider (mock, openai, anthropic, etc.)
    model: "gpt-4", // Model name
    maxTokens: 4000, // Maximum tokens per request
    temperature: 0.1, // Temperature for generation
    timeoutMs: 30000, // LLM request timeout
  },

  // Idempotency Settings
  idempotency: {
    enabled: true, // Enable idempotency
    keyField: "id", // Field to use for idempotency key
    ttlSeconds: 86400, // Idempotency key TTL (24 hours)
  },

  // Error Handling
  errorHandling: {
    failFast: false, // Fail fast on errors
    partialResults: true, // Allow partial results
    errorThreshold: 0.1, // Error threshold (10% of documents)
    continueOnError: true, // Continue processing on individual errors
  },
};

/**
 * Get configuration value with fallback
 * @param {string} path - Configuration path (e.g., 'batching.maxBatchSize')
 * @param {any} defaultValue - Default value if not found
 * @returns {any} Configuration value
 */
export function getConfig(path, defaultValue = null) {
  const keys = path.split(".");
  let value = appConfig;

  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }

  return value;
}

/**
 * Validate configuration
 * @returns {Object} Validation result
 */
export function validateConfig() {
  const errors = [];

  // Validate batching settings
  if (getConfig("batching.maxBatchSize") <= 0) {
    errors.push("batching.maxBatchSize must be positive");
  }

  if (getConfig("batching.maxConcurrentBatches") <= 0) {
    errors.push("batching.maxConcurrentBatches must be positive");
  }

  // Validate concurrency settings
  if (getConfig("concurrency.maxConcurrentWorkers") <= 0) {
    errors.push("concurrency.maxConcurrentWorkers must be positive");
  }

  if (getConfig("concurrency.rateLimitPerSecond") <= 0) {
    errors.push("concurrency.rateLimitPerSecond must be positive");
  }

  // Validate retry settings
  if (getConfig("retry.maxRetries") < 0) {
    errors.push("retry.maxRetries must be non-negative");
  }

  if (getConfig("retry.initialBackoffMs") <= 0) {
    errors.push("retry.initialBackoffMs must be positive");
  }

  // Validate backpressure settings
  if (getConfig("backpressure.maxQueueSize") <= 0) {
    errors.push("backpressure.maxQueueSize must be positive");
  }

  if (
    getConfig("backpressure.pressureThreshold") <= 0 ||
    getConfig("backpressure.pressureThreshold") > 1
  ) {
    errors.push("backpressure.pressureThreshold must be between 0 and 1");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export default appConfig;
