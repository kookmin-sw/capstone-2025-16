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
import { DrugExposure } from '../CohortExpression';
import BuilderUtils from './BuilderUtils';

/**
 * Interface for drug exposure criteria that handles both camel and pascal case
 */
interface DrugExposureCriteria extends DrugExposure {
  // Support both camelCase and PascalCase naming styles
  DrugType?: any[];
  drugType?: any[];
  DrugTypeExclude?: boolean;
  drugTypeExclude?: boolean;
  Route?: any[];
  route?: any[];
  RouteExclude?: boolean;
  routeExclude?: boolean;
  DoseUnit?: any[];
  doseUnit?: any[];
  DoseUnitExclude?: boolean;
  doseUnitExclude?: boolean;
  DaysSupply?: any;
  daysSupply?: any;
  Refills?: any;
  refills?: any;
  LotNumber?: any;
  lotNumber?: any;
  DrugSourceConcept?: number;
  drugSourceConcept?: number;
  EffectiveDrugDose?: any;
  effectiveDrugDose?: any;
  CodesetId?: number;
  codesetId?: number;
  OccurrenceStartDate?: any;
  occurrenceStartDate?: any;
  OccurrenceEndDate?: any;
  occurrenceEndDate?: any;
  // Add any additional properties needed
}

/**
 * SQL builder for drug exposure criteria
 */
export class DrugExposureSqlBuilder extends CriteriaSqlBuilder<DrugExposureCriteria> {
  // Default columns that are already in the template
  private readonly DEFAULT_COLUMNS: Set<CriteriaColumn> = new Set([
    CriteriaColumn.START_DATE, 
    CriteriaColumn.END_DATE, 
    CriteriaColumn.VISIT_ID
  ]);
  
  // Template SQL for drug exposure
  private readonly DRUG_EXPOSURE_TEMPLATE = ResourceHelper.GetResourceAsString("cohortdefinition/sql/drugExposure.sql");
  
  /**
   * Get default columns for the criteria
   */
  protected getDefaultColumns(): Set<CriteriaColumn> {
    return this.DEFAULT_COLUMNS;
  }
  
  /**
   * Get the SQL template for drug exposure
   */
  protected getQueryTemplate(): string {
    return this.DRUG_EXPOSURE_TEMPLATE;
  }
  
  /**
   * Get the table column for a criteria column
   * @param column Criteria column to map
   * @returns Table column expression for the criteria column
   */
  protected getTableColumnForCriteriaColumn(column: CriteriaColumn): string {
    switch (column) {
      case CriteriaColumn.DOMAIN_CONCEPT:
        return "de.drug_type_concept_id";
      default:
        throw new Error(`Invalid CriteriaColumn for DrugExposure: ${column}`);
    }
  }
  
  /**
   * Embed the codeset clause for concept filtering
   * @param query SQL query
   * @param criteria Drug exposure criteria
   * @returns Modified query with codeset clause
   */
  protected embedCodesetClause(query: string, criteria: DrugExposureCriteria): string {
    // Add the codeset join based on the drug concept ID
    // Account for both camelCase and PascalCase property names
    const codesetId = criteria.CodesetId !== undefined ? criteria.CodesetId : 
                     (criteria.codesetId !== undefined ? criteria.codesetId : undefined);
    
    // Check if we need to include source concept
    const sourceConcept = criteria.DrugSourceConcept !== undefined ? criteria.DrugSourceConcept : 
                         (criteria.drugSourceConcept !== undefined ? criteria.drugSourceConcept : null);
    
    const includeSourceConcept = sourceConcept !== null;
    
    let codesetClause = "";
    if (codesetId !== undefined) {
      if (includeSourceConcept) {
        // JOIN with source concept support
        codesetClause = `JOIN #Codesets cs on ((de.drug_concept_id = cs.concept_id OR de.drug_source_concept_id = cs.concept_id) and cs.codeset_id = ${codesetId})`;
      } else {
        // Standard JOIN
        codesetClause = `JOIN #Codesets cs on (de.drug_concept_id = cs.concept_id and cs.codeset_id = ${codesetId})`;
      }
    }
    
    return query.replace("@codesetClause", codesetClause);
  }
  
  /**
   * Embed ordinal expression for ordering criteria
   * @param query SQL query
   * @param criteria Drug exposure criteria
   * @param whereClauses Where clauses to modify
   * @returns Modified query with ordinal expression
   */
  protected embedOrdinalExpression(query: string, criteria: DrugExposureCriteria, whereClauses: string[]): string {
    // First occurrence logic
    const firstOccurrence = criteria.FirstOccurrenceOnly || criteria.First;
    if (firstOccurrence) {
      return query.replace("@ordinalExpression", " AND drug_exposure_id = (SELECT MIN(drug_exposure_id) FROM @cdmDatabaseSchema.drug_exposure d WHERE person_id = de.person_id)");
    }
    
    return query.replace("@ordinalExpression", "");
  }
  
  /**
   * Resolve select clauses for the criteria
   * @param criteria Drug exposure criteria
   * @returns Array of select clause expressions
   */
  protected resolveSelectClauses(criteria: DrugExposureCriteria): string[] {
    const selectCols = [
      "de.person_id", 
      "de.drug_exposure_id",
      "de.drug_concept_id",
      "de.drug_exposure_start_date",
      "de.drug_exposure_end_date",
      "de.drug_type_concept_id",
      "de.route_concept_id",
      "de.quantity",
      "de.days_supply",
      "de.sig",
      "de.visit_occurrence_id",
      "de.effective_drug_dose",
      "de.dose_unit_concept_id",
      "de.lot_number",
      "de.refills"
    ];
    
    // Add date fields
    selectCols.push("de.drug_exposure_start_date as start_date");
    
    // Use end date if available, otherwise use start date
    selectCols.push("COALESCE(de.drug_exposure_end_date, de.drug_exposure_start_date) as end_date");
    
    // Source concept if specifically requested
    if (criteria.DrugSourceConcept || criteria.drugSourceConcept) {
      selectCols.push("de.drug_source_concept_id");
    }
    
    return selectCols;
  }
  
  /**
   * Resolve join clauses for the criteria
   * @param criteria Drug exposure criteria
   * @returns Array of join clause expressions
   */
  protected resolveJoinClauses(criteria: DrugExposureCriteria): string[] {
    return [];
  }
  
  /**
   * Resolve where clauses for the criteria
   * @param criteria Drug exposure criteria
   * @returns Array of where clause expressions
   */
  protected resolveWhereClauses(criteria: DrugExposureCriteria): string[] {
    // Start with base where clauses from parent class
    const whereClauses = super.resolveWhereClauses(criteria);
    
    // Support both PascalCase and camelCase property names
    const occurrenceStartDate = criteria.OccurrenceStartDate || criteria.occurrenceStartDate;
    const occurrenceEndDate = criteria.OccurrenceEndDate || criteria.occurrenceEndDate;
    const drugType = criteria.DrugType || criteria.drugType;
    const drugTypeExclude = criteria.DrugTypeExclude || criteria.drugTypeExclude;
    const route = criteria.Route || criteria.route;
    const routeExclude = criteria.RouteExclude || criteria.routeExclude;
    const doseUnit = criteria.DoseUnit || criteria.doseUnit;
    const doseUnitExclude = criteria.DoseUnitExclude || criteria.doseUnitExclude;
    const daysSupply = criteria.DaysSupply || criteria.daysSupply;
    const refills = criteria.Refills || criteria.refills;
    const lotNumber = criteria.LotNumber || criteria.lotNumber;
    const effectiveDrugDose = criteria.EffectiveDrugDose || criteria.effectiveDrugDose;
    
    // Occurrence start date
    if (occurrenceStartDate) {
      whereClauses.push(BuilderUtils.buildDateRangeClause("de.drug_exposure_start_date", occurrenceStartDate));
    }
    
    // Occurrence end date
    if (occurrenceEndDate) {
      whereClauses.push(BuilderUtils.buildDateRangeClause("de.drug_exposure_end_date", occurrenceEndDate));
    }
    
    // Drug type
    if (drugType && drugType.length > 0) {
      const conceptIdField = drugType[0].CONCEPT_ID ? 'CONCEPT_ID' : 'conceptId';
      const conceptIds = drugType.map(c => c[conceptIdField]).join(',');
      whereClauses.push(`de.drug_type_concept_id ${drugTypeExclude ? 'not' : ''} in (${conceptIds})`);
    }
    
    // Route
    if (route && route.length > 0) {
      const conceptIdField = route[0].CONCEPT_ID ? 'CONCEPT_ID' : 'conceptId';
      const conceptIds = route.map(c => c[conceptIdField]).join(',');
      whereClauses.push(`de.route_concept_id ${routeExclude ? 'not' : ''} in (${conceptIds})`);
    }
    
    // Dose unit
    if (doseUnit && doseUnit.length > 0) {
      const conceptIdField = doseUnit[0].CONCEPT_ID ? 'CONCEPT_ID' : 'conceptId';
      const conceptIds = doseUnit.map(c => c[conceptIdField]).join(',');
      whereClauses.push(`de.dose_unit_concept_id ${doseUnitExclude ? 'not' : ''} in (${conceptIds})`);
    }
    
    // Days supply range filter
    if (daysSupply) {
      const op = daysSupply.Op || daysSupply.op || "gt";
      const value = daysSupply.Value || daysSupply.value || 0;
      
      switch (op.toLowerCase()) {
        case "eq":
          whereClauses.push(`de.days_supply = ${value}`);
          break;
        case "gt":
          whereClauses.push(`de.days_supply > ${value}`);
          break;
        case "gte":
          whereClauses.push(`de.days_supply >= ${value}`);
          break;
        case "lt":
          whereClauses.push(`de.days_supply < ${value}`);
          break;
        case "lte":
          whereClauses.push(`de.days_supply <= ${value}`);
          break;
        case "bt":
          const extent = daysSupply.Extent || daysSupply.extent || 0;
          whereClauses.push(`de.days_supply between ${value} and ${extent}`);
          break;
      }
    }
    
    // Refills range filter
    if (refills) {
      const op = refills.Op || refills.op || "gt";
      const value = refills.Value || refills.value || 0;
      
      switch (op.toLowerCase()) {
        case "eq":
          whereClauses.push(`de.refills = ${value}`);
          break;
        case "gt":
          whereClauses.push(`de.refills > ${value}`);
          break;
        case "gte":
          whereClauses.push(`de.refills >= ${value}`);
          break;
        case "lt":
          whereClauses.push(`de.refills < ${value}`);
          break;
        case "lte":
          whereClauses.push(`de.refills <= ${value}`);
          break;
        case "bt":
          const extent = refills.Extent || refills.extent || 0;
          whereClauses.push(`de.refills between ${value} and ${extent}`);
          break;
      }
    }
    
    // Effective drug dose range filter
    if (effectiveDrugDose) {
      const op = effectiveDrugDose.Op || effectiveDrugDose.op || "gt";
      const value = effectiveDrugDose.Value || effectiveDrugDose.value || 0;
      
      switch (op.toLowerCase()) {
        case "eq":
          whereClauses.push(`de.effective_drug_dose = ${value}`);
          break;
        case "gt":
          whereClauses.push(`de.effective_drug_dose > ${value}`);
          break;
        case "gte":
          whereClauses.push(`de.effective_drug_dose >= ${value}`);
          break;
        case "lt":
          whereClauses.push(`de.effective_drug_dose < ${value}`);
          break;
        case "lte":
          whereClauses.push(`de.effective_drug_dose <= ${value}`);
          break;
        case "bt":
          const extent = effectiveDrugDose.Extent || effectiveDrugDose.extent || 0;
          whereClauses.push(`de.effective_drug_dose between ${value} and ${extent}`);
          break;
      }
    }
    
    // Lot number filter
    if (lotNumber) {
      const op = lotNumber.Op || lotNumber.op || "contains";
      const text = lotNumber.Text || lotNumber.text || "";
      
      if (text.length > 0) {
        switch (op.toLowerCase()) {
          case "contains":
            whereClauses.push(`de.lot_number like '%${text}%'`);
            break;
          case "startswith":
            whereClauses.push(`de.lot_number like '${text}%'`);
            break;
          case "endswith":
            whereClauses.push(`de.lot_number like '%${text}'`);
            break;
          case "exact":
            whereClauses.push(`de.lot_number = '${text}'`);
            break;
        }
      }
    }
    
    return whereClauses;
  }
}

export default DrugExposureSqlBuilder;