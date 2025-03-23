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

import { Check } from '../Check';
import { Warning } from '../warnings/Warning';
import { WarningSeverity } from '../warnings/WarningSeverity';
import { DefaultWarning } from '../warnings/DefaultWarning';
import { CohortExpression } from '../../cohortdefinition/CohortExpression';
import { WarningReporter } from './WarningReporter';

export abstract class BaseCheck implements Check {
  protected static readonly INCLUSION_RULE = "inclusion rule ";
  protected static readonly ADDITIONAL_RULE = "additional rule";
  protected static readonly INITIAL_EVENT = "initial event";

  check(expression: CohortExpression): Warning[] {
    const warnings: Warning[] = [];
    this.checkInternal(expression, this.defineReporter(warnings));
    return warnings;
  }

  protected defineSeverity(): WarningSeverity {
    return WarningSeverity.CRITICAL;
  }

  protected defineReporter(warnings: Warning[]): WarningReporter {
    return this.getReporter(this.defineSeverity(), warnings);
  }

  protected abstract checkInternal(expression: CohortExpression, reporter: WarningReporter): void;

  protected getReporter(severity: WarningSeverity, warnings: Warning[]): WarningReporter {
    return {
      add: (template: string, ...params: any[]) => {
        // Format template string with params
        let message = template;
        if (params && params.length > 0) {
          params.forEach((param, index) => {
            message = message.replace(`{${index}}`, param);
          });
        }
        warnings.push(new DefaultWarning(severity, message));
      }
    };
  }
}