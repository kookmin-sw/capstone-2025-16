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

import { BaseValueCheck } from './BaseValueCheck';
import { BaseCheckerFactory } from './BaseCheckerFactory';
import { WarningReporter } from './WarningReporter';
import { TextCheckerFactory } from './TextCheckerFactory';
import { WarningSeverity } from '../warnings/WarningSeverity';

export class TextCheck extends BaseValueCheck {
  protected defineSeverity(): WarningSeverity {
    return WarningSeverity.WARNING;
  }

  protected getFactory(reporter: WarningReporter, name: string): BaseCheckerFactory {
    return TextCheckerFactory.getFactory(reporter, name);
  }
}