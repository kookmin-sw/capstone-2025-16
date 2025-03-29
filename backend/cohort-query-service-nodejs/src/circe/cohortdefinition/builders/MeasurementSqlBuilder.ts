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
import { Measurement } from '../CohortExpression';
import BuilderUtils from './BuilderUtils';

/**
 * Interface for measurement criteria that handles both camel and pascal case
 */
interface MeasurementCriteria extends Measurement {
  // Support both camelCase and PascalCase naming styles
  MeasurementType?: any[];
  measurementType?: any[];
  MeasurementTypeExclude?: boolean;
  measurementTypeExclude?: boolean;
  Operator?: any[];
  operator?: any[];
  OperatorExclude?: boolean;
  operatorExclude?: boolean;
  ValueAsNumber?: any;
  valueAsNumber?: any;
  ValueAsString?: any;
  valueAsString?: any;
  ValueAsConcept?: any[];
  valueAsConcept?: any[];
  ValueAsConceptExclude?: boolean;
  valueAsConceptExclude?: boolean;
  Unit?: any[];
  unit?: any[];
  UnitExclude?: boolean;
  unitExclude?: boolean;
  RangeLow?: number;
  rangeLow?: number;
  RangeHigh?: number;
  rangeHigh?: number;
  RangeLowRatio?: number;
  rangeLowRatio?: number;
  RangeHighRatio?: number;
  rangeHighRatio?: number;
  MeasurementSourceConcept?: number;
  measurementSourceConcept?: number;
  CodesetId?: number;
  codesetId?: number;
  OccurrenceStartDate?: any;
  occurrenceStartDate?: any;
  OccurrenceEndDate?: any;
  occurrenceEndDate?: any;
  // Add any additional properties needed
}

/**
 * SQL builder for measurement criteria
 */
export class MeasurementSqlBuilder extends CriteriaSqlBuilder<MeasurementCriteria> {
  // Default columns that are already in the template
  private readonly DEFAULT_COLUMNS: Set<CriteriaColumn> = new Set([
    CriteriaColumn.START_DATE, 
    CriteriaColumn.END_DATE, 
    CriteriaColumn.VISIT_ID
  ]);
  
  // Template SQL for measurement
  private readonly MEASUREMENT_TEMPLATE = ResourceHelper.GetResourceAsString("cohortdefinition/sql/measurement.sql");
  
  /**
   * Get default columns for the criteria
   */
  protected getDefaultColumns(): Set<CriteriaColumn> {
    return this.DEFAULT_COLUMNS;
  }
  
  /**
   * Get the SQL template for measurement
   */
  protected getQueryTemplate(): string {
    return this.MEASUREMENT_TEMPLATE;
  }
  
  /**
   * Get the table column for a criteria column
   * @param column Criteria column to map
   * @returns Table column expression for the criteria column
   */
  protected getTableColumnForCriteriaColumn(column: CriteriaColumn): string {
    switch (column) {
      case CriteriaColumn.DOMAIN_CONCEPT:
        return "m.measurement_type_concept_id";
      default:
        throw new Error(`Invalid CriteriaColumn for Measurement: ${column}`);
    }
  }
  
  /**
   * Embed the codeset clause for concept filtering
   * @param query SQL query
   * @param criteria Measurement criteria
   * @returns Modified query with codeset clause
   */
  protected embedCodesetClause(query: string, criteria: MeasurementCriteria): string {
    const joinClauses: string[] = [];
    
    // Add the codeset join based on the measurement concept ID
    // Account for both camelCase and PascalCase property names
    const codesetId = criteria.CodesetId !== undefined ? criteria.CodesetId : 
                     (criteria.codesetId !== undefined ? criteria.codesetId : undefined);
                     
    if (codesetId !== undefined) {
      joinClauses.push(`JOIN #Codesets cs on cs.codeset_id = ${codesetId} and cs.concept_id = m.measurement_concept_id`);
    }
    
    return query.replace("@codesetClause", joinClauses.join("\n"));
  }
  
  /**
   * Embed ordinal expression for ordering criteria
   * @param query SQL query
   * @param criteria Measurement criteria
   * @param whereClauses Where clauses to modify
   * @returns Modified query with ordinal expression
   */
  protected embedOrdinalExpression(query: string, criteria: MeasurementCriteria, whereClauses: string[]): string {
    // First occurrence logic
    const firstOccurrence = criteria.FirstOccurrenceOnly || criteria.First;
    if (firstOccurrence) {
      return query.replace("@ordinalExpression", " AND measurement_id = (SELECT MIN(measurement_id) FROM @cdmDatabaseSchema.measurement m WHERE person_id = m.person_id)");
    }
    
    return query.replace("@ordinalExpression", "");
  }
  
  /**
   * Resolve select clauses for the criteria
   * @param criteria Measurement criteria
   * @returns Array of select clause expressions
   */
  protected resolveSelectClauses(criteria: MeasurementCriteria): string[] {
    const selectCols = [
      "m.person_id", 
      "m.measurement_id",
      "m.measurement_concept_id",
      "m.measurement_date",
      "m.measurement_datetime",
      "m.measurement_type_concept_id",
      "m.operator_concept_id",
      "m.value_as_number",
      "m.value_as_concept_id",
      "m.unit_concept_id",
      "m.range_low",
      "m.range_high",
      "m.provider_id",
      "m.visit_occurrence_id",
      "m.visit_detail_id"
    ];
    
    // Add date fields
    selectCols.push("m.measurement_date as start_date, m.measurement_date as end_date");
    
    // Add string value if available
    selectCols.push("m.value_as_string");
    
    // Source concept if specifically requested
    if (criteria.MeasurementSourceConcept || criteria.measurementSourceConcept) {
      selectCols.push("m.measurement_source_concept_id");
    }
    
    return selectCols;
  }
  
  /**
   * Resolve join clauses for the criteria
   * @param criteria Measurement criteria
   * @returns Array of join clause expressions
   */
  protected resolveJoinClauses(criteria: MeasurementCriteria): string[] {
    return [];
  }
  
  /**
   * Resolve where clauses for the criteria
   * @param criteria Measurement criteria
   * @returns Array of where clause expressions
   */
  protected resolveWhereClauses(criteria: MeasurementCriteria): string[] {
    // Start with base where clauses from parent class
    const whereClauses = super.resolveWhereClauses(criteria);
    
    // Support both PascalCase and camelCase property names
    const occurrenceStartDate = criteria.OccurrenceStartDate || criteria.occurrenceStartDate;
    const occurrenceEndDate = criteria.OccurrenceEndDate || criteria.occurrenceEndDate;
    const measurementType = criteria.MeasurementType || criteria.measurementType;
    const measurementTypeExclude = criteria.MeasurementTypeExclude || criteria.measurementTypeExclude;
    const operator = criteria.Operator || criteria.operator;
    const operatorExclude = criteria.OperatorExclude || criteria.operatorExclude;
    const valueAsNumber = criteria.ValueAsNumber || criteria.valueAsNumber;
    const valueAsString = criteria.ValueAsString || criteria.valueAsString;
    const valueAsConcept = criteria.ValueAsConcept || criteria.valueAsConcept;
    const valueAsConceptExclude = criteria.ValueAsConceptExclude || criteria.valueAsConceptExclude;
    const unit = criteria.Unit || criteria.unit;
    const unitExclude = criteria.UnitExclude || criteria.unitExclude;
    const rangeLow = criteria.RangeLow || criteria.rangeLow;
    const rangeHigh = criteria.RangeHigh || criteria.rangeHigh;
    const rangeLowRatio = criteria.RangeLowRatio || criteria.rangeLowRatio;
    const rangeHighRatio = criteria.RangeHighRatio || criteria.rangeHighRatio;
    
    // Occurrence start date
    if (occurrenceStartDate) {
      whereClauses.push(BuilderUtils.buildDateRangeClause("m.measurement_date", occurrenceStartDate));
    }
    
    // Occurrence end date - measurements typically only have date, not start/end dates
    if (occurrenceEndDate) {
      whereClauses.push(BuilderUtils.buildDateRangeClause("m.measurement_date", occurrenceEndDate));
    }
    
    // Measurement type
    if (measurementType && measurementType.length > 0) {
      const conceptIdField = measurementType[0].CONCEPT_ID ? 'CONCEPT_ID' : 'conceptId';
      const conceptIds = measurementType.map(c => c[conceptIdField]).join(',');
      whereClauses.push(`m.measurement_type_concept_id ${measurementTypeExclude ? 'not' : ''} in (${conceptIds})`);
    }
    
    // Operator
    if (operator && operator.length > 0) {
      const conceptIdField = operator[0].CONCEPT_ID ? 'CONCEPT_ID' : 'conceptId';
      const conceptIds = operator.map(c => c[conceptIdField]).join(',');
      whereClauses.push(`m.operator_concept_id ${operatorExclude ? 'not' : ''} in (${conceptIds})`);
    }
    
    // Value as number range filter
    if (valueAsNumber) {
      const op = valueAsNumber.Op || valueAsNumber.op || "gt";
      const value = valueAsNumber.Value || valueAsNumber.value || 0;
      
      switch (op.toLowerCase()) {
        case "eq":
          whereClauses.push(`m.value_as_number = ${value}`);
          break;
        case "gt":
          whereClauses.push(`m.value_as_number > ${value}`);
          break;
        case "gte":
          whereClauses.push(`m.value_as_number >= ${value}`);
          break;
        case "lt":
          whereClauses.push(`m.value_as_number < ${value}`);
          break;
        case "lte":
          whereClauses.push(`m.value_as_number <= ${value}`);
          break;
        case "bt":
          const extent = valueAsNumber.Extent || valueAsNumber.extent || 0;
          whereClauses.push(`m.value_as_number between ${value} and ${extent}`);
          break;
      }
    }
    
    // Value as string filter
    if (valueAsString) {
      const op = valueAsString.Op || valueAsString.op || "contains";
      const text = valueAsString.Text || valueAsString.text || "";
      
      if (text.length > 0) {
        switch (op.toLowerCase()) {
          case "contains":
            whereClauses.push(`m.value_as_string like '%${text}%'`);
            break;
          case "startswith":
            whereClauses.push(`m.value_as_string like '${text}%'`);
            break;
          case "endswith":
            whereClauses.push(`m.value_as_string like '%${text}'`);
            break;
          case "exact":
            whereClauses.push(`m.value_as_string = '${text}'`);
            break;
        }
      }
    }
    
    // Value as concept
    if (valueAsConcept && valueAsConcept.length > 0) {
      const conceptIdField = valueAsConcept[0].CONCEPT_ID ? 'CONCEPT_ID' : 'conceptId';
      const conceptIds = valueAsConcept.map(c => c[conceptIdField]).join(',');
      whereClauses.push(`m.value_as_concept_id ${valueAsConceptExclude ? 'not' : ''} in (${conceptIds})`);
    }
    
    // Unit
    if (unit && unit.length > 0) {
      const conceptIdField = unit[0].CONCEPT_ID ? 'CONCEPT_ID' : 'conceptId';
      const conceptIds = unit.map(c => c[conceptIdField]).join(',');
      whereClauses.push(`m.unit_concept_id ${unitExclude ? 'not' : ''} in (${conceptIds})`);
    }
    
    // Range filters
    if (rangeLow !== undefined) {
      whereClauses.push(`m.range_low = ${rangeLow}`);
    }
    
    if (rangeHigh !== undefined) {
      whereClauses.push(`m.range_high = ${rangeHigh}`);
    }
    
    if (rangeLowRatio !== undefined) {
      whereClauses.push(`m.value_as_number >= m.range_low * ${rangeLowRatio}`);
    }
    
    if (rangeHighRatio !== undefined) {
      whereClauses.push(`m.value_as_number <= m.range_high * ${rangeHighRatio}`);
    }
    
    return whereClauses;
  }
}

export default MeasurementSqlBuilder;