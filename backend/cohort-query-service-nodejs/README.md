# Cohort Query Service (Node.js)

A TypeScript/Node.js implementation of the OHDSI Cohort Query Service, ported from the original Java version. This service provides an API for generating SQL from cohort expressions and validating cohort expressions.

## Features

- Generate SQL from cohort expressions
- Translate SQL to different database dialects
- Render SQL with parameter substitution
- Validate cohort expressions using the Circe checker framework

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd cohort-query-service-nodejs

# Install dependencies
npm install
```

## Usage

### Start the server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

The server will start on port 3000 by default. You can change this by setting the `PORT` environment variable.

## API Endpoints

### Generate SQL

**Endpoint:** `POST /api/cohort-query/sql`

**Request Body:**

```json
{
  "expression": "...", // JSON string of the cohort expression
  "cdmSchema": "cdm", // CDM schema name
  "vocabularySchema": "cdm", // Optional: vocabulary schema name, defaults to cdmSchema
  "cohortId": 1, // Cohort ID for the generated SQL
  "generateStats": true, // Whether to generate cohort inclusion stats
  "targetDialect": "postgresql", // Optional: target SQL dialect (postgresql, oracle, sql server, etc.)
  "sessionId": "session1", // Optional: session identifier
  "oracleTempSchema": "temp", // Optional: oracle temp schema
  "parameterNames": ["param1"], // Optional: parameter names for SQL rendering
  "parameterValues": ["value1"], // Optional: parameter values for SQL rendering
  "targetDatabaseSchema": "results", // Optional: target database schema
  "targetCohortTable": "cohort" // Optional: target cohort table name
}
```

**Response:**

```json
{
  "sql": "...", // The generated SQL
  "message": "SQL generated successfully"
}
```

### Validate Cohort Expression

**Endpoint:** `POST /api/cohort-query/validate`

**Request Body:**

```json
{
  "expression": "..." // JSON string of the cohort expression to validate
}
```

**Response:**

```json
{
  "message": "Expression is valid", // or "Found X warnings/errors"
  "warnings": [
    {
      "message": "Warning message",
      "severity": "WARNING", // INFO, WARNING, or CRITICAL
      "targetName": "Target name",
      "group": "Group name",
      "attribute": "Attribute"
    },
    // ...
  ]
}
```

### Health Check

**Endpoint:** `GET /health`

**Response:**

```json
{
  "status": "UP"
}
```

## Libraries

This project incorporates TypeScript ports of:

1. **SqlRender** - A library for parameterizing SQL and translating it to different SQL dialects
2. **Circe-BE** - The backend for the OHDSI Cohort Definition tools

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

## License

Apache License 2.0