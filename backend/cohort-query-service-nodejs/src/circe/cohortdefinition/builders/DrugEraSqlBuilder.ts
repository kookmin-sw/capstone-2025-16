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
import { DrugEra, NumericRange } from '../CohortExpression';
import { BuilderOptions, CriteriaColumn } from './BuilderOptions';
import BuilderUtils from './BuilderUtils';

/**
 * Interface for DrugEra criteria with both PascalCase and camelCase properties
 */
interface DrugEraCriteria extends DrugEra {
  // PascalCase (Java-style)
  CodesetId?: number;
  EraLength?: NumericRange;
  OccurrenceCount?: NumericRange;
  GapDays?: NumericRange;
  
  // camelCase (JavaScript-style)
  codesetId?: number;
  eraLength?: NumericRange;
  occurrenceCount?: NumericRange;
  gapDays?: NumericRange;
}

/**
 * SQL builder for drug era criteria
 */
export class DrugEraSqlBuilder extends CriteriaSqlBuilder<DrugEraCriteria> {
  
  /**
   * Get default columns that don't need to be added as additional columns
   * @returns Set of default columns
   */
  protected getDefaultColumns(): Set<CriteriaColumn> {
    return new Set([
      CriteriaColumn.START_DATE,
      CriteriaColumn.END_DATE,
      CriteriaColumn.PERSON_ID
    ]);
  }

  /**
   * Get the SQL template for this criteria type
   * @returns SQL template string
   */
  protected getQueryTemplate(): string {
    return ResourceHelper.GetResourceAsString("cohortdefinition/sql/drugEra.sql");
  }

  /**
   * Get the table column corresponding to a criteria column
   * @param column The criteria column to get
   * @returns The SQL column expression
   */
  protected getTableColumnForCriteriaColumn(column: CriteriaColumn): string {
    switch (column) {
      case CriteriaColumn.START_DATE:
        return "C.drug_era_start_date";
      case CriteriaColumn.END_DATE:
        return "C.drug_era_end_date";
      case CriteriaColumn.PERSON_ID:
        return "C.person_id";
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
  protected embedCodesetClause(query: string, criteria: DrugEraCriteria): string {
    let codesetClause = "";
    
    // Support both camelCase and PascalCase property names
    const codesetId = criteria.CodesetId !== undefined ? criteria.CodesetId : 
                     (criteria.codesetId !== undefined ? criteria.codesetId : null);
                     
    if (codesetId !== null) {
      // Using the same format as the Java implementation
      codesetClause = `where de.drug_concept_id in (SELECT concept_id from #Codesets where codeset_id = ${codesetId})`;
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
  protected embedOrdinalExpression(query: string, criteria: DrugEraCriteria, whereClauses: string[]): string {
    // Only use First from PascalCase (Java style)
    const first = criteria.First === true;
                 
    if (first) {
      query = query.replace("@ordinalExpression", ", row_number() over (partition by C.person_id order by C.drug_era_start_date asc) as ordinal");
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
  protected resolveSelectClauses(criteria: DrugEraCriteria): string[] {
    const selectClauses: string[] = [];
    selectClauses.push("C.person_id");
    selectClauses.push("C.drug_era_id");
    selectClauses.push("C.drug_era_start_date as start_date");
    selectClauses.push("C.drug_era_end_date as end_date");
    selectClauses.push("C.drug_concept_id");
    selectClauses.push("C.drug_exposure_count");
    selectClauses.push("DATEDIFF(day, C.drug_era_start_date, C.drug_era_end_date) as era_length");
    selectClauses.push("C.gap_days");
    
    return selectClauses;
  }
  
  /**
   * Resolve join clauses for the criteria
   * @param criteria Criteria to get join clauses for
   * @returns Array of join clause expressions
   */
  protected resolveJoinClauses(criteria: DrugEraCriteria): string[] {
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
  protected resolveWhereClauses(criteria: DrugEraCriteria): string[] {
    const whereClauses: string[] = super.resolveWhereClauses(criteria);
    
    // Handle era length
    if (criteria.EraLength || criteria.eraLength) {
      const eraLength = criteria.EraLength || criteria.eraLength;
      const eraLengthClause = BuilderUtils.buildNumericRangeClause("DATEDIFF(day, C.drug_era_start_date, C.drug_era_end_date)", eraLength);
      if (eraLengthClause) {
        whereClauses.push(eraLengthClause);
      }
    }
    
    // Handle occurrence count
    if (criteria.OccurrenceCount || criteria.occurrenceCount) {
      const occurrenceCount = criteria.OccurrenceCount || criteria.occurrenceCount;
      const occurrenceCountClause = BuilderUtils.buildNumericRangeClause("C.drug_exposure_count", occurrenceCount);
      if (occurrenceCountClause) {
        whereClauses.push(occurrenceCountClause);
      }
    }
    
    // Handle gap days
    if (criteria.GapDays || criteria.gapDays) {
      const gapDays = criteria.GapDays || criteria.gapDays;
      const gapDaysClause = BuilderUtils.buildNumericRangeClause("C.gap_days", gapDays);
      if (gapDaysClause) {
        whereClauses.push(gapDaysClause);
      }
    }
    
    return whereClauses;
  }
}

export default DrugEraSqlBuilder;