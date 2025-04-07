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
import { Observation, NumericRange, TextFilter } from '../CohortExpression';
import { BuilderOptions, CriteriaColumn } from './BuilderOptions';
import BuilderUtils from './BuilderUtils';

/**
 * Interface for Observation criteria with both PascalCase and camelCase properties
 */
interface ObservationCriteria extends Observation {
  // PascalCase (Java-style)
  CodesetId?: number;
  ObservationType?: number[];
  ObservationTypeExclude?: boolean;
  ValueAsNumber?: NumericRange;
  ValueAsString?: TextFilter;
  ValueAsConcept?: number[];
  ValueAsConceptExclude?: boolean;
  Qualifier?: TextFilter;
  ObservationSourceConcept?: number;
  
  // camelCase (JavaScript-style)
  codesetId?: number;
  observationType?: number[];
  observationTypeExclude?: boolean;
  valueAsNumber?: NumericRange;
  valueAsString?: TextFilter;
  valueAsConcept?: number[];
  valueAsConceptExclude?: boolean;
  qualifier?: TextFilter;
  observationSourceConcept?: number;
}

/**
 * SQL builder for observation criteria
 */
export class ObservationSqlBuilder extends CriteriaSqlBuilder<ObservationCriteria> {
  
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
    return ResourceHelper.GetResourceAsString("cohortdefinition/sql/observation.sql");
  }

  /**
   * Get the table column corresponding to a criteria column
   * @param column The criteria column to get
   * @returns The SQL column expression
   */
  protected getTableColumnForCriteriaColumn(column: CriteriaColumn): string {
    switch (column) {
      case CriteriaColumn.START_DATE:
        return "C.observation_date";
      case CriteriaColumn.END_DATE:
        return "C.observation_date";
      case CriteriaColumn.PERSON_ID:
        return "C.person_id";
      case CriteriaColumn.VISIT_ID:
        return "C.visit_occurrence_id";
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
  protected embedCodesetClause(query: string, criteria: ObservationCriteria): string {
    const codesetId = criteria.CodesetId !== undefined ? criteria.CodesetId : 
                     (criteria.codesetId !== undefined ? criteria.codesetId : null);
    
    // Check for observation source concept 
    const observationSourceConcept = criteria.ObservationSourceConcept || 
                                    criteria.observationSourceConcept;
    
    let codesetClause = "";
    if (codesetId !== null) {
      if (observationSourceConcept) {
        // Join with both standard and source concepts (matching Java implementation)
        codesetClause = `JOIN #Codesets cs on (o.observation_concept_id = cs.concept_id and cs.codeset_id = ${codesetId})
JOIN #Codesets cns on (o.observation_source_concept_id = cns.concept_id and cns.codeset_id = ${observationSourceConcept})`;
      } else {
        // Standard concept join only
        codesetClause = `JOIN #Codesets cs on (o.observation_concept_id = cs.concept_id and cs.codeset_id = ${codesetId})`;
      }
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
  protected embedOrdinalExpression(query: string, criteria: ObservationCriteria, whereClauses: string[]): string {
    // Only use First from PascalCase (Java style)
    const first = criteria.First === true;
                 
    if (first) {
      query = query.replace("@ordinalExpression", ", row_number() over (partition by C.person_id order by C.observation_date asc) as ordinal");
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
  protected resolveSelectClauses(criteria: ObservationCriteria): string[] {
    const selectClauses: string[] = [];
    selectClauses.push("C.person_id");
    selectClauses.push("C.observation_id");
    selectClauses.push("C.observation_date as start_date");
    selectClauses.push("C.observation_date as end_date");
    selectClauses.push("C.observation_concept_id");
    selectClauses.push("C.visit_occurrence_id");
    selectClauses.push("C.value_as_number");
    selectClauses.push("C.value_as_string");
    selectClauses.push("C.value_as_concept_id");
    selectClauses.push("C.observation_type_concept_id");
    
    const sourceConcept = criteria.ObservationSourceConcept !== undefined ? criteria.ObservationSourceConcept : 
                        (criteria.observationSourceConcept !== undefined ? criteria.observationSourceConcept : null);
                        
    if (sourceConcept !== null) {
      selectClauses.push("C.observation_source_concept_id");
    }
    
    return selectClauses;
  }
  
  /**
   * Resolve join clauses for the criteria
   * @param criteria Criteria to get join clauses for
   * @returns Array of join clause expressions
   */
  protected resolveJoinClauses(criteria: ObservationCriteria): string[] {
    const joinClauses: string[] = [];
    
    // Person join for age and gender criteria
    const age = criteria.Age || criteria.age;
    const gender = criteria.Gender || criteria.gender;
    
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
  protected resolveWhereClauses(criteria: ObservationCriteria): string[] {
    const whereClauses: string[] = super.resolveWhereClauses(criteria);
    
    // Handle observation type
    const observationType = criteria.ObservationType || criteria.observationType;
    if (observationType && observationType.length > 0) {
      const observationTypeExclude = criteria.ObservationTypeExclude !== undefined ? 
                                    criteria.ObservationTypeExclude : 
                                    (criteria.observationTypeExclude !== undefined ? criteria.observationTypeExclude : false);
      
      // Convert array to comma-separated list
      const conceptIds = observationType.join(',');
      const operator = observationTypeExclude ? "NOT IN" : "IN";
      whereClauses.push(`C.observation_type_concept_id ${operator} (${conceptIds})`);
    }
    
    // Handle value as string
    if (criteria.ValueAsString || criteria.valueAsString) {
      const valueAsString = criteria.ValueAsString || criteria.valueAsString;
      const valueAsStringClause = BuilderUtils.buildTextFilterClause("C.value_as_string", valueAsString);
      if (valueAsStringClause) {
        whereClauses.push(valueAsStringClause);
      }
    }
    
    // Handle value as number
    if (criteria.ValueAsNumber || criteria.valueAsNumber) {
      const valueAsNumber = criteria.ValueAsNumber || criteria.valueAsNumber;
      const valueAsNumberClause = BuilderUtils.buildNumericRangeClause("C.value_as_number", valueAsNumber);
      if (valueAsNumberClause) {
        whereClauses.push(valueAsNumberClause);
      }
    }
    
    // Handle value as concept
    const valueAsConcept = criteria.ValueAsConcept || criteria.valueAsConcept;
    if (valueAsConcept && valueAsConcept.length > 0) {
      const valueAsConceptExclude = criteria.ValueAsConceptExclude !== undefined ? 
                                  criteria.ValueAsConceptExclude : 
                                  (criteria.valueAsConceptExclude !== undefined ? criteria.valueAsConceptExclude : false);
      
      // Convert array to comma-separated list
      const conceptIds = valueAsConcept.join(',');
      const operator = valueAsConceptExclude ? "NOT IN" : "IN";
      whereClauses.push(`C.value_as_concept_id ${operator} (${conceptIds})`);
    }
    
    // Handle qualifier text filter
    if (criteria.Qualifier || criteria.qualifier) {
      const qualifier = criteria.Qualifier || criteria.qualifier;
      const qualifierClause = BuilderUtils.buildTextFilterClause("C.qualifier_source_value", qualifier);
      if (qualifierClause) {
        whereClauses.push(qualifierClause);
      }
    }
    
    // Handle source concept
    const sourceConcept = criteria.ObservationSourceConcept !== undefined ? criteria.ObservationSourceConcept : 
                        (criteria.observationSourceConcept !== undefined ? criteria.observationSourceConcept : null);
                        
    if (sourceConcept !== null) {
      whereClauses.push(`C.observation_source_concept_id = ${sourceConcept}`);
    }
    
    return whereClauses;
  }
}

export default ObservationSqlBuilder;