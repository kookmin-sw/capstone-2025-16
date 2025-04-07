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

import { CorelatedCriteria, DrugEra } from '../../cohortdefinition/CohortExpression';
import { Operations } from '../operations/Operations';
import { WarningSeverity } from '../warnings/WarningSeverity';
import { BaseCorelatedCriteriaCheck } from './BaseCorelatedCriteriaCheck';
import { WarningReporter } from './WarningReporter';

export class DrugEraCheck extends BaseCorelatedCriteriaCheck {
  private static readonly MISSING_DAYS_INFO = "Using drug era at %s criteria on medical claims (e.g., biologics) may not be accurate due to missing days supply information";
  
  protected defineSeverity(): WarningSeverity {
    return WarningSeverity.INFO;
  }
  
  protected checkCriteria(criteria: CorelatedCriteria, groupName: string, reporter: WarningReporter): void {
    Operations.match(criteria.Criteria)
      .isA(DrugEra)
      .then(c => Operations.match(criteria)
        .when(drugEra => 
          (!drugEra.StartWindow || 
           (drugEra.StartWindow.Start === undefined || drugEra.StartWindow.Start === null) && 
           (drugEra.StartWindow.End === undefined || drugEra.StartWindow.End === null)) &&
          (!drugEra.EndWindow || 
           (drugEra.EndWindow.Start === undefined || drugEra.EndWindow.Start === null)))
        .then(() => reporter.add(DrugEraCheck.MISSING_DAYS_INFO, groupName)));
  }
}