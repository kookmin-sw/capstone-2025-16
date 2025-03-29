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
  ConditionOccurrence,
  DeviceExposure,
  DrugExposure,
  Observation,
  Specimen,
  TextFilter
} from '../../cohortdefinition/CohortExpression';

export class TextCheckerFactory extends BaseCheckerFactory {
  private static readonly WARNING_EMPTY_VALUE = "%s in the %s has empty %s value";

  private constructor(reporter: WarningReporter, groupName: string) {
    super(reporter, groupName);
  }

  public static getFactory(reporter: WarningReporter, groupName: string): TextCheckerFactory {
    return new TextCheckerFactory(reporter, groupName);
  }

  protected getCheck(criteria: Criteria): (criteria: Criteria) => void {
    if (criteria instanceof ConditionOccurrence) {
      return (c: Criteria) => {
        const co = c as ConditionOccurrence;
        this.checkText(co.StopReason, Constants.Criteria.CONDITION_OCCURRENCE, Constants.Attributes.STOP_REASON_ATTR);
      };
    } else if (criteria instanceof DeviceExposure) {
      return (c: Criteria) => {
        const de = c as DeviceExposure;
        this.checkText(de.UniqueDeviceId, Constants.Criteria.DEVICE_EXPOSURE, Constants.Attributes.UNIQUE_DEVICE_ID_ATTR);
      };
    } else if (criteria instanceof DrugExposure) {
      return (c: Criteria) => {
        const de = c as DrugExposure;
        this.checkText(de.StopReason, Constants.Criteria.DRUG_EXPOSURE, Constants.Attributes.STOP_REASON_ATTR);
        this.checkText(de.LotNumber, Constants.Criteria.DRUG_EXPOSURE, Constants.Attributes.LOT_NUMBER_ATTR);
      };
    } else if (criteria instanceof Observation) {
      return (c: Criteria) => {
        const o = c as Observation;
        this.checkText(o.ValueAsString, Constants.Criteria.OBSERVATION, Constants.Attributes.VALUE_AS_STRING_ATTR);
      };
    } else if (criteria instanceof Specimen) {
      return (c: Criteria) => {
        const specimen = c as Specimen;
        // Convert string to TextFilter if needed
        const sourceId = this.toTextFilter(specimen.SourceId);
        this.checkText(sourceId, Constants.Criteria.SPECIMEN, Constants.Attributes.SOURCE_ID_ATTR);
      };
    }
    
    return () => {}; // Default no-op function
  }

  protected getCheckDemographic(criteria: DemographicCriteria): (criteria: DemographicCriteria) => void {
    // There are no text filters in demographic
    return () => {};
  }

  // Helper method to convert string to TextFilter
  private toTextFilter(value: any): TextFilter | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    
    if (typeof value === 'string') {
      const textFilter = new TextFilter();
      textFilter.Text = value;
      textFilter.Op = "contains";
      return textFilter;
    }
    
    return value as TextFilter;
  }
  
  private checkText(text: TextFilter | undefined, criteriaName: string, attribute: string): void {
    const warning = (t: string) => this.reporter.add(t, this.groupName, criteriaName, attribute);
    
    Operations.match<TextFilter | undefined, void>(text)
      .when(r => r !== undefined && r !== null && r.Text === undefined)
      .then(() => warning(TextCheckerFactory.WARNING_EMPTY_VALUE));
  }
}