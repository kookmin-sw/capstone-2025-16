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

import { CriteriaSqlBuilder } from './CriteriaSqlBuilder';
import { ResourceHelper } from '../../helper/ResourceHelper';
import { ProcedureOccurrence, NumericRange, TextFilter } from '../CohortExpression';
import { BuilderOptions, CriteriaColumn } from './BuilderOptions';
import BuilderUtils from './BuilderUtils';

/**
 * SQL builder for procedure occurrence criteria
 */
export class ProcedureOccurrenceSqlBuilder extends CriteriaSqlBuilder<ProcedureOccurrence> {
  
  /**
   * Get default columns that don't need to be added as additional columns
   * @returns Set of default columns
   */
  protected getDefaultColumns(): Set<CriteriaColumn> {
    return new Set([
      CriteriaColumn.START_DATE,
      CriteriaColumn.END_DATE,
      CriteriaColumn.PERSON_ID,
      CriteriaColumn.VISIT_ID
    ]);
  }

  /**
   * Get the SQL template for this criteria type
   * @returns SQL template string
   */
  protected getQueryTemplate(): string {
    return ResourceHelper.GetResourceAsString("cohortdefinition/sql/procedureOccurrence.sql");
  }

  /**
   * Get the table column corresponding to a criteria column
   * @param column The criteria column to get
   * @returns The SQL column expression
   */
  protected getTableColumnForCriteriaColumn(column: CriteriaColumn): string {
    switch (column) {
      case CriteriaColumn.START_DATE:
        return "po.procedure_date";
      case CriteriaColumn.END_DATE:
        return "po.procedure_date";
      case CriteriaColumn.PERSON_ID:
        return "po.person_id";
      case CriteriaColumn.VISIT_ID:
        return "po.visit_occurrence_id";
      default:
        return "NULL";
    }
  }

  /**
   * Embed the codeset clause for concept filtering
   * @param query SQL query template
   * @param criteria Criteria with codeset information
   * @returns Modified query with codeset clause embedded
   */
  protected embedCodesetClause(query: string, criteria: ProcedureOccurrence): string {
    const codesetId = criteria.CodesetId !== undefined ? criteria.CodesetId : null;
    
    let codesetClause = "";
    if (codesetId !== null) {
      // Using the JOIN pattern like Java implementation
      codesetClause = `JOIN #Codesets cs on (po.procedure_concept_id = cs.concept_id and cs.codeset_id = ${codesetId})`;
    }
    
    return query.replace("@codesetClause", codesetClause);
  }

  /**
   * Embed ordinal expression for ordering criteria
   * @param query SQL query template
   * @param criteria Criteria to get ordinal for
   * @param whereClauses Where clauses to potentially modify
   * @returns Modified query with ordinal expression embedded
   */
  protected embedOrdinalExpression(query: string, criteria: ProcedureOccurrence, whereClauses: string[]): string {
    if (criteria.First) {
      query = query.replace("@ordinalExpression", ", row_number() over (partition by po.person_id order by po.procedure_date asc) as ordinal");
      whereClauses.push("ordinal = 1");
    } else {
      query = query.replace("@ordinalExpression", "");
    }
    
    return query;
  }

  /**
   * Resolve the select clauses for the criteria
   * @param criteria Criteria to get select clauses for
   * @returns Array of select clause expressions
   */
  protected resolveSelectClauses(criteria: ProcedureOccurrence): string[] {
    const selectClauses: string[] = [];
    selectClauses.push("po.person_id");
    selectClauses.push("po.procedure_occurrence_id");
    selectClauses.push("po.procedure_date as start_date");
    selectClauses.push("po.procedure_date as end_date");
    selectClauses.push("po.procedure_concept_id");
    selectClauses.push("po.visit_occurrence_id");
    selectClauses.push("po.procedure_type_concept_id");
    
    const modifier = criteria.Modifier;
    if (modifier) {
      selectClauses.push("po.modifier_concept_id");
    }
    
    const quantity = criteria.ProcedureQuantity;
    if (quantity) {
      selectClauses.push("po.quantity");
    }
    
    return selectClauses;
  }
  
  /**
   * Resolve join clauses for the criteria
   * @param criteria Criteria to get join clauses for
   * @returns Array of join clause expressions
   */
  protected resolveJoinClauses(criteria: ProcedureOccurrence): string[] {
    const joinClauses: string[] = [];
    
    // Support both PascalCase and camelCase property names for age and gender criteria
    const age = criteria.Age || criteria.age;
    const gender = criteria.Gender || criteria.gender;
    
    // Join to PERSON if needed for demographics
    if (age || (gender && gender.length > 0)) {
      joinClauses.push("JOIN @cdm_database_schema.PERSON P on C.person_id = P.person_id");
    }
    
    return joinClauses;
  }
  
  /**
   * Resolve where clauses for the criteria
   * @param criteria Criteria to get where clauses for
   * @returns Array of where clause expressions
   */
  protected resolveWhereClauses(criteria: ProcedureOccurrence): string[] {
    const whereClauses: string[] = super.resolveWhereClauses(criteria);
    
    // Handle procedure type
    if (criteria.ProcedureType && criteria.ProcedureType.length > 0) {
      const typeIds = criteria.ProcedureType.join(',');
      const exclude = criteria.ProcedureTypeExclude ? 'NOT' : '';
      whereClauses.push(`po.procedure_type_concept_id ${exclude} IN (${typeIds})`);
    }
    
    // Handle modifier TextFilter
    if (criteria.Modifier) {
      const modifier = criteria.Modifier;
      if (modifier.Text) {
        const modifierClause = BuilderUtils.buildTextFilterClause("po.modifier_source_value", modifier);
        if (modifierClause) {
          whereClauses.push(modifierClause);
        }
      }
    }
    
    // Handle quantity
    if (criteria.ProcedureQuantity) {
      const quantity = criteria.ProcedureQuantity;
      const quantityClause = BuilderUtils.buildNumericRangeClause("po.quantity", quantity);
      if (quantityClause) {
        whereClauses.push(quantityClause);
      }
    }
    
    return whereClauses;
  }
}

export default ProcedureOccurrenceSqlBuilder;