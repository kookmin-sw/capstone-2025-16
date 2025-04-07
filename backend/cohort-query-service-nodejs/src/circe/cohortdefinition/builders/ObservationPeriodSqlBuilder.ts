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
import { CriteriaColumn } from './BuilderOptions';
import { ResourceHelper } from '../../helper/ResourceHelper';
import { ObservationPeriod, NumericRange, DateRange, DateAdjustment, Criteria } from '../CohortExpression';
import { INumericRange } from '../CriteriaInterfaces';
import { BuilderOptions } from './BuilderOptions';
import BuilderUtils from './BuilderUtils';

/**
 * Extended interface for ObservationPeriod
 */
interface ExtendedObservationPeriod {
  UserDefinedPeriod?: any;
  PeriodStartDate?: DateRange;
  PeriodEndDate?: DateRange;
  PeriodType?: any[];
  PeriodTypeCS?: any;
  PeriodLength?: NumericRange | number;
  AgeAtStart?: NumericRange;
  AgeAtEnd?: NumericRange;
  First?: boolean;
  DateAdjustment?: DateAdjustment;
}

/**
 * SQL builder for observation period criteria
 */
export class ObservationPeriodSqlBuilder extends CriteriaSqlBuilder<ObservationPeriod> {
  // Default columns specified in the template that don't need to be added as additional columns
  private readonly DEFAULT_COLUMNS = new Set<CriteriaColumn>([
    CriteriaColumn.START_DATE, 
    CriteriaColumn.END_DATE,
    CriteriaColumn.PERSON_ID,
    CriteriaColumn.VISIT_ID
  ]);

  // Default select columns that will always be returned from the subquery
  private readonly DEFAULT_SELECT_COLUMNS = [
    "op.person_id", 
    "op.observation_period_id", 
    "op.period_type_concept_id"
  ];

  /**
   * Gets default columns that don't need to be added as additional columns
   * @returns Set of default columns
   */
  protected getDefaultColumns(): Set<CriteriaColumn> {
    return this.DEFAULT_COLUMNS;
  }

  /**
   * Gets SQL for observation period criteria
   * @param criteria Observation period criteria
   * @param options Builder options
   * @returns SQL string for observation period criteria
   */
  public getCriteriaSql(criteria: ObservationPeriod, options?: BuilderOptions): string {
    // Cast to ExtendedObservationPeriod to access additional properties
    const extCriteria = criteria as unknown as ExtendedObservationPeriod;
    
    let query = super.getCriteriaSql(criteria, options);

    // Overwrite user defined dates in select
    let startDateExpression = "C.start_date";
    if (extCriteria.UserDefinedPeriod && extCriteria.UserDefinedPeriod.StartDate) {
      startDateExpression = BuilderUtils.dateStringToSql(extCriteria.UserDefinedPeriod.StartDate);
    }
    query = query.replace("@startDateExpression", startDateExpression);

    let endDateExpression = "C.end_date";
    if (extCriteria.UserDefinedPeriod && extCriteria.UserDefinedPeriod.EndDate) {
      endDateExpression = BuilderUtils.dateStringToSql(extCriteria.UserDefinedPeriod.EndDate);
    }
    query = query.replace("@endDateExpression", endDateExpression);

    return query;
  }

  /**
   * Gets the SQL template for this criteria type
   * @returns SQL template string
   */
  protected getQueryTemplate(): string {
    return ResourceHelper.GetResourceAsString("cohortdefinition/sql/observationPeriod.sql");
  }

  /**
   * Gets the table column corresponding to a criteria column
   * @param column The criteria column to get
   * @returns The SQL column expression
   */
  protected getTableColumnForCriteriaColumn(column: CriteriaColumn): string {
    switch (column) {
      case CriteriaColumn.DOMAIN_CONCEPT:
        return "C.period_type_concept_id";
      case CriteriaColumn.DURATION:
        return "DATEDIFF(d, @startDateExpression, @endDateExpression)";
      case CriteriaColumn.START_DATE:
        return "C.start_date";
      case CriteriaColumn.END_DATE:
        return "C.end_date";
      case CriteriaColumn.PERSON_ID:
        return "C.person_id";
      // Note: VISIT_ID doesn't really apply to ObservationPeriod, but we implement it for consistency
      case CriteriaColumn.VISIT_ID:
        return "NULL";
      default:
        throw new Error(`Invalid CriteriaColumn for Observation Period: ${column}`);
    }
  }

  /**
   * Embeds the codeset clause for concept filtering
   * @param query SQL query template
   * @param criteria Criteria with codeset information
   * @returns Modified query with codeset clause embedded
   */
  protected embedCodesetClause(query: string, criteria: ObservationPeriod): string {
    // ObservationPeriod doesn't need codeset clause
    return query;
  }

  /**
   * Embeds ordinal expression for ordering criteria
   * @param query SQL query template
   * @param criteria Criteria to get ordinal for
   * @param whereClauses Where clauses to potentially modify
   * @returns Modified query with ordinal expression embedded
   */
  protected embedOrdinalExpression(query: string, criteria: ObservationPeriod, whereClauses: string[]): string {
    // Cast to ExtendedObservationPeriod to access additional properties
    const extCriteria = criteria as unknown as ExtendedObservationPeriod;
    
    if (extCriteria.First) {
      whereClauses.push("C.ordinal = 1");
      query = query.replace("@ordinalExpression", 
        ", row_number() over (PARTITION BY op.person_id ORDER BY op.observation_period_start_date) as ordinal"
      );
    } else {
      query = query.replace("@ordinalExpression", "");
    }
    return query;
  }

  /**
   * Resolves the select clauses for the criteria
   * @param criteria Criteria to get select clauses for
   * @returns Array of select clause expressions
   */
  protected resolveSelectClauses(criteria: ObservationPeriod): string[] {
    // Cast to ExtendedObservationPeriod to access additional properties
    const extCriteria = criteria as unknown as ExtendedObservationPeriod;
    
    const selectCols = [...this.DEFAULT_SELECT_COLUMNS];

    // Handle date adjustment if specified
    if (extCriteria.DateAdjustment) {
      const dateAdjustment: DateAdjustment = extCriteria.DateAdjustment;
      
      // Use standardized field names for consistency
      const startDateField = dateAdjustment.StartWith === "END_DATE" ? 
        "op.observation_period_end_date" : "op.observation_period_start_date";
      
      const endDateField = dateAdjustment.EndWith === "START_DATE" ? 
        "op.observation_period_start_date" : "op.observation_period_end_date";

      // Apply date adjustments
      const startOffset = dateAdjustment.StartOffset || 0;
      const endOffset = dateAdjustment.EndOffset || 0;
      
      // Build date expressions
      const startExpr = startOffset !== 0 ? 
        `DATEADD(day, ${startOffset}, ${startDateField})` : startDateField;
      
      const endExpr = endOffset !== 0 ? 
        `DATEADD(day, ${endOffset}, ${endDateField})` : endDateField;
      
      selectCols.push(`${startExpr} as start_date, ${endExpr} as end_date`);
    } else {
      // Default date fields
      selectCols.push("op.observation_period_start_date as start_date, op.observation_period_end_date as end_date");
    }

    return selectCols;
  }

  /**
   * Resolves join clauses for the criteria
   * @param criteria Criteria to get join clauses for
   * @returns Array of join clause expressions
   */
  protected resolveJoinClauses(criteria: ObservationPeriod): string[] {
    // Cast to ExtendedObservationPeriod to access additional properties
    const extCriteria = criteria as unknown as ExtendedObservationPeriod;
    
    const joinClauses: string[] = [];

    // Join to PERSON if we need age calculations
    if (extCriteria.AgeAtStart || extCriteria.AgeAtEnd) {
      joinClauses.push("JOIN @cdm_database_schema.PERSON P on C.person_id = P.person_id");
    }

    return joinClauses;
  }

  /**
   * Resolves where clauses for the criteria
   * @param criteria Criteria to get where clauses for
   * @returns Array of where clause expressions
   */
  protected resolveWhereClauses(criteria: ObservationPeriod): string[] {
    // Cast to ExtendedObservationPeriod to access additional properties
    const extCriteria = criteria as unknown as ExtendedObservationPeriod;
    
    const whereClauses = super.resolveWhereClauses(criteria);

    // First event filter
    if (extCriteria.First) {
      whereClauses.push("C.ordinal = 1");
    }

    // Check for user defined start/end dates
    if (extCriteria.UserDefinedPeriod) {
      if (extCriteria.UserDefinedPeriod.StartDate) {
        const startDateExpression = BuilderUtils.dateStringToSql(extCriteria.UserDefinedPeriod.StartDate);
        whereClauses.push(`C.start_date <= ${startDateExpression} AND C.end_date >= ${startDateExpression}`);
      }

      if (extCriteria.UserDefinedPeriod.EndDate) {
        const endDateExpression = BuilderUtils.dateStringToSql(extCriteria.UserDefinedPeriod.EndDate);
        whereClauses.push(`C.start_date <= ${endDateExpression} AND C.end_date >= ${endDateExpression}`);
      }
    }

    // Handle date range filters
    if (extCriteria.PeriodStartDate) {
      whereClauses.push(BuilderUtils.buildDateRangeClause("C.start_date", extCriteria.PeriodStartDate));
    }

    if (extCriteria.PeriodEndDate) {
      whereClauses.push(BuilderUtils.buildDateRangeClause("C.end_date", extCriteria.PeriodEndDate));
    }

    // Period type filter
    if (extCriteria.PeriodType && extCriteria.PeriodType.length > 0) {
      const conceptIds = BuilderUtils.getConceptIdsFromConcepts(extCriteria.PeriodType);
      if (conceptIds.length > 0) {
        whereClauses.push(`C.period_type_concept_id IN (${conceptIds.join(",")})`);
      }
    }

    // Period type concept set
    if (extCriteria.PeriodTypeCS && extCriteria.PeriodTypeCS.CodesetId) {
      whereClauses.push(`C.period_type_concept_id IN (SELECT concept_id FROM #Codesets WHERE codeset_id = ${extCriteria.PeriodTypeCS.CodesetId})`);
    }

    // Period length
    if (extCriteria.PeriodLength) {
      if (typeof extCriteria.PeriodLength === 'object' && 'Op' in extCriteria.PeriodLength) {
        // Handle NumericRange object
        whereClauses.push(BuilderUtils.buildNumericRangeClause("DATEDIFF(d, C.start_date, C.end_date)", extCriteria.PeriodLength as NumericRange));
      } else if (typeof extCriteria.PeriodLength === 'number') {
        // Handle simple number value
        whereClauses.push(`DATEDIFF(d, C.start_date, C.end_date) = ${extCriteria.PeriodLength}`);
      }
    }

    // Age filters
    if (extCriteria.AgeAtStart) {
      whereClauses.push(BuilderUtils.buildNumericRangeClause("YEAR(C.start_date) - P.year_of_birth", extCriteria.AgeAtStart));
    }

    if (extCriteria.AgeAtEnd) {
      whereClauses.push(BuilderUtils.buildNumericRangeClause("YEAR(C.end_date) - P.year_of_birth", extCriteria.AgeAtEnd));
    }

    return whereClauses;
  }
}

export default ObservationPeriodSqlBuilder;