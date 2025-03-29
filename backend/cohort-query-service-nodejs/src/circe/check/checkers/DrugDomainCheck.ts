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

import { 
  CohortExpression, 
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
  CustomEraStrategy
} from '../../cohortdefinition/CohortExpression';
import { ConceptSet } from '../../cohortdefinition/ConceptSet';
import { Operations } from '../operations/Operations';
import { BaseCheck } from './BaseCheck';
import { WarningSeverity } from '../warnings/WarningSeverity';
import { WarningReporter } from './WarningReporter';

export class DrugDomainCheck extends BaseCheck {
  private static readonly MESSAGE = "%s %s used in initial event and not used for cohort exit criteria";
  private expression!: CohortExpression;

  protected defineSeverity(): WarningSeverity {
    return WarningSeverity.INFO;
  }

  protected checkInternal(expression: CohortExpression, reporter: WarningReporter): void {
    this.expression = expression;
    
    // Find all drug-related criteria from primary criteria
    const drugCriteria = (expression.PrimaryCriteria?.CriteriaList || [])
      .filter(criteria => criteria instanceof DrugExposure || criteria instanceof DrugEra || criteria instanceof DoseEra);
    
    // Get their codeset IDs
    const drugCodesetIds = drugCriteria
      .map(criteria => this.mapCriteria(criteria))
      .filter(codesetId => codesetId !== undefined) as number[];
    
    // Find concept sets that are NOT in the drug domain but are used in drug criteria
    let nonDrugConceptSets = drugCodesetIds
      .filter(codesetId => this.isConceptInDrugDomain(codesetId))
      .map(codesetId => this.mapConceptSet(codesetId))
      .filter(conceptSet => conceptSet !== null && conceptSet !== undefined) as ConceptSet[];
    
    // Exclude concepts used in the end strategy
    if (expression.EndStrategy instanceof CustomEraStrategy) {
      const eraStrategy = expression.EndStrategy as CustomEraStrategy;
      nonDrugConceptSets = nonDrugConceptSets.filter(conceptSet => conceptSet.Id !== eraStrategy.DrugCodesetId);
    }
    
    // Report warnings for any non-drug concept sets used in drug criteria
    if (nonDrugConceptSets.length > 0) {
      const names = nonDrugConceptSets.map(conceptSet => conceptSet.Name).join(", ");
      const title = nonDrugConceptSets.length > 1 ? "Concept sets" : "Concept set";
      reporter.add(DrugDomainCheck.MESSAGE, title, names);
    }
  }

  private mapCriteria(criteria: Criteria): number | undefined {
    return Operations.match<Criteria, number | undefined>(criteria)
      .isA(ConditionEra).thenReturn(c => (c as ConditionEra).CodesetId)
      .isA(ConditionOccurrence).thenReturn(c => (c as ConditionOccurrence).CodesetId)
      .isA(Death).thenReturn(c => (c as Death).CodesetId)
      .isA(DeviceExposure).thenReturn(c => (c as DeviceExposure).CodesetId)
      .isA(DoseEra).thenReturn(c => (c as DoseEra).CodesetId)
      .isA(DrugEra).thenReturn(c => (c as DrugEra).CodesetId)
      .isA(DrugExposure).thenReturn(c => (c as DrugExposure).CodesetId)
      .isA(Measurement).thenReturn(c => (c as Measurement).CodesetId)
      .isA(Observation).thenReturn(c => (c as Observation).CodesetId)
      .isA(ProcedureOccurrence).thenReturn(c => (c as ProcedureOccurrence).CodesetId)
      .isA(Specimen).thenReturn(c => (c as Specimen).CodesetId)
      .isA(VisitOccurrence).thenReturn(c => (c as VisitOccurrence).CodesetId)
      .isA(VisitDetail).thenReturn(c => (c as VisitDetail).CodesetId)
      .value();
  }

  private isConceptInDrugDomain(codesetId: number | undefined): boolean {
    if (codesetId === undefined || codesetId === null) return false;
    
    const conceptSet = (this.expression.ConceptSets || [])
      .find(cs => cs !== null && cs !== undefined && cs.Id === codesetId);
    
    if (!conceptSet) return false;
    
    // Check if the domain is a drug domain
    const isDrugDomain = (conceptSet.Expression?.Items || [])
      .some(item => {
        const domain = item.Concept?.DomainId;
        return domain && domain.toLowerCase() === "drug";
      });
    
    // Inverse the check - we want to return true if it's NOT in the drug domain
    // because we're looking for cases where a drug concept should be used but isn't
    return !isDrugDomain;
  }

  private mapConceptSet(codesetId: number | undefined): ConceptSet | null {
    if (codesetId === undefined || codesetId === null) return null;
    
    return (this.expression.ConceptSets || [])
      .find(cs => cs !== null && cs !== undefined && cs.Id === codesetId) || null;
  }
}