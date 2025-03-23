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

import { ConceptSet } from '../../cohortdefinition/ConceptSet';
import { BaseWarning } from './BaseWarning';
import { WarningSeverity } from './WarningSeverity';

export class ConceptSetWarning extends BaseWarning {
  private template: string;
  private conceptSet: ConceptSet;
  ConceptSetId: number;
  
  constructor(severity: WarningSeverity, template: string, conceptSet: ConceptSet) {
    super(severity);
    this.template = template;
    this.conceptSet = conceptSet;
    this.ConceptSetId = conceptSet?.Id || 0;
  }
  
  getConceptSet(): ConceptSet {
    return this.conceptSet;
  }
  
  toMessage(): string {
    return this.template.replace('%s', this.conceptSet.Name);
  }
}