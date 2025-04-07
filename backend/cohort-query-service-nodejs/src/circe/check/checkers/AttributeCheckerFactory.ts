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
import { 
  Criteria, 
  DemographicCriteria
} from '../../cohortdefinition/CohortExpression';

export class AttributeCheckerFactory extends BaseCheckerFactory {
  private static readonly WARNING_EMPTY_VALUE = "%s in the %s does not have attributes";

  private constructor(reporter: WarningReporter, groupName: string) {
    super(reporter, groupName);
  }

  public static getFactory(reporter: WarningReporter, groupName: string): AttributeCheckerFactory {
    return new AttributeCheckerFactory(reporter, groupName);
  }

  protected getCheck(criteria: Criteria): (criteria: Criteria) => void {
    // Non-demographic criteria does not need to be checked,
    // as it always has observation period and occurence
    return () => {};
  }

  protected getCheckDemographic(criteria: DemographicCriteria): (criteria: DemographicCriteria) => void {
    return (c: DemographicCriteria) => {
      this.checkAttribute(Constants.Criteria.DEMOGRAPHIC,
        c.Age,
        c.Gender,
        c.Race,
        c.Ethnicity,
        c.OccurrenceStartDate,
        c.OccurrenceEndDate);
    };
  }

  private checkAttribute(criteriaName: string, ...attributes: any[]): void {
    const warning = (t: string) => this.reporter.add(t, this.groupName, criteriaName);
    
    const hasValue = attributes.some(a => a !== undefined && a !== null);
    if (!hasValue) {
      warning(AttributeCheckerFactory.WARNING_EMPTY_VALUE);
    }
  }
}