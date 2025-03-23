import { Request, Response } from 'express';
import { CohortQueryRequest } from '../dto/CohortQueryRequest';
import { CohortQueryResponse } from '../dto/CohortQueryResponse';
import { CohortValidationResponse } from '../dto/CohortValidationResponse';
import { CohortQueryService } from '../service/CohortQueryService';

export class CohortQueryController {
  private cohortQueryService: CohortQueryService;

  constructor() {
    this.cohortQueryService = new CohortQueryService();
  }

  /**
   * Validates a cohort expression by running a series of checks
   */
  public validateExpression = async (req: Request, res: Response): Promise<void> => {
    try {
      const expression = req.body.expression;
      
      // Validate request
      if (!expression) {
        res.status(400).json({ 
          Message: "Expression is required" 
        } as CohortValidationResponse);
        return;
      }
      
      // Run validation
      const warnings = this.cohortQueryService.validateExpression(expression);
      
      // Create response
      const response: CohortValidationResponse = {
        Message: warnings.length > 0 
          ? `Found ${warnings.length} warnings/errors` 
          : "Expression is valid",
        Warnings: warnings
      };
      
      res.status(200).json(response);
    } catch (error: any) {
      console.error('Error in validateExpression:', error);
      
      const response: CohortValidationResponse = {
        Message: `Error validating expression: ${error instanceof Error ? error.message : String(error)}`
      };
      
      res.status(400).json(response);
    }
  };

  /**
   * Generates SQL for a cohort expression
   */
  public generateSql = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: CohortQueryRequest = req.body;
      
      // Validate request
      if (!request.expression) {
        res.status(400).json({ 
          Message: "Expression is required" 
        } as CohortQueryResponse);
        return;
      }
      
      if (!request.cdmSchema) {
        res.status(400).json({ 
          Message: "CDM Schema is required" 
        } as CohortQueryResponse);
        return;
      }
      
      // Log the request for debugging
      console.log(`Generating SQL for cohort expression, targetDialect: ${request.targetDialect || 'none'}`);
      
      // Create build options from request
      const options = {
        cdmSchema: request.cdmSchema,
        vocabularySchema: request.vocabularySchema || request.cdmSchema,
        cohortId: request.cohortId || 0,
        generateStats: request.generateStats || false
      };
      
      // Generate SQL
      let sql;
      try {
        sql = this.cohortQueryService.generateSql(request.expression, options);
        console.log('SQL generation successful');
      } catch (e) {
        console.error("Error building expression query:", e);
        const errorMessage = e instanceof Error ? e.message : String(e);
        
        // Try to provide more context about the error
        let detailedMessage = `Error building expression query: ${errorMessage}`;
        
        // Check for specific error types
        if (errorMessage.includes("PrimaryCriteria is not a constructor")) {
          detailedMessage += ". This appears to be a class initialization error with PrimaryCriteria. The expression may be using incorrect property names or structure.";
        } else if (errorMessage.includes("Cannot read properties of undefined")) {
          detailedMessage += ". Some required properties in the cohort expression were undefined or missing.";
        }
        
        res.status(400).json({ 
          Message: detailedMessage,
          Sql: null
        } as CohortQueryResponse);
        return;
      }
      
      // Translate SQL if dialect is specified
      if (request.targetDialect) {
        try {
          sql = this.cohortQueryService.translateSql(
            sql,
            request.targetDialect,
            request.sessionId,
            request.oracleTempSchema
          );
          console.log(`SQL translated to ${request.targetDialect} successfully`);
        } catch (e) {
          console.error(`Error translating SQL to ${request.targetDialect}:`, e);
          res.status(400).json({ 
            Message: `Error translating SQL to ${request.targetDialect}: ${e instanceof Error ? e.message : String(e)}`,
            Sql: null
          } as CohortQueryResponse);
          return;
        }
      }
      
      // Always render SQL to process conditional logic
      const paramNames = request.parameterNames || [];
      const paramValues = request.parameterValues || [];
      
      // Additional params for render
      let finalParamNames = [...paramNames];
      let finalParamValues = [...paramValues];
      
      // Ensure all required parameters are provided
      
      // Add database and table parameters
      if (request.targetDatabaseSchema) {
        finalParamNames.push("target_database_schema");
        finalParamValues.push(request.targetDatabaseSchema);
      } else {
        finalParamNames.push("target_database_schema");
        finalParamValues.push(request.cdmSchema); // Default to CDM schema
      }
      
      if (request.targetCohortTable) {
        finalParamNames.push("target_cohort_table");
        finalParamValues.push(request.targetCohortTable);
      } else {
        finalParamNames.push("target_cohort_table");
        finalParamValues.push("cohort"); // Default cohort table name
      }
      
      // Always provide these essential parameters
      finalParamNames.push("cohort_id_field_name");
      finalParamValues.push(request.cohortIdFieldName || "cohort_definition_id");
      
      finalParamNames.push("target_cohort_id");
      finalParamValues.push(String(request.cohortId || 0));
      
      finalParamNames.push("results_database_schema");
      finalParamValues.push(request.resultsDatabaseSchema || request.cdmSchema);
      
      // Generation flags and parameters
      finalParamNames.push("generateStats");
      finalParamValues.push(request.generateStats ? "true" : "false");
      
      finalParamNames.push("eraconstructorpad");
      finalParamValues.push(String(request.eraConstructorPad || 0));
      
      // Required for runtime rendering in SQL Server
      finalParamNames.push("cdm_database_schema");
      finalParamValues.push(request.cdmSchema);
      
      finalParamNames.push("vocabulary_database_schema");
      finalParamValues.push(request.vocabularySchema || request.cdmSchema);
      
      // Inclusion rule parameters
      finalParamNames.push("ruleTotal");
      finalParamValues.push(String(request.ruleTotal || 0));
      
      // Render SQL with parameters - this will replace @parameter placeholders
      try {
        sql = this.cohortQueryService.renderSql(
          sql,
          finalParamNames,
          finalParamValues
        );
        console.log('SQL rendering with parameters successful');
      } catch (e) {
        console.error("Error rendering SQL with parameters:", e);
        res.status(400).json({ 
          Message: `Error rendering SQL with parameters: ${e instanceof Error ? e.message : String(e)}`,
          Sql: null
        } as CohortQueryResponse);
        return;
      }
      
      // Create response
      const response: CohortQueryResponse = {
        Sql: sql,
        Message: "SQL generated successfully"
      };
      
      res.status(200).json(response);
    } catch (error: any) {
      console.error('Error in generateSql:', error);
      
      // Provide a more detailed error message
      let errorMessage = `Error generating SQL: ${error instanceof Error ? error.message : String(error)}`;
      
      // Check the request structure if available
      try {
        const request = req.body as CohortQueryRequest;
        if (request && request.expression) {
          // Log a brief excerpt of the expression to help debugging
          const expressionExcerpt = typeof request.expression === 'string' 
            ? request.expression.substring(0, 100) + '...' 
            : JSON.stringify(request.expression).substring(0, 100) + '...';
          console.log(`Request expression excerpt: ${expressionExcerpt}`);
        }
      } catch (e) {
        console.log('Could not log request details:', e);
      }
      
      const response: CohortQueryResponse = {
        Message: errorMessage
      };
      
      res.status(400).json(response);
    }
  };
}