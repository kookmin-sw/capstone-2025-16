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

import { Criteria } from '../CohortExpression';
import { BuilderOptions, CriteriaColumn } from './BuilderOptions';

/**
 * Abstract base class for building SQL for different criteria types
 * This class is responsible for generating SQL for criteria in cohort definitions
 */
export abstract class CriteriaSqlBuilder<T extends Criteria> {
  
  /**
   * Get SQL for a criteria with optional builder options
   * @param criteria Criteria to generate SQL for
   * @param options Optional builder options
   * @returns SQL string for the criteria
   */
  public getCriteriaSql(criteria: T, options?: BuilderOptions): string {
    // Get the SQL template
    let query = this.getQueryTemplate();
    
    // Replace codeset clause
    query = this.embedCodesetClause(query, criteria);
    
    // Build the various clause parts
    const selectClauses = this.resolveSelectClauses(criteria);
    const joinClauses = this.resolveJoinClauses(criteria);
    const whereClauses = this.resolveWhereClauses(criteria);
    
    // Embed ordinal expression (for first events, etc)
    query = this.embedOrdinalExpression(query, criteria, whereClauses);
    
    // Replace clauses in template
    query = this.embedSelectClauses(query, selectClauses);
    query = this.embedJoinClauses(query, joinClauses);
    query = this.embedWhereClauses(query, whereClauses);
    
    // Handle additional columns if options are provided
    if (options) {
      const additionalColumns = this.getAdditionalColumns(options);
      query = query.replace("@additionalColumns", additionalColumns.length > 0 ? ", " + additionalColumns.join(", ") : "");
    } else {
      query = query.replace("@additionalColumns", "");
    }
    
    return query;
  }
  
  /**
   * Get the table column corresponding to a criteria column
   * @param column The criteria column to get
   * @returns The SQL column expression
   */
  protected abstract getTableColumnForCriteriaColumn(column: CriteriaColumn): string;
  
  /**
   * Get additional columns based on builder options
   * @param options Builder options containing additional columns
   * @returns Array of column expressions
   */
  protected getAdditionalColumns(options: BuilderOptions): string[] {
    // This would be replaced with actual code in subclasses
    return [];
  }
  
  /**
   * Get default columns that don't need to be added as additional columns
   * @returns Set of default columns
   */
  protected abstract getDefaultColumns(): Set<CriteriaColumn>;
  
  /**
   * Embed select clauses into the query template
   * @param query SQL query template 
   * @param selectClauses Array of select clause expressions
   * @returns Modified query with select clauses embedded
   */
  protected embedSelectClauses(query: string, selectClauses: string[]): string {
    return query.replace("@selectClause", selectClauses.join(",\n  "));
  }
  
  /**
   * Embed join clauses into the query template
   * @param query SQL query template
   * @param joinClauses Array of join clause expressions
   * @returns Modified query with join clauses embedded
   */
  protected embedJoinClauses(query: string, joinClauses: string[]): string {
    return query.replace("@joinClause", joinClauses.join("\n"));
  }
  
  /**
   * Embed where clauses into the query template
   * @param query SQL query template
   * @param whereClauses Array of where clause expressions
   * @returns Modified query with where clauses embedded
   */
  protected embedWhereClauses(query: string, whereClauses: string[]): string {
    let whereClause = "";
    if (whereClauses.length > 0) {
      whereClause = "WHERE " + whereClauses.join(" AND\n  ");
    }
    return query.replace("@whereClause", whereClause);
  }
  
  /**
   * Get the SQL template for this criteria type
   * @returns SQL template string
   */
  protected abstract getQueryTemplate(): string;
  
  /**
   * Embed the codeset clause for concept filtering
   * @param query SQL query template
   * @param criteria Criteria with codeset information
   * @returns Modified query with codeset clause embedded
   */
  protected abstract embedCodesetClause(query: string, criteria: T): string;
  
  /**
   * Embed ordinal expression for ordering criteria
   * @param query SQL query template
   * @param criteria Criteria to get ordinal for
   * @param whereClauses Where clauses to potentially modify
   * @returns Modified query with ordinal expression embedded
   */
  protected abstract embedOrdinalExpression(query: string, criteria: T, whereClauses: string[]): string;
  
  /**
   * Resolve the select clauses for the criteria
   * @param criteria Criteria to get select clauses for
   * @returns Array of select clause expressions
   */
  protected resolveSelectClauses(criteria: T): string[] {
    return [];
  }
  
  /**
   * Resolve join clauses for the criteria
   * @param criteria Criteria to get join clauses for
   * @returns Array of join clause expressions
   */
  protected abstract resolveJoinClauses(criteria: T): string[];
  
  /**
   * Resolve where clauses for the criteria
   * @param criteria Criteria to get where clauses for
   * @returns Array of where clause expressions
   */
  protected resolveWhereClauses(criteria: T): string[] {
    const whereClauses: string[] = [];
    
    // If date adjustment is used, ensure end date >= start date
    if (criteria.DateAdjustment !== undefined) {
      whereClauses.push("C.end_date >= C.start_date");
    }
    
    return whereClauses;
  }
}

export default CriteriaSqlBuilder;