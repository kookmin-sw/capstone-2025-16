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

import { Execution } from '../operations/Execution';
import { WarningReporter } from './WarningReporter';

export class WarningReporterHelper {
  private reporter: WarningReporter;
  private template: string;
  private primaryGroup: string;

  constructor(reporter: WarningReporter, template: string, primaryGroup: string) {
    this.reporter = reporter;
    this.template = template;
    this.primaryGroup = primaryGroup;
  }

  public addWarning(secondaryGroup: string): Execution {
    return {
      apply: () => this.reporter.add(this.template, this.primaryGroup, secondaryGroup)
    };
  }
}