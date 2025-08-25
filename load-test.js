#!/usr/bin/env node

/**
 * Load Test Script for Extraction Service
 * Tests the performance and scalability of the extraction endpoints
 */

import fetch from "node-fetch";

const BASE_URL = "http://localhost:3000";
const CONCURRENT_REQUESTS = 5; // Reduced from 10
const TOTAL_REQUESTS = 25; // Reduced from 100
const DELAY_BETWEEN_BATCHES = 1000; // 1 second

// Sample texts for testing
const sampleTexts = [
  "Contact us at john.doe@example.com or call (555) 123-4567. Visit https://example.com for more information.",
  "Meeting scheduled for 12/25/2023 at 2:00 PM. Budget is $1,234.56 with 15.5% increase.",
  "John Smith and Mary Johnson attended the quarterly review. Revenue grew by 25% this quarter.",
  "This document discusses machine learning and artificial intelligence. Machine learning is a key technology for modern applications.",
  "INTRODUCTION\nThis is the introduction section.\n\nMETHODS\nThis describes the research methods.\n\nRESULTS\nThese are the experimental results.",
];

const extractionTypes = [
  "full",
  "entities",
  "keywords",
  "summary",
  "structure",
];

class LoadTester {
  constructor() {
    this.results = [];
    this.startTime = null;
    this.endTime = null;
  }

  /**
   * Generates a random test request
   */
  generateTestRequest() {
    const text = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    const extractionType =
      extractionTypes[Math.floor(Math.random() * extractionTypes.length)];

    return {
      text,
      extractionType,
    };
  }

  /**
   * Makes a single request to the extraction endpoint
   */
  async makeRequest(requestId) {
    const request = this.generateTestRequest();
    const startTime = Date.now();

    try {
      const response = await fetch(`${BASE_URL}/extract`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      const result = {
        requestId,
        status: response.status,
        duration,
        success: response.ok,
        textLength: request.text.length,
        extractionType: request.extractionType,
      };

      if (response.ok) {
        const data = await response.json();
        result.extractionId = data.data?.id;
        result.entitiesCount = data.data?.result?.entities?.length || 0;
        result.keywordsCount = data.data?.result?.keywords?.length || 0;
      } else {
        result.error = await response.text();
      }

      return result;
    } catch (error) {
      const endTime = Date.now();
      return {
        requestId,
        status: 0,
        duration: endTime - startTime,
        success: false,
        error: error.message,
        textLength: request.text.length,
        extractionType: request.extractionType,
      };
    }
  }

  /**
   * Makes concurrent requests
   */
  async makeConcurrentRequests(batchId, count) {
    const promises = [];

    for (let i = 0; i < count; i++) {
      const requestId = batchId * CONCURRENT_REQUESTS + i;
      promises.push(this.makeRequest(requestId));
    }

    return Promise.all(promises);
  }

  /**
   * Runs the load test
   */
  async runLoadTest() {
    console.log("🚀 Starting Load Test...");
    console.log(`📊 Configuration:`);
    console.log(`   - Base URL: ${BASE_URL}`);
    console.log(`   - Total Requests: ${TOTAL_REQUESTS}`);
    console.log(`   - Concurrent Requests: ${CONCURRENT_REQUESTS}`);
    console.log(`   - Delay between batches: ${DELAY_BETWEEN_BATCHES}ms`);
    console.log("");

    this.startTime = Date.now();

    const batches = Math.ceil(TOTAL_REQUESTS / CONCURRENT_REQUESTS);

    for (let batch = 0; batch < batches; batch++) {
      const remainingRequests = TOTAL_REQUESTS - batch * CONCURRENT_REQUESTS;
      const batchSize = Math.min(CONCURRENT_REQUESTS, remainingRequests);

      console.log(
        `📦 Batch ${
          batch + 1
        }/${batches} - Making ${batchSize} concurrent requests...`
      );

      const batchResults = await this.makeConcurrentRequests(batch, batchSize);
      this.results.push(...batchResults);

      // Add delay between batches (except for the last batch)
      if (batch < batches - 1) {
        console.log(
          `⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, DELAY_BETWEEN_BATCHES)
        );
      }
    }

    this.endTime = Date.now();

    this.printResults();
  }

  /**
   * Prints test results and statistics
   */
  printResults() {
    const totalDuration = this.endTime - this.startTime;
    const successfulRequests = this.results.filter((r) => r.success);
    const failedRequests = this.results.filter((r) => !r.success);

    const durations = this.results.map((r) => r.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    const requestsPerSecond = (this.results.length / totalDuration) * 1000;

    console.log("");
    console.log("📈 Load Test Results");
    console.log("====================");
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    console.log(`📊 Total Requests: ${this.results.length}`);
    console.log(`✅ Successful: ${successfulRequests.length}`);
    console.log(`❌ Failed: ${failedRequests.length}`);
    console.log(
      `📈 Success Rate: ${(
        (successfulRequests.length / this.results.length) *
        100
      ).toFixed(2)}%`
    );
    console.log(`🚀 Requests/Second: ${requestsPerSecond.toFixed(2)}`);
    console.log("");
    console.log("⏱️  Response Times:");
    console.log(`   - Average: ${avgDuration.toFixed(2)}ms`);
    console.log(`   - Minimum: ${minDuration}ms`);
    console.log(`   - Maximum: ${maxDuration}ms`);
    console.log("");

    // Group by extraction type
    const byType = {};
    this.results.forEach((result) => {
      if (!byType[result.extractionType]) {
        byType[result.extractionType] = [];
      }
      byType[result.extractionType].push(result);
    });

    console.log("📋 Results by Extraction Type:");
    Object.entries(byType).forEach(([type, results]) => {
      const successCount = results.filter((r) => r.success).length;
      const avgDuration =
        results.reduce((a, b) => a + b.duration, 0) / results.length;
      console.log(
        `   - ${type}: ${successCount}/${
          results.length
        } successful, avg ${avgDuration.toFixed(2)}ms`
      );
    });

    // Error summary
    if (failedRequests.length > 0) {
      console.log("");
      console.log("❌ Error Summary:");
      const errorCounts = {};
      failedRequests.forEach((req) => {
        const error = req.error || `HTTP ${req.status}`;
        errorCounts[error] = (errorCounts[error] || 0) + 1;
      });

      Object.entries(errorCounts).forEach(([error, count]) => {
        console.log(`   - ${error}: ${count} occurrences`);
      });
    }

    // Performance recommendations
    console.log("");
    console.log("💡 Performance Recommendations:");
    if (avgDuration > 1000) {
      console.log(
        "   ⚠️  Average response time is high (>1s). Consider optimization."
      );
    }
    if (failedRequests.length > this.results.length * 0.1) {
      console.log("   ⚠️  High failure rate (>10%). Check service stability.");
    }
    if (requestsPerSecond < 10) {
      console.log("   ⚠️  Low throughput (<10 req/s). Consider scaling.");
    }
    if (successfulRequests.length === this.results.length) {
      console.log("   ✅ All requests successful! Service is performing well.");
    }
  }
}

// Health check before running load test
async function healthCheck() {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    if (response.ok) {
      console.log("✅ Service is healthy, starting load test...");
      return true;
    } else {
      console.log("❌ Service health check failed");
      return false;
    }
  } catch (error) {
    console.log("❌ Cannot connect to service:", error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log("🔍 Checking service health...");

  if (!(await healthCheck())) {
    console.log("💡 Make sure the service is running with: npm run dev");
    process.exit(1);
  }

  const loadTester = new LoadTester();
  await loadTester.runLoadTest();
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Load Test Script for Extraction Service

Usage: node load-test.js [options]

Options:
  --help, -h     Show this help message
  --url <url>    Base URL for the service (default: http://localhost:3000/dev)
  --requests <n> Total number of requests (default: 100)
  --concurrent <n> Concurrent requests per batch (default: 10)
  --delay <ms>   Delay between batches in milliseconds (default: 1000)

Example:
  node load-test.js --url http://localhost:3000/dev --requests 200 --concurrent 20
`);
  process.exit(0);
}

// Parse command line arguments
if (args.includes("--url")) {
  const urlIndex = args.indexOf("--url");
  if (urlIndex < args.length - 1) {
    BASE_URL = args[urlIndex + 1];
  }
}

if (args.includes("--requests")) {
  const requestsIndex = args.indexOf("--requests");
  if (requestsIndex < args.length - 1) {
    TOTAL_REQUESTS = parseInt(args[requestsIndex + 1]);
  }
}

if (args.includes("--concurrent")) {
  const concurrentIndex = args.indexOf("--concurrent");
  if (concurrentIndex < args.length - 1) {
    CONCURRENT_REQUESTS = parseInt(args[concurrentIndex + 1]);
  }
}

if (args.includes("--delay")) {
  const delayIndex = args.indexOf("--delay");
  if (delayIndex < args.length - 1) {
    DELAY_BETWEEN_BATCHES = parseInt(args[delayIndex + 1]);
  }
}

// Run the load test
main().catch((error) => {
  console.error("❌ Load test failed:", error);
  process.exit(1);
});
