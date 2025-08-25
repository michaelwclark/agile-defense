# DECISIONS.md

This document records the key decisions made during the design of the **Unstructured → Structured Extraction Service**, along with trade-offs considered.

---

## 1. Architecture Style

**Decision:** Use a serverless AWS stack with Serverless.js for IaC.

- Components: API Gateway, Lambda, Step Functions, SQS, DynamoDB, S3, CloudWatch, X-Ray, CloudTrail.
- **Trade-offs:**
  - Elastic scaling, minimal ops overhead, pay-per-use cost model.
  - Cold starts + concurrency quotas can add latency (mitigated by concurrency reservations).

---

## 2. Data Model vs Sidecar Files

**Decision:** Store shard metadata, checksums, and KPIs in JobResults and JobMetrics tables (DynamoDB), rather than `_manifest.json` and `_metrics.json` sidecars.

- **Trade-offs:**
  - Single source of truth in DB, no desync risk, richer API responses.
  - Easier audit/compliance queries.
  - Slightly more DB complexity, extra writes per shard.

---

## 3. Output Format

**Decision:** Standardize on partitioned JSONL (.jsonl.gz) for outputs.

- Shard at ~100–250 MB gz or ≤200k lines per file.
- **Trade-offs:**
  - Line-oriented, stream-friendly, works with Spark/Athena.
  - Compression saves storage/transfer cost.
  - Non-columnar, not optimal for analytical queries (future: Parquet).

---

## 4. Scaling Strategy

**Decision:** Target 100k documents per job, with concurrency up to ~1,000 workers per tenant/job. Use SQS backlog as backpressure signal.

- **Trade-offs:**
  - Predictable throughput, fairness across tenants.
  - Cost control via quotas + budgets.
  - Requires careful concurrency tuning to avoid throttling LLMs or external connectors.

---

## 5. Cost Control

**Decision:** Enforce both pre-flight cost estimation and mid-run fail-fast caps.

- **Trade-offs:**
  - Prevents runaway spend, protects tenant budgets.
  - May cancel jobs mid-execution (partial results remain available).

---

## 6. Observability & Audit

**Decision:** Instrument with CloudWatch metrics/logs, X-Ray tracing, CloudTrail + AuditLog DB.

- **Trade-offs:**
  - Full E2E visibility for SLOs, latency, errors, costs.
  - Immutable audit log supports compliance.
  - Higher storage cost for logs/traces (mitigated by retention policies).

---

## 7. LLM Integration

**Decision:** Use Amazon Bedrock as primary provider, with OpenAI/Anthropic fallback via Secrets Manager and VPC NAT.

- **Trade-offs:**
  - Flexibility across providers, cost/performance benchmarking.
  - Integration complexity, model version drift, variable latency.

---

## 8. Build vs Buy

- **LLM:** Buy (Bedrock/OpenAI) → not feasible to build.
- **OCR:** Exclude for now → revisit only if needed.
- **Vector search:** Out of scope; revisit GA+ if semantic search demanded.
- **Connectors:** Build (FS, S3, SharePoint) → need auditability and control.
- **Trade-offs:**
  - Faster delivery, focus effort where it matters.
  - Vendor lock-in on LLM and OCR if adopted later.

---

## 9. Security & Compliance

**Decision:** Secure-by-default — TLS everywhere, KMS encryption, Secrets Manager, tenant isolation, PII handling (masking, retention, right-to-delete).

- **Trade-offs:**
  - Meets enterprise buyer expectations.
  - Adds upfront implementation complexity and testing burden.

---

These decisions create a scalable, secure, and observable service while balancing cost, developer experience, and delivery speed.

## 9. Code challange

**Decision:** Use serverless.js to stub out basics.

- **Trade-offs:**
  - Ops learning curve

**Decision:** Use Jest for testing.
**Decision:** Move to vitest, easier for es6 modules and faster.

- Trade-offs:
  - wasted 30 minutes of my time

**Decision:** Use Mock LLM, have used many APIs before but given time limits it was easy enough to fake it with some prebuilt extraction functions.

- Trade-offs:
  - I didn't feel as cool
  - You don't know if I can call an external API (I can, but time....)
