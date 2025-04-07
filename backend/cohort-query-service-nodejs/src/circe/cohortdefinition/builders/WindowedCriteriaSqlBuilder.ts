/*******************************************************************************
 * Copyright 2025 Observational Health Data Sciences and Informatics
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *   http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/

import { WindowedCriteria, Window, NumericRange } from '../CohortExpression';
import { ResourceHelper } from '../../helper/ResourceHelper';
import { IGetCriteriaSqlDispatcher } from '../IGetCriteriaSqlDispatcher';
import { BuilderOptions } from './BuilderOptions';

// Type augmentation is no longer needed as we've added the properties
// directly to the WindowedCriteria class in CohortExpression.ts

// Helper function to extend CriteriaColumn with columnName method
function ensureColumnName(column: any): any {
  if (!column.columnName) {
    column.columnName = function() { return column.name || 'unknown'; };
  }
  return column;
}

/**
 * Builder for generating SQL for windowed criteria in a cohort definition
 */
export class WindowedCriteriaSqlBuilder {
  
  /**
   * Dispatcher to delegate criteria SQL generation to appropriate builders
   */
  private criteriaSqlDispatcher: IGetCriteriaSqlDispatcher;

  /**
   * Constructor for WindowedCriteriaSqlBuilder
   * @param criteriaSqlDispatcher Dispatcher to generate SQL for different criteria types
   */
  constructor(criteriaSqlDispatcher: IGetCriteriaSqlDispatcher) {
    this.criteriaSqlDispatcher = criteriaSqlDispatcher;
  }
  
  /**
   * Gets windowed criteria query by applying a template with criteria, event table, and options
   * @param criteria The windowed criteria
   * @param eventTable The event table name
   * @param options Optional builder options
   * @returns SQL for windowed criteria
   */
  public getWindowedCriteriaQuery(criteria: WindowedCriteria, eventTable: string, options?: BuilderOptions): string {
    try {
      // Start with the template - note that the parent class passes a template parameter that we'll ignore
      // since we want to make sure we're always using the correct template
      const template = ResourceHelper.GetResourceAsString("cohortdefinition/sql/windowedCriteria.sql");
      let query = template;
      
      // Get whether to check observation period
      const checkObservationPeriod = !criteria.IgnoreObservationPeriod;
      
      // Get the criteria SQL
      const criteriaQuery = this.criteriaSqlDispatcher.getCriteriaSql(criteria.Criteria);
      
      // Replace placeholders in the template
      query = query.replace("@criteriaQuery", criteriaQuery);
      query = query.replace("@eventTable", eventTable);
      
      // Handle additional columns
      if (options && options.additionalColumns && options.additionalColumns.length > 0) {
        const additionalColumnsStr = ", " + options.additionalColumns
          .map(column => `A.${ensureColumnName(column).columnName()}`)
          .join(", ");
        query = query.replace("@additionalColumns", additionalColumnsStr);
      } else {
        query = query.replace("@additionalColumns", "");
      }
      
      // Build window criteria conditions
      const clauses: string[] = [];
      
      // Check observation period if needed
      if (checkObservationPeriod) {
        clauses.push("A.START_DATE >= P.OP_START_DATE AND A.START_DATE <= P.OP_END_DATE");
      }
      
      // Start window
      const startWindow = criteria.StartWindow;
      const startIndexDateExpression = (startWindow.UseIndexEnd) ? "P.END_DATE" : "P.START_DATE";
      const startEventDateExpression = (startWindow.UseEventEnd) ? "A.END_DATE" : "A.START_DATE";
      
      // Start date conditions
      let startExpression: string = null;
      if (startWindow.Start.Days !== null && startWindow.Start.Days !== undefined) {
        // Calculate coefficient for days (1 for after, -1 for before)
        const coeff = startWindow.Start.Coeff || 1;
        startExpression = `DATEADD(day, ${coeff * startWindow.Start.Days}, ${startIndexDateExpression})`;
      } else {
        // Use observation period bounds if applicable
        if (checkObservationPeriod) {
          startExpression = (startWindow.Start.Coeff === -1) ? "P.OP_START_DATE" : "P.OP_END_DATE";
        }
      }
      
      if (startExpression) {
        clauses.push(`${startEventDateExpression} >= ${startExpression}`);
      }
      
      // End date conditions for start window
      let endExpression: string = null;
      if (startWindow.End.Days !== null && startWindow.End.Days !== undefined) {
        // Calculate coefficient for days (1 for after, -1 for before)
        const coeff = startWindow.End.Coeff || 1;
        endExpression = `DATEADD(day, ${coeff * startWindow.End.Days}, ${startIndexDateExpression})`;
      } else {
        // Use observation period bounds if applicable
        if (checkObservationPeriod) {
          endExpression = (startWindow.End.Coeff === -1) ? "P.OP_START_DATE" : "P.OP_END_DATE";
        }
      }
      
      if (endExpression) {
        clauses.push(`${startEventDateExpression} <= ${endExpression}`);
      }
      
      // End window (if present)
      const endWindow = criteria.EndWindow;
      if (endWindow) {
        const endIndexDateExpression = (endWindow.UseIndexEnd) ? "P.END_DATE" : "P.START_DATE";
        // For backward compatibility, having null UseEventEnd means they should use the end date
        const endEventDateExpression = (endWindow.UseEventEnd === null || endWindow.UseEventEnd) ? "A.END_DATE" : "A.START_DATE";
        
        // Start date conditions for end window
        if (endWindow.Start.Days !== null && endWindow.Start.Days !== undefined) {
          // Calculate coefficient for days (1 for after, -1 for before)
          const coeff = endWindow.Start.Coeff || 1;
          startExpression = `DATEADD(day, ${coeff * endWindow.Start.Days}, ${endIndexDateExpression})`;
        } else {
          // Use observation period bounds if applicable
          if (checkObservationPeriod) {
            startExpression = (endWindow.Start.Coeff === -1) ? "P.OP_START_DATE" : "P.OP_END_DATE";
          } else {
            startExpression = null;
          }
        }
        
        if (startExpression) {
          clauses.push(`${endEventDateExpression} >= ${startExpression}`);
        }
        
        // End date conditions for end window
        if (endWindow.End.Days !== null && endWindow.End.Days !== undefined) {
          // Calculate coefficient for days (1 for after, -1 for before)
          const coeff = endWindow.End.Coeff || 1;
          endExpression = `DATEADD(day, ${coeff * endWindow.End.Days}, ${endIndexDateExpression})`;
        } else {
          // Use observation period bounds if applicable
          if (checkObservationPeriod) {
            endExpression = (endWindow.End.Coeff === -1) ? "P.OP_START_DATE" : "P.OP_END_DATE";
          } else {
            endExpression = null;
          }
        }
        
        if (endExpression) {
          clauses.push(`${endEventDateExpression} <= ${endExpression}`);
        }
      }
      
      // Restrict to same visit if needed
      if (criteria.RestrictVisit) {
        clauses.push("A.visit_occurrence_id = P.visit_occurrence_id");
      }
      
      // Join all clauses and add to the query
      const windowCriteria = clauses.length > 0 ? " AND " + clauses.join(" AND ") : "";
      query = query.replace("@windowCriteria", windowCriteria);
      
      return query;
    } catch (error) {
      console.error("Error getting windowed criteria query:", error);
      return "";
    }
  }
  
  /**
   * Apply window to existing criteria query
   * @param criteriaQuery Base criteria query to apply window to
   * @param window Window parameters
   * @returns SQL query with window applied
   */
  public applyWindowedCriteria(criteriaQuery: string, window: Window): string {
    try {
      // Apply the window parameters to the criteria query
      const windowedSql = ResourceHelper.GetResourceAsString("cohortdefinition/sql/windowedCriteria.sql");
      
      // Additional columns for start_date and end_date
      const additionalColumns = ", P.Start_date, P.End_date";
      
      // Build the window criteria join conditions
      const windowCriteriaConditions: string[] = [];
      
      // Handle start date window condition
      if (window?.Start) {
        const startDateField = this.getWindowedCriteriaDateField("START", window.Start, window.UseIndexEnd);
        const startCompOp = this.getWindowedCriteriaComparisonOp(window.Start.Op);
        const startValue = window.Start.Value || 0;
        
        if (window.Start.Op.toLowerCase() === 'bt' && window.Start.Extent) {
          // Between operator
          windowCriteriaConditions.push(
            `AND A.Start_date BETWEEN DATEADD(day, ${startValue}, ${startDateField}) AND DATEADD(day, ${window.Start.Extent}, ${startDateField})`
          );
        } else {
          // Standard comparison
          windowCriteriaConditions.push(
            `AND A.Start_date ${startCompOp} DATEADD(day, ${startValue}, ${startDateField})`
          );
        }
      }
      
      // Handle end date window condition
      if (window?.End) {
        const endDateBase = window.UseEventEnd ? "A.End_date" : "A.Start_date";
        const endDateField = this.getWindowedCriteriaDateField("END", window.End, window.UseIndexEnd);
        const endCompOp = this.getWindowedCriteriaComparisonOp(window.End.Op);
        const endValue = window.End.Value || 0;
        
        if (window.End.Op.toLowerCase() === 'bt' && window.End.Extent) {
          // Between operator
          windowCriteriaConditions.push(
            `AND ${endDateBase} BETWEEN DATEADD(day, ${endValue}, ${endDateField}) AND DATEADD(day, ${window.End.Extent}, ${endDateField})`
          );
        } else {
          // Standard comparison
          windowCriteriaConditions.push(
            `AND ${endDateBase} ${endCompOp} DATEADD(day, ${endValue}, ${endDateField})`
          );
        }
      }
      
      // Join all window criteria conditions
      const windowCriteria = windowCriteriaConditions.join(" ");
      
      // Replace placeholders in the template
      let sql = windowedSql
        .replace("@criteriaQuery", criteriaQuery)
        .replace("@additionalColumns", additionalColumns)
        .replace("@windowCriteria", windowCriteria);
      
      return sql;
    } catch (error) {
      console.error('Error applying windowed criteria:', error);
      return criteriaQuery; // Return original query on error
    }
  }
  
  /**
   * Get the SQL date field to use for windowed criteria
   * @param dateType Type of date (START or END)
   * @param range Numeric range for the window
   * @param useEnd Whether to use end date instead of start date
   * @returns SQL date field expression
   */
  private getWindowedCriteriaDateField(dateType: string, range: NumericRange, useEnd: boolean): string {
    // Determine whether to use start_date or end_date
    return useEnd ? "P.End_date" : "P.Start_date";
  }
  
  /**
   * Get SQL comparison operator for the window operation
   * @param op Operation string (eq, lt, gt, etc.)
   * @returns SQL comparison operator
   */
  private getWindowedCriteriaComparisonOp(op: string): string {
    // Map operation string to SQL comparison operator
    const opLower = op.toLowerCase();
    switch (opLower) {
      case "lt": return "<";
      case "lte": return "<=";
      case "eq": return "=";
      case "gt": return ">";
      case "gte": return ">=";
      case "bt": return "BETWEEN"; // Special case - handled separately
      default: return "=";
    }
  }
}

export default WindowedCriteriaSqlBuilder;