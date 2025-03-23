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

import { ConceptSetExpression } from './ConceptSetExpression';
import { Concept } from './Concept';
import { SqlRender } from '../../sqlrender';
import { ResourceHelper } from '../helper/ResourceHelper';
import { BuilderUtils } from '../cohortdefinition/builders/BuilderUtils';

export class ConceptSetExpressionQueryBuilder {
  
  private static readonly MAX_IN_LENGTH = 1000; // Oracle limitation

  /**
   * Builds a SQL query for a concept set expression
   * @param expression ConceptSetExpression to build the query for
   * @returns SQL query string
   */
  public static buildExpressionQuery(expression: ConceptSetExpression): string {
    if (!expression || !expression.Items || expression.Items.length === 0) {
      return "";
    }
    
    // Handle included concepts
    const includeConcepts: Concept[] = [];
    const includeDescendantConcepts: Concept[] = [];
    const includeMappedConcepts: Concept[] = [];
    const includeMappedDescendantConcepts: Concept[] = [];

    // Handle excluded concepts
    const excludeConcepts: Concept[] = [];
    const excludeDescendantConcepts: Concept[] = [];
    const excludeMappedConcepts: Concept[] = [];
    const excludeMappedDescendantConcepts: Concept[] = [];
    
    // Populate each subset of concepts from the flags set in each concept set item
    for (const item of expression.Items) {
      if (!item.IsExcluded) {
        includeConcepts.push(item.Concept);
        
        if (item.IncludeDescendants) {
          includeDescendantConcepts.push(item.Concept);
        }
        
        if (item.IncludeMapped) {
          includeMappedConcepts.push(item.Concept);
          if (item.IncludeDescendants) {
            includeMappedDescendantConcepts.push(item.Concept);
          }
        }
      } else {
        excludeConcepts.push(item.Concept);
        
        if (item.IncludeDescendants) {
          excludeDescendantConcepts.push(item.Concept);
        }
        
        if (item.IncludeMapped) {
          excludeMappedConcepts.push(item.Concept);
          if (item.IncludeDescendants) {
            excludeMappedDescendantConcepts.push(item.Concept);
          }
        }
      }
    }
    
    // Build concept set query
    const conceptSetIncludeTemplate = ResourceHelper.GetResourceAsString("vocabulary/sql/conceptSetInclude.sql");
    const conceptSetExcludeTemplate = ResourceHelper.GetResourceAsString("vocabulary/sql/conceptSetExclude.sql");
    
    // Build the include query
    const includeQuery = this.buildConceptSetQuery(
      includeConcepts,
      includeDescendantConcepts, 
      includeMappedConcepts, 
      includeMappedDescendantConcepts
    );
    
    let conceptSetQuery = SqlRender.renderSql(conceptSetIncludeTemplate, ["includeQuery"], [includeQuery]);
    
    // Add exclude query if needed
    if (excludeConcepts.length > 0) {
      const excludeQuery = this.buildConceptSetQuery(
        excludeConcepts, 
        excludeDescendantConcepts, 
        excludeMappedConcepts, 
        excludeMappedDescendantConcepts
      );
      
      const excludeClause = SqlRender.renderSql(conceptSetExcludeTemplate, ["excludeQuery"], [excludeQuery]);
      conceptSetQuery += excludeClause;
    }
    
    return conceptSetQuery;
  }

  /**
   * Builds concept set sub-query from concepts and descendant concepts
   */
  private static buildConceptSetSubQuery(
    concepts: Concept[],
    descendantConcepts: Concept[]
  ): string {
    const queries: string[] = [];
    const conceptSetQueryTemplate = ResourceHelper.GetResourceAsString("vocabulary/sql/conceptSetQuery.sql");
    const conceptSetDescendantsTemplate = ResourceHelper.GetResourceAsString("vocabulary/sql/conceptSetDescendants.sql");
    
    if (concepts.length > 0) {
      const conceptIds = concepts.map(concept => concept.ConceptId);
      const inClause = BuilderUtils.splitInClause("concept_id", conceptIds, this.MAX_IN_LENGTH);
      queries.push(conceptSetQueryTemplate.replace("@conceptIdIn", inClause));
    }
    
    if (descendantConcepts.length > 0) {
      const conceptIds = descendantConcepts.map(concept => concept.ConceptId);
      const inClause = BuilderUtils.splitInClause("ca.ancestor_concept_id", conceptIds, this.MAX_IN_LENGTH);
      queries.push(conceptSetDescendantsTemplate.replace("@conceptIdIn", inClause));
    }
    
    return queries.join("UNION");
  }

  /**
   * Builds a mapped concept set query
   */
  private static buildConceptSetMappedQuery(
    mappedConcepts: Concept[],
    mappedDescendantConcepts: Concept[]
  ): string {
    const conceptSetQuery = this.buildConceptSetSubQuery(mappedConcepts, mappedDescendantConcepts);
    const conceptSetMappedTemplate = ResourceHelper.GetResourceAsString("vocabulary/sql/conceptSetMapped.sql");
    return conceptSetMappedTemplate.replace("@conceptsetQuery", conceptSetQuery);
  }

  /**
   * Builds a complete concept set query
   */
  private static buildConceptSetQuery(
    concepts: Concept[],
    descendantConcepts: Concept[],
    mappedConcepts: Concept[],
    mappedDescendantConcepts: Concept[]
  ): string {
    if (concepts.length === 0) {
      return "select concept_id from @vocabulary_database_schema.CONCEPT where 0=1";
    }
    
    let conceptSetQuery = this.buildConceptSetSubQuery(concepts, descendantConcepts);
    
    if (mappedConcepts.length > 0 || mappedDescendantConcepts.length > 0) {
      // 이 코드는 Java 구현을 정확히 따릅니다 - 첫 번째 호출은 사용되지 않음
      this.buildConceptSetMappedQuery(mappedConcepts, mappedDescendantConcepts);
      conceptSetQuery += "UNION\n" + this.buildConceptSetMappedQuery(mappedConcepts, mappedDescendantConcepts);
    }
    
    return conceptSetQuery;
  }
  
  /**
   * Builds a query for concept set with explicit IDs
   */
  public static buildExpressionQueryIgnoreConceptSetTable(
    includedIds: number[], 
    excludedIds: number[] = [], 
    includeDescendantIds: number[] = [],
    includeMappedIds: number[] = []
  ): string {
    // Convert IDs to Concept objects
    const includeConcepts: Concept[] = includedIds.map(id => {
      const concept = new Concept();
      concept.ConceptId = id;
      return concept;
    });
    
    const excludeConcepts: Concept[] = excludedIds.map(id => {
      const concept = new Concept();
      concept.ConceptId = id;
      return concept;
    });
    
    const includeDescendantConcepts: Concept[] = includeDescendantIds.map(id => {
      const concept = new Concept();
      concept.ConceptId = id;
      return concept;
    });
    
    const includeMappedConcepts: Concept[] = includeMappedIds.map(id => {
      const concept = new Concept();
      concept.ConceptId = id;
      return concept;
    });
    
    // Empty for this simplified version
    const includeMappedDescendantConcepts: Concept[] = [];
    const excludeDescendantConcepts: Concept[] = [];
    const excludeMappedConcepts: Concept[] = [];
    const excludeMappedDescendantConcepts: Concept[] = [];
    
    // Build concept set query
    const conceptSetIncludeTemplate = ResourceHelper.GetResourceAsString("vocabulary/sql/conceptSetInclude.sql");
    const conceptSetExcludeTemplate = ResourceHelper.GetResourceAsString("vocabulary/sql/conceptSetExclude.sql");
    
    // Build the include query
    const includeQuery = this.buildConceptSetQuery(
      includeConcepts,
      includeDescendantConcepts, 
      includeMappedConcepts, 
      includeMappedDescendantConcepts
    );
    
    let conceptSetQuery = SqlRender.renderSql(conceptSetIncludeTemplate, ["includeQuery"], [includeQuery]);
    
    // Add exclude query if needed
    if (excludeConcepts.length > 0) {
      const excludeQuery = this.buildConceptSetQuery(
        excludeConcepts, 
        excludeDescendantConcepts, 
        excludeMappedConcepts, 
        excludeMappedDescendantConcepts
      );
      
      const excludeClause = SqlRender.renderSql(conceptSetExcludeTemplate, ["excludeQuery"], [excludeQuery]);
      conceptSetQuery += excludeClause;
    }
    
    return conceptSetQuery;
  }
  
  /**
   * Builds a query without exclusions
   */
  public static buildExpressionQueryNoExclude(
    includedIds: number[],
    includeDescendantIds: number[] = [],
    includeMappedIds: number[] = []
  ): string {
    return this.buildExpressionQueryIgnoreConceptSetTable(includedIds, [], includeDescendantIds, includeMappedIds);
  }
  
  /**
   * Builds a query with only direct concept IDs
   */
  public static buildExpressionQueryOnly(
    includedIds: number[]
  ): string {
    return this.buildExpressionQueryIgnoreConceptSetTable(includedIds, [], [], []);
  }
  
  /**
   * Builds a query for descendants of specified concepts
   */
  public static buildDescendantQuery(
    conceptIds: number[]
  ): string {
    if (!conceptIds || conceptIds.length === 0) {
      throw new Error("Must specify at least one concept");
    }
    
    const descendantConcepts: Concept[] = conceptIds.map(id => {
      const concept = new Concept();
      concept.ConceptId = id;
      return concept;
    });
    
    return this.buildConceptSetSubQuery([], descendantConcepts);
  }
}

export default ConceptSetExpressionQueryBuilder;