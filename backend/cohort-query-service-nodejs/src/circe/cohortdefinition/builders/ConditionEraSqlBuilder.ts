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
import { CriteriaColumn, BuilderOptions } from './BuilderOptions';
import { ResourceHelper } from '../../helper/ResourceHelper';
import BuilderUtils from './BuilderUtils';
import { ConditionEra, NumericRange } from '../CohortExpression';

/**
 * Interface for ConditionEra criteria
 * Extends the base Criteria with condition era specific properties with both camelCase and PascalCase versions
 */
export interface ConditionEraCriteria extends ConditionEra {
  // Support both camelCase and PascalCase naming styles
  CodesetId?: number;
  codesetId?: number;
  First?: boolean;
  first?: boolean;
  EraStartDate?: any;
  eraStartDate?: any;
  EraEndDate?: any;
  eraEndDate?: any;
  OccurrenceCount?: NumericRange;
  occurrenceCount?: NumericRange;
  EraLength?: NumericRange;
  eraLength?: NumericRange;
  Age?: NumericRange;
  age?: NumericRange;
  Gender?: any[];
  gender?: any[];
  GenderExclude?: boolean;
  genderExclude?: boolean;
  OccurrenceStartDate?: any;
  occurrenceStartDate?: any;
  OccurrenceEndDate?: any;
  occurrenceEndDate?: any;
}

/**
 * SQL Builder for Condition Era criteria
 */
export class ConditionEraSqlBuilder extends CriteriaSqlBuilder<ConditionEraCriteria> {
  
  // Default columns that are already in the template
  private readonly DEFAULT_COLUMNS: Set<CriteriaColumn> = new Set([
    CriteriaColumn.START_DATE, 
    CriteriaColumn.END_DATE, 
    CriteriaColumn.VISIT_ID
  ]);
  
  // Default select columns for the query
  private readonly DEFAULT_SELECT_COLUMNS: string[] = [
    "ce.person_id", 
    "ce.condition_era_id", 
    "ce.condition_concept_id"
  ];
  
  // Template SQL for condition era
  private readonly CONDITION_ERA_TEMPLATE = ResourceHelper.GetResourceAsString("cohortdefinition/sql/conditionEra.sql");
  
  /**
   * Get default columns for the criteria
   */
  protected getDefaultColumns(): Set<CriteriaColumn> {
    return this.DEFAULT_COLUMNS;
  }
  
  /**
   * Get the SQL template for condition era
   */
  protected getQueryTemplate(): string {
    return this.CONDITION_ERA_TEMPLATE;
  }
  
  /**
   * Get the table column for a criteria column
   * @param column Criteria column to map
   * @returns Table column expression for the criteria column
   */
  protected getTableColumnForCriteriaColumn(column: CriteriaColumn): string {
    switch (column) {
      case CriteriaColumn.DOMAIN_CONCEPT:
        return "C.condition_concept_id";
      case CriteriaColumn.DURATION:
        return "(DATEDIFF(day, C.start_date, C.end_date))";
      default:
        throw new Error(`Invalid CriteriaColumn for Condition Era: ${column}`);
    }
  }
  
  /**
   * Embed the codeset clause for concept filtering
   * @param query SQL query
   * @param criteria Condition criteria
   * @returns Modified query with codeset clause
   */
  protected embedCodesetClause(query: string, criteria: ConditionEraCriteria): string {
    let codesetClause = "";
    
    // Support both camelCase and PascalCase property names
    const codesetId = criteria.CodesetId !== undefined ? criteria.CodesetId : 
                     (criteria.codesetId !== undefined ? criteria.codesetId : undefined);
    
    if (codesetId !== undefined) {
      // Using the same format as the Java implementation
      codesetClause = `where ce.condition_concept_id in (SELECT concept_id from #Codesets where codeset_id = ${codesetId})`;
    }
    
    return query.replace("@codesetClause", codesetClause);
  }
  
  /**
   * Embed ordinal expression for first occurrence
   * @param query SQL query
   * @param criteria Condition criteria
   * @param whereClauses Where clauses to modify
   * @returns Modified query with ordinal expression
   */
  protected embedOrdinalExpression(query: string, criteria: ConditionEraCriteria, whereClauses: string[]): string {
    // Handle "first" flag for getting only the first occurrence 
    const first = criteria.First || criteria.first;
    if (first) {
      whereClauses.push("C.ordinal = 1");
      return query.replace("@ordinalExpression", ", row_number() over (PARTITION BY ce.person_id ORDER BY ce.condition_era_start_date, ce.condition_era_id) as ordinal");
    } else {
      return query.replace("@ordinalExpression", "");
    }
  }
  
  /**
   * Resolve select clauses for the criteria
   * @param criteria Condition criteria
   * @returns Array of select expressions
   */
  protected resolveSelectClauses(criteria: ConditionEraCriteria): string[] {
    const selectCols = [...this.DEFAULT_SELECT_COLUMNS];
    
    // Add occurrence count
    const occurrenceCount = criteria.OccurrenceCount || criteria.occurrenceCount;
    if (occurrenceCount) {
      selectCols.push("ce.condition_occurrence_count");
    }
    
    // Add era length/duration if needed
    const eraLength = criteria.EraLength || criteria.eraLength;
    if (eraLength) {
      selectCols.push("DATEDIFF(day, ce.condition_era_start_date, ce.condition_era_end_date) as era_length");
    }
    
    // Add date adjustment or default start/end dates
    const dateAdjustment = criteria.DateAdjustment || criteria.DateAdjustment;
    if (dateAdjustment) {
      // Get start date expression
      const startDateExpr = BuilderUtils.getStartDateExpression(
        "ce", 
        dateAdjustment
      );
      
      // Get end date expression
      const endDateExpr = BuilderUtils.getEndDateExpression(
        "ce", 
        dateAdjustment
      );
      
      selectCols.push(`${startDateExpr} as start_date, ${endDateExpr} as end_date`);
    } else {
      selectCols.push("ce.condition_era_start_date as start_date, ce.condition_era_end_date as end_date");
    }
    
    return selectCols;
  }
  
  /**
   * Resolve join clauses for the criteria
   * @param criteria Condition criteria
   * @returns Array of join expressions
   */
  protected resolveJoinClauses(criteria: ConditionEraCriteria): string[] {
    const joinClauses: string[] = [];
    
    // Support both camelCase and PascalCase property names
    const age = criteria.Age || criteria.age;
    const gender = criteria.Gender || criteria.gender;
    
    // Join to PERSON table if needed for demographics
    if (age || (gender && gender.length > 0)) {
      joinClauses.push("JOIN @cdm_database_schema.PERSON P on C.person_id = P.person_id");
    }
    
    return joinClauses;
  }
  
  /**
   * Resolve where clauses for the criteria
   * @param criteria Condition criteria
   * @returns Array of where expressions
   */
  protected resolveWhereClauses(criteria: ConditionEraCriteria): string[] {
    // Start with base where clauses from parent class
    const whereClauses = super.resolveWhereClauses(criteria);
    
    // Support both camelCase and PascalCase property names
    const eraStartDate = criteria.EraStartDate || criteria.eraStartDate;
    const eraEndDate = criteria.EraEndDate || criteria.eraEndDate;
    const occurrenceCount = criteria.OccurrenceCount || criteria.occurrenceCount;
    const eraLength = criteria.EraLength || criteria.eraLength;
    const age = criteria.Age || criteria.age;
    const gender = criteria.Gender || criteria.gender;
    const genderExclude = criteria.GenderExclude || criteria.genderExclude;
    const occurrenceStartDate = criteria.OccurrenceStartDate || criteria.occurrenceStartDate;
    const occurrenceEndDate = criteria.OccurrenceEndDate || criteria.occurrenceEndDate;
    
    // Era start date or occurrence start date
    if (eraStartDate) {
      whereClauses.push(BuilderUtils.buildDateRangeClause("C.start_date", eraStartDate));
    } else if (occurrenceStartDate) {
      whereClauses.push(BuilderUtils.buildDateRangeClause("C.start_date", occurrenceStartDate));
    }
    
    // Era end date or occurrence end date
    if (eraEndDate) {
      whereClauses.push(BuilderUtils.buildDateRangeClause("C.end_date", eraEndDate));
    } else if (occurrenceEndDate) {
      whereClauses.push(BuilderUtils.buildDateRangeClause("C.end_date", occurrenceEndDate));
    }
    
    // Occurrence count
    if (occurrenceCount) {
      const numericRange = new NumericRange();
      numericRange.Value = occurrenceCount.Value || 0;
      numericRange.Op = occurrenceCount.Op || "gt";
      numericRange.Extent = occurrenceCount.Extent;
      
      whereClauses.push(BuilderUtils.buildNumericRangeClause("C.condition_occurrence_count", numericRange));
    }
    
    // Era length
    if (eraLength) {
      const numericRange = new NumericRange();
      numericRange.Value = eraLength.Value || 0;
      numericRange.Op = eraLength.Op || "gt";
      numericRange.Extent = eraLength.Extent;
      
      whereClauses.push(BuilderUtils.buildNumericRangeClause("DATEDIFF(day, C.start_date, C.end_date)", numericRange));
    }
    
    // Age
    if (age) {
      const numericRange = new NumericRange();
      numericRange.Value = age.Value || 0;
      numericRange.Op = age.Op || "gt";
      numericRange.Extent = age.Extent;
      
      whereClauses.push(BuilderUtils.buildNumericRangeClause("YEAR(C.start_date) - P.year_of_birth", numericRange));
    }
    
    // Gender
    if (gender && gender.length > 0) {
      const conceptIdField = gender[0].CONCEPT_ID ? 'CONCEPT_ID' : 'conceptId';
      const conceptIds = gender.map(c => c[conceptIdField]).join(',');
      whereClauses.push(`P.gender_concept_id ${genderExclude ? 'not' : ''} in (${conceptIds})`);
    }
    
    return whereClauses;
  }
}

export default ConditionEraSqlBuilder;