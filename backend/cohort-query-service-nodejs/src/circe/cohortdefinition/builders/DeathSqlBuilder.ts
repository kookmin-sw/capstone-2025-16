/*******************************************************************************
 * Copyright 2023 Observational Health Data Sciences and Informatics
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

import { CriteriaSqlBuilder } from './CriteriaSqlBuilder';
import { CriteriaColumn, BuilderOptions } from './BuilderOptions';
import { ResourceHelper } from '../../helper/ResourceHelper';
import { SqlRender } from '../../../sqlrender';
import { Death } from '../CohortExpression';
import BuilderUtils from './BuilderUtils';

/**
 * Interface for death criteria that supports both camelCase and PascalCase properties
 */
interface DeathCriteria extends Death {
  // Support both camelCase and PascalCase naming styles
  DeathType?: any[];
  deathType?: any[];
  DeathTypeExclude?: boolean;
  deathTypeExclude?: boolean;
  DeathDate?: any;
  deathDate?: any;
  CodesetId?: number;
  codesetId?: number;
  OccurrenceStartDate?: any;
  occurrenceStartDate?: any;
  OccurrenceEndDate?: any;
  occurrenceEndDate?: any;
  // Add any additional properties needed
}

/**
 * SQL builder for death criteria
 */
export class DeathSqlBuilder extends CriteriaSqlBuilder<DeathCriteria> {
  // Default columns that are already in the template
  private readonly DEFAULT_COLUMNS: Set<CriteriaColumn> = new Set([
    CriteriaColumn.START_DATE, 
    CriteriaColumn.END_DATE, 
    CriteriaColumn.VISIT_ID
  ]);
  
  // Template SQL for death
  private readonly DEATH_TEMPLATE = ResourceHelper.GetResourceAsString("cohortdefinition/sql/death.sql");
  /**
   * Get default columns for the criteria
   */
  protected getDefaultColumns(): Set<CriteriaColumn> {
    return this.DEFAULT_COLUMNS;
  }
  
  /**
   * Get the SQL template for death
   */
  protected getQueryTemplate(): string {
    return this.DEATH_TEMPLATE;
  }
  
  /**
   * Get the table column for a criteria column
   * @param column Criteria column to map
   * @returns Table column expression for the criteria column
   */
  protected getTableColumnForCriteriaColumn(column: CriteriaColumn): string {
    switch (column) {
      case CriteriaColumn.DOMAIN_CONCEPT:
        return "C.death_type_concept_id";
      default:
        throw new Error(`Invalid CriteriaColumn for Death: ${column}`);
    }
  }
  
  /**
   * Gets SQL for death criteria
   * @param criteria Death criteria
   * @param options Builder options
   * @returns SQL string for death criteria
   */
  /**
   * Embed the codeset clause for concept filtering
   * @param query SQL query
   * @param criteria Death criteria
   * @returns Modified query with codeset clause
   */
  protected embedCodesetClause(query: string, criteria: DeathCriteria): string {
    const joinClauses: string[] = [];
    
    // Add the codeset join based on the condition concept ID
    // Account for both camelCase and PascalCase property names
    const codesetId = criteria.CodesetId !== undefined ? criteria.CodesetId : undefined;
                     
    if (codesetId !== undefined) {
      joinClauses.push(`JOIN #Codesets cs on cs.codeset_id = ${codesetId} and cs.concept_id = d.cause_concept_id`);
    }
    
    return query.replace("@codesetClause", joinClauses.join("\n"));
  }
  
  /**
   * Embed ordinal expression for ordering criteria
   * @param query SQL query
   * @param criteria Death criteria
   * @param whereClauses Where clauses to modify
   * @returns Modified query with ordinal expression
   */
  protected embedOrdinalExpression(query: string, criteria: DeathCriteria, whereClauses: string[]): string {
    // Death criteria doesn't typically use ordinal filtering
    return query.replace("@ordinalExpression", "");
  }
  
  /**
   * Resolve select clauses for the criteria
   * @param criteria Death criteria
   * @returns Array of select clause expressions
   */
  protected resolveSelectClauses(criteria: DeathCriteria): string[] {
    const selectCols = [
      "d.person_id", 
      "d.death_date",
      "d.death_type_concept_id",
      "d.cause_concept_id"
    ];
    
    // Add date fields
    selectCols.push("d.death_date as start_date, DATEADD(day,1,d.death_date) as end_date");
    
    return selectCols;
  }
  
  /**
   * Resolve join clauses for the criteria
   * @param criteria Death criteria
   * @returns Array of join clause expressions
   */
  protected resolveJoinClauses(criteria: DeathCriteria): string[] {
    return [];
  }
  
  /**
   * Resolve where clauses for the criteria
   * @param criteria Death criteria
   * @returns Array of where clause expressions
   */
  protected resolveWhereClauses(criteria: DeathCriteria): string[] {
    // Start with base where clauses from parent class
    const whereClauses = super.resolveWhereClauses(criteria);
    
    // Support both PascalCase and camelCase property names
    const deathDate = criteria.DeathDate || criteria.deathDate;
    const deathType = criteria.DeathType || criteria.deathType;
    const deathTypeExclude = criteria.DeathTypeExclude || criteria.deathTypeExclude;
    
    // Death date
    if (deathDate) {
      whereClauses.push(BuilderUtils.buildDateRangeClause("d.death_date", deathDate));
    }
    
    // Death type
    if (deathType && deathType.length > 0) {
      const conceptIdField = deathType[0].CONCEPT_ID ? 'CONCEPT_ID' : 'conceptId';
      const conceptIds = deathType.map(c => c[conceptIdField]).join(',');
      whereClauses.push(`d.death_type_concept_id ${deathTypeExclude ? 'not' : ''} in (${conceptIds})`);
    }
    
    return whereClauses;
  }
}

export default DeathSqlBuilder;