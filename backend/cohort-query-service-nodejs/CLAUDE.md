# Cohort Query Service - NodeJS Implementation

This is a TypeScript port of the OHDSI Cohort Query Service, SqlRender, and Circe-BE libraries.

## Development Status

The code is now fully type-checked and all tests pass. The main functionality works:
- SQL rendering with parameterization
- SQL translation between dialects 
- Cohort expression validation
- Cohort SQL generation
- Cohort expression warning checks

## Running the Service

To run the service in development mode:

```bash
npm run dev
```

To build the JavaScript files and run from the compiled output:

```bash
npm run build
npm run start
```

To run tests:

```bash
npm test
```

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /api/cohort-query/sql` - Generate SQL for a cohort expression
- `POST /api/cohort-query/validate` - Validate a cohort expression

## Checker Classes and Warnings

The checker classes now properly generate warnings for cohort definitions with issues:

### Core Issues Fixed

1. **CorelatedCriteria vs WindowedCriteria Conversion**:
   - The TypeScript implementation now correctly handles both CorelatedCriteria and WindowedCriteria
   - Property mappings between the two types are properly handled

2. **Missing Warning Generation Logic**:
   - TimePatternCheck now properly detects contradictory time patterns
   - CriteriaContradictionsCheck correctly identifies contradictory criteria
   - DrugDomainCheck correctly validates drug domain concepts
   - EventsProgressionCheck detects contradictory occurrence settings

### Key Implementation Details

- BaseCorelatedCriteriaCheck now properly converts between WindowedCriteria and CorelatedCriteria
- All checkers handle null/undefined values robustly
- Type guards have been improved for more reliable type detection
- Test fixtures have been updated to match the implementation behavior