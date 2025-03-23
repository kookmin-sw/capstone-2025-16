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
import { VisitOccurrence } from '../CohortExpression';
import BuilderUtils from './BuilderUtils';

/**
 * Interface for visit occurrence criteria that handles both camel and pascal case
 */
interface VisitOccurrenceCriteria extends VisitOccurrence {
  // Support both camelCase and PascalCase naming styles
  VisitType?: any[];
  visitType?: any[];
  VisitTypeExclude?: boolean;
  visitTypeExclude?: boolean;
  VisitTypeCS?: any;
  visitTypeCS?: any;
  ProviderSpecialty?: any[];
  providerSpecialty?: any[];
  ProviderSpecialtyCS?: any;
  providerSpecialtyCS?: any;
  PlaceOfService?: any[];
  placeOfService?: any[];
  PlaceOfServiceCS?: any;
  placeOfServiceCS?: any;
  PlaceOfServiceLocation?: number;
  placeOfServiceLocation?: number;
  VisitLength?: any;
  visitLength?: any;
  VisitSourceConcept?: number;
  visitSourceConcept?: number;
  Age?: any;
  age?: any;
  Gender?: any[];
  gender?: any[];
  GenderCS?: any;
  genderCS?: any;
  DateAdjustment?: any;
  dateAdjustment?: any;
  First?: boolean;
  first?: boolean;
  CodesetId?: number;
  codesetId?: number;
  OccurrenceStartDate?: any;
  occurrenceStartDate?: any;
  OccurrenceEndDate?: any;
  occurrenceEndDate?: any;
  // Add any additional properties needed
}

/**
 * SQL builder for visit occurrence criteria
 */
export class VisitOccurrenceSqlBuilder extends CriteriaSqlBuilder<VisitOccurrenceCriteria> {
  // Default columns specified in the template that don't need to be added as additional columns
  private readonly DEFAULT_COLUMNS = new Set<CriteriaColumn>([
    CriteriaColumn.START_DATE, 
    CriteriaColumn.END_DATE, 
    CriteriaColumn.VISIT_ID
  ]);

  // Default select columns that will always be returned from the subquery
  private readonly DEFAULT_SELECT_COLUMNS = [
    "vo.person_id", 
    "vo.visit_occurrence_id", 
    "vo.visit_concept_id"
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
    return ResourceHelper.GetResourceAsString("cohortdefinition/sql/visitOccurrence.sql");
  }

  /**
   * Gets the table column corresponding to a criteria column
   * @param column The criteria column to get
   * @returns The SQL column expression
   */
  protected getTableColumnForCriteriaColumn(column: CriteriaColumn): string {
    switch (column) {
      case CriteriaColumn.DOMAIN_CONCEPT:
        return "C.visit_concept_id";
      case CriteriaColumn.DURATION:
        return "DATEDIFF(d, C.start_date, C.end_date)";
      default:
        throw new Error(`Invalid CriteriaColumn for Visit Occurrence: ${column}`);
    }
  }

  /**
   * Embeds the codeset clause for concept filtering
   * @param query SQL query template
   * @param criteria Criteria with codeset information
   * @returns Modified query with codeset clause embedded
   */
  protected embedCodesetClause(query: string, criteria: VisitOccurrenceCriteria): string {
    // Support both PascalCase and camelCase
    const codesetId = criteria.CodesetId !== undefined ? criteria.CodesetId : 
                     (criteria.codesetId !== undefined ? criteria.codesetId : null);
    const visitSourceConcept = criteria.VisitSourceConcept || criteria.visitSourceConcept;

    // Create codeset clause
    let codesetClause = "";
    if (codesetId !== null) {
      if (visitSourceConcept) {
        // Join with both standard and source concepts (matching Java implementation)
        codesetClause = `JOIN #Codesets cs on (vo.visit_concept_id = cs.concept_id and cs.codeset_id = ${codesetId})
JOIN #Codesets cns on (vo.visit_source_concept_id = cns.concept_id and cns.codeset_id = ${visitSourceConcept})`;
      } else {
        // Standard concept join only
        codesetClause = `JOIN #Codesets cs on (vo.visit_concept_id = cs.concept_id and cs.codeset_id = ${codesetId})`;
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
  protected embedOrdinalExpression(query: string, criteria: VisitOccurrenceCriteria, whereClauses: string[]): string {
    // Support both PascalCase and camelCase
    const first = criteria.First !== undefined ? criteria.First : 
                 (criteria.first !== undefined ? criteria.first : false);

    if (first) {
      whereClauses.push("C.ordinal = 1");
      query = query.replace("@ordinalExpression", ", row_number() over (PARTITION BY vo.person_id ORDER BY vo.visit_start_date, vo.visit_occurrence_id) as ordinal");
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
  protected resolveSelectClauses(criteria: VisitOccurrenceCriteria): string[] {
    const selectCols = [...this.DEFAULT_SELECT_COLUMNS];

    // Support both PascalCase and camelCase
    const visitType = criteria.VisitType || criteria.visitType;
    const visitTypeCS = criteria.VisitTypeCS || criteria.visitTypeCS;
    const providerSpecialty = criteria.ProviderSpecialty || criteria.providerSpecialty;
    const providerSpecialtyCS = criteria.ProviderSpecialtyCS || criteria.providerSpecialtyCS;
    const placeOfService = criteria.PlaceOfService || criteria.placeOfService;
    const placeOfServiceCS = criteria.PlaceOfServiceCS || criteria.placeOfServiceCS;
    const dateAdjustment = criteria.DateAdjustment || criteria.dateAdjustment;

    // visitType
    if ((visitType && visitType.length > 0) || visitTypeCS) {
      selectCols.push("vo.visit_type_concept_id");
    }

    // providerSpecialty
    if ((providerSpecialty && providerSpecialty.length > 0) || providerSpecialtyCS) {
      selectCols.push("vo.provider_id");
    }

    // placeOfService
    if ((placeOfService && placeOfService.length > 0) || placeOfServiceCS) {
      selectCols.push("vo.care_site_id");
    }

    // dateAdjustment or default start/end dates
    if (dateAdjustment) {
      const startDateField = dateAdjustment.startWith === "START_DATE" ? 
        "vo.visit_start_date" : "vo.visit_end_date";
      
      const endDateField = dateAdjustment.endWith === "START_DATE" ? 
        "vo.visit_start_date" : "vo.visit_end_date";

      // Apply date adjustments for start date
      if (dateAdjustment.StartOffset !== undefined) {
        selectCols.push(`DATEADD(day, ${dateAdjustment.StartOffset}, ${startDateField}) as start_date`);
      } else {
        selectCols.push(`${startDateField} as start_date`);
      }
      
      // Apply date adjustments for end date
      if (dateAdjustment.EndOffset !== undefined) {
        selectCols.push(`DATEADD(day, ${dateAdjustment.EndOffset}, ${endDateField}) as end_date`);
      } else {
        selectCols.push(`${endDateField} as end_date`);
      }
    } else {
      selectCols.push("vo.visit_start_date as start_date, vo.visit_end_date as end_date");
    }

    return selectCols;
  }

  /**
   * Resolves join clauses for the criteria
   * @param criteria Criteria to get join clauses for
   * @returns Array of join clause expressions
   */
  protected resolveJoinClauses(criteria: VisitOccurrenceCriteria): string[] {
    const joinClauses: string[] = [];

    // Support both PascalCase and camelCase
    const age = criteria.Age || criteria.age;
    const gender = criteria.Gender || criteria.gender;
    const genderCS = criteria.GenderCS || criteria.genderCS;
    const placeOfService = criteria.PlaceOfService || criteria.placeOfService;
    const placeOfServiceCS = criteria.PlaceOfServiceCS || criteria.placeOfServiceCS;
    const placeOfServiceLocation = criteria.PlaceOfServiceLocation || criteria.placeOfServiceLocation;
    const providerSpecialty = criteria.ProviderSpecialty || criteria.providerSpecialty;
    const providerSpecialtyCS = criteria.ProviderSpecialtyCS || criteria.providerSpecialtyCS;

    // Join to PERSON if needed for age or gender criteria
    if (age || (gender && gender.length > 0) || genderCS) {
      joinClauses.push("JOIN @cdm_database_schema.PERSON P on C.person_id = P.person_id");
    }

    // Join to CARE_SITE if needed for place of service criteria
    if ((placeOfService && placeOfService.length > 0) || placeOfServiceCS || placeOfServiceLocation) {
      joinClauses.push("JOIN @cdm_database_schema.CARE_SITE CS on C.care_site_id = CS.care_site_id");
    }

    // Join to PROVIDER if needed for provider specialty criteria
    if ((providerSpecialty && providerSpecialty.length > 0) || providerSpecialtyCS) {
      joinClauses.push("LEFT JOIN @cdm_database_schema.PROVIDER PR on C.provider_id = PR.provider_id");
    }

    // Add location history join if needed for place of service location
    if (placeOfServiceLocation) {
      this.addFilteringByCareSiteLocationRegion(joinClauses, placeOfServiceLocation);
    }

    return joinClauses;
  }

  /**
   * Resolves where clauses for the criteria
   * @param criteria Criteria to get where clauses for
   * @returns Array of where clause expressions
   */
  protected resolveWhereClauses(criteria: VisitOccurrenceCriteria): string[] {
    const whereClauses = super.resolveWhereClauses(criteria);

    // Support both PascalCase and camelCase
    const occurrenceStartDate = criteria.OccurrenceStartDate || criteria.occurrenceStartDate;
    const occurrenceEndDate = criteria.OccurrenceEndDate || criteria.occurrenceEndDate;
    const visitType = criteria.VisitType || criteria.visitType;
    const visitTypeExclude = criteria.VisitTypeExclude !== undefined ? criteria.VisitTypeExclude : 
                           (criteria.visitTypeExclude !== undefined ? criteria.visitTypeExclude : false);
    const visitTypeCS = criteria.VisitTypeCS || criteria.visitTypeCS;
    const visitLength = criteria.VisitLength || criteria.visitLength;
    const age = criteria.Age || criteria.age;
    const gender = criteria.Gender || criteria.gender;
    const genderCS = criteria.GenderCS || criteria.genderCS;
    const providerSpecialty = criteria.ProviderSpecialty || criteria.providerSpecialty;
    const providerSpecialtyCS = criteria.ProviderSpecialtyCS || criteria.providerSpecialtyCS;
    const placeOfService = criteria.PlaceOfService || criteria.placeOfService;
    const placeOfServiceCS = criteria.PlaceOfServiceCS || criteria.placeOfServiceCS;

    // occurrenceStartDate
    if (occurrenceStartDate) {
      whereClauses.push(BuilderUtils.buildDateRangeClause("C.start_date", occurrenceStartDate));
    }

    // occurrenceEndDate
    if (occurrenceEndDate) {
      whereClauses.push(BuilderUtils.buildDateRangeClause("C.end_date", occurrenceEndDate));
    }

    // visitType
    if (visitType && visitType.length > 0) {
      const conceptIds = BuilderUtils.getConceptIdsFromConcepts(visitType);
      whereClauses.push(`C.visit_type_concept_id ${visitTypeExclude ? "not" : ""} in (${conceptIds.join(",")})`);
    }

    // visitTypeCS
    if (visitTypeCS) {
      whereClauses.push(BuilderUtils.getCodesetInExpression("C.visit_type_concept_id", visitTypeCS));
    }

    // visitLength
    if (visitLength) {
      whereClauses.push(BuilderUtils.buildNumericRangeClause("DATEDIFF(d,C.start_date, C.end_date)", visitLength));
    }

    // age
    if (age) {
      whereClauses.push(BuilderUtils.buildNumericRangeClause("YEAR(C.start_date) - P.year_of_birth", age));
    }

    // gender
    if (gender && gender.length > 0) {
      const conceptIds = BuilderUtils.getConceptIdsFromConcepts(gender);
      whereClauses.push(`P.gender_concept_id in (${conceptIds.join(",")})`);
    }

    // genderCS
    if (genderCS) {
      whereClauses.push(BuilderUtils.getCodesetInExpression("P.gender_concept_id", genderCS));
    }

    // providerSpecialty
    if (providerSpecialty && providerSpecialty.length > 0) {
      const conceptIds = BuilderUtils.getConceptIdsFromConcepts(providerSpecialty);
      whereClauses.push(`PR.specialty_concept_id in (${conceptIds.join(",")})`);
    }

    // providerSpecialtyCS
    if (providerSpecialtyCS) {
      whereClauses.push(BuilderUtils.getCodesetInExpression("PR.specialty_concept_id", providerSpecialtyCS));
    }

    // placeOfService
    if (placeOfService && placeOfService.length > 0) {
      const conceptIds = BuilderUtils.getConceptIdsFromConcepts(placeOfService);
      whereClauses.push(`CS.place_of_service_concept_id in (${conceptIds.join(",")})`);
    }

    // placeOfServiceCS
    if (placeOfServiceCS) {
      whereClauses.push(BuilderUtils.getCodesetInExpression("CS.place_of_service_concept_id", placeOfServiceCS));
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
    // Join to the codeset for location region concepts
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
           `AND C.visit_start_date >= ${alias}.start_date ` +
           `AND C.visit_end_date <= ISNULL(${alias}.end_date, DATEFROMPARTS(2099,12,31))`;
  }
}

export default VisitOccurrenceSqlBuilder;