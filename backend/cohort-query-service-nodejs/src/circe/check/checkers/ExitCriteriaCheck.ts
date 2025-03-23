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

import { CohortExpression, CustomEraStrategy } from '../../cohortdefinition/CohortExpression';
import { BaseCheck } from './BaseCheck';
import { WarningReporter } from './WarningReporter';
import { Operations } from '../operations/Operations';

export class ExitCriteriaCheck extends BaseCheck {
  private static readonly DRUG_CONCEPT_EMPTY_ERROR = "Drug concept set must be selected at Exit Criteria.";

  protected checkInternal(expression: CohortExpression, reporter: WarningReporter): void {
    Operations.match<any, void>(expression.EndStrategy)
      .isA(CustomEraStrategy)
      .then(s => Operations.match<CustomEraStrategy, void>(s as CustomEraStrategy)
        .when(customEraStrategy => 
          customEraStrategy.DrugCodesetId === undefined || 
          customEraStrategy.DrugCodesetId === null)
        .then(() => reporter.add(ExitCriteriaCheck.DRUG_CONCEPT_EMPTY_ERROR)));
  }
}