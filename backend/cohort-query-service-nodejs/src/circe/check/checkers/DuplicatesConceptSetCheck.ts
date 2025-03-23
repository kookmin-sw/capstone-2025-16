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

import { CohortExpression } from '../../cohortdefinition/CohortExpression';
import { ConceptSet } from '../../cohortdefinition/ConceptSet';
import { WarningSeverity } from '../warnings/WarningSeverity';
import { BaseCheck } from './BaseCheck';
import { Comparisons } from './Comparisons';
import { WarningReporter } from './WarningReporter';

export class DuplicatesConceptSetCheck extends BaseCheck {
  private static readonly DUPLICATES_WARNING = "Concept set %s contains the same concepts like %s";
  
  protected defineSeverity(): WarningSeverity {
    return WarningSeverity.WARNING;
  }
  
  protected checkInternal(expression: CohortExpression, reporter: WarningReporter): void {
    const conceptSets = expression.ConceptSets || [];
    
    if (conceptSets.length > 1) {
      const size = conceptSets.length;
      
      for (let i = 0; i <= size - 2; i++) {
        const conceptSet = conceptSets[i];
        const restOfArray = conceptSets.slice(i + 1);
        
        const duplicates = restOfArray.filter(cs => 
          Comparisons.compareConceptSets(conceptSet)(cs));
        
        if (duplicates.length > 0) {
          const names = duplicates
            .map(cs => cs.Name)
            .join(", ");
          
          reporter.add(DuplicatesConceptSetCheck.DUPLICATES_WARNING, conceptSet.Name, names);
        }
      }
    }
  }
}