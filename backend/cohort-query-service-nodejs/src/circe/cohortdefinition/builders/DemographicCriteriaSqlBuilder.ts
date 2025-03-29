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

import { DemographicCriteria } from '../CohortExpression';
import { ResourceHelper } from '../../helper/ResourceHelper';
import { BuilderUtils } from './BuilderUtils';

/**
 * Builder for generating SQL for demographic criteria in a cohort definition
 */
export class DemographicCriteriaSqlBuilder {
  
  /**
   * Build SQL query for demographic criteria
   * @param criteria Demographic criteria to build SQL for
   * @param eventTable Event table to join with
   * @returns SQL query for demographic criteria
   */
  public getDemographicCriteriaQuery(criteria: DemographicCriteria, eventTable: string): string {
    try {
      // Get the template
      const demographicTemplate = ResourceHelper.GetResourceAsString("cohortdefinition/sql/demographicCriteria.sql");
      
      // Build the where clause
      const whereClauseComponents: string[] = [];
      
      // Age
      if (criteria.Age) {
        const ageClause = BuilderUtils.buildNumericRangeClause("YEAR(E.Start_date) - P.year_of_birth", criteria.Age);
        if (ageClause) {
          whereClauseComponents.push(ageClause);
        }
      }
      
      // Gender
      if (criteria.Gender && criteria.Gender.length > 0) {
        const genderCondition = criteria.GenderExclude ? "NOT" : "";
        whereClauseComponents.push(`${genderCondition} P.gender_concept_id in (${criteria.Gender.join(",")})`);
      }
      
      // Race
      if (criteria.Race && criteria.Race.length > 0) {
        const raceCondition = criteria.RaceExclude ? "NOT" : "";
        whereClauseComponents.push(`${raceCondition} P.race_concept_id in (${criteria.Race.join(",")})`);
      }
      
      // Ethnicity
      if (criteria.Ethnicity && criteria.Ethnicity.length > 0) {
        const ethnicityCondition = criteria.EthnicityExclude ? "NOT" : "";
        whereClauseComponents.push(`${ethnicityCondition} P.ethnicity_concept_id in (${criteria.Ethnicity.join(",")})`);
      }
      
      // If no demographic conditions were specified, return empty string
      if (whereClauseComponents.length === 0) {
        return "";
      }
      
      // Create the WHERE clause
      const whereClause = `WHERE ${whereClauseComponents.join(" AND ")}`;
      
      // Replace placeholders in the template
      let query = demographicTemplate.replace("@whereClause", whereClause);
      query = query.replace("@eventTable", eventTable);
      
      return query;
    } catch (error) {
      console.error('Error getting demographic criteria query:', error);
      return "";
    }
  }
}

export default DemographicCriteriaSqlBuilder;