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
import { ConditionOccurrence, TextFilter, NumericRange } from '../CohortExpression';

/**
 * Interface for ConditionOccurrence criteria 
 * Extends the base Criteria with condition-specific properties
 */
export interface ConditionOccurrenceCriteria extends ConditionOccurrence {
  // Support both PascalCase (Java style) and camelCase (JavaScript style) properties
  CodesetId?: number;
  codesetId?: number; // For camelCase compatibility
  
  ConditionTypeExclude?: boolean;
  conditionTypeExclude?: boolean; // For camelCase compatibility
  
  ConditionType?: any[];
  conditionType?: any[]; // For camelCase compatibility
  
  StopReason?: TextFilter;
  stopReason?: TextFilter; // For camelCase compatibility
  
  ProviderSpecialty?: any[];
  providerSpecialty?: any[]; // For camelCase compatibility
  
  VisitType?: any[];
  visitType?: any[]; // For camelCase compatibility
  
  First?: boolean;
  first?: boolean; // For camelCase compatibility
  
  OccurrenceStartDate?: any;
  occurrenceStartDate?: any; // For camelCase compatibility
  
  OccurrenceEndDate?: any;
  occurrenceEndDate?: any; // For camelCase compatibility
  
  ConditionStatus?: any[];
  conditionStatus?: any[]; // For camelCase compatibility
  
  ConditionStatusExclude?: boolean;
  conditionStatusExclude?: boolean; // For camelCase compatibility
  
  Age?: NumericRange;
  age?: NumericRange; // For camelCase compatibility
  
  Gender?: any[];
  gender?: any[]; // For camelCase compatibility
}

/**
 * SQL Builder for Condition Occurrence criteria
 */
export class ConditionOccurrenceSqlBuilder extends CriteriaSqlBuilder<ConditionOccurrenceCriteria> {
  
  // Default columns that are already in the template
  private readonly DEFAULT_COLUMNS: Set<CriteriaColumn> = new Set([
    CriteriaColumn.START_DATE, 
    CriteriaColumn.END_DATE, 
    CriteriaColumn.VISIT_ID
  ]);
  
  // Default select columns for the query
  private readonly DEFAULT_SELECT_COLUMNS: string[] = [
    "co.person_id", 
    "co.condition_occurrence_id", 
    "co.condition_concept_id", 
    "co.visit_occurrence_id"
  ];
  
  // Template SQL for condition occurrence
  private readonly CONDITION_OCCURRENCE_TEMPLATE = ResourceHelper.GetResourceAsString("cohortdefinition/sql/conditionOccurrence.sql");
  
  /**
   * Get default columns for the criteria
   */
  protected getDefaultColumns(): Set<CriteriaColumn> {
    return this.DEFAULT_COLUMNS;
  }
  
  /**
   * Get the SQL template for condition occurrence
   */
  protected getQueryTemplate(): string {
    return this.CONDITION_OCCURRENCE_TEMPLATE;
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
        throw new Error(`Invalid CriteriaColumn for Condition Occurrence: ${column}`);
    }
  }
  
  /**
   * Embed the codeset clause for concept filtering
   * @param query SQL query
   * @param criteria Condition criteria
   * @returns Modified query with codeset clause
   */
  protected embedCodesetClause(query: string, criteria: ConditionOccurrenceCriteria): string {
    const joinClauses: string[] = [];
    
    // Account for both camelCase and PascalCase property names
    const codesetId = criteria.CodesetId !== undefined ? criteria.CodesetId : 
                     (criteria.codesetId !== undefined ? criteria.codesetId : undefined);
    
    // Get source concept flag
    const conditionSourceConcept = criteria.ConditionSourceConcept !== undefined ? criteria.ConditionSourceConcept : 
                                  (criteria.conditionSourceConcept !== undefined ? criteria.conditionSourceConcept : null);
                     
    if (codesetId !== undefined) {
      // Standard concept join
      joinClauses.push(`JOIN #Codesets cs on (co.condition_concept_id = cs.concept_id and cs.codeset_id = ${codesetId})`);
      
      // Source concept join if needed
      if (conditionSourceConcept !== null) {
        joinClauses.push(`JOIN #Codesets cns on (co.condition_source_concept_id = cns.concept_id and cns.codeset_id = ${conditionSourceConcept})`);
      }
    }
    
    return query.replace("@codesetClause", joinClauses.join("\n"));
  }
  
  /**
   * Embed ordinal expression for first occurrence
   * @param query SQL query
   * @param criteria Condition criteria
   * @param whereClauses Where clauses to modify
   * @returns Modified query with ordinal expression
   */
  protected embedOrdinalExpression(query: string, criteria: ConditionOccurrenceCriteria, whereClauses: string[]): string {
    // Handle "first" flag for getting only the first occurrence
    // Support both PascalCase and camelCase
    const isFirst = criteria.First === true || criteria.first === true;
    
    if (isFirst) {
      whereClauses.push("C.ordinal = 1");
      return query.replace("@ordinalExpression", ", row_number() over (PARTITION BY co.person_id ORDER BY co.condition_start_date, co.condition_occurrence_id) as ordinal");
    } else {
      return query.replace("@ordinalExpression", "");
    }
  }
  
  /**
   * Resolve select clauses for the criteria
   * @param criteria Condition criteria
   * @returns Array of select expressions
   */
  protected resolveSelectClauses(criteria: ConditionOccurrenceCriteria): string[] {
    const selectCols = [...this.DEFAULT_SELECT_COLUMNS];
    
    // Support both PascalCase and camelCase property names
    const conditionType = criteria.ConditionType || criteria.conditionType;
    const stopReason = criteria.StopReason || criteria.stopReason;
    const providerSpecialty = criteria.ProviderSpecialty || criteria.providerSpecialty;
    const conditionStatus = criteria.ConditionStatus || criteria.conditionStatus;
    const dateAdjustment = criteria.DateAdjustment || criteria.DateAdjustment;
    
    // Add condition type column if needed
    if (conditionType && conditionType.length > 0) {
      selectCols.push("co.condition_type_concept_id");
    }
    
    // Add stop reason if needed
    if (stopReason) {
      selectCols.push("co.stop_reason");
    }
    
    // Add provider specialty if needed
    if (providerSpecialty && providerSpecialty.length > 0) {
      selectCols.push("co.provider_id");
    }
    
    // Add condition status if needed
    if (conditionStatus && conditionStatus.length > 0) {
      selectCols.push("co.condition_status_concept_id");
    }
    
    // Add date adjustment or default start/end dates
    if (dateAdjustment) {
      // Use DateAdjustment properties
      const startDateExpr = BuilderUtils.getStartDateExpression("co", dateAdjustment);
      const endDateExpr = BuilderUtils.getEndDateExpression("co", dateAdjustment);
      selectCols.push(`${startDateExpr} as start_date, ${endDateExpr} as end_date`);
    } else {
      // Default date handling
      selectCols.push("co.condition_start_date as start_date, COALESCE(co.condition_end_date, DATEADD(day,1,co.condition_start_date)) as end_date");
    }
    
    return selectCols;
  }
  
  /**
   * Resolve join clauses for the criteria
   * @param criteria Condition criteria
   * @returns Array of join expressions
   */
  protected resolveJoinClauses(criteria: ConditionOccurrenceCriteria): string[] {
    const joinClauses: string[] = [];
    
    // Support both PascalCase and camelCase property names
    const age = criteria.Age || criteria.age;
    const gender = criteria.Gender || criteria.gender;
    const visitType = criteria.VisitType || criteria.visitType;
    const providerSpecialty = criteria.ProviderSpecialty || criteria.providerSpecialty;
    
    // Join to PERSON table if needed for demographics
    if (age || (gender && gender.length > 0)) {
      joinClauses.push("JOIN @cdm_database_schema.PERSON P on C.person_id = P.person_id");
    }
    
    // Join to VISIT_OCCURRENCE if needed
    if (visitType && visitType.length > 0) {
      joinClauses.push("JOIN @cdm_database_schema.VISIT_OCCURRENCE V on C.visit_occurrence_id = V.visit_occurrence_id and C.person_id = V.person_id");
    }
    
    // Join to PROVIDER if needed
    if (providerSpecialty && providerSpecialty.length > 0) {
      joinClauses.push("LEFT JOIN @cdm_database_schema.PROVIDER PR on C.provider_id = PR.provider_id");
    }
    
    return joinClauses;
  }
  
  /**
   * Resolve where clauses for the criteria
   * @param criteria Condition criteria
   * @returns Array of where expressions
   */
  protected resolveWhereClauses(criteria: ConditionOccurrenceCriteria): string[] {
    // Start with base where clauses from parent class
    const whereClauses = super.resolveWhereClauses(criteria);
    
    // Support both PascalCase and camelCase property names
    const occurrenceStartDate = criteria.OccurrenceStartDate || criteria.occurrenceStartDate;
    const occurrenceEndDate = criteria.OccurrenceEndDate || criteria.occurrenceEndDate;
    const conditionType = criteria.ConditionType || criteria.conditionType;
    const conditionTypeExclude = criteria.ConditionTypeExclude || criteria.conditionTypeExclude;
    const stopReason = criteria.StopReason || criteria.stopReason;
    const age = criteria.Age || criteria.age;
    const gender = criteria.Gender || criteria.gender;
    const providerSpecialty = criteria.ProviderSpecialty || criteria.providerSpecialty;
    const visitType = criteria.VisitType || criteria.visitType;
    const conditionStatus = criteria.ConditionStatus || criteria.conditionStatus;
    const conditionStatusExclude = criteria.ConditionStatusExclude || criteria.conditionStatusExclude;

    // Occurrence start date
    if (occurrenceStartDate) {
      whereClauses.push(BuilderUtils.buildDateRangeClause("C.start_date", occurrenceStartDate));
    }
    
    // Occurrence end date
    if (occurrenceEndDate) {
      whereClauses.push(BuilderUtils.buildDateRangeClause("C.end_date", occurrenceEndDate));
    }
    
    // Condition type
    if (conditionType && conditionType.length > 0) {
      const conceptIdField = conditionType[0].CONCEPT_ID ? 'CONCEPT_ID' : 'conceptId';
      const conceptIds = conditionType.map(c => c[conceptIdField]).join(',');
      whereClauses.push(`C.condition_type_concept_id ${conditionTypeExclude ? 'not' : ''} in (${conceptIds})`);
    }
    
    // Stop reason
    if (stopReason) {
      // Create a new TextFilter object that has both property styles
      const textFilter = new TextFilter();
      textFilter.Text = stopReason.Text || (stopReason as any).text || "";
      textFilter.Op = stopReason.Op || (stopReason as any).op || "contains";
      
      whereClauses.push(BuilderUtils.buildTextFilterClause("C.stop_reason", textFilter));
    }
    
    // Age
    if (age) {
      // Create a new NumericRange object with PascalCase properties
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
      whereClauses.push(`P.gender_concept_id in (${conceptIds})`);
    }
    
    // Provider specialty
    if (providerSpecialty && providerSpecialty.length > 0) {
      const conceptIdField = providerSpecialty[0].CONCEPT_ID ? 'CONCEPT_ID' : 'conceptId';
      const conceptIds = providerSpecialty.map(c => c[conceptIdField]).join(',');
      whereClauses.push(`PR.specialty_concept_id in (${conceptIds})`);
    }
    
    // Visit type
    if (visitType && visitType.length > 0) {
      const conceptIdField = visitType[0].CONCEPT_ID ? 'CONCEPT_ID' : 'conceptId';
      const conceptIds = visitType.map(c => c[conceptIdField]).join(',');
      whereClauses.push(`V.visit_concept_id in (${conceptIds})`);
    }
    
    // Condition status
    if (conditionStatus && conditionStatus.length > 0) {
      const conceptIdField = conditionStatus[0].CONCEPT_ID ? 'CONCEPT_ID' : 'conceptId';
      const conceptIds = conditionStatus.map(c => c[conceptIdField]).join(',');
      whereClauses.push(`C.condition_status_concept_id ${conditionStatusExclude ? 'not' : ''} in (${conceptIds})`);
    }
    
    return whereClauses;
  }
}

export default ConditionOccurrenceSqlBuilder;