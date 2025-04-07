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

import { CohortExpression, CorelatedCriteria, Criteria, Death } from '../../cohortdefinition/CohortExpression';
import { Operations } from '../operations/Operations';
import { WarningSeverity } from '../warnings/WarningSeverity';
import { CriteriaNameHelper } from '../utils/CriteriaNameHelper';
import { BaseCorelatedCriteriaCheck } from './BaseCorelatedCriteriaCheck';
import { Comparisons } from './Comparisons';
import { WarningReporter } from './WarningReporter';

export class DeathTimeWindowCheck extends BaseCorelatedCriteriaCheck {
  private static readonly MESSAGE = "%s attempts to identify death event prior to index event. Events post-death may not be available";
  // Use the base class constant instead of defining a private one
  // private static readonly ADDITIONAL_RULE = "additional criteria";
  // Make this protected to match inheritance rules
  protected static readonly INITIAL_EVENT = "initial event";
  
  protected defineSeverity(): WarningSeverity {
    return WarningSeverity.WARNING;
  }
  
  protected checkCriteria(criteria: CorelatedCriteria, groupName: string, reporter: WarningReporter): void {
    const name = groupName + " " + CriteriaNameHelper.getCriteriaName(criteria.Criteria);
    
    Operations.match(criteria.Criteria)
      .isA(Death)
      .then(death => Operations.match(criteria)
        .when(c => Comparisons.isBefore(c.StartWindow))
        .then(() => reporter.add(DeathTimeWindowCheck.MESSAGE, name))
      );
  }
  
  protected internalCheck(expression: CohortExpression, reporter: WarningReporter): void {
    super.internalCheck(expression, reporter);
    
    if (expression.AdditionalCriteria) {
      this.checkCriteriaList(expression.AdditionalCriteria.CriteriaList, DeathTimeWindowCheck.ADDITIONAL_RULE, reporter);
    }
    
    this.checkCriteriaList(expression.PrimaryCriteria.CriteriaList, DeathTimeWindowCheck.INITIAL_EVENT, reporter);
  }
  
  private checkCriteriaList(criteriaList: any[] = [], groupName: string, reporter: WarningReporter): void {
    criteriaList.forEach(c => {
      let criteria: Criteria | null = null;
      
      if (c && c.Criteria) { // CorelatedCriteria
        criteria = c.Criteria;
        this.checkCriteria(c as CorelatedCriteria, groupName, reporter);
      } else if (c) { // Criteria
        criteria = c as Criteria;
      }
      
      if (criteria) {
        this.checkCriteriaGroup(criteria, groupName, reporter);
      }
    });
  }
}