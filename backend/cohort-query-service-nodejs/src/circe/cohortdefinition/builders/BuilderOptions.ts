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

/**
 * Represents a column in a criteria query that can be used in additional selections
 */
export class CriteriaColumn {
  static readonly START_DATE = new CriteriaColumn("start_date");
  static readonly END_DATE = new CriteriaColumn("end_date");
  static readonly VISIT_ID = new CriteriaColumn("visit_occurrence_id");
  static readonly PERSON_ID = new CriteriaColumn("person_id");
  static readonly DOMAIN_CONCEPT = new CriteriaColumn("domain_concept_id");
  static readonly DURATION = new CriteriaColumn("duration");
  
  private readonly name: string;
  
  constructor(name: string) {
    this.name = name;
  }
  
  public columnName(): string {
    return this.name;
  }
}

/**
 * Options for building SQL queries
 */
export class BuilderOptions {
  /**
   * Determines whether to include the source concept in the SQL query
   */
  public includeSourceConcept: boolean = false;
  
  /**
   * Additional columns to include in query results
   */
  public additionalColumns: Array<CriteriaColumn> = [];
  
  /**
   * CDM schema name
   */
  public cdmSchema: string = '';
  
  /**
   * Results schema name
   */
  public resultsSchema: string = '';
  
  /**
   * Vocabulary schema name
   */
  public vocabularySchema: string = '';
  
  /**
   * Whether to generate statistics
   */
  public generateStats: boolean = false;
  
  /**
   * Create a new instance of builder options
   */
  constructor() {
    this.includeSourceConcept = false;
    this.additionalColumns = [];
    this.cdmSchema = '';
    this.resultsSchema = '';
    this.vocabularySchema = '';
    this.generateStats = false;
  }
}

export default BuilderOptions;