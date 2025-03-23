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

import { Criteria, DemographicCriteria, CohortExpression } from '../../cohortdefinition/CohortExpression';
import { ICriteria, IDemographicCriteria } from '../../cohortdefinition/CriteriaInterfaces';
import { WarningReporter } from './WarningReporter';

export abstract class BaseCheckerFactory {
  protected groupName: string;
  protected reporter: WarningReporter;

  constructor(reporter: WarningReporter, groupName: string) {
    this.groupName = groupName;
    this.reporter = reporter;
  }

  // Main check method that handles different criteria types
  check(criteria: ICriteria | CohortExpression): void {
    if (this.isDemographicCriteria(criteria)) {
      this.checkDemographicCriteria(criteria);
    } else if (this.isCohortExpression(criteria)) {
      this.checkCohortExpression(criteria);
    } else {
      this.checkStandardCriteria(criteria as Criteria);
    }
  }

  // Type guards for determining criteria type
  private isDemographicCriteria(criteria: any): criteria is IDemographicCriteria {
    return criteria && criteria.CriteriaType === 'DemographicCriteria';
  }

  private isCohortExpression(criteria: any): criteria is CohortExpression {
    return criteria && 'primaryCriteria' in criteria;
  }

  // Specific check methods for each criteria type
  protected checkStandardCriteria(criteria: Criteria): void {
    this.getCheck(criteria)(criteria);
  }

  protected checkDemographicCriteria(criteria: IDemographicCriteria): void {
    this.getCheckDemographic(criteria as DemographicCriteria)(criteria as DemographicCriteria);
  }

  protected checkCohortExpression(expression: CohortExpression): void {
    // Default implementation does nothing, can be overridden by subclasses
  }

  // Abstract methods that derived classes must implement
  protected abstract getCheck(criteria: Criteria): (criteria: Criteria) => void;

  protected abstract getCheckDemographic(criteria: DemographicCriteria): (criteria: DemographicCriteria) => void;
}