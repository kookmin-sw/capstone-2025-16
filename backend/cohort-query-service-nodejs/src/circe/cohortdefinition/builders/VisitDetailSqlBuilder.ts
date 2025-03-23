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
import { ConceptSetSelection, VisitDetail, NumericRange } from '../CohortExpression';
import { BuilderOptions } from './BuilderOptions';
import BuilderUtils from './BuilderUtils';

/**
 * Extended VisitDetail interface with location property
 */
interface ExtendedVisitDetail extends VisitDetail {
  // Define PlaceOfServiceLocation that might be used but isn't in the base VisitDetail
  PlaceOfServiceLocation?: number;
}

/**
 * SQL builder for visit detail criteria
 */
export class VisitDetailSqlBuilder extends CriteriaSqlBuilder<ExtendedVisitDetail> {
  // Default columns specified in the template that don't need to be added as additional columns
  private readonly DEFAULT_COLUMNS = new Set<CriteriaColumn>([
    CriteriaColumn.START_DATE, 
    CriteriaColumn.END_DATE,
    CriteriaColumn.PERSON_ID,
    CriteriaColumn.VISIT_ID
  ]);

  // Default select columns that will always be returned from the subquery
  private readonly DEFAULT_SELECT_COLUMNS = [
    "vd.person_id", 
    "vd.visit_detail_id", 
    "vd.visit_detail_concept_id",
    "vd.visit_occurrence_id"
  ];

  /**
   * Gets default columns that don't need to be added as additional columns
   * @returns Set of default columns
   */
  protected getDefaultColumns(): Set<CriteriaColumn> {
    return this.DEFAULT_COLUMNS;
  }

  /**
   * Gets the SQL template for this criteria type
   * @returns SQL template string
   */
  protected getQueryTemplate(): string {
    return ResourceHelper.GetResourceAsString("cohortdefinition/sql/visitDetail.sql");
  }

  /**
   * Gets the table column corresponding to a criteria column
   * @param column The criteria column to get
   * @returns The SQL column expression
   */
  protected getTableColumnForCriteriaColumn(column: CriteriaColumn): string {
    switch (column) {
      case CriteriaColumn.DOMAIN_CONCEPT:
        return "C.visit_detail_concept_id";
      case CriteriaColumn.DURATION:
        return "DATEDIFF(d, C.start_date, C.end_date)";
      case CriteriaColumn.START_DATE:
        return "C.start_date";
      case CriteriaColumn.END_DATE:
        return "C.end_date";
      case CriteriaColumn.PERSON_ID:
        return "C.person_id";
      case CriteriaColumn.VISIT_ID:
        return "C.visit_occurrence_id";
      default:
        throw new Error(`Invalid CriteriaColumn for Visit Detail: ${column}`);
    }
  }

  /**
   * Embeds the codeset clause for concept filtering
   * @param query SQL query template
   * @param criteria Criteria with codeset information
   * @returns Modified query with codeset clause embedded
   */
  protected embedCodesetClause(query: string, criteria: ExtendedVisitDetail): string {
    const codesetId = criteria.CodesetId !== undefined ? criteria.CodesetId : null;
    const visitDetailSourceConcept = criteria.VisitDetailSourceConcept;
    
    let codesetClause = "";
    if (codesetId !== null) {
      if (visitDetailSourceConcept) {
        // Join with both standard and source concepts (matching Java implementation)
        codesetClause = `JOIN #Codesets cs on (vd.visit_detail_concept_id = cs.concept_id and cs.codeset_id = ${codesetId})
JOIN #Codesets cns on (vd.visit_detail_source_concept_id = cns.concept_id and cns.codeset_id = ${visitDetailSourceConcept})`;
      } else {
        // Standard concept join only
        codesetClause = `JOIN #Codesets cs on (vd.visit_detail_concept_id = cs.concept_id and cs.codeset_id = ${codesetId})`;
      }
    }
    
    return query.replace("@codesetClause", codesetClause);
  }

  /**
   * Embeds ordinal expression for ordering criteria
   * @param query SQL query template
   * @param criteria Criteria to get ordinal for
   * @param whereClauses Where clauses to potentially modify
   * @returns Modified query with ordinal expression embedded
   */
  protected embedOrdinalExpression(query: string, criteria: ExtendedVisitDetail, whereClauses: string[]): string {
    if (criteria.First) {
      whereClauses.push("C.ordinal = 1");
      query = query.replace("@ordinalExpression", 
        ", row_number() over (PARTITION BY vd.person_id ORDER BY vd.visit_detail_start_date, vd.visit_detail_id) as ordinal"
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
  protected resolveSelectClauses(criteria: ExtendedVisitDetail): string[] {
    const selectCols = [...this.DEFAULT_SELECT_COLUMNS];

    // Add specific columns only when they are used in filtering
    if (criteria.VisitDetailTypeCS) {
      selectCols.push("vd.visit_detail_type_concept_id");
    }

    if (criteria.ProviderSpecialtyCS) {
      selectCols.push("vd.provider_id");
    }

    if (criteria.PlaceOfServiceCS || criteria.PlaceOfServiceLocation) {
      selectCols.push("vd.care_site_id");
    }

    // Handle date adjustment or use default start/end dates
    if (criteria.DateAdjustment) {
      const startDateField = criteria.DateAdjustment.StartWith === "END_DATE" ? 
        "vd.visit_detail_end_date" : "vd.visit_detail_start_date";
      
      const endDateField = criteria.DateAdjustment.EndWith === "START_DATE" ? 
        "vd.visit_detail_start_date" : "vd.visit_detail_end_date";

      // Apply start date adjustment
      if (criteria.DateAdjustment.StartOffset !== undefined) {
        selectCols.push(`DATEADD(day, ${criteria.DateAdjustment.StartOffset}, ${startDateField}) as start_date`);
      } else {
        selectCols.push(`${startDateField} as start_date`);
      }

      // Apply end date adjustment
      if (criteria.DateAdjustment.EndOffset !== undefined) {
        selectCols.push(`DATEADD(day, ${criteria.DateAdjustment.EndOffset}, ${endDateField}) as end_date`);
      } else {
        selectCols.push(`${endDateField} as end_date`);
      }
    } else {
      selectCols.push("vd.visit_detail_start_date as start_date, vd.visit_detail_end_date as end_date");
    }

    return selectCols;
  }

  /**
   * Resolves join clauses for the criteria
   * @param criteria Criteria to get join clauses for
   * @returns Array of join clause expressions
   */
  protected resolveJoinClauses(criteria: ExtendedVisitDetail): string[] {
    const joinClauses: string[] = [];

    // Join to PERSON if needed for age or gender criteria
    if (criteria.Age || criteria.GenderCS) {
      joinClauses.push("JOIN @cdm_database_schema.PERSON P on C.person_id = P.person_id");
    }

    // Join to CARE_SITE if needed for place of service criteria
    if (criteria.PlaceOfServiceCS || criteria.PlaceOfServiceLocation) {
      joinClauses.push("JOIN @cdm_database_schema.CARE_SITE CS on C.care_site_id = CS.care_site_id");
    }

    // Join to PROVIDER if needed for provider specialty criteria
    if (criteria.ProviderSpecialtyCS) {
      joinClauses.push("LEFT JOIN @cdm_database_schema.PROVIDER PR on C.provider_id = PR.provider_id");
    }

    // Add location history join if needed for place of service location
    if (criteria.PlaceOfServiceLocation) {
      this.addFilteringByCareSiteLocationRegion(joinClauses, criteria.PlaceOfServiceLocation);
    }

    return joinClauses;
  }

  /**
   * Resolves where clauses for the criteria
   * @param criteria Criteria to get where clauses for
   * @returns Array of where clause expressions
   */
  protected resolveWhereClauses(criteria: ExtendedVisitDetail): string[] {
    const whereClauses = super.resolveWhereClauses(criteria);

    // Visit detail start date filter
    if (criteria.VisitDetailStartDate) {
      whereClauses.push(BuilderUtils.buildDateRangeClause("C.start_date", criteria.VisitDetailStartDate));
    }

    // Visit detail end date filter
    if (criteria.VisitDetailEndDate) {
      whereClauses.push(BuilderUtils.buildDateRangeClause("C.end_date", criteria.VisitDetailEndDate));
    }

    // Visit detail type codeset
    if (criteria.VisitDetailTypeCS) {
      // Create direct SQL for concept set filtering
      whereClauses.push(`C.visit_detail_type_concept_id IN (SELECT concept_id FROM #Codesets WHERE codeset_id = ${criteria.VisitDetailTypeCS})`);
    }

    // Visit detail length - needs numeric range
    if (criteria.VisitDetailLength) {
      if (typeof criteria.VisitDetailLength === 'number') {
        // If it's just a number, create an exact match equation
        whereClauses.push(`DATEDIFF(d,C.start_date, C.end_date) = ${criteria.VisitDetailLength}`);
      } else if (typeof criteria.VisitDetailLength === 'object' && 'Op' in criteria.VisitDetailLength) {
        // If it's a NumericRange object
        whereClauses.push(BuilderUtils.buildNumericRangeClause(
          "DATEDIFF(d,C.start_date, C.end_date)", 
          criteria.VisitDetailLength as NumericRange)
        );
      }
    }

    // Age
    if (criteria.Age) {
      whereClauses.push(BuilderUtils.buildNumericRangeClause("YEAR(C.end_date) - P.year_of_birth", criteria.Age));
    }

    // Gender codeset
    if (criteria.GenderCS) {
      // Create direct SQL for concept set filtering
      whereClauses.push(`P.gender_concept_id IN (SELECT concept_id FROM #Codesets WHERE codeset_id = ${criteria.GenderCS})`);
    }

    // Provider specialty codeset
    if (criteria.ProviderSpecialtyCS) {
      // Create direct SQL for concept set filtering
      whereClauses.push(`PR.specialty_concept_id IN (SELECT concept_id FROM #Codesets WHERE codeset_id = ${criteria.ProviderSpecialtyCS})`);
    }

    // Place of service codeset
    if (criteria.PlaceOfServiceCS) {
      // Create direct SQL for concept set filtering
      whereClauses.push(`CS.place_of_service_concept_id IN (SELECT concept_id FROM #Codesets WHERE codeset_id = ${criteria.PlaceOfServiceCS})`);
    }

    return whereClauses;
  }

  /**
   * Adds location history join clauses for filtering by care site location region
   * @param joinClauses Array of join clauses to add to
   * @param codesetId Codeset ID for location region concepts
   */
  protected addFilteringByCareSiteLocationRegion(joinClauses: string[], codesetId: number): void {
    joinClauses.push(this.getLocationHistoryJoin("LH", "CARE_SITE", "C.care_site_id"));
    joinClauses.push("JOIN @cdm_database_schema.LOCATION LOC on LOC.location_id = LH.location_id");
    joinClauses.push(`JOIN #Codesets CS_LOC on LOC.region_concept_id = CS_LOC.concept_id and CS_LOC.codeset_id = ${codesetId}`);
  }

  /**
   * Creates a location history join clause
   * @param alias Alias for the location history table
   * @param domain Domain for the location history
   * @param entityIdField Entity ID field to join on
   * @returns SQL join clause
   */
  protected getLocationHistoryJoin(alias: string, domain: string, entityIdField: string): string {
    return `JOIN @cdm_database_schema.LOCATION_HISTORY ${alias} ` +
           `on ${alias}.entity_id = ${entityIdField} ` +
           `AND ${alias}.domain_id = '${domain}' ` +
           `AND C.visit_detail_start_date >= ${alias}.start_date ` +
           `AND C.visit_detail_end_date <= ISNULL(${alias}.end_date, DATEFROMPARTS(2099,12,31))`;
  }
}

export default VisitDetailSqlBuilder;