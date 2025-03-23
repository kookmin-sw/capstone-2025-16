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

import { CohortExpression, PrimaryCriteria, Criteria } from '../CohortExpression';
import { ResourceHelper } from '../../helper/ResourceHelper';
import { IGetCriteriaSqlDispatcher } from '../IGetCriteriaSqlDispatcher';
import { BuilderOptions } from './BuilderOptions';

/**
 * Builder for generating SQL for primary criteria in a cohort definition
 */
export class PrimaryCriteriaSqlBuilder {
  
  /**
   * Dispatcher to delegate criteria SQL generation to appropriate builders
   */
  private criteriaSqlDispatcher: IGetCriteriaSqlDispatcher;
  
  /**
   * Constructor for PrimaryCriteriaSqlBuilder
   * @param criteriaSqlDispatcher Dispatcher to generate SQL for different criteria types
   */
  constructor(criteriaSqlDispatcher: IGetCriteriaSqlDispatcher) {
    this.criteriaSqlDispatcher = criteriaSqlDispatcher;
  }
  
  /**
   * Build SQL query for primary criteria
   * @param expression Cohort expression containing primary criteria
   * @returns SQL query for primary criteria
   */
  public buildPrimaryCriteriaQuery(expression: CohortExpression): string {
    let query = ResourceHelper.GetResourceAsString("cohortdefinition/sql/primaryEventsQuery.sql");
    
    try {
      // Ensure primary criteria and criteria list are initialized
      if (!expression.PrimaryCriteria) {
        console.log('Creating new PrimaryCriteria instance - PrimaryCriteria was undefined');
        expression.PrimaryCriteria = new PrimaryCriteria();
      }
      
      if (!expression.PrimaryCriteria.CriteriaList) {
        console.log('Initializing empty CriteriaList array - CriteriaList was undefined');
        expression.PrimaryCriteria.CriteriaList = [];
      }
      
      // Build criteria queries for each criteria in the primary criteria list
      const criteriaQueries: string[] = [];
      for (const criteria of expression.PrimaryCriteria.CriteriaList) {
        if (!criteria) {
          console.warn('Skipping null/undefined criteria in PrimaryCriteria.CriteriaList');
          continue;
        }
        
        // Handle domain-specific variants like ConditionEra or ConditionOccurrence
        let processedCriteria = criteria;
        
        if (criteria.ConditionEra) {
          console.log('Found ConditionEra criteria');
          // PascalCase로 통일하되 필수 속성만 사용
          processedCriteria = {
            CriteriaType: 'ConditionEra',
            Domain: 'condition',
            CodesetId: criteria.ConditionEra.CodesetId,
            CriteriaName: 'Condition Era'
          };
        } else if (criteria.ConditionOccurrence) {
          console.log('Found ConditionOccurrence criteria');
          // PascalCase로 통일하되 필수 속성만 사용
          processedCriteria = {
            CriteriaType: 'ConditionOccurrence', 
            Domain: 'condition',
            CodesetId: criteria.ConditionOccurrence.CodesetId,
            CriteriaName: 'Condition Occurrence'
          };
        } else if (criteria.DrugExposure) {
          console.log('Found DrugExposure criteria');
          // PascalCase로 통일하되 필수 속성만 사용
          processedCriteria = {
            CriteriaType: 'DrugExposure',
            Domain: 'drug',
            CodesetId: criteria.DrugExposure.CodesetId,
            CriteriaName: 'Drug Exposure'
          };
        } else if (criteria.DrugEra) {
          console.log('Found DrugEra criteria');
          // PascalCase로 통일하되 필수 속성만 사용
          processedCriteria = {
            CriteriaType: 'DrugEra',
            Domain: 'drug',
            CodesetId: criteria.DrugEra.CodesetId,
            CriteriaName: 'Drug Era'
          };
        }
        
        criteriaQueries.push(this.criteriaSqlDispatcher.getCriteriaSql(processedCriteria));
      }
      
      // Replace criteria queries placeholder with the union of all criteria queries
      // If criteriaQueries is empty, provide a default "select 0" to avoid SQL errors
      const queriesText = criteriaQueries.length > 0 
        ? criteriaQueries.join("\nUNION ALL\n")
        : "SELECT 0 as criterion_id, 0 as person_id, CAST(NULL AS TIMESTAMP) as start_date, CAST(NULL AS TIMESTAMP) as end_date, 0 as sort_order";
      
      query = query.replace("@criteriaQueries", queriesText);
      
      // Build primary events filter based on observation window
      const observationWindow = expression.PrimaryCriteria.ObservationWindow || {Start: {Value: 0}, End: {Value: 0}};
      // Determine prior days, looking at potential structure variations
      let priorDays = observationWindow.Start?.Value || 0;
      
      // Determine post days, looking at potential structure variations
      let postDays = observationWindow.End?.Value || 0;
      
      const primaryEventsFilters = [
        `DATEADD(day,${priorDays},OP.OBSERVATION_PERIOD_START_DATE) <= E.START_DATE AND DATEADD(day,${postDays},E.START_DATE) <= OP.OBSERVATION_PERIOD_END_DATE`
      ];
      
      // Replace primary events filter placeholder with the AND-joined filters
      query = query.replace("@primaryEventsFilter", primaryEventsFilters.join(" AND "));
      
      // Set sorting order based on primary limit type (FIRST vs LAST) - default to ASC (FIRST)
      const primaryLimit = expression.PrimaryCriteria.PrimaryCriteriaLimit || { Type: 0 };
      const sortDirection = (primaryLimit.Type === 1) // 1 = LAST
                          ? "DESC" : "ASC";
      query = query.replace("@EventSort", sortDirection);
      
      // Apply primary limit if needed
      const primaryLimitType = primaryLimit.Type || 0; // 0 = ALL
      if (primaryLimitType !== 0) {
        query = query.replace("@primaryEventLimit", "WHERE P.ordinal = 1");
      } else {
        query = query.replace("@primaryEventLimit", "");
      }
      
      return query;
    } catch (error) {
      console.error('Error in buildPrimaryCriteriaQuery:', error);
      // Provide a fallback query that won't break SQL execution
      query = query.replace("@criteriaQueries", 
        "SELECT 0 as criterion_id, 0 as person_id, CAST(NULL AS TIMESTAMP) as start_date, CAST(NULL AS TIMESTAMP) as end_date, 0 as sort_order");
      query = query.replace("@primaryEventsFilter", "1=1");
      query = query.replace("@EventSort", "ASC");
      query = query.replace("@primaryEventLimit", "");
      return query;
    }
  }
}

export default PrimaryCriteriaSqlBuilder;