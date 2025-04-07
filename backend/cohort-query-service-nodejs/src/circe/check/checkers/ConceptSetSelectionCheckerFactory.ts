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
 *   Authors: Sergey Suvorov
 *
 */

import { BaseCheckerFactory } from './BaseCheckerFactory';
import { WarningReporter } from './WarningReporter';
import { Constants } from '../Constants';
import { Operations } from '../operations/Operations';
import { 
  Criteria, 
  DemographicCriteria,
  VisitDetail,
  ConceptSetSelection
} from '../../cohortdefinition/CohortExpression';

export class ConceptSetSelectionCheckerFactory extends BaseCheckerFactory {
  private static readonly WARNING_EMPTY_VALUE = "%s in the %s has empty %s value";

  private constructor(reporter: WarningReporter, groupName: string) {
    super(reporter, groupName);
  }

  public static getFactory(reporter: WarningReporter, groupName: string): ConceptSetSelectionCheckerFactory {
    return new ConceptSetSelectionCheckerFactory(reporter, groupName);
  }

  protected getCheck(criteria: Criteria): (criteria: Criteria) => void {
    if (criteria instanceof VisitDetail) {
      return (c: Criteria) => {
        const vd = c as VisitDetail;
        
        // Convert number values to ConceptSetSelection objects if needed
        const visitDetailTypeCS = this.toConceptSetSelection(vd.VisitDetailTypeCS);
        const genderCS = this.toConceptSetSelection(vd.GenderCS);
        const providerSpecialtyCS = this.toConceptSetSelection(vd.ProviderSpecialtyCS);
        const placeOfServiceCS = this.toConceptSetSelection(vd.PlaceOfServiceCS);
        
        this.checkConcept(visitDetailTypeCS, Constants.Criteria.VISIT_DETAIL, Constants.Attributes.VISIT_DETAIL_TYPE_ATTR);
        this.checkConcept(genderCS, Constants.Criteria.VISIT_DETAIL, Constants.Attributes.GENDER_ATTR);
        this.checkConcept(providerSpecialtyCS, Constants.Criteria.VISIT_DETAIL, Constants.Attributes.PROVIDER_SPECIALITY_ATTR);
        this.checkConcept(placeOfServiceCS, Constants.Criteria.VISIT_DETAIL, Constants.Attributes.PLACE_OF_SERVICE_ATTR);
      };
    }
    
    return () => {}; // Default no-op function
  }
  
  // Helper method to convert a number to ConceptSetSelection if needed
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

  protected getCheckDemographic(criteria: DemographicCriteria): (criteria: DemographicCriteria) => void {
    return (c: DemographicCriteria) => {};
  }

  private checkConcept(conceptSetSelection: ConceptSetSelection | undefined, criteriaName: string, attribute: string): void {
    const warning = (t: string) => this.reporter.add(t, this.groupName, criteriaName, attribute);
    
    Operations.match<ConceptSetSelection | undefined, void>(conceptSetSelection)
      .when(r => r !== undefined && r !== null && r.CodesetId === undefined)
      .then(() => warning(ConceptSetSelectionCheckerFactory.WARNING_EMPTY_VALUE));
  }
}