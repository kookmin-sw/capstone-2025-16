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
import { SqlRender } from '../../../sqlrender';
import { DoseEra, NumericRange } from '../CohortExpression';
import { BuilderOptions, CriteriaColumn } from './BuilderOptions';
import BuilderUtils from './BuilderUtils';

/**
 * Interface for DoseEra criteria with both PascalCase and camelCase properties
 */
interface DoseEraCriteria extends DoseEra {
  // PascalCase (Java-style)
  CodesetId?: number;
  DoseValue?: NumericRange;
  UnitConceptId?: number;
  EraStartDate?: any;
  EraEndDate?: any;
  
  // camelCase (JavaScript-style)
  codesetId?: number;
  doseValue?: NumericRange;
  unitConceptId?: number;
  eraStartDate?: any;
  eraEndDate?: any;
}

/**
 * SQL builder for dose era criteria
 */
export class DoseEraSqlBuilder extends CriteriaSqlBuilder<DoseEraCriteria> {
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
    return ResourceHelper.GetResourceAsString("cohortdefinition/sql/doseEra.sql");
  }

  /**
   * Get the table column corresponding to a criteria column
   * @param column The criteria column to get
   * @returns The SQL column expression
   */
  protected getTableColumnForCriteriaColumn(column: CriteriaColumn): string {
    switch (column) {
      case CriteriaColumn.START_DATE:
        return "C.dose_era_start_date";
      case CriteriaColumn.END_DATE:
        return "C.dose_era_end_date";
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
  protected embedCodesetClause(query: string, criteria: DoseEraCriteria): string {
    const codesetId = criteria.CodesetId !== undefined ? criteria.CodesetId : 
                      (criteria.codesetId !== undefined ? criteria.codesetId : null);
                      
    if (codesetId !== null) {
      query = query.replace("@codesetId", String(codesetId));
    } else {
      query = query.replace("@codesetId", "null");
    }
    
    return query;
  }

  /**
   * Embed ordinal expression for ordering criteria
   * @param query SQL query template
   * @param criteria Criteria to get ordinal for
   * @param whereClauses Where clauses to potentially modify
   * @returns Modified query with ordinal expression embedded
   */
  protected embedOrdinalExpression(query: string, criteria: DoseEraCriteria, whereClauses: string[]): string {
    // Only use First from PascalCase (Java style)
    const first = criteria.First === true;
                 
    if (first) {
      query = query.replace("@ordinalExpression", ", row_number() over (partition by C.person_id order by C.dose_era_start_date asc) as ordinal");
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
  protected resolveSelectClauses(criteria: DoseEraCriteria): string[] {
    const selectClauses: string[] = [];
    selectClauses.push("C.person_id");
    selectClauses.push("C.dose_era_id");
    selectClauses.push("C.dose_era_start_date as start_date");
    selectClauses.push("C.dose_era_end_date as end_date");
    selectClauses.push("C.drug_concept_id");
    selectClauses.push("C.unit_concept_id");
    selectClauses.push("C.dose_value");
    
    return selectClauses;
  }
  
  /**
   * Resolve join clauses for the criteria
   * @param criteria Criteria to get join clauses for
   * @returns Array of join clause expressions
   */
  protected resolveJoinClauses(criteria: DoseEraCriteria): string[] {
    const joinClauses: string[] = [];
    
    const codesetId = criteria.CodesetId !== undefined ? criteria.CodesetId : 
                     (criteria.codesetId !== undefined ? criteria.codesetId : null);
                     
    if (codesetId !== null) {
      joinClauses.push(BuilderUtils.getCodesetJoinExpression("C.drug_concept_id", codesetId));
    }
    
    return joinClauses;
  }
  
  /**
   * Resolve where clauses for the criteria
   * @param criteria Criteria to get where clauses for
   * @returns Array of where clause expressions
   */
  protected resolveWhereClauses(criteria: DoseEraCriteria): string[] {
    const whereClauses: string[] = super.resolveWhereClauses(criteria);
    
    // Handle dose value
    if (criteria.DoseValue || criteria.doseValue) {
      const doseValue = criteria.DoseValue || criteria.doseValue;
      const doseClause = BuilderUtils.buildNumericRangeClause("C.dose_value", doseValue);
      if (doseClause) {
        whereClauses.push(doseClause);
      }
    }
    
    // Handle unit concept ID
    const unitConceptId = criteria.UnitConceptId !== undefined ? criteria.UnitConceptId : 
                          (criteria.unitConceptId !== undefined ? criteria.unitConceptId : null);
                          
    if (unitConceptId !== null) {
      whereClauses.push(`C.unit_concept_id = ${unitConceptId}`);
    }
    
    // Handle era start date
    if (criteria.EraStartDate || criteria.eraStartDate) {
      whereClauses.push(`C.dose_era_start_date = ${criteria.EraStartDate || criteria.eraStartDate}`);
    }
    
    // Handle era end date
    if (criteria.EraEndDate || criteria.eraEndDate) {
      whereClauses.push(`C.dose_era_end_date = ${criteria.EraEndDate || criteria.eraEndDate}`);
    }
    
    return whereClauses;
  }
}

export default DoseEraSqlBuilder;