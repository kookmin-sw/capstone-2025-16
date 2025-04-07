/*******************************************************************************
 * Copyright 2025 Observational Health Data Sciences and Informatics
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *   http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/

import { ConceptSetExpression, ConceptSetItem } from '../vocabulary/ConceptSetExpression';

export class ConceptSet {
  Id: number = 0;
  Name: string = '';
  Expression: ConceptSetExpression = new ConceptSetExpression();
  
  constructor(data?: any) {
    if (data) {
      this.Id = data.id || data.Id || 0;
      this.Name = data.name || data.Name || '';
      
      if (data.expression || data.Expression) {
        // Create a new expression and initialize its items
        const expr = new ConceptSetExpression();
        
        const expression = data.expression || data.Expression;
        if (Array.isArray(expression.items) || Array.isArray(expression.Items)) {
          const items = expression.items || expression.Items || [];
          expr.Items = items.map((item: any) => {
            // Create new ConceptSetItem using the imported class
            const newItem = new ConceptSetItem();
            
            // Copy properties from the source item
            if (item.concept || item.Concept) {
              // PascalCase만 사용
              const concept = item.concept || item.Concept;
              newItem.Concept = {
                // UPPER_CASE에서만 가져온다 (Java 원본 코드와 일치)
                ConceptId: concept.CONCEPT_ID || 0,
                ConceptName: concept.CONCEPT_NAME || "",
                StandardConcept: concept.STANDARD_CONCEPT,
                StandardConceptCaption: concept.STANDARD_CONCEPT_CAPTION,
                ConceptCode: concept.CONCEPT_CODE || "",
                DomainId: concept.DOMAIN_ID || "",
                VocabularyId: concept.VOCABULARY_ID || "",
                ConceptClassId: concept.CONCEPT_CLASS_ID || "",
                InvalidReason: concept.INVALID_REASON,
                InvalidReasonCaption: concept.INVALID_REASON_CAPTION,
                // UI properties:
                IsExcluded: false,
                IncludeMapped: false
              };
            } else {
              newItem.Concept = {
                ConceptId: 0,
                ConceptName: "",
                ConceptCode: "",
                DomainId: "",
                VocabularyId: "",
                ConceptClassId: "",
                StandardConcept: null,
                InvalidReason: null,
                StandardConceptCaption: null,
                InvalidReasonCaption: null,
                IsExcluded: false,
                IncludeMapped: false
              };
            }
            
            // JSON은 camelCase를 사용하므로 정확히 camelCase만 확인
            newItem.IsExcluded = item.isExcluded || false;
            newItem.IncludeMapped = item.includeMapped || false;
            newItem.IncludeDescendants = item.includeDescendants || false;
            
            // Debug
            console.log(`Concept ID set to: ${newItem.Concept.ConceptId}, Type: ${typeof newItem.Concept.ConceptId}`);
            console.log(`Concept Name: ${newItem.Concept.ConceptName}`);
            if (!newItem.Concept.ConceptId) {
              console.warn("WARNING: ConceptId is not properly set in a concept item")
            }
            
            return newItem;
          });
        }
        
        this.Expression = expr;
      }
    }
  }
}

export default ConceptSet;