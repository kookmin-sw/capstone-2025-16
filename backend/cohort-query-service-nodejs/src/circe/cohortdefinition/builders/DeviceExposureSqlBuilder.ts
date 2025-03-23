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
import { SqlRender } from '../../../sqlrender';
import { DeviceExposure } from '../CohortExpression';
import BuilderUtils from './BuilderUtils';

/**
 * Interface for device exposure criteria that handles both camel and pascal case
 */
interface DeviceExposureCriteria extends DeviceExposure {
  // Support both camelCase and PascalCase naming styles
  DeviceType?: any[];
  deviceType?: any[];
  DeviceTypeExclude?: boolean;
  deviceTypeExclude?: boolean;
  UniqueDeviceId?: any;
  uniqueDeviceId?: any;
  Quantity?: any;
  quantity?: any;
  DeviceSourceConcept?: number;
  deviceSourceConcept?: number;
  CodesetId?: number;
  codesetId?: number;
  OccurrenceStartDate?: any;
  occurrenceStartDate?: any;
  OccurrenceEndDate?: any;
  occurrenceEndDate?: any;
  // Add any additional properties needed
}

/**
 * SQL builder for device exposure criteria
 */
export class DeviceExposureSqlBuilder extends CriteriaSqlBuilder<DeviceExposureCriteria> {
  // Default columns that are already in the template
  private readonly DEFAULT_COLUMNS: Set<CriteriaColumn> = new Set([
    CriteriaColumn.START_DATE, 
    CriteriaColumn.END_DATE, 
    CriteriaColumn.VISIT_ID
  ]);
  
  // Template SQL for device exposure
  private readonly DEVICE_EXPOSURE_TEMPLATE = ResourceHelper.GetResourceAsString("cohortdefinition/sql/deviceExposure.sql");
  
  /**
   * Get default columns for the criteria
   */
  protected getDefaultColumns(): Set<CriteriaColumn> {
    return this.DEFAULT_COLUMNS;
  }
  
  /**
   * Get the SQL template for device exposure
   */
  protected getQueryTemplate(): string {
    return this.DEVICE_EXPOSURE_TEMPLATE;
  }
  
  /**
   * Get the table column for a criteria column
   * @param column Criteria column to map
   * @returns Table column expression for the criteria column
   */
  protected getTableColumnForCriteriaColumn(column: CriteriaColumn): string {
    switch (column) {
      case CriteriaColumn.DOMAIN_CONCEPT:
        return "de.device_type_concept_id";
      default:
        throw new Error(`Invalid CriteriaColumn for DeviceExposure: ${column}`);
    }
  }
  
  /**
   * Embed the codeset clause for concept filtering
   * @param query SQL query
   * @param criteria Device exposure criteria
   * @returns Modified query with codeset clause
   */
  protected embedCodesetClause(query: string, criteria: DeviceExposureCriteria): string {
    const joinClauses: string[] = [];
    
    // Add the codeset join based on the device concept ID
    // Account for both camelCase and PascalCase property names
    const codesetId = criteria.CodesetId !== undefined ? criteria.CodesetId : 
                     (criteria.codesetId !== undefined ? criteria.codesetId : undefined);
                     
    if (codesetId !== undefined) {
      joinClauses.push(`JOIN #Codesets cs on cs.codeset_id = ${codesetId} and cs.concept_id = de.device_concept_id`);
    }
    
    return query.replace("@codesetClause", joinClauses.join("\n"));
  }
  
  /**
   * Embed ordinal expression for ordering criteria
   * @param query SQL query
   * @param criteria Device exposure criteria
   * @param whereClauses Where clauses to modify
   * @returns Modified query with ordinal expression
   */
  protected embedOrdinalExpression(query: string, criteria: DeviceExposureCriteria, whereClauses: string[]): string {
    // First occurrence logic
    const firstOccurrence = criteria.FirstOccurrenceOnly || criteria.First;
    if (firstOccurrence) {
      return query.replace("@ordinalExpression", " AND device_exposure_id = (SELECT MIN(device_exposure_id) FROM @cdmDatabaseSchema.device_exposure d WHERE person_id = de.person_id)");
    }
    
    return query.replace("@ordinalExpression", "");
  }
  
  /**
   * Resolve select clauses for the criteria
   * @param criteria Device exposure criteria
   * @returns Array of select clause expressions
   */
  protected resolveSelectClauses(criteria: DeviceExposureCriteria): string[] {
    const selectCols = [
      "de.person_id", 
      "de.device_exposure_id",
      "de.device_concept_id",
      "de.device_exposure_start_date",
      "de.device_exposure_end_date",
      "de.device_type_concept_id",
      "de.unique_device_id",
      "de.quantity",
      "de.visit_occurrence_id"
    ];
    
    // Add date fields
    selectCols.push("de.device_exposure_start_date as start_date");
    
    // Use end date if available, otherwise use start date
    selectCols.push("COALESCE(de.device_exposure_end_date, de.device_exposure_start_date) as end_date");
    
    // Source concept if specifically requested
    if (criteria.DeviceSourceConcept || criteria.deviceSourceConcept) {
      selectCols.push("de.device_source_concept_id");
    }
    
    return selectCols;
  }
  
  /**
   * Resolve join clauses for the criteria
   * @param criteria Device exposure criteria
   * @returns Array of join clause expressions
   */
  protected resolveJoinClauses(criteria: DeviceExposureCriteria): string[] {
    return [];
  }
  
  /**
   * Resolve where clauses for the criteria
   * @param criteria Device exposure criteria
   * @returns Array of where clause expressions
   */
  protected resolveWhereClauses(criteria: DeviceExposureCriteria): string[] {
    // Start with base where clauses from parent class
    const whereClauses = super.resolveWhereClauses(criteria);
    
    // Support both PascalCase and camelCase property names
    const occurrenceStartDate = criteria.OccurrenceStartDate || criteria.occurrenceStartDate;
    const occurrenceEndDate = criteria.OccurrenceEndDate || criteria.occurrenceEndDate;
    const deviceType = criteria.DeviceType || criteria.deviceType;
    const deviceTypeExclude = criteria.DeviceTypeExclude || criteria.deviceTypeExclude;
    const uniqueDeviceId = criteria.UniqueDeviceId || criteria.uniqueDeviceId;
    const quantity = criteria.Quantity || criteria.quantity;
    
    // Occurrence start date
    if (occurrenceStartDate) {
      whereClauses.push(BuilderUtils.buildDateRangeClause("de.device_exposure_start_date", occurrenceStartDate));
    }
    
    // Occurrence end date
    if (occurrenceEndDate) {
      whereClauses.push(BuilderUtils.buildDateRangeClause("de.device_exposure_end_date", occurrenceEndDate));
    }
    
    // Device type
    if (deviceType && deviceType.length > 0) {
      const conceptIdField = deviceType[0].CONCEPT_ID ? 'CONCEPT_ID' : 'conceptId';
      const conceptIds = deviceType.map(c => c[conceptIdField]).join(',');
      whereClauses.push(`de.device_type_concept_id ${deviceTypeExclude ? 'not' : ''} in (${conceptIds})`);
    }
    
    // Unique device ID filter
    if (uniqueDeviceId) {
      const op = uniqueDeviceId.Op || uniqueDeviceId.op || "contains";
      const text = uniqueDeviceId.Text || uniqueDeviceId.text || "";
      
      if (text.length > 0) {
        switch (op.toLowerCase()) {
          case "contains":
            whereClauses.push(`de.unique_device_id like '%${text}%'`);
            break;
          case "startswith":
            whereClauses.push(`de.unique_device_id like '${text}%'`);
            break;
          case "endswith":
            whereClauses.push(`de.unique_device_id like '%${text}'`);
            break;
          case "exact":
            whereClauses.push(`de.unique_device_id = '${text}'`);
            break;
        }
      }
    }
    
    // Quantity range filter
    if (quantity) {
      const op = quantity.Op || quantity.op || "gt";
      const value = quantity.Value || quantity.value || 0;
      
      switch (op.toLowerCase()) {
        case "eq":
          whereClauses.push(`de.quantity = ${value}`);
          break;
        case "gt":
          whereClauses.push(`de.quantity > ${value}`);
          break;
        case "gte":
          whereClauses.push(`de.quantity >= ${value}`);
          break;
        case "lt":
          whereClauses.push(`de.quantity < ${value}`);
          break;
        case "lte":
          whereClauses.push(`de.quantity <= ${value}`);
          break;
        case "bt":
          const extent = quantity.Extent || quantity.extent || 0;
          whereClauses.push(`de.quantity between ${value} and ${extent}`);
          break;
      }
    }
    
    return whereClauses;
  }
}

export default DeviceExposureSqlBuilder;