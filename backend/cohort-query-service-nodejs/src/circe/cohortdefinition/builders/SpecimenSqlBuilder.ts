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
import { Specimen, TextFilter } from '../CohortExpression';
import { BuilderOptions } from './BuilderOptions';
import BuilderUtils from './BuilderUtils';

/**
 * Extended Specimen interface with optional concept set selections
 */
interface SpecimenWithConceptSets extends Specimen {
  // These don't exist in the base Specimen type, but might be used
  SpecimenTypeCS?: number;
  UnitCS?: number;
  AnatomicSiteCS?: number;
  DiseaseStatusCS?: number;
}

/**
 * SQL builder for specimen criteria
 */
export class SpecimenSqlBuilder extends CriteriaSqlBuilder<SpecimenWithConceptSets> {
  // Default columns specified in the template that don't need to be added as additional columns
  private readonly DEFAULT_COLUMNS = new Set<CriteriaColumn>([
    CriteriaColumn.START_DATE, 
    CriteriaColumn.END_DATE,
    CriteriaColumn.PERSON_ID,
    CriteriaColumn.VISIT_ID
  ]);

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
    return ResourceHelper.GetResourceAsString("cohortdefinition/sql/specimen.sql");
  }

  /**
   * Gets the table column corresponding to a criteria column
   * @param column The criteria column to get
   * @returns The SQL column expression
   */
  protected getTableColumnForCriteriaColumn(column: CriteriaColumn): string {
    switch (column) {
      case CriteriaColumn.DOMAIN_CONCEPT:
        return "C.specimen_concept_id";
      case CriteriaColumn.DURATION:
        return "CAST(1 as int)";
      case CriteriaColumn.START_DATE:
        return "C.specimen_date";
      case CriteriaColumn.END_DATE:
        return "C.specimen_date";
      case CriteriaColumn.PERSON_ID:
        return "C.person_id";
      case CriteriaColumn.VISIT_ID:
        return "C.visit_occurrence_id";
      default:
        throw new Error(`Invalid CriteriaColumn for Specimen: ${column}`);
    }
  }

  /**
   * Resolves the select clauses for the criteria
   * @param criteria Criteria to get select clauses for
   * @returns Array of select clause expressions
   */
  protected resolveSelectClauses(criteria: SpecimenWithConceptSets): string[] {
    const selectCols: string[] = [];
    
    selectCols.push("s.person_id");
    selectCols.push("s.specimen_id");
    selectCols.push("s.specimen_concept_id");
    selectCols.push("s.specimen_date as start_date");
    selectCols.push("s.specimen_date as end_date");
    selectCols.push("s.visit_occurrence_id");
    
    // Include additional fields if they're used in filtering
    if ((criteria.SpecimenType && criteria.SpecimenType.length > 0) || criteria.SpecimenTypeCS) {
      selectCols.push("s.specimen_type_concept_id");
    }
    
    if (criteria.Quantity) {
      selectCols.push("s.quantity");
    }
    
    if ((criteria.Unit && criteria.Unit.length > 0) || criteria.UnitCS) {
      selectCols.push("s.unit_concept_id");
    }
    
    if ((criteria.AnatomicSite && criteria.AnatomicSite.length > 0) || criteria.AnatomicSiteCS) {
      selectCols.push("s.anatomic_site_concept_id");
    }
    
    if ((criteria.DiseaseStatus && criteria.DiseaseStatus.length > 0) || criteria.DiseaseStatusCS) {
      selectCols.push("s.disease_status_concept_id");
    }
    
    if (criteria.SourceId) {
      selectCols.push("s.specimen_source_id");
    }
    
    return selectCols;
  }

  /**
   * Embeds the codeset clause for concept filtering
   * @param query SQL query template
   * @param criteria Criteria with codeset information
   * @returns Modified query with codeset clause embedded
   */
  protected embedCodesetClause(query: string, criteria: SpecimenWithConceptSets): string {
    const codesetId = criteria.CodesetId !== undefined ? criteria.CodesetId : null;
    
    let codesetClause = "";
    if (codesetId !== null) {
      codesetClause = `WHERE s.specimen_concept_id IN (SELECT concept_id FROM #Codesets WHERE codeset_id = ${codesetId})`;
      
      if (criteria.SpecimenSourceConcept) {
        codesetClause = `WHERE (s.specimen_concept_id IN (SELECT concept_id FROM #Codesets WHERE codeset_id = ${codesetId}) OR 
                            s.specimen_source_concept_id IN (SELECT concept_id FROM #Codesets WHERE codeset_id = ${codesetId}))`;
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
  protected embedOrdinalExpression(query: string, criteria: SpecimenWithConceptSets, whereClauses: string[]): string {
    if (criteria.First) {
      whereClauses.push("C.ordinal = 1");
      query = query.replace("@ordinalExpression", 
        ", row_number() over (PARTITION BY s.person_id ORDER BY s.specimen_date, s.specimen_id) as ordinal"
      );
    } else {
      query = query.replace("@ordinalExpression", "");
    }
    
    return query;
  }

  /**
   * Resolves join clauses for the criteria
   * @param criteria Criteria to get join clauses for
   * @returns Array of join clause expressions
   */
  protected resolveJoinClauses(criteria: SpecimenWithConceptSets): string[] {
    const joinClauses: string[] = [];

    // Join to PERSON if needed for age or gender criteria
    if (criteria.Age || 
       (criteria.Gender && criteria.Gender.length > 0) || 
       criteria.GenderCS) {
      joinClauses.push("JOIN @cdm_database_schema.PERSON P on C.person_id = P.person_id");
    }

    return joinClauses;
  }

  /**
   * Resolves where clauses for the criteria
   * @param criteria Criteria to get where clauses for
   * @returns Array of where clause expressions
   */
  protected resolveWhereClauses(criteria: SpecimenWithConceptSets): string[] {
    const whereClauses: string[] = super.resolveWhereClauses(criteria);

    // OccurrenceStartDate
    if (criteria.OccurrenceStartDate) {
      whereClauses.push(BuilderUtils.buildDateRangeClause("C.specimen_date", criteria.OccurrenceStartDate));
    }

    // SpecimenType
    if (criteria.SpecimenType && criteria.SpecimenType.length > 0) {
      const conceptIds = BuilderUtils.getConceptIdsFromConcepts(criteria.SpecimenType);
      if (conceptIds.length > 0) {
        whereClauses.push(`C.specimen_type_concept_id ${criteria.SpecimenTypeExclude ? "NOT" : ""} IN (${conceptIds.join(",")})`);
      }
    }

    // SpecimenTypeCS (as number, not ConceptSetSelection)
    if (criteria.SpecimenTypeCS) {
      whereClauses.push(`C.specimen_type_concept_id IN (SELECT concept_id FROM #Codesets WHERE codeset_id = ${criteria.SpecimenTypeCS})`);
    }

    // Quantity
    if (criteria.Quantity) {
      whereClauses.push(BuilderUtils.buildNumericRangeClause("C.quantity", criteria.Quantity));
    }

    // Unit
    if (criteria.Unit && criteria.Unit.length > 0) {
      const conceptIds = BuilderUtils.getConceptIdsFromConcepts(criteria.Unit);
      if (conceptIds.length > 0) {
        whereClauses.push(`C.unit_concept_id IN (${conceptIds.join(",")})`);
      }
    }

    // UnitCS (as number, not ConceptSetSelection)
    if (criteria.UnitCS) {
      whereClauses.push(`C.unit_concept_id IN (SELECT concept_id FROM #Codesets WHERE codeset_id = ${criteria.UnitCS})`);
    }

    // AnatomicSite
    if (criteria.AnatomicSite && criteria.AnatomicSite.length > 0) {
      const conceptIds = BuilderUtils.getConceptIdsFromConcepts(criteria.AnatomicSite);
      if (conceptIds.length > 0) {
        whereClauses.push(`C.anatomic_site_concept_id IN (${conceptIds.join(",")})`);
      }
    }

    // AnatomicSiteCS (as number, not ConceptSetSelection)
    if (criteria.AnatomicSiteCS) {
      whereClauses.push(`C.anatomic_site_concept_id IN (SELECT concept_id FROM #Codesets WHERE codeset_id = ${criteria.AnatomicSiteCS})`);
    }

    // DiseaseStatus
    if (criteria.DiseaseStatus && criteria.DiseaseStatus.length > 0) {
      const conceptIds = BuilderUtils.getConceptIdsFromConcepts(criteria.DiseaseStatus);
      if (conceptIds.length > 0) {
        whereClauses.push(`C.disease_status_concept_id IN (${conceptIds.join(",")})`);
      }
    }

    // DiseaseStatusCS (as number, not ConceptSetSelection)
    if (criteria.DiseaseStatusCS) {
      whereClauses.push(`C.disease_status_concept_id IN (SELECT concept_id FROM #Codesets WHERE codeset_id = ${criteria.DiseaseStatusCS})`);
    }

    // SourceId - this is a string so we need to create a TextFilter object
    if (criteria.SourceId) {
      const sourceIdFilter: TextFilter = new TextFilter();
      sourceIdFilter.Text = criteria.SourceId;
      sourceIdFilter.Op = "contains"; // Default to contains operation
      whereClauses.push(BuilderUtils.buildTextFilterClause("C.specimen_source_id", sourceIdFilter));
    }

    // Age
    if (criteria.Age) {
      whereClauses.push(BuilderUtils.buildNumericRangeClause("YEAR(C.specimen_date) - P.year_of_birth", criteria.Age));
    }

    // Gender
    if (criteria.Gender && criteria.Gender.length > 0) {
      const conceptIds = BuilderUtils.getConceptIdsFromConcepts(criteria.Gender);
      if (conceptIds.length > 0) {
        whereClauses.push(`P.gender_concept_id IN (${conceptIds.join(",")})`);
      }
    }

    // GenderCS
    if (criteria.GenderCS) {
      whereClauses.push(`P.gender_concept_id IN (SELECT concept_id FROM #Codesets WHERE codeset_id = ${criteria.GenderCS})`);
    }

    return whereClauses;
  }
}

export default SpecimenSqlBuilder;