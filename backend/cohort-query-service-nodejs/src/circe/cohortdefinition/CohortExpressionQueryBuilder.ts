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

import { 
  CohortExpression, 
  PrimaryCriteria,
  CorelatedCriteria, 
  CriteriaGroup, 
  WindowedCriteria,
  Criteria,
  DemographicCriteria, 
  NumericRange,
  Window
} from './CohortExpression';
import ConceptSet from './ConceptSet';
import { ConceptSetExpressionQueryBuilder } from '../vocabulary/ConceptSetExpressionQueryBuilder';
import { ResourceHelper } from '../helper/ResourceHelper';
import { SqlRender } from '../../sqlrender';
import { IGetEndStrategySqlDispatcher } from './IGetEndStrategySqlDispatcher';
import { IGetCriteriaSqlDispatcher } from './IGetCriteriaSqlDispatcher';
import { BuilderOptions } from './builders/BuilderOptions';
import { CriteriaSqlBuilder } from './builders/CriteriaSqlBuilder';
import { ConditionOccurrenceSqlBuilder } from './builders/ConditionOccurrenceSqlBuilder';
import { ConditionEraSqlBuilder } from './builders/ConditionEraSqlBuilder';
import { DeathSqlBuilder } from './builders/DeathSqlBuilder';
import { DeviceExposureSqlBuilder } from './builders/DeviceExposureSqlBuilder';
import { DoseEraSqlBuilder } from './builders/DoseEraSqlBuilder';
import { DrugExposureSqlBuilder } from './builders/DrugExposureSqlBuilder';
import { DrugEraSqlBuilder } from './builders/DrugEraSqlBuilder';
import { LocationRegionSqlBuilder } from './builders/LocationRegionSqlBuilder';
import { MeasurementSqlBuilder } from './builders/MeasurementSqlBuilder';
import { ObservationPeriodSqlBuilder } from './builders/ObservationPeriodSqlBuilder';
import { ObservationSqlBuilder } from './builders/ObservationSqlBuilder';
import { PayerPlanPeriodSqlBuilder } from './builders/PayerPlanPeriodSqlBuilder';
import { ProcedureOccurrenceSqlBuilder } from './builders/ProcedureOccurrenceSqlBuilder';
import { SpecimenSqlBuilder } from './builders/SpecimenSqlBuilder';
import { VisitDetailSqlBuilder } from './builders/VisitDetailSqlBuilder';
import { VisitOccurrenceSqlBuilder } from './builders/VisitOccurrenceSqlBuilder';
import { PrimaryCriteriaSqlBuilder } from './builders/PrimaryCriteriaSqlBuilder';
import { CriteriaGroupSqlBuilder } from './builders/CriteriaGroupSqlBuilder';
import { DemographicCriteriaSqlBuilder } from './builders/DemographicCriteriaSqlBuilder';
import { WindowedCriteriaSqlBuilder } from './builders/WindowedCriteriaSqlBuilder';
import { CriteriaColumn } from './builders/BuilderOptions';

export interface AdditionalCriteriaStats {
  createdAt: Date;
  covariateId: number;
  covariateCount: number;
  exclusionCount: number;
  inclusionCount: number;
}

export class CohortExpressionQueryBuilder implements IGetEndStrategySqlDispatcher, IGetCriteriaSqlDispatcher {
  private readonly builderOptions: BuilderOptions;
  private readonly DEFAULT_QUERY_SCHEMA = "CDM_Schema";
  private readonly TEMP_TABLE_PREFIX = "#";
  
  // SQL builders for different criteria types
  private readonly conditionOccurrenceSqlBuilder = new ConditionOccurrenceSqlBuilder();
  private readonly conditionEraSqlBuilder = new ConditionEraSqlBuilder();
  private readonly deathSqlBuilder = new DeathSqlBuilder();
  private readonly deviceExposureSqlBuilder = new DeviceExposureSqlBuilder();
  private readonly doseEraSqlBuilder = new DoseEraSqlBuilder();
  private readonly drugExposureSqlBuilder = new DrugExposureSqlBuilder();
  private readonly drugEraSqlBuilder = new DrugEraSqlBuilder();
  private readonly locationRegionSqlBuilder = new LocationRegionSqlBuilder();
  private readonly measurementSqlBuilder = new MeasurementSqlBuilder();
  private readonly observationPeriodSqlBuilder = new ObservationPeriodSqlBuilder();
  private readonly observationSqlBuilder = new ObservationSqlBuilder();
  private readonly payerPlanPeriodSqlBuilder = new PayerPlanPeriodSqlBuilder();
  private readonly procedureOccurrenceSqlBuilder = new ProcedureOccurrenceSqlBuilder();
  private readonly specimenSqlBuilder = new SpecimenSqlBuilder();
  private readonly visitDetailSqlBuilder = new VisitDetailSqlBuilder();
  private readonly visitOccurrenceSqlBuilder = new VisitOccurrenceSqlBuilder();
  
  // Complex criteria builders
  private readonly primaryCriteriaSqlBuilder;
  private readonly criteriaGroupSqlBuilder;
  private readonly demographicCriteriaSqlBuilder = new DemographicCriteriaSqlBuilder();
  private readonly windowedCriteriaSqlBuilder;
  
  constructor(options?: BuilderOptions) {
    this.builderOptions = options || new BuilderOptions();
    
    // Initialize complex criteria builders that need access to this instance
    this.windowedCriteriaSqlBuilder = new WindowedCriteriaSqlBuilder(this);
    this.primaryCriteriaSqlBuilder = new PrimaryCriteriaSqlBuilder(this);
    this.criteriaGroupSqlBuilder = new CriteriaGroupSqlBuilder(this);
  }
  
  /**
   * Generic method to get criteria SQL using a specific builder
   * @param builder The SQL builder to use
   * @param criteria The criteria to build SQL for
   * @param options Optional builder options
   * @returns SQL string for the criteria
   */
  protected getCriteriaSqlFromBuilder<T extends Criteria>(builder: CriteriaSqlBuilder<T>, criteria: T, options?: BuilderOptions): string {
    const query = builder.getCriteriaSql(criteria, options);
    return this.processCorrelatedCriteria(query, criteria);
  }
  
  /**
   * Process correlated criteria for the given criteria
   * @param query The base SQL query
   * @param criteria The criteria with potential correlated criteria
   * @returns Modified SQL query with correlated criteria
   */
  protected processCorrelatedCriteria(query: string, criteria: Criteria): string {
    if (criteria.CorrelatedCriteria && !this.isEmptyCriteriaGroup(criteria.CorrelatedCriteria)) {
      query = this.wrapCriteriaQuery(query, criteria.CorrelatedCriteria);
    }
    return query;
  }
  
  /**
   * Checks if a criteria group is empty
   * @param group The criteria group to check
   * @returns True if the group is empty, false otherwise
   */
  private isEmptyCriteriaGroup(group: CriteriaGroup): boolean {
    return !group || 
           (!group.CriteriaList?.length && 
            !group.Groups?.length && 
            !group.DemographicCriteriaList?.length);
  }
  
  /**
   * Wraps a query with additional criteria
   * @param query The query to wrap
   * @param group The criteria group for additional criteria
   * @returns Wrapped query with additional criteria
   */
  private wrapCriteriaQuery(query: string, group: CriteriaGroup): string {
    // Get the event table expression template
    const eventTableExpression = ResourceHelper.GetResourceAsString("cohortdefinition/sql/eventTableExpression.sql");
    
    // Replace the event query placeholder
    const wrappedEventQuery = eventTableExpression.replace("@eventQuery", query);
    
    // Get the criteria group query with the wrapped event query
    let groupQuery = this.getCriteriaGroupQuery(group, `(${wrappedEventQuery})`);
    
    // Replace the index ID placeholder
    groupQuery = groupQuery.replace("@indexId", "0");
    
    // Construct the final wrapped query with join to additional criteria
    const finalQuery = `select PE.person_id, PE.event_id, PE.start_date, PE.end_date, PE.visit_occurrence_id, PE.sort_date FROM (\n${query}\n) PE\nJOIN (\n${groupQuery}) AC on AC.person_id = pe.person_id and AC.event_id = pe.event_id\n`;
    
    return finalQuery;
  }

  public buildExpressionQuery(expression: CohortExpression, options: any = {}): string {
    let query = "";
    
    try {
      console.log("Starting to build cohort expression query...");
      
      // Validate expression
      if (!expression) {
        throw new Error("Expression is null or undefined");
      }
      
      console.log("Expression contains:", 
        `${expression.ConceptSets?.length || 0} concept sets, `,
        `${expression.InclusionRules?.length || 0} inclusion rules, `,
        `${expression.PrimaryCriteria?.CriteriaList?.length || 0} primary criteria`);
      
      // Initialize result with generateCohort template
      query = ResourceHelper.GetResourceAsString("cohortdefinition/sql/generateCohort.sql");
      console.log("Loaded generateCohort.sql template");
      
      // Get codeset queries
      let codesetQuery = "";
      if (expression.ConceptSets && expression.ConceptSets.length > 0) {
        // Build a complete codeset query with all concept sets
        console.log(`Building codeset query for ${expression.ConceptSets.length} concept sets`);
        codesetQuery = this.getCodesetQuery(expression.ConceptSets);
        console.log(`Codeset query generated, length: ${codesetQuery.length}`);
      } else {
        console.log("No concept sets found in expression");
      }
      
      // Get primary events query
      console.log("Building primary criteria query...");
      const primaryQuery = this.buildPrimaryCriteriaQuery(expression);
      console.log(`Primary query generated, length: ${primaryQuery.length}`);
      
      // Set initial parameters for rendering
      const paramNames = [
        "codesetQuery",           // SQL fragment for concept sets
        "primaryEventsQuery",     // SQL fragment for primary events
        "cohort_id_field_name",   // Field name for cohort ID
        "target_cohort_id",       // Target cohort ID
        "eraconstructorpad",      // Era constructor pad
        "generateStats"           // Whether to generate stats
      ];
      
      const paramValues = [
        codesetQuery,                                 // Concept sets SQL
        primaryQuery,                                 // Primary events SQL
        options.cohortIdFieldName || "cohort_definition_id", // Default ID field name
        String(options.targetId || 0),                // Default target cohort ID
        String(expression.CollapseSettings?.EraPad || 0),  // Default era pad
        options.generateStats ? "1" : "0"              // Generate stats param
      ];
      
      // Render the query with basic parameters
      query = SqlRender.renderSql(query, paramNames, paramValues);
      
      // Apply qualified event sort based on qualified limit
      query = query.replace("@QualifiedEventSort", 
        (expression.QualifiedLimit?.Type === 1) // 1 = LAST
          ? "DESC" : "ASC");
      
      // Apply qualified limit filter if additional criteria exists and not ALL (0 = ALL)
      if (expression.AdditionalCriteria && 
          expression.QualifiedLimit && 
          expression.QualifiedLimit.Type !== 0) {
        query = query.replace("@QualifiedLimitFilter", "WHERE QE.ordinal = 1");
      } else {
        query = query.replace("@QualifiedLimitFilter", "");
      }
      
      // Additional criteria
      if (expression.AdditionalCriteria) {
        if (expression.AdditionalCriteria.CriteriaList?.length > 0 || 
            expression.AdditionalCriteria.Groups?.length > 0 || 
            expression.AdditionalCriteria.DemographicCriteriaList?.length > 0) {
          query = this.buildAdditionalCriteria(query, expression.AdditionalCriteria);
        } else {
          query = query.replace("@additionalCriteriaQuery", "");
        }
      } else {
        query = query.replace("@additionalCriteriaQuery", "");
      }
      
      // Inclusion rules
      if (expression.InclusionRules && expression.InclusionRules.length > 0) {
        query = this.buildInclusionRules(query, expression, options);
      } else {
        query = this.buildInclusionRules(query, expression, options);
      }
      
      // Apply included event sort based on expression limit
      query = query.replace("@IncludedEventSort", 
        (expression.ExpressionLimit?.Type === 1) // 1 = LAST
          ? "DESC" : "ASC");
      
      // Apply result limit filter based on expression limit
      if (expression.ExpressionLimit?.Type !== 0) { // 0 = ALL
        query = query.replace("@ResultLimitFilter", "WHERE Results.ordinal = 1");
      } else {
        query = query.replace("@ResultLimitFilter", "");
      }
      
      // Add rule total
      query = query.replace("@ruleTotal", String(expression.InclusionRules?.length || 0));
      
      // Add end strategy and censoring
      if (expression.EndStrategy) {
        query = query.replace("@strategy_ends_temp_tables", 
          this.getEndStrategySql(expression.EndStrategy));
        query = query.replace("@strategy_ends_cleanup", 
          "TRUNCATE TABLE #strategy_ends;\nDROP TABLE #strategy_ends;\n");
      } else {
        query = query.replace("@strategy_ends_temp_tables", "");
        query = query.replace("@strategy_ends_cleanup", "");
      }
      
      // Apply censoring criteria if defined
      if (expression.CensoringCriteria && expression.CensoringCriteria.length > 0) {
        query = this.buildCensoringEvents(query, expression);
      } else {
        query = query.replace("@cohort_end_unions", "");
      }
      
      // Apply collapse settings
      if (expression.CollapseSettings && expression.CollapseSettings.CollapseType !== "NONE") {
        query = this.buildCollapseConstructs(query, expression);
      }
      
      // Finalize the query
      query = this.finalizeCohortQuery(query, expression);
      
      // Set DB schema and table names
      query = query.replace(/@target_database_schema/g, options.resultSchema || "");
      query = query.replace(/@target_cohort_table/g, options.targetTable || "cohort");
      query = query.replace(/@results_database_schema/g, options.resultSchema || "");
      query = query.replace(/@cdm_database_schema/g, options.cdmSchema || "");
      query = query.replace(/@vocabulary_database_schema/g, options.vocabularySchema || options.cdmSchema || "");
      
      // Replace cohort_id_field_name if not already done
      query = query.replace(/@cohort_id_field_name/g, options.cohortIdFieldName || "cohort_definition_id");
      
      return query;
    } catch (error) {
      console.error("Error building expression query:", error);
      throw error;
    }
  }
  
  public getEndStrategySql(strategy: any): string {
    // Implementation of IGetEndStrategySqlDispatcher
    // Add more implementations as needed
    if (strategy.dateField) {
      return `${strategy.dateField} + ${strategy.offset || 0}`;
    } else if (strategy.customEra) {
      const customEraSql = ResourceHelper.GetResourceAsString("cohortdefinition/sql/customEraStrategy.sql");
      return SqlRender.renderSql(customEraSql, ["drugCodesetId", "gapDays", "offset"], 
        [strategy.drugCodesetId, strategy.gapDays, strategy.offset]);
    }
    
    throw new Error("Unsupported end strategy");
  }
  
  public getCriteriaSql(criteria: any): string {
    // Implementation of IGetCriteriaSqlDispatcher
    if (!criteria) {
      console.error("Null criteria passed to getCriteriaSql");
      throw new Error("Invalid criteria: criteria object is null");
    }
    
    // Try to infer CriteriaType if not provided
    if (!criteria.CriteriaType) {
      console.warn("Missing CriteriaType in criteria:", JSON.stringify(criteria, null, 2));
      
      // Look for domain-specific nested objects to infer type
      if (criteria.ConditionOccurrence) {
        console.log("Inferred ConditionOccurrence from nested object");
        criteria = {
          CriteriaType: "ConditionOccurrence", 
          Domain: "condition",
          CriteriaName: "Condition Occurrence"
        };
      } else if (criteria.ConditionEra) {
        console.log("Inferred ConditionEra from nested object");
        criteria = { 
          CriteriaType: "ConditionEra", 
          Domain: "condition",
          CriteriaName: "Condition Era"
        };
      } else if (criteria.DrugExposure) {
        console.log("Inferred DrugExposure from nested object");
        criteria = { 
          CriteriaType: "DrugExposure", 
          Domain: "drug",
          CriteriaName: "Drug Exposure"
        };
      } else if (criteria.DrugEra) {
        console.log("Inferred DrugEra from nested object");
        criteria = { 
          CriteriaType: "DrugEra", 
          Domain: "drug",
          CriteriaName: "Drug Era"
        };
      } else {
        throw new Error("Invalid criteria: CriteriaType is required and could not be inferred");
      }
    }
    
    try {
      // Use PascalCase for CriteriaType
      switch (criteria.CriteriaType) {
        case "ConditionOccurrence": 
          return this.getConditionOccurrenceSql(criteria);
        case "ConditionEra":
          return this.getConditionEraSql(criteria);
        case "DrugExposure":
          return this.getDrugExposureSql(criteria);
        case "DrugEra":
          return this.getDrugEraSql(criteria);
        case "DoseEra":
          return this.getDoseEraSql(criteria);
        case "ProcedureOccurrence":
          return this.getProcedureOccurrenceSql(criteria);
        case "DeviceExposure":
          return this.getDeviceExposureSql(criteria);
        case "Measurement":
          return this.getMeasurementSql(criteria);
        case "Observation":
          return this.getObservationSql(criteria);
        case "Death":
          return this.getDeathSql(criteria);
        case "ObservationPeriod":
          return this.getObservationPeriodSql(criteria);
        case "VisitOccurrence":
          return this.getVisitOccurrenceSql(criteria);
        case "VisitDetail":
          return this.getVisitDetailSql(criteria);
        case "Specimen":
          return this.getSpecimenSql(criteria);
        case "PayerPlanPeriod":
          return this.getPayerPlanPeriodSql(criteria);
        case "LocationRegion":
          return this.getLocationRegionSql(criteria);
        case "DemographicCriteria":
          // This is handled separately through getDemographicCriteriaQuery
          throw new Error("Demographic criteria should be handled via getDemographicCriteriaQuery");
        default:
          throw new Error(`Unsupported criteria type: ${criteria.CriteriaType}`);
      }
    } catch (error) {
      console.error(`Error getting SQL for criteria type ${criteria.CriteriaType}:`, error);
      throw error;
    }
  }
  
  private getConditionOccurrenceSql(criteria: any): string {
    try {
      // Use the SQL builder to generate the SQL
      return this.getCriteriaSqlFromBuilder(this.conditionOccurrenceSqlBuilder, criteria, this.builderOptions);
    } catch (error) {
      console.error("Error getting ConditionOccurrence SQL:", error);
      throw error;
    }
  }
  
  private getConditionEraSql(criteria: any): string {
    try {
      // Use the SQL builder to generate the SQL
      return this.getCriteriaSqlFromBuilder(this.conditionEraSqlBuilder, criteria, this.builderOptions);
    } catch (error) {
      console.error("Error getting ConditionEra SQL:", error);
      throw error;
    }
  }
  
  private getDrugExposureSql(criteria: any): string {
    try {
      // Use the SQL builder to generate the SQL
      return this.getCriteriaSqlFromBuilder(this.drugExposureSqlBuilder, criteria, this.builderOptions);
    } catch (error) {
      console.error("Error getting DrugExposure SQL:", error);
      throw error;
    }
  }
  
  private getDrugEraSql(criteria: any): string {
    try {
      // Use the SQL builder to generate the SQL
      return this.getCriteriaSqlFromBuilder(this.drugEraSqlBuilder, criteria, this.builderOptions);
    } catch (error) {
      console.error("Error getting DrugEra SQL:", error);
      throw error;
    }
  }
  
  private getDoseEraSql(criteria: any): string {
    try {
      // Use the SQL builder to generate the SQL
      return this.getCriteriaSqlFromBuilder(this.doseEraSqlBuilder, criteria, this.builderOptions);
    } catch (error) {
      console.error("Error getting DoseEra SQL:", error);
      throw error;
    }
  }
  
  private getProcedureOccurrenceSql(criteria: any): string {
    try {
      // Use the SQL builder to generate the SQL
      return this.getCriteriaSqlFromBuilder(this.procedureOccurrenceSqlBuilder, criteria, this.builderOptions);
    } catch (error) {
      console.error("Error getting ProcedureOccurrence SQL:", error);
      throw error;
    }
  }
  
  private getDeviceExposureSql(criteria: any): string {
    try {
      // Use the SQL builder to generate the SQL
      return this.getCriteriaSqlFromBuilder(this.deviceExposureSqlBuilder, criteria, this.builderOptions);
    } catch (error) {
      console.error("Error getting DeviceExposure SQL:", error);
      throw error;
    }
  }
  
  private getMeasurementSql(criteria: any): string {
    try {
      // Use the SQL builder to generate the SQL
      return this.getCriteriaSqlFromBuilder(this.measurementSqlBuilder, criteria, this.builderOptions);
    } catch (error) {
      console.error("Error getting Measurement SQL:", error);
      throw error;
    }
  }
  
  private getObservationSql(criteria: any): string {
    try {
      // Use the SQL builder to generate the SQL
      return this.getCriteriaSqlFromBuilder(this.observationSqlBuilder, criteria, this.builderOptions);
    } catch (error) {
      console.error("Error getting Observation SQL:", error);
      throw error;
    }
  }
  
  private getDeathSql(criteria: any): string {
    try {
      // Use the SQL builder to generate the SQL
      return this.getCriteriaSqlFromBuilder(this.deathSqlBuilder, criteria, this.builderOptions);
    } catch (error) {
      console.error("Error getting Death SQL:", error);
      throw error;
    }
  }
  
  private getObservationPeriodSql(criteria: any): string {
    try {
      // Use the SQL builder to generate the SQL
      return this.getCriteriaSqlFromBuilder(this.observationPeriodSqlBuilder, criteria, this.builderOptions);
    } catch (error) {
      console.error("Error getting ObservationPeriod SQL:", error);
      throw error;
    }
  }
  
  private getVisitOccurrenceSql(criteria: any): string {
    try {
      // Use the SQL builder to generate the SQL
      return this.getCriteriaSqlFromBuilder(this.visitOccurrenceSqlBuilder, criteria, this.builderOptions);
    } catch (error) {
      console.error("Error getting VisitOccurrence SQL:", error);
      throw error;
    }
  }
  
  private getVisitDetailSql(criteria: any): string {
    try {
      // Use the SQL builder to generate the SQL
      return this.getCriteriaSqlFromBuilder(this.visitDetailSqlBuilder, criteria, this.builderOptions);
    } catch (error) {
      console.error("Error getting VisitDetail SQL:", error);
      throw error;
    }
  }
  
  private getSpecimenSql(criteria: any): string {
    try {
      // Use the SQL builder to generate the SQL
      return this.getCriteriaSqlFromBuilder(this.specimenSqlBuilder, criteria, this.builderOptions);
    } catch (error) {
      console.error("Error getting Specimen SQL:", error);
      throw error;
    }
  }
  
  private getPayerPlanPeriodSql(criteria: any): string {
    try {
      // Use the SQL builder to generate the SQL
      return this.getCriteriaSqlFromBuilder(this.payerPlanPeriodSqlBuilder, criteria, this.builderOptions);
    } catch (error) {
      console.error("Error getting PayerPlanPeriod SQL:", error);
      throw error;
    }
  }
  
  private getLocationRegionSql(criteria: any): string {
    try {
      // Use the SQL builder to generate the SQL
      return this.getCriteriaSqlFromBuilder(this.locationRegionSqlBuilder, criteria, this.builderOptions);
    } catch (error) {
      console.error("Error getting LocationRegion SQL:", error);
      throw error;
    }
  }
  
  private buildPrimaryCriteriaQuery(expression: CohortExpression): string {
    try {
      return this.primaryCriteriaSqlBuilder.buildPrimaryCriteriaQuery(expression);
    } catch (error) {
      console.error('Error in buildPrimaryCriteriaQuery:', error);
      // Provide a fallback query that won't break SQL execution
      let query = ResourceHelper.GetResourceAsString("cohortdefinition/sql/primaryEventsQuery.sql");
      query = query.replace("@criteriaQueries", 
        "SELECT 0 as criterion_id, 0 as person_id, CAST(NULL AS TIMESTAMP) as start_date, CAST(NULL AS TIMESTAMP) as end_date, 0 as sort_order");
      query = query.replace("@primaryEventsFilter", "1=1");
      query = query.replace("@EventSort", "ASC");
      query = query.replace("@primaryEventLimit", "");
      return query;
    }
  }
  
  private buildAdditionalCriteria(query: string, additionalCriteria: CriteriaGroup): string {
    if (!additionalCriteria || !additionalCriteria.CriteriaList?.length && !additionalCriteria.Groups?.length && !additionalCriteria.DemographicCriteriaList?.length) {
      return query;
    }
    
    try {
      // Get the additional criteria group query
      const acGroupQuery = this.getCriteriaGroupQuery(additionalCriteria, query);
      
      // Replace the index ID in the query
      const acQueryWithIndex = acGroupQuery.replace("@indexId", "0");
      
      // Add the join statement to the query
      const additionalCriteriaQuery = `\nJOIN (\n${acQueryWithIndex}) AC on AC.person_id = pe.person_id and AC.event_id = pe.event_id\n`;
      
      return query.replace("@additionalCriteriaQuery", additionalCriteriaQuery);
    } catch (error) {
      console.error('Error building additional criteria:', error);
      return query.replace("@additionalCriteriaQuery", "");
    }
  }
  
  private getCriteriaGroupQuery(group: CriteriaGroup, query: string): string {
    try {
      return this.criteriaGroupSqlBuilder.getCriteriaGroupQuery(group, query);
    } catch (error) {
      console.error('Error getting criteria group query:', error);
      return "";
    }
  }
  
  private getNestedCriteriaGroupQuery(group: CriteriaGroup, eventTable: string): string {
    // For backward compatibility, we construct a simple query to pass to the criteria group builder
    return this.criteriaGroupSqlBuilder.getCriteriaGroupQuery(group, "");
  }
  
  private getDemographicCriteriaQuery(criteria: DemographicCriteria, eventTable: string): string {
    try {
      return this.demographicCriteriaSqlBuilder.getDemographicCriteriaQuery(criteria, eventTable);
    } catch (error) {
      console.error('Error getting demographic criteria query:', error);
      return "";
    }
  }
  
  private applyWindowedCriteria(criteriaQuery: string, window: Window): string {
    try {
      return this.windowedCriteriaSqlBuilder.applyWindowedCriteria(criteriaQuery, window);
    } catch (error) {
      console.error('Error applying windowed criteria:', error);
      return criteriaQuery; // Return original query on error
    }
  }
  
  /**
   * Gets windowed criteria query by applying a template with criteria, event table, and options
   * @param template The SQL template to use
   * @param criteria The windowed criteria
   * @param eventTable The event table name
   * @param options Optional builder options
   * @returns SQL for windowed criteria
   */
  private getWindowedCriteriaQuery(template: string, criteria: WindowedCriteria, eventTable: string, options?: BuilderOptions): string {
    try {
      // We ignore the template parameter since the builder will use the correct template
      return this.windowedCriteriaSqlBuilder.getWindowedCriteriaQuery(criteria, eventTable, options);
    } catch (error) {
      console.error("Error getting windowed criteria query:", error);
      return "";
    }
  }
  
  /**
   * Gets SQL for corelated criteria
   * @param corelatedCriteria The corelated criteria
   * @param eventTable The event table
   * @returns SQL for corelated criteria
   */
  private getCorelatedlCriteriaQuery(corelatedCriteria: CorelatedCriteria, eventTable: string): string {
    try {
      // Determine whether to use inner or left join template based on occurrence type
      const isLeftJoin = corelatedCriteria.Occurrence.Type === 1 || // AT_MOST
                        corelatedCriteria.Occurrence.Count === 0;
                        
      // Get the appropriate template
      const templateName = isLeftJoin ? 
                          "cohortdefinition/sql/additionalCriteriaExclude.sql" : 
                          "cohortdefinition/sql/additionalCriteriaInclude.sql";
      
      // Get the template
      let query = ResourceHelper.GetResourceAsString(templateName);
      
      // Replace the windowed criteria template
      const windowedTemplate = ResourceHelper.GetResourceAsString("cohortdefinition/sql/windowedCriteria.sql");
      query = query.replace("@windowedCriteria", windowedTemplate);
      
      // Set up count column for distinct occurrence counting
      let countColumnExpression = "cc.event_id";
      
      // Set up builder options for additional columns
      const builderOptions = new BuilderOptions();
      
      // If using distinct occurrence counting, add the appropriate column
      if (corelatedCriteria.Occurrence.IsDistinct) {
        if (!corelatedCriteria.Occurrence.CountColumn) {
          // Default to domain concept if not specified
          builderOptions.additionalColumns.push(CriteriaColumn.DOMAIN_CONCEPT);
          countColumnExpression = `cc.${CriteriaColumn.DOMAIN_CONCEPT.columnName()}`;
        } else {
          // Use the specified count column
          builderOptions.additionalColumns.push(corelatedCriteria.Occurrence.CountColumn);
          countColumnExpression = `cc.${corelatedCriteria.Occurrence.CountColumn.columnName()}`;
        }
      }
      
      // Convert CorelatedCriteria to WindowedCriteria for compatibility
      const windowedCriteria: WindowedCriteria = {
        Criteria: corelatedCriteria.Criteria,
        StartWindow: corelatedCriteria.StartWindow || {
          Start: { Days: 0, Coeff: 1 },
          End: { Days: 0, Coeff: 1 },
          UseIndexEnd: false,
          UseEventEnd: false
        },
        EndWindow: corelatedCriteria.EndWindow,
        IgnoreObservationPeriod: false,
        RestrictVisit: corelatedCriteria.RestrictVisit || false,
        Window: null
      };
      
      // Apply windowed criteria
      query = this.windowedCriteriaSqlBuilder.getWindowedCriteriaQuery(windowedCriteria, eventTable, builderOptions);
      
      // Build the occurrence criteria
      let occurrenceOperator: string;
      switch (corelatedCriteria.Occurrence.Type) {
        case 0: occurrenceOperator = "="; break;  // Exactly
        case 1: occurrenceOperator = "<="; break; // At Most
        case 2: occurrenceOperator = ">="; break; // At Least
        default: occurrenceOperator = "="; break;
      }
      
      const occurrenceCriteria = `HAVING COUNT(${corelatedCriteria.Occurrence.IsDistinct ? "DISTINCT " : ""}${countColumnExpression}) ${occurrenceOperator} ${corelatedCriteria.Occurrence.Count}`;
      
      // Replace the occurrence criteria
      query = query.replace("@occurrenceCriteria", occurrenceCriteria);
      
      return query;
    } catch (error) {
      console.error("Error getting corelated criteria query:", error);
      return "";
    }
  }
  
  // These methods have been moved to the BuilderUtils class
  
  private buildInclusionRules(query: string, expression: CohortExpression, options: any): string {
    if (!expression.InclusionRules || expression.InclusionRules.length === 0) {
      // No inclusion rules, just create an empty table
      query = query.replace("@inclusionCohortInserts", "create table #inclusion_events (inclusion_rule_id bigint,\n\tperson_id bigint,\n\tevent_id bigint\n);");
      
      // Update rule total for empty inclusion rules
      query = query.replace("@ruleTotal", "0");
      
      return query;
    }
    
    try {
      const inclusionRuleInserts: string[] = [];
      const inclusionRuleTempTables: string[] = [];
      
      // Process each inclusion rule
      for (let i = 0; i < expression.InclusionRules.length; i++) {
        console.log(`Processing inclusion rule ${i}: ${expression.InclusionRules[i].Name || 'unnamed'}`);
        const cg = expression.InclusionRules[i].Expression;
        
        if (!cg) {
          console.warn(`Inclusion rule ${i} has no expression, skipping`);
          continue;
        }
        
        const inclusionRuleInsert = this.getInclusionRuleQuery(cg);
        
        if (!inclusionRuleInsert || inclusionRuleInsert.trim() === "") {
          console.warn(`Empty inclusion rule query for rule ${i}, skipping`);
          continue;
        }
        
        // Replace inclusion rule ID
        const ruleWithId = inclusionRuleInsert.replace("@inclusion_rule_id", String(i));
        inclusionRuleInserts.push(ruleWithId);
        inclusionRuleTempTables.push(`#Inclusion_${i}`);
        
        console.log(`Successfully processed inclusion rule ${i}`);
      }
      
      // If no valid inclusion rules were found, create an empty inclusion events table
      if (inclusionRuleInserts.length === 0) {
        console.warn("No valid inclusion rules found, creating empty inclusion events table");
        query = query.replace("@inclusionCohortInserts", "create table #inclusion_events (inclusion_rule_id bigint,\n\tperson_id bigint,\n\tevent_id bigint\n);");
        query = query.replace("@ruleTotal", "0");
        return query;
      }
      
      // Create union of all temp tables for the final inclusion events
      const irTempUnion = inclusionRuleTempTables
        .map(tableName => `select inclusion_rule_id, person_id, event_id from ${tableName}`)
        .join("\nUNION ALL\n");
      
      // Add the final inclusion events table creation
      inclusionRuleInserts.push(`SELECT inclusion_rule_id, person_id, event_id\nINTO #inclusion_events\nFROM (${irTempUnion}) I;`);
      
      // Add cleanup statements for the temp tables
      inclusionRuleInserts.push(...inclusionRuleTempTables
        .map(tableName => `TRUNCATE TABLE ${tableName};\nDROP TABLE ${tableName};\n`)
      );
      
      // Replace the placeholder with all the inclusion rule inserts
      query = query.replace("@inclusionCohortInserts", inclusionRuleInserts.join("\n"));
      
      // Replace the rule total with the actual count
      query = query.replace("@ruleTotal", String(expression.InclusionRules.length));
      
      return query;
    } catch (error) {
      console.error('Error building inclusion rules:', error);
      
      // On error, create an empty inclusion events table
      query = query.replace("@inclusionCohortInserts", "create table #inclusion_events (inclusion_rule_id bigint,\n\tperson_id bigint,\n\tevent_id bigint\n);");
      query = query.replace("@ruleTotal", "0");
      return query;
    }
  }
  
  private getInclusionRuleQuery(criteriaGroup: CriteriaGroup): string {
    try {
      const inclusionRuleTemplate = ResourceHelper.GetResourceAsString("cohortdefinition/sql/inclusionrule.sql");
      const criteriaQuery = this.getCriteriaGroupQuery(criteriaGroup, "");
      return inclusionRuleTemplate.replace("@criteriaQuery", criteriaQuery);
    } catch (error) {
      console.error('Error getting inclusion rule query:', error);
      return "";
    }
  }
  
  private buildCensoringEvents(query: string, expression: CohortExpression): string {
    if (!expression.CensoringCriteria || expression.CensoringCriteria.length === 0) {
      return query;
    }
    
    try {
      const criteriaQueries: string[] = [];
      const censoringTemplate = ResourceHelper.GetResourceAsString("cohortdefinition/sql/censoringInsert.sql");
      
      // Process each censoring criteria
      for (const criteria of expression.CensoringCriteria) {
        const criteriaQuery = this.getCriteriaSql(criteria);
        criteriaQueries.push(censoringTemplate.replace("@criteriaQuery", criteriaQuery));
      }
      
      // Replace cohort end unions placeholder with the censoring events
      const cohortEndUnions = query.includes("@cohort_end_unions") 
        ? query.replace("@cohort_end_unions", criteriaQueries.join("\nUNION ALL\n"))
        : query;
      
      return cohortEndUnions;
    } catch (error) {
      console.error('Error building censoring events:', error);
      return query;
    }
  }
  
  private buildCollapseConstructs(query: string, expression: CohortExpression): string {
    if (!expression.CollapseSettings || expression.CollapseSettings.CollapseType === "NONE") {
      return query;
    }
    
    try {
      // ERA collapsing logic
      if (expression.CollapseSettings.CollapseType === "ERA") {
        // Replace era constructor pad placeholder
        query = query.replace("@eraconstructorpad", String(expression.CollapseSettings.EraPad || 0));
      }
      
      return query;
    } catch (error) {
      console.error('Error building collapse constructs:', error);
      return query;
    }
  }
  
  /**
   * Gets final cohort query based on the censor window
   * @param censorWindow Optional period for censoring dates
   * @returns SQL query string
   */
  private getFinalCohortQuery(censorWindow?: any): string {
    try {
      let query = "select @target_cohort_id as @cohort_id_field_name, person_id, @start_date, @end_date \nFROM #final_cohort CO";
      
      let startDate = "start_date";
      let endDate = "end_date";
      
      // Check if censorWindow has startDate/endDate directly
      if (censorWindow && (censorWindow.startDate || censorWindow.endDate)) {
        if (censorWindow.startDate) {
          const censorStartDate = this.dateStringToSql(censorWindow.startDate);
          startDate = `CASE WHEN start_date > ${censorStartDate} THEN start_date ELSE ${censorStartDate} END`;
        }
        
        if (censorWindow.endDate) {
          const censorEndDate = this.dateStringToSql(censorWindow.endDate);
          endDate = `CASE WHEN end_date < ${censorEndDate} THEN end_date ELSE ${censorEndDate} END`;
        }
        
        query += "\nWHERE @start_date <= @end_date";
      }
      // Handle Window object with Start/End properties
      else if (censorWindow && (censorWindow.Start || censorWindow.End)) {
        // Convert Window to date string if needed
        const startValue = censorWindow.Start?.Value;
        const endValue = censorWindow.End?.Value;
        
        if (startValue !== undefined) {
          startDate = `CASE WHEN start_date > DATEADD(day, ${startValue}, '1970-01-01') THEN start_date ELSE DATEADD(day, ${startValue}, '1970-01-01') END`;
        }
        
        if (endValue !== undefined) {
          endDate = `CASE WHEN end_date < DATEADD(day, ${endValue}, '1970-01-01') THEN end_date ELSE DATEADD(day, ${endValue}, '1970-01-01') END`;
        }
        
        query += "\nWHERE @start_date <= @end_date";
      }
      
      query = query.replace("@start_date", startDate);
      query = query.replace("@end_date", endDate);
      
      return query;
    } catch (error) {
      console.error("Error getting final cohort query:", error);
      return "select @target_cohort_id as @cohort_id_field_name, person_id, start_date, end_date \nFROM #final_cohort";
    }
  }
  
  /**
   * Converts a date string to SQL date literal
   * @param dateString Date string in format 'YYYY-MM-DD'
   * @returns SQL date literal
   */
  private dateStringToSql(dateString: string): string {
    if (!dateString) return "NULL";
    return `'${dateString}'`; // For SQL Server
  }

  private finalizeCohortQuery(query: string, expression: CohortExpression): string {
    try {
      // Replace finalCohortQuery placeholder with the actual query
      let updatedQuery = query.replace("@finalCohortQuery", this.getFinalCohortQuery(expression.CensorWindow));
      
      // Add final parameters that weren't provided in the initial rendering
      const finalParamNames = [
        "strategy_ends_cleanup"   // Clean up temporary tables
      ];
      
      const finalParamValues = [
        ""  // No cleanup needed by default
      ];
      
      // Handle remaining basic parameters
      updatedQuery = SqlRender.renderSql(updatedQuery, finalParamNames, finalParamValues);
      
      // Handle generateStats parameter
      if (updatedQuery.includes("{@generateStats != 0}?{")) {
        const generateStats = true; // Default to generating stats
        // Replace conditional blocks in the query
        updatedQuery = this.replaceConditionalBlocks(updatedQuery, "generateStats", generateStats ? 1 : 0);
      }
      
      // Handle cohortCensoredStatsQuery placeholder
      if (updatedQuery.includes("@cohortCensoredStatsQuery")) {
        updatedQuery = updatedQuery.replace("@cohortCensoredStatsQuery", this.getCohortCensoredStatsQuery());
      }
      
      // Handle inclusionRuleTable placeholder
      if (updatedQuery.includes("@inclusionRuleTable")) {
        updatedQuery = updatedQuery.replace("@inclusionRuleTable", this.getInclusionRuleTableSql(expression));
      }
      
      // Handle inclusion impact analysis placeholders
      if (updatedQuery.includes("@inclusionImpactAnalysisByEventQuery")) {
        updatedQuery = updatedQuery.replace("@inclusionImpactAnalysisByEventQuery", 
          this.getInclusionAnalysisQuery(false));
      }
      
      if (updatedQuery.includes("@inclusionImpactAnalysisByPersonQuery")) {
        updatedQuery = updatedQuery.replace("@inclusionImpactAnalysisByPersonQuery", 
          this.getInclusionAnalysisQuery(true));
      }
      
      return updatedQuery;
    } catch (error) {
      console.error("Error in finalizeCohortQuery:", error);
      return query; // Return the original query on error
    }
  }
  
  /**
   * Replaces conditional blocks in SQL templates
   * @param sql SQL template with conditional blocks
   * @param paramName Parameter name to check
   * @param paramValue Parameter value to compare
   * @returns SQL with conditional blocks resolved
   */
  private replaceConditionalBlocks(sql: string, paramName: string, paramValue: number): string {
    const regex = new RegExp(`\\{@${paramName} != (\\d+)\\}\\?\\{([\\s\\S]*?)\\}`, 'g');
    return sql.replace(regex, (match, value, content) => {
      return paramValue != Number(value) ? content : '';
    });
  }
  
  /**
   * Gets the SQL for cohort censored stats query
   * @returns SQL for cohort censored stats query
   */
  private getCohortCensoredStatsQuery(): string {
    try {
      return ResourceHelper.GetResourceAsString("cohortdefinition/sql/cohortCensoredStats.sql");
    } catch (error) {
      console.error("Error getting cohort censored stats query:", error);
      return "-- Error getting cohort censored stats query";
    }
  }
  
  /**
   * Gets the SQL for inclusion rule table
   * @param expression The cohort expression
   * @returns SQL for inclusion rule table
   */
  private getInclusionRuleTableSql(expression: CohortExpression): string {
    try {
      if (!expression.InclusionRules || expression.InclusionRules.length === 0) {
        return "-- No inclusion rules defined";
      }
      
      // Create union of all inclusion rules
      const inclusionRuleUnions: string[] = [];
      
      for (let i = 0; i < expression.InclusionRules.length; i++) {
        // Use SQL Server compatible approach instead of "from dual"
        inclusionRuleUnions.push(`select ${i} as rule_sequence`);
      }
      
      const unions = inclusionRuleUnions.join("\nUNION ALL\n");
      
      // Get the inclusion rule temp table template
      const inclusionRuleTempTable = ResourceHelper.GetResourceAsString("cohortdefinition/sql/inclusionRuleTempTable.sql");
      
      // Replace the unions placeholder
      return inclusionRuleTempTable.replace("@inclusionRuleUnions", unions);
    } catch (error) {
      console.error("Error getting inclusion rule table SQL:", error);
      return "-- Error getting inclusion rule table SQL";
    }
  }
  
  /**
   * Gets the SQL for inclusion analysis query
   * @param byPerson Whether to analyze by person (true) or by event (false)
   * @returns SQL for inclusion analysis query
   */
  private getInclusionAnalysisQuery(byPerson: boolean): string {
    try {
      const template = ResourceHelper.GetResourceAsString("cohortdefinition/sql/cohortInclusionAnalysis.sql");
      
      // Mode: 0 = by event, 1 = by person
      const mode = byPerson ? 1 : 0;
      
      // Replace eventTable based on mode
      const eventTable = byPerson ? "#best_events" : "#qualified_events";
      
      // Create the full query with replaced placeholders
      let query = template
        .replace(/@inclusionImpactMode/g, String(mode))
        .replace(/@eventTable/g, eventTable);
      
      return query;
    } catch (error) {
      console.error("Error getting inclusion analysis query:", error);
      return "-- Error getting inclusion analysis query";
    }
  }
  
  private getCodesetIds(expression: CohortExpression): number[] {
    const codesetIds: Set<number> = new Set<number>();
    
    // Add all codesetIds from ConceptSets
    if (expression.ConceptSets) {
      for (const conceptSet of expression.ConceptSets) {
        codesetIds.add(conceptSet.Id);
      }
    }
    
    // Add more logic to extract codesetIds from criteria if needed
    
    return Array.from(codesetIds);
  }
  
  private getCodesetQuery(conceptSets: ConceptSet[]): string {
    if (!conceptSets || conceptSets.length === 0) {
      // Return empty template if no concept sets
      const codesetQueryTemplate = ResourceHelper.GetResourceAsString("cohortdefinition/sql/codesetQuery.sql");
      return codesetQueryTemplate.replace("@codesetInserts", "");
    }
    
    try {
      // Build union select queries for all concept sets
      const unionQueries: string[] = [];
      
      for (const cs of conceptSets) {
        console.log(`Processing concept set ID ${cs.Id} with ${cs.Expression?.Items?.length || 0} items`);
        
        if (!cs.Expression || !cs.Expression.Items || cs.Expression.Items.length === 0) {
          console.warn(`Skipping empty concept set with ID ${cs.Id}`);
          continue;
        }
        
        try {
          // Generate query for this concept set
          const csQuery = ConceptSetExpressionQueryBuilder.buildExpressionQuery(cs.Expression);
          
          if (!csQuery || csQuery.trim() === "") {
            console.warn(`Empty query generated for concept set ID ${cs.Id}`);
            continue;
          }
          
          // Create a select with the codeset_id and concept_id
          const selectQuery = `SELECT ${String(cs.Id)} as codeset_id, c.concept_id FROM (${csQuery}) C`;
          unionQueries.push(selectQuery);
          
          console.log(`Successfully generated query for concept set ID ${cs.Id}`);
        } catch (csError) {
          console.error(`Error generating query for concept set ID ${cs.Id}:`, csError);
          // Continue with other concept sets
        }
      }
      
      // No valid concept sets found
      if (unionQueries.length === 0) {
        console.warn("No valid concept set queries were generated");
        const codesetQueryTemplate = ResourceHelper.GetResourceAsString("cohortdefinition/sql/codesetQuery.sql");
        return codesetQueryTemplate.replace("@codesetInserts", "");
      }
      
      const unionSelectsQuery = unionQueries.join(" UNION ALL \n");
      
      // Insert into the codeset query template
      const codesetQueryTemplate = ResourceHelper.GetResourceAsString("cohortdefinition/sql/codesetQuery.sql");
      const codesetQuery = codesetQueryTemplate.replace(
        "@codesetInserts",
        `INSERT INTO #Codesets (codeset_id, concept_id)\n${unionSelectsQuery};`
      );
      
      console.log("Generated codeset query with concept sets:", conceptSets.map(cs => cs.Id).join(", "));
      return codesetQuery;
    } catch (error) {
      console.error('Error getting codeset query:', error);
      // Return empty codeset template on error
      const codesetQueryTemplate = ResourceHelper.GetResourceAsString("cohortdefinition/sql/codesetQuery.sql");
      return codesetQueryTemplate.replace("@codesetInserts", "");
    }
  }
  
  private getCodesetQueryForId(expression: CohortExpression, codesetId: number): string {
    const conceptSet = expression.ConceptSets.find(cs => cs.Id === codesetId);
    
    if (!conceptSet) {
      throw new Error(`Codeset id: ${codesetId} not found in cohort expression.`);
    }
    
    const csQuery = ConceptSetExpressionQueryBuilder.buildExpressionQuery(conceptSet.Expression);
    if (csQuery.length === 0) {
      return "";
    }
    
    const codesetQuery = ResourceHelper.GetResourceAsString("cohortdefinition/sql/codesetQuery.sql");
    // Direct string replacement like in Java code, instead of using SqlRender
    return codesetQuery
      .replace("@codesetId", String(codesetId))
      .replace("@codesetQuery", csQuery);
  }
}

export default CohortExpressionQueryBuilder;