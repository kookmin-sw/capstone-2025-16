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
import { CriteriaColumn } from './BuilderOptions';
import { ResourceHelper } from '../../helper/ResourceHelper';
import { PayerPlanPeriod, Period } from '../CohortExpression';
import { BuilderOptions } from './BuilderOptions';
import { BuilderUtils } from './BuilderUtils';

/**
 * Extended PayerPlanPeriod interface with additional properties
 */
interface ExtendedPayerPlanPeriod extends PayerPlanPeriod {
  UserDefinedPeriod?: any;
  PeriodStartDate?: any;
  PeriodEndDate?: any;
  PeriodLength?: any;
  AgeAtStart?: any;
  AgeAtEnd?: any;
  PayerConcept?: any;
  PlanConcept?: any;
  SponsorConcept?: any;
  StopReasonConcept?: any;
  PayerSourceConcept?: any;
  PlanSourceConcept?: any;
  SponsorSourceConcept?: any;
  StopReasonSourceConcept?: any;
}

/**
 * SQL builder for payer plan period criteria
 */
export class PayerPlanPeriodSqlBuilder extends CriteriaSqlBuilder<ExtendedPayerPlanPeriod> {
  // Default columns specified in the template that don't need to be added as additional columns
  private readonly DEFAULT_COLUMNS = new Set<CriteriaColumn>([
    CriteriaColumn.START_DATE, 
    CriteriaColumn.END_DATE, 
    CriteriaColumn.VISIT_ID
  ]);

  // Default select columns that will always be returned from the subquery
  private readonly DEFAULT_SELECT_COLUMNS = [
    "ppp.person_id", 
    "ppp.payer_plan_period_id"
  ];

  /**
   * Gets default columns that don't need to be added as additional columns
   * @returns Set of default columns
   */
  protected getDefaultColumns(): Set<CriteriaColumn> {
    return this.DEFAULT_COLUMNS;
  }

  /**
   * Gets SQL for observation period criteria with user-defined date expressions
   * @param criteria Observation period criteria
   * @param options Builder options
   * @returns SQL string for observation period criteria
   */
  public getCriteriaSql(criteria: ExtendedPayerPlanPeriod, options?: BuilderOptions): string {
    let query = super.getCriteriaSql(criteria, options);

    const userDefinedPeriod = criteria.UserDefinedPeriod;

    // Overwrite user defined dates in select
    let startDateExpression = "C.start_date";
    if (userDefinedPeriod && userDefinedPeriod.StartDate) {
      startDateExpression = BuilderUtils.dateStringToSql(userDefinedPeriod.StartDate);
    }
    query = query.replace("@startDateExpression", startDateExpression);

    let endDateExpression = "C.end_date";
    if (userDefinedPeriod && userDefinedPeriod.EndDate) {
      endDateExpression = BuilderUtils.dateStringToSql(userDefinedPeriod.EndDate);
    }
    query = query.replace("@endDateExpression", endDateExpression);

    return query;
  }

  /**
   * Gets the SQL template for this criteria type
   * @returns SQL template string
   */
  protected getQueryTemplate(): string {
    return ResourceHelper.GetResourceAsString("cohortdefinition/sql/payerPlanPeriod.sql");
  }

  /**
   * Gets the table column corresponding to a criteria column
   * @param column The criteria column to get
   * @returns The SQL column expression
   */
  protected getTableColumnForCriteriaColumn(column: CriteriaColumn): string {
    switch (column) {
      case CriteriaColumn.DOMAIN_CONCEPT:
        return "C.payer_concept_id";
      default:
        throw new Error(`Invalid CriteriaColumn for Payer Plan Period: ${column}`);
    }
  }

  /**
   * Embeds the codeset clause for concept filtering
   * @param query SQL query template
   * @param criteria Criteria with codeset information
   * @returns Modified query with codeset clause embedded
   */
  protected embedCodesetClause(query: string, criteria: ExtendedPayerPlanPeriod): string {
    // PayerPlanPeriod doesn't need codeset clause
    return query;
  }

  /**
   * Embeds ordinal expression for ordering criteria
   * @param query SQL query template
   * @param criteria Criteria to get ordinal for
   * @param whereClauses Where clauses to potentially modify
   * @returns Modified query with ordinal expression embedded
   */
  protected embedOrdinalExpression(query: string, criteria: ExtendedPayerPlanPeriod, whereClauses: string[]): string {
    // PayerPlanPeriod doesn't need ordinal expression modification (already has ordinal in the template)
    return query;
  }

  /**
   * Resolves the select clauses for the criteria
   * @param criteria Criteria to get select clauses for
   * @returns Array of select clause expressions
   */
  protected resolveSelectClauses(criteria: ExtendedPayerPlanPeriod): string[] {
    const selectCols = [...this.DEFAULT_SELECT_COLUMNS];

    // Use PascalCase properties for consistency
    const payerConcept = criteria.PayerConcept;
    const planConcept = criteria.PlanConcept;
    const sponsorConcept = criteria.SponsorConcept;
    const stopReasonConcept = criteria.StopReasonConcept;
    const payerSourceConcept = criteria.PayerSourceConcept;
    const planSourceConcept = criteria.PlanSourceConcept;
    const sponsorSourceConcept = criteria.SponsorSourceConcept;
    const stopReasonSourceConcept = criteria.StopReasonSourceConcept;
    const dateAdjustment = criteria.DateAdjustment;

    // payer concept
    if (payerConcept) {
      selectCols.push("ppp.payer_concept_id");
    }

    // plan concept
    if (planConcept) {
      selectCols.push("ppp.plan_concept_id");
    }

    // sponsor concept
    if (sponsorConcept) {
      selectCols.push("ppp.sponsor_concept_id");
    }

    // stop reason concept
    if (stopReasonConcept) {
      selectCols.push("ppp.stop_reason_concept_id");
    }

    // payer source concept
    if (payerSourceConcept) {
      selectCols.push("ppp.payer_source_concept_id");
    }

    // plan source concept
    if (planSourceConcept) {
      selectCols.push("ppp.plan_source_concept_id");
    }

    // sponsor source concept
    if (sponsorSourceConcept) {
      selectCols.push("ppp.sponsor_source_concept_id");
    }

    // stop reason source concept
    if (stopReasonSourceConcept) {
      selectCols.push("ppp.stop_reason_source_concept_id");
    }

    // dateAdjustment or default start/end dates
    if (dateAdjustment) {
      const startDateField = dateAdjustment.StartWith === "END_DATE" ? 
        "ppp.payer_plan_period_end_date" : "ppp.payer_plan_period_start_date";
      
      const endDateField = dateAdjustment.EndWith === "START_DATE" ? 
        "ppp.payer_plan_period_start_date" : "ppp.payer_plan_period_end_date";

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
      selectCols.push("ppp.payer_plan_period_start_date as start_date, ppp.payer_plan_period_end_date as end_date");
    }

    return selectCols;
  }

  /**
   * Resolves join clauses for the criteria
   * @param criteria Criteria to get join clauses for
   * @returns Array of join clause expressions
   */
  protected resolveJoinClauses(criteria: ExtendedPayerPlanPeriod): string[] {
    const joinClauses: string[] = [];

    // Use PascalCase properties only for consistency
    const ageAtStart = criteria.AgeAtStart;
    const ageAtEnd = criteria.AgeAtEnd;
    const gender = criteria.Gender;
    const genderCS = criteria.GenderCS;

    // Join to PERSON if needed for age or gender criteria
    if (ageAtStart || ageAtEnd || 
       (gender && gender.length > 0) || 
       genderCS) {
      joinClauses.push("JOIN @cdm_database_schema.PERSON P on C.person_id = P.person_id");
    }

    return joinClauses;
  }

  /**
   * Resolves where clauses for the criteria
   * @param criteria Criteria to get where clauses for
   * @returns Array of where clause expressions
   */
  protected resolveWhereClauses(criteria: ExtendedPayerPlanPeriod): string[] {
    const whereClauses = super.resolveWhereClauses(criteria);

    // Use only PascalCase properties for consistency
    const first = criteria.First === true;
    const userDefinedPeriod = criteria.UserDefinedPeriod;
    const periodStartDate = criteria.PeriodStartDate;
    const periodEndDate = criteria.PeriodEndDate;
    const periodLength = criteria.PeriodLength;
    const ageAtStart = criteria.AgeAtStart;
    const ageAtEnd = criteria.AgeAtEnd;
    const gender = criteria.Gender;
    const genderCS = criteria.GenderCS;
    const payerConcept = criteria.PayerConcept;
    const planConcept = criteria.PlanConcept;
    const sponsorConcept = criteria.SponsorConcept;
    const stopReasonConcept = criteria.StopReasonConcept;
    const payerSourceConcept = criteria.PayerSourceConcept;
    const planSourceConcept = criteria.PlanSourceConcept;
    const sponsorSourceConcept = criteria.SponsorSourceConcept;
    const stopReasonSourceConcept = criteria.StopReasonSourceConcept;

    // first
    if (first) {
      whereClauses.push("C.ordinal = 1");
    }

    // check for user defined start/end dates
    if (userDefinedPeriod) {
      if (userDefinedPeriod.StartDate) {
        const startDateExpression = BuilderUtils.dateStringToSql(userDefinedPeriod.StartDate);
        whereClauses.push(`C.start_date <= ${startDateExpression} and C.end_date >= ${startDateExpression}`);
      }

      if (userDefinedPeriod.EndDate) {
        const endDateExpression = BuilderUtils.dateStringToSql(userDefinedPeriod.EndDate);
        whereClauses.push(`C.start_date <= ${endDateExpression} and C.end_date >= ${endDateExpression}`);
      }
    }

    // periodStartDate
    if (periodStartDate) {
      whereClauses.push(BuilderUtils.buildDateRangeClause("C.start_date", periodStartDate));
    }

    // periodEndDate
    if (periodEndDate) {
      whereClauses.push(BuilderUtils.buildDateRangeClause("C.end_date", periodEndDate));
    }

    // periodLength
    if (periodLength) {
      whereClauses.push(BuilderUtils.buildNumericRangeClause("DATEDIFF(d,C.start_date, C.end_date)", periodLength));
    }

    // ageAtStart
    if (ageAtStart) {
      whereClauses.push(BuilderUtils.buildNumericRangeClause("YEAR(C.start_date) - P.year_of_birth", ageAtStart));
    }

    // ageAtEnd
    if (ageAtEnd) {
      whereClauses.push(BuilderUtils.buildNumericRangeClause("YEAR(C.end_date) - P.year_of_birth", ageAtEnd));
    }

    // gender
    if (gender && gender.length > 0) {
      const conceptIds = BuilderUtils.getConceptIdsFromConcepts(gender);
      whereClauses.push(`P.gender_concept_id in (${conceptIds.join(",")})`);
    }

    // genderCS
    if (genderCS && genderCS.CodesetId) {
      whereClauses.push(BuilderUtils.getCodesetInExpression("P.gender_concept_id", genderCS.CodesetId));
    }

    // payer concept
    if (payerConcept) {
      whereClauses.push(`C.payer_concept_id in (SELECT concept_id from #Codesets where codeset_id = ${payerConcept})`);
    }

    // plan concept
    if (planConcept) {
      whereClauses.push(`C.plan_concept_id in (SELECT concept_id from #Codesets where codeset_id = ${planConcept})`);
    }

    // sponsor concept
    if (sponsorConcept) {
      whereClauses.push(`C.sponsor_concept_id in (SELECT concept_id from #Codesets where codeset_id = ${sponsorConcept})`);
    }

    // stop reason concept
    if (stopReasonConcept) {
      whereClauses.push(`C.stop_reason_concept_id in (SELECT concept_id from #Codesets where codeset_id = ${stopReasonConcept})`);
    }

    // payer source concept
    if (payerSourceConcept) {
      whereClauses.push(`C.payer_source_concept_id in (SELECT concept_id from #Codesets where codeset_id = ${payerSourceConcept})`);
    }

    // plan source concept
    if (planSourceConcept) {
      whereClauses.push(`C.plan_source_concept_id in (SELECT concept_id from #Codesets where codeset_id = ${planSourceConcept})`);
    }

    // sponsor source concept
    if (sponsorSourceConcept) {
      whereClauses.push(`C.sponsor_source_concept_id in (SELECT concept_id from #Codesets where codeset_id = ${sponsorSourceConcept})`);
    }

    // stop reason source concept
    if (stopReasonSourceConcept) {
      whereClauses.push(`C.stop_reason_source_concept_id in (SELECT concept_id from #Codesets where codeset_id = ${stopReasonSourceConcept})`);
    }

    return whereClauses;
  }
}

export default PayerPlanPeriodSqlBuilder;