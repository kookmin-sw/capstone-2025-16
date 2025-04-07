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

import { CohortExpression, CorelatedCriteria, ObservationFilter, Window } from '../../cohortdefinition/CohortExpression';
import { BaseCorelatedCriteriaCheck } from './BaseCorelatedCriteriaCheck';
import { WarningReporter } from './WarningReporter';
import { WarningSeverity } from '../warnings/WarningSeverity';
import { CriteriaNameHelper } from '../utils/CriteriaNameHelper';
import { Comparisons } from './Comparisons';
import { Operations } from '../operations/Operations';

export class TimeWindowCheck extends BaseCorelatedCriteriaCheck {
  private static readonly WARNING = "%s criteria have time window range that is longer than required time for initial event";
  private observationFilter?: ObservationFilter;
  
  protected defineSeverity(): WarningSeverity {
    return WarningSeverity.INFO;
  }
  
  protected beforeCheck(reporter: WarningReporter, expression: CohortExpression): void {
    // Convert observationWindow to ObservationFilter for compatibility
    if (expression.PrimaryCriteria?.ObservationWindow) {
      const window = expression.PrimaryCriteria.ObservationWindow;
      
      // Create a filter that has both the ObservationFilter properties and any properties needed for Window comparison
      this.observationFilter = {
        // ObservationFilter required properties
        observationTypeExclude: false,
        observationType: [],
        
        // Properties from window that don't cause TypeScript errors
        ...(window as any), // Copy all properties from window using spread operator
      };
    }
  }
  
  protected checkCriteria(criteria: CorelatedCriteria, groupName: string, reporter: WarningReporter): void {
    const name = groupName + " " + CriteriaNameHelper.getCriteriaName(criteria.Criteria);
    
    Operations.match<CorelatedCriteria, void>(criteria)
      .when(c => 
        c.StartWindow !== undefined && 
        c.StartWindow !== null && 
        this.observationFilter !== undefined && 
        Comparisons.compareTo(this.observationFilter, c.StartWindow) < 0)
      .then(() => reporter.add(TimeWindowCheck.WARNING, name));
  }
}