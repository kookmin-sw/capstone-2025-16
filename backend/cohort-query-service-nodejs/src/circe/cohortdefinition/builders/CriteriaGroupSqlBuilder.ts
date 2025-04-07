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

import { CriteriaGroup, WindowedCriteria } from '../CohortExpression';
import { ResourceHelper } from '../../helper/ResourceHelper';
import { IGetCriteriaSqlDispatcher } from '../IGetCriteriaSqlDispatcher';
import { DemographicCriteriaSqlBuilder } from './DemographicCriteriaSqlBuilder';
import { WindowedCriteriaSqlBuilder } from './WindowedCriteriaSqlBuilder';

/**
 * Builder for generating SQL for criteria groups in a cohort definition
 */
export class CriteriaGroupSqlBuilder {
  
  /**
   * Dispatcher to delegate criteria SQL generation to appropriate builders
   */
  private criteriaSqlDispatcher: IGetCriteriaSqlDispatcher;
  
  /**
   * Builder for demographic criteria
   */
  private demographicCriteriaSqlBuilder: DemographicCriteriaSqlBuilder;
  
  /**
   * Builder for windowed criteria
   */
  private windowedCriteriaSqlBuilder: WindowedCriteriaSqlBuilder;
  
  /**
   * Constructor for CriteriaGroupSqlBuilder
   * @param criteriaSqlDispatcher Dispatcher to generate SQL for different criteria types
   */
  constructor(criteriaSqlDispatcher: IGetCriteriaSqlDispatcher) {
    this.criteriaSqlDispatcher = criteriaSqlDispatcher;
    this.demographicCriteriaSqlBuilder = new DemographicCriteriaSqlBuilder();
    this.windowedCriteriaSqlBuilder = new WindowedCriteriaSqlBuilder(criteriaSqlDispatcher);
  }
  
  /**
   * Get SQL for a criteria group
   * @param group Criteria group to generate SQL for
   * @param query Base query to use for event table (optional)
   * @returns SQL query for the criteria group
   */
  public getCriteriaGroupQuery(group: CriteriaGroup, query: string): string {
    if (!group || (!group.CriteriaList?.length && !group.Groups?.length && !group.DemographicCriteriaList?.length)) {
      return "";
    }
    
    try {
      // Start with wrapping the event query if provided, otherwise use the primary events table
      let eventTable = "#qualified_events";
      if (query && query.trim().length > 0) {
        const eventTableExpression = ResourceHelper.GetResourceAsString("cohortdefinition/sql/eventTableExpression.sql");
        const wrappedQuery = eventTableExpression.replace("@eventQuery", query);
        eventTable = `(${wrappedQuery})`;
      }
      
      // Collect criteria queries
      const criteriaQueries: string[] = [];
      
      // Process standard criteria
      if (group.CriteriaList && group.CriteriaList.length > 0) {
        for (const criteria of group.CriteriaList) {
          if ("Criteria" in criteria) { // WindowedCriteria
            // Process windowed criteria
            const windowedCriteria = criteria as WindowedCriteria;
            // Use the windowedCriteriaSqlBuilder for windowed criteria
            const windowedQuery = this.windowedCriteriaSqlBuilder.getWindowedCriteriaQuery(
              windowedCriteria, 
              eventTable
            );
            criteriaQueries.push(windowedQuery);
          } else {
            // Regular criteria
            const criteriaQuery = this.criteriaSqlDispatcher.getCriteriaSql(criteria);
            criteriaQueries.push(criteriaQuery);
          }
        }
      }
      
      // Process demographic criteria
      if (group.DemographicCriteriaList && group.DemographicCriteriaList.length > 0) {
        for (const demographicCriteria of group.DemographicCriteriaList) {
          const demoQuery = this.demographicCriteriaSqlBuilder.getDemographicCriteriaQuery(demographicCriteria, eventTable);
          if (demoQuery) {
            criteriaQueries.push(demoQuery);
          }
        }
      }
      
      // Process nested groups
      if (group.Groups && group.Groups.length > 0) {
        for (const nestedGroup of group.Groups) {
          const nestedQuery = this.getNestedCriteriaGroupQuery(nestedGroup, eventTable);
          if (nestedQuery) {
            criteriaQueries.push(nestedQuery);
          }
        }
      }
      
      // If no criteria were found, return empty string
      if (criteriaQueries.length === 0) {
        return "";
      }
      
      // Build the group query
      let groupQuery = ResourceHelper.GetResourceAsString("cohortdefinition/sql/groupQuery.sql");
      
      // Set join type based on group type
      const joinType = group.Type === "ALL" ? "INNER" : "LEFT";
      groupQuery = groupQuery.replace("@joinType", joinType);
      
      // Determine occurrence count clause
      let occurrenceClause = "";
      if (group.Type === "AT_LEAST" && group.Count > 0) {
        occurrenceClause = `HAVING COUNT(DISTINCT CQ.index_id) >= ${group.Count}`;
      } else if (group.Type === "AT_MOST" && group.Count > 0) {
        occurrenceClause = `HAVING COUNT(DISTINCT CQ.index_id) <= ${group.Count}`;
      } else if (group.Type === "ANY") {
        occurrenceClause = ""; // No special handling for ANY
      } else if (group.Type !== "ALL") {
        // Custom count for other types
        if (group.Count > 0) {
          occurrenceClause = `HAVING COUNT(DISTINCT CQ.index_id) ${group.Type} ${group.Count}`;
        }
      }
      
      groupQuery = groupQuery.replace("@occurrenceCountClause", occurrenceClause);
      
      // Set event table and criteria queries
      groupQuery = groupQuery.replace("@eventTable", eventTable);
      groupQuery = groupQuery.replace("@criteriaQueries", criteriaQueries.join("\nUNION ALL\n"));
      
      return groupQuery;
    } catch (error) {
      console.error('Error getting criteria group query:', error);
      return "";
    }
  }
  
  /**
   * Get SQL for a nested criteria group
   * @param group Nested criteria group
   * @param eventTable Event table name
   * @returns SQL query for the nested criteria group
   */
  private getNestedCriteriaGroupQuery(group: CriteriaGroup, eventTable: string): string {
    try {
      const criteriaQueries: string[] = [];
      
      // Process standard criteria
      if (group.CriteriaList && group.CriteriaList.length > 0) {
        for (const criteria of group.CriteriaList) {
          if ("Criteria" in criteria) { // WindowedCriteria
            const windowedCriteria = criteria as WindowedCriteria;
            // Use the windowedCriteriaSqlBuilder for windowed criteria
            const windowedQuery = this.windowedCriteriaSqlBuilder.getWindowedCriteriaQuery(
              windowedCriteria, 
              eventTable
            );
            criteriaQueries.push(windowedQuery);
          } else {
            const criteriaQuery = this.criteriaSqlDispatcher.getCriteriaSql(criteria);
            criteriaQueries.push(criteriaQuery);
          }
        }
      }
      
      // Process demographic criteria
      if (group.DemographicCriteriaList && group.DemographicCriteriaList.length > 0) {
        for (const demographicCriteria of group.DemographicCriteriaList) {
          const demoQuery = this.demographicCriteriaSqlBuilder.getDemographicCriteriaQuery(demographicCriteria, eventTable);
          if (demoQuery) {
            criteriaQueries.push(demoQuery);
          }
        }
      }
      
      // Process nested groups
      if (group.Groups && group.Groups.length > 0) {
        for (const nestedGroup of group.Groups) {
          const nestedQuery = this.getNestedCriteriaGroupQuery(nestedGroup, eventTable);
          if (nestedQuery) {
            criteriaQueries.push(nestedQuery);
          }
        }
      }
      
      // If no criteria were found, return empty string
      if (criteriaQueries.length === 0) {
        return "";
      }
      
      // Build the group query
      let groupQuery = ResourceHelper.GetResourceAsString("cohortdefinition/sql/groupQuery.sql");
      
      // Set join type based on group type
      const joinType = group.Type === "ALL" ? "INNER" : "LEFT";
      groupQuery = groupQuery.replace("@joinType", joinType);
      
      // Determine occurrence count clause
      let occurrenceClause = "";
      if (group.Type === "AT_LEAST" && group.Count > 0) {
        occurrenceClause = `HAVING COUNT(DISTINCT CQ.index_id) >= ${group.Count}`;
      } else if (group.Type === "AT_MOST" && group.Count > 0) {
        occurrenceClause = `HAVING COUNT(DISTINCT CQ.index_id) <= ${group.Count}`;
      } else if (group.Type === "ANY") {
        occurrenceClause = ""; // No special handling for ANY
      } else if (group.Type !== "ALL") {
        // Custom count for other types
        if (group.Count > 0) {
          occurrenceClause = `HAVING COUNT(DISTINCT CQ.index_id) ${group.Type} ${group.Count}`;
        }
      }
      
      groupQuery = groupQuery.replace("@occurrenceCountClause", occurrenceClause);
      
      // Set event table and criteria queries
      groupQuery = groupQuery.replace("@eventTable", eventTable);
      groupQuery = groupQuery.replace("@criteriaQueries", criteriaQueries.join("\nUNION ALL\n"));
      
      return groupQuery;
    } catch (error) {
      console.error('Error getting nested criteria group query:', error);
      return "";
    }
  }
}

export default CriteriaGroupSqlBuilder;