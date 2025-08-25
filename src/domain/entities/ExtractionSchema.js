/**
 * ExtractionSchema entity representing the schema for structured data extraction
 * This is a core domain entity in the hexagon architecture
 */
export class ExtractionSchema {
  /**
   * Creates a new ExtractionSchema instance
   * @param {Object} params - Schema parameters
   * @param {string} params.id - Unique identifier
   * @param {string} params.name - Schema name
   * @param {Array<Object>} params.fields - Array of field definitions
   * @param {string} params.createdAt - ISO timestamp
   * @param {Object} params.metadata - Additional metadata
   */
  constructor({ id, name, fields = [], createdAt, metadata = {} }) {
    this.id = id;
    this.name = name;
    this.fields = fields;
    this.createdAt = createdAt || new Date().toISOString();
    this.metadata = metadata;
  }

  /**
   * Validates the schema entity
   * @returns {boolean} True if valid
   * @throws {Error} If validation fails
   */
  validate() {
    if (!this.id) {
      throw new Error("Schema ID is required");
    }
    if (!this.name) {
      throw new Error("Schema name is required");
    }
    if (!Array.isArray(this.fields)) {
      throw new Error("Fields must be an array");
    }

    // Validate each field
    this.fields.forEach((field, index) => {
      if (!field.name) {
        throw new Error(`Field ${index} must have a name`);
      }
      if (!field.type) {
        throw new Error(`Field ${field.name} must have a type`);
      }
    });

    return true;
  }

  /**
   * Validates and coerces a value according to field type
   * @param {string} fieldName - Name of the field
   * @param {any} value - Value to validate and coerce
   * @returns {any} Coerced value
   * @throws {Error} If validation fails
   */
  validateAndCoerceField(fieldName, value) {
    const field = this.fields.find((f) => f.name === fieldName);
    if (!field) {
      throw new Error(`Field '${fieldName}' not found in schema`);
    }

    return this.coerceValue(value, field.type, field.format);
  }

  /**
   * Coerces a value to the specified type
   * @param {any} value - Value to coerce
   * @param {string} type - Target type
   * @param {string} format - Optional format (e.g., date format)
   * @returns {any} Coerced value
   */
  coerceValue(value, type, format) {
    if (value === null || value === undefined) {
      return null;
    }

    switch (type.toLowerCase()) {
      case "string":
        return String(value);

      case "number":
      case "integer":
        const num = Number(value);
        if (isNaN(num)) {
          throw new Error(`Cannot convert '${value}' to number`);
        }
        return type === "integer" ? Math.floor(num) : num;

      case "boolean":
        if (typeof value === "boolean") return value;
        if (typeof value === "string") {
          const lower = value.toLowerCase();
          if (lower === "true" || lower === "1" || lower === "yes") return true;
          if (lower === "false" || lower === "0" || lower === "no")
            return false;
        }
        if (typeof value === "number") return value !== 0;
        throw new Error(`Cannot convert '${value}' to boolean`);

      case "date":
        if (value instanceof Date) return value;
        if (typeof value === "string") {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            throw new Error(`Cannot convert '${value}' to date`);
          }
          return date;
        }
        throw new Error(`Cannot convert '${value}' to date`);

      case "array":
        if (Array.isArray(value)) return value;
        if (typeof value === "string") {
          try {
            return JSON.parse(value);
          } catch {
            return [value];
          }
        }
        return [value];

      case "object":
        if (typeof value === "object" && value !== null) return value;
        if (typeof value === "string") {
          try {
            return JSON.parse(value);
          } catch {
            throw new Error(`Cannot convert '${value}' to object`);
          }
        }
        throw new Error(`Cannot convert '${value}' to object`);

      default:
        return value;
    }
  }

  /**
   * Gets field definition by name
   * @param {string} fieldName - Name of the field
   * @returns {Object|null} Field definition or null if not found
   */
  getField(fieldName) {
    return this.fields.find((f) => f.name === fieldName) || null;
  }

  /**
   * Gets all required fields
   * @returns {Array<Object>} Array of required field definitions
   */
  getRequiredFields() {
    return this.fields.filter((f) => f.required !== false);
  }

  /**
   * Converts the schema to a plain object
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      fields: this.fields,
      createdAt: this.createdAt,
      metadata: this.metadata,
    };
  }

  /**
   * Creates a schema from a plain object
   * @param {Object} data - Plain object data
   * @returns {ExtractionSchema} Schema instance
   */
  static fromJSON(data) {
    return new ExtractionSchema(data);
  }

  /**
   * Creates a default schema for common document types
   * @param {string} documentType - Type of document
   * @returns {ExtractionSchema} Default schema
   */
  static createDefaultSchema(documentType = "general") {
    const schemas = {
      invoice: {
        name: "Invoice Schema",
        fields: [
          { name: "invoice_number", type: "string", required: true },
          { name: "invoice_date", type: "date", required: true },
          { name: "due_date", type: "date", required: false },
          { name: "vendor_name", type: "string", required: true },
          { name: "vendor_address", type: "string", required: false },
          { name: "customer_name", type: "string", required: true },
          { name: "customer_address", type: "string", required: false },
          { name: "subtotal", type: "number", required: true },
          { name: "tax_amount", type: "number", required: false },
          { name: "total_amount", type: "number", required: true },
          { name: "currency", type: "string", required: false },
          { name: "line_items", type: "array", required: false },
        ],
      },
      receipt: {
        name: "Receipt Schema",
        fields: [
          { name: "merchant_name", type: "string", required: true },
          { name: "merchant_address", type: "string", required: false },
          { name: "transaction_date", type: "date", required: true },
          { name: "transaction_time", type: "string", required: false },
          { name: "total_amount", type: "number", required: true },
          { name: "tax_amount", type: "number", required: false },
          { name: "payment_method", type: "string", required: false },
          { name: "items", type: "array", required: false },
        ],
      },
      contract: {
        name: "Contract Schema",
        fields: [
          { name: "contract_number", type: "string", required: true },
          { name: "contract_date", type: "date", required: true },
          { name: "effective_date", type: "date", required: false },
          { name: "expiration_date", type: "date", required: false },
          { name: "parties", type: "array", required: true },
          { name: "contract_value", type: "number", required: false },
          { name: "currency", type: "string", required: false },
          { name: "terms", type: "string", required: false },
        ],
      },
      general: {
        name: "General Document Schema",
        fields: [
          { name: "title", type: "string", required: false },
          { name: "author", type: "string", required: false },
          { name: "date", type: "date", required: false },
          { name: "summary", type: "string", required: false },
          { name: "keywords", type: "array", required: false },
          { name: "entities", type: "array", required: false },
        ],
      },
    };

    const schema = schemas[documentType] || schemas.general;
    return new ExtractionSchema({
      id: `default-${documentType}`,
      name: schema.name,
      fields: schema.fields,
    });
  }
}
