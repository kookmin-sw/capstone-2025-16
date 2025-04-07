import { 
  CohortExpression,
  PrimaryCriteria,
  CohortExpressionQueryBuilder, 
  BuilderOptions
} from '../circe';

import { Checker, Warning } from '../circe/check';
import { SqlRender, SqlTranslate } from '../sqlrender';

interface QueryOptions {
  cdmSchema: string;
  vocabularySchema: string;
  cohortId: number;
  generateStats: boolean;
}

export class CohortQueryService {
  private queryBuilder: CohortExpressionQueryBuilder;
  private checker: Checker;

  constructor() {
    this.queryBuilder = new CohortExpressionQueryBuilder();
    this.checker = new Checker();
  }

  /**
   * Generates SQL for a cohort expression.
   *
   * @param expressionJson JSON string of the cohort expression
   * @param options Build options for the query generation
   * @return The generated SQL
   */
  public generateSql(expressionJson: string, options: QueryOptions): string {
    try {
      console.log('Starting SQL generation...');
      
      // Parse the JSON into a CohortExpression object
      let expressionData;
      try {
        expressionData = JSON.parse(expressionJson);
        console.log('Successfully parsed expression JSON');
      } catch (parseError) {
        console.error('Error parsing expression JSON:', parseError);
        throw new Error(`Invalid JSON format: ${parseError.message}`);
      }
      
      // Log key properties of the expression data for debugging
      console.log('Expression data summary:', {
        conceptSetsCount: expressionData.ConceptSets?.length || 0,
        inclusionRulesCount: expressionData.InclusionRules?.length || 0,
        hasPrimaryCriteria: !!expressionData.PrimaryCriteria,
        primaryCriteriaCount: expressionData.PrimaryCriteria?.CriteriaList?.length || 0
      });
      
      // Properly instantiate the CohortExpression with the constructor
      // This ensures all defaults are set and nested objects are properly instantiated
      let expression: CohortExpression;
      try {
        // Use the constructor directly instead of Object.assign to ensure proper initialization
        expression = new CohortExpression(expressionData);
        console.log('CohortExpression instantiated successfully');
        
        // Check if concept sets were properly instantiated
        if (expression.ConceptSets && expression.ConceptSets.length > 0) {
          for (let i = 0; i < expression.ConceptSets.length; i++) {
            const cs = expression.ConceptSets[i];
            console.log(`Concept set #${i} (ID: ${cs.Id}) has ${cs.Expression?.Items?.length || 0} items`);
            
            // Verify concept items have proper properties 
            if (cs.Expression?.Items && cs.Expression.Items.length > 0) {
              const firstItem = cs.Expression.Items[0];
              console.log(`First item in concept set #${i}: conceptId=${firstItem.Concept?.ConceptId}, isExcluded=${firstItem.IsExcluded}, includeMapped=${firstItem.IncludeMapped}`);
            }
          }
        } else {
          console.log('No concept sets in the expression');
        }
      } catch (expressionError) {
        console.error('Error creating CohortExpression:', expressionError);
        throw new Error(`Failed to instantiate CohortExpression: ${expressionError.message}`);
      }
      
      // Ensure PrimaryCriteria is initialized if missing
      if (!expression.PrimaryCriteria) {
        console.log('Creating new PrimaryCriteria - PrimaryCriteria was undefined');
        expression.PrimaryCriteria = new PrimaryCriteria();
      }
      
      // Ensure CriteriaList is initialized
      if (!expression.PrimaryCriteria.CriteriaList) {
        console.log('Initializing empty CriteriaList array - CriteriaList was undefined');
        expression.PrimaryCriteria.CriteriaList = [];
      }
      
      // Configure query options
      const queryOptions = new BuilderOptions();
      // Set properties manually
      queryOptions.cdmSchema = options.cdmSchema;
      queryOptions.resultsSchema = options.cdmSchema;
      queryOptions.vocabularySchema = options.vocabularySchema || options.cdmSchema;
      queryOptions.generateStats = options.generateStats;
      
      console.log('Builder options configured:', queryOptions);
      
      // Generate the SQL
      console.log('Calling buildExpressionQuery...');
      const sql = this.queryBuilder.buildExpressionQuery(expression, queryOptions);
      console.log(`SQL generation complete, length: ${sql.length}`);
      
      return sql;
    } catch (error) {
      console.error('Error generating SQL:', error);
      throw error;
    }
  }
  
  /**
   * Translates the SQL to a specific dialect.
   *
   * @param sql The SQL to translate
   * @param targetDialect The target SQL dialect
   * @param sessionId An optional session identifier
   * @param oracleTempSchema Oracle temp schema (if needed)
   * @return The translated SQL
   */
  public translateSql(sql: string, targetDialect: string, sessionId?: string, oracleTempSchema?: string): string {
    // Directly use translateSqlWithPath which is a public method
    return SqlTranslate.translateSqlWithPath(sql, targetDialect, sessionId || null, oracleTempSchema || null);
  }
  
  /**
   * Renders the SQL by replacing template parameters.
   *
   * @param sql The SQL with placeholders
   * @param parameterNames The parameter names
   * @param parameterValues The parameter values
   * @return The rendered SQL
   */
  public renderSql(sql: string, parameterNames: string[], parameterValues: string[]): string {
    // Create arrays of parameters to pass to SqlRender
    return SqlRender.renderSql(sql, parameterNames, parameterValues);
  }
  
  /**
   * Validates a cohort expression by running all checks.
   *
   * @param expressionJson JSON string of the cohort expression to validate
   * @return Array of warnings found during validation
   */
  public validateExpression(expressionJson: string): Warning[] {
    try {
      // Parse the JSON into a CohortExpression object
      const expression = JSON.parse(expressionJson) as CohortExpression;
      
      // Run the checks
      return this.checker.check(expression);
    } catch (error) {
      console.error('Error validating expression', error);
      throw error;
    }
  }
}