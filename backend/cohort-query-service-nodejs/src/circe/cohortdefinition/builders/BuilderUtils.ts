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

import { Window, DateRange, NumericRange, TextFilter, DateAdjustment } from '../CohortExpression';

export class BuilderUtils {
  
  public static buildDateRangeClause(alias: string, range?: DateRange): string {
    if (!range) {
      return "";
    }
    
    const clauses: string[] = [];
    
    if (range.StartDate) {
      const startDate = this.formatDate(range.StartDate);
      clauses.push(`${alias} >= '${startDate}'`);
    }
    
    if (range.EndDate) {
      const endDate = this.formatDate(range.EndDate);
      clauses.push(`${alias} <= '${endDate}'`);
    }
    
    return clauses.length > 0 ? clauses.join(" AND ") : "";
  }
  
  public static buildNumericRangeClause(alias: string, range?: NumericRange): string {
    if (!range) {
      return "";
    }
    
    let clause = "";
    
    switch (range.Op) {
      case "eq":
        clause = `${alias} = ${range.Value}`;
        break;
      case "lt":
        clause = `${alias} < ${range.Value}`;
        break;
      case "lte":
        clause = `${alias} <= ${range.Value}`;
        break;
      case "gt":
        clause = `${alias} > ${range.Value}`;
        break;
      case "gte":
        clause = `${alias} >= ${range.Value}`;
        break;
      case "bt":
        if (range.Extent !== undefined) {
          clause = `${alias} BETWEEN ${range.Value} AND ${range.Extent}`;
        }
        break;
      case "!bt":
        if (range.Extent !== undefined) {
          clause = `${alias} NOT BETWEEN ${range.Value} AND ${range.Extent}`;
        }
        break;
      case "!eq":
        clause = `${alias} <> ${range.Value}`;
        break;
    }
    
    return clause;
  }
  
  public static buildTextFilterClause(alias: string, filter?: TextFilter): string {
    if (!filter || !filter.Text) {
      return "";
    }
    
    const escapedText = filter.Text.replace(/'/g, "''");
    
    switch (filter.Op) {
      case "contains":
        return `${alias} LIKE '%${escapedText}%'`;
      case "startsWith":
        return `${alias} LIKE '${escapedText}%'`;
      case "endsWith":
        return `${alias} LIKE '%${escapedText}'`;
      case "eq":
        return `${alias} = '${escapedText}'`;
      case "!eq":
        return `${alias} <> '${escapedText}'`;
    }
    
    return "";
  }
  
  public static buildWindowedCriteria(alias: string, window?: Window): string {
    if (!window) {
      return "";
    }
    
    const clauses: string[] = [];
    
    if (window.Start) {
      const startClause = this.buildNumericRangeClause(`DATEADD(day, ${window.Start.Value}, index_date)`, window.Start);
      if (startClause) {
        clauses.push(`${alias} ${startClause}`);
      }
    }
    
    if (window.End) {
      const endClause = this.buildNumericRangeClause(`DATEADD(day, ${window.End.Value}, index_date)`, window.End);
      if (endClause) {
        clauses.push(`${alias} ${endClause}`);
      }
    }
    
    return clauses.length > 0 ? clauses.join(" AND ") : "";
  }
  
  /**
   * Get the codeset join expression for a specific field and codeset ID
   * @param field The field to join on (e.g., "C.concept_id")
   * @param codesetId The codeset ID to filter by
   * @param includeSourceConcept Whether to include source concepts in the join
   * @param sourceField Optional source concept field to join on
   * @returns SQL join clause for the codeset
   */
  public static getCodesetJoinExpression(field: string, codesetId: number, includeSourceConcept: boolean = false, sourceField?: string): string {
    if (!includeSourceConcept || !sourceField) {
      return `JOIN #Codesets CS on (${field} = CS.concept_id and CS.codeset_id = ${codesetId})`;
    } else {
      return `LEFT JOIN #Codesets CS on ((${field} = CS.concept_id OR ${sourceField} = CS.concept_id) and CS.codeset_id = ${codesetId})`;
    }
  }
  
  public static getCodesetInExpression(field: string, codesetId: number): string {
    return `${field} in (select concept_id from #Codesets where codeset_id = ${codesetId})`;
  }
  
  public static getConceptIdsFromConcepts(concepts: any[]): number[] {
    if (!concepts || concepts.length === 0) {
      return [];
    }
    
    // First check if we have PascalCase (CONCEPT_ID) or camelCase (conceptId)
    const firstConcept = concepts[0];
    const conceptIdField = firstConcept.CONCEPT_ID !== undefined ? 'CONCEPT_ID' : 'conceptId';
    
    // Filter valid concepts and extract IDs
    return concepts
      .filter(concept => concept && concept[conceptIdField])
      .map(concept => concept[conceptIdField]);
  }
  
  public static getDateAdjustmentExpression(alias: string, adjustment?: DateAdjustment): string {
    if (!adjustment) {
      return alias;
    }
    
    if (adjustment.StartOffset !== undefined) {
      return `DATEADD(day, ${adjustment.StartOffset || 0}, ${alias})`;
    }
    
    return alias;
  }
  
  public static getStartDateExpression(baseAlias: string, adjustment?: DateAdjustment): string {
    if (!adjustment) {
      return `${baseAlias}.start_date`;
    }
    
    // Source date field based on StartWith
    const sourceDateField = adjustment.StartWith === 'END_DATE' 
      ? `${baseAlias}.end_date` 
      : `${baseAlias}.start_date`;
      
    // Apply offset
    return `DATEADD(day, ${adjustment.StartOffset || 0}, ${sourceDateField})`;
  }
  
  public static getEndDateExpression(baseAlias: string, adjustment?: DateAdjustment): string {
    if (!adjustment) {
      return `${baseAlias}.end_date`;
    }
    
    // Source date field based on EndWith
    const sourceDateField = adjustment.EndWith === 'START_DATE' 
      ? `${baseAlias}.start_date` 
      : `${baseAlias}.end_date`;
      
    // Apply offset
    return `DATEADD(day, ${adjustment.EndOffset || 0}, ${sourceDateField})`;
  }
  
  public static dateStringToSql(dateString: string): string {
    if (!dateString) return "NULL";
    return `'${dateString}'`; // For SQL Server
  }
  
  private static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  /**
   * Handles splitting large IN clauses to accommodate Oracle's IN clause limitation
   * @param fieldName The field name for the IN clause
   * @param ids Array of IDs to include in the IN clause
   * @param maxSize Maximum size for each IN clause (for Oracle, typically 1000)
   * @returns An SQL condition with IN clauses properly formatted
   */
  public static splitInClause(fieldName: string, ids: number[], maxSize: number): string {
    if (!ids || ids.length === 0) {
      return "0 = 1"; // Return false condition if no IDs
    }
    
    if (ids.length <= maxSize) {
      // If IDs fit within maxSize, return simple IN clause
      return `${fieldName} in (${ids.join(',')})`;
    } else {
      // Split IDs into chunks and create OR conditions with multiple IN clauses
      const clauses: string[] = [];
      for (let i = 0; i < ids.length; i += maxSize) {
        const chunk = ids.slice(i, Math.min(i + maxSize, ids.length));
        clauses.push(`${fieldName} in (${chunk.join(',')})`);
      }
      return clauses.join(' OR ');
    }
  }
}

export default BuilderUtils;