/*
 *   Copyright 2017 Observational Health Data Sciences and Informatics
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 *   Authors: Vitaly Koulakov
 *
 */

import { ConceptSet } from '../../cohortdefinition/ConceptSet';
import {
  Criteria,
  ConditionEra,
  ConditionOccurrence,
  Death,
  DeviceExposure,
  DoseEra,
  DrugEra,
  DrugExposure,
  Measurement,
  Observation,
  ProcedureOccurrence,
  Specimen,
  VisitOccurrence,
  VisitDetail,
  LocationRegion,
  ConceptSetSelection
} from '../../cohortdefinition/CohortExpression';

export class CriteriaCheckerFactory {
  private conceptSet: ConceptSet;

  private constructor(conceptSet: ConceptSet) {
    this.conceptSet = conceptSet;
  }

  static getFactory(conceptSet: ConceptSet): CriteriaCheckerFactory {
    return new CriteriaCheckerFactory(conceptSet);
  }

  getCriteriaChecker(criteria: Criteria): (c: Criteria) => boolean {
    let result = (c: Criteria) => false;
    
    if (criteria.hasOwnProperty('ConditionEra')) {
      result = (c: Criteria) => (c as ConditionEra).CodesetId === this.conceptSet.Id;
    } else if (criteria.hasOwnProperty('ConditionOccurrence')) {
      result = (c: Criteria) => {
        const co = c as ConditionOccurrence;
        return co.CodesetId === this.conceptSet.Id || co.ConditionSourceConcept === this.conceptSet.Id;
      };
    } else if (criteria.hasOwnProperty('Death')) {
      result = (c: Criteria) => (c as Death).CodesetId === this.conceptSet.Id;
    } else if (criteria.hasOwnProperty('DeviceExposure')) {
      result = (c: Criteria) => (c as DeviceExposure).CodesetId === this.conceptSet.Id;
    } else if (criteria.hasOwnProperty('DoseEra')) {
      result = (c: Criteria) => (c as DoseEra).CodesetId === this.conceptSet.Id;
    } else if (criteria.hasOwnProperty('DrugEra')) {
      result = (c: Criteria) => (c as DrugEra).CodesetId === this.conceptSet.Id;
    } else if (criteria.hasOwnProperty('DrugExposure')) {
      result = (c: Criteria) => {
        const de = c as DrugExposure;
        return de.CodesetId === this.conceptSet.Id || de.DrugSourceConcept === this.conceptSet.Id;
      };
    } else if (criteria.hasOwnProperty('Measurement')) {
      result = (c: Criteria) => {
        const m = c as Measurement;
        return m.CodesetId === this.conceptSet.Id || m.MeasurementSourceConcept === this.conceptSet.Id;
      };
    } else if (criteria.hasOwnProperty('Observation')) {
      result = (c: Criteria) => {
        const o = c as Observation;
        return o.CodesetId === this.conceptSet.Id || o.ObservationSourceConcept === this.conceptSet.Id;
      };
    } else if (criteria.hasOwnProperty('ProcedureOccurrence')) {
      result = (c: Criteria) => {
        const po = c as ProcedureOccurrence;
        return po.CodesetId === this.conceptSet.Id || po.ProcedureSourceConcept === this.conceptSet.Id;
      };
    } else if (criteria.hasOwnProperty('Specimen')) {
      result = (c: Criteria) => (c as Specimen).CodesetId === this.conceptSet.Id;
    } else if (criteria.hasOwnProperty('VisitOccurrence')) {
      result = (c: Criteria) => (c as VisitOccurrence).CodesetId === this.conceptSet.Id;
    } else if (criteria.hasOwnProperty('VisitDetail')) {
      result = (c: Criteria) => {
        const vd = c as VisitDetail;
        return vd.CodesetId === this.conceptSet.Id || this.checkConceptSetSelection(c);
      };
    } else if (criteria.hasOwnProperty('LocationRegion')) {
      result = (c: Criteria) => (c as LocationRegion).CodesetId === this.conceptSet.Id;
    }
    
    return result;
  }

  private checkConceptSetSelection(criteria: Criteria): boolean {
    let result = false;
    for (const supplier of this.getSuppliers(criteria)) {
      const conceptSetSelection = supplier();
      if (conceptSetSelection) {
        result = result || conceptSetSelection.CodesetId === this.conceptSet.Id;
      }
    }
    return result;
  }

  private getSuppliers(criteria: Criteria): Array<() => ConceptSetSelection | undefined> {
    const suppliers: Array<() => ConceptSetSelection | undefined> = [];
    
    if (criteria.hasOwnProperty('VisitDetail')) {
      const vd = criteria as VisitDetail;
      
      // Convert potentially numeric values to ConceptSetSelection objects
      suppliers.push(() => this.toConceptSetSelection(vd.PlaceOfServiceCS));
      suppliers.push(() => this.toConceptSetSelection(vd.GenderCS));
      suppliers.push(() => this.toConceptSetSelection(vd.ProviderSpecialtyCS));
      suppliers.push(() => this.toConceptSetSelection(vd.VisitDetailTypeCS));
    }
    
    return suppliers;
  }
  
  // Helper method to convert number to ConceptSetSelection if needed
  private toConceptSetSelection(value: any): ConceptSetSelection | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    
    if (typeof value === 'number') {
      return { 
        CodesetId: value, 
        Min: 1, 
        Max: 1 
      };
    }
    
    return value as ConceptSetSelection;
  }
}