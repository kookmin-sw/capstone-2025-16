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

import { StringUtils, Token } from './StringUtils';

/**
 * Special translations for BigQuery and Spark
 */
export class BigQuerySparkTranslate {
  
  /**
   * Translates DATEDIFF calls for BigQuery
   * @param sql Original SQL
   * @returns Translated SQL
   */
  public static translateDateDiff(sql: string): string {
    const tokens = StringUtils.tokenizeSql(sql);
    
    // Identify DATEDIFF patterns
    for (let i = 0; i < tokens.length - 1; i++) {
      if (tokens[i].text.toUpperCase() === 'DATEDIFF') {
        // Process DATEDIFF and translate to BigQuery syntax
        let level = 0;
        let start = tokens[i].start;
        let end = -1;
        
        // Find the matching parenthesis
        for (let j = i + 1; j < tokens.length; j++) {
          if (tokens[j].text === '(') {
            level++;
          } else if (tokens[j].text === ')') {
            level--;
            if (level === 0) {
              end = tokens[j].end;
              break;
            }
          }
        }
        
        if (end !== -1) {
          // Extract DATEDIFF arguments
          const dateDiffExpr = sql.substring(start, end);
          
          // Parse and reformat for BigQuery
          // Replace this with actual BigQuery-specific translation
          const translated = dateDiffExpr.replace(/DATEDIFF\s*\(\s*day\s*,\s*([^,]+),\s*([^)]+)\)/i, 
                                               'DATE_DIFF($2, $1, DAY)');
          
          // Apply the translation
          sql = sql.substring(0, start) + translated + sql.substring(end);
          
          // Retokenize after modification
          tokens.length = 0;
          StringUtils.tokenizeSql(sql).forEach(t => tokens.push(t));
          i = 0; // Restart the search
        }
      }
    }
    
    return sql;
  }
  
  /**
   * Translates specific functions for Spark SQL
   * @param sql Original SQL
   * @returns Translated SQL
   */
  public static translateForSpark(sql: string): string {
    // Simple replacements for common SQL Server functions
    sql = sql.replace(/DATEFROMPARTS\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/gi, 
                      'make_date($1, $2, $3)');
    
    // DATEADD translation
    sql = sql.replace(/DATEADD\s*\(\s*day\s*,\s*([^,]+),\s*([^)]+)\)/gi,
                      'date_add($2, $1)');
    
    return sql;
  }
  
  /**
   * Translates join syntax for BigQuery
   * @param sql Original SQL
   * @returns Translated SQL
   */
  public static translateJoinSyntax(sql: string): string {
    const tokens = StringUtils.tokenizeSql(sql);
    
    // Look for JOIN ... ON syntax
    for (let i = 0; i < tokens.length - 2; i++) {
      if ((tokens[i].text.toUpperCase() === 'JOIN' || 
           tokens[i].text.toUpperCase() === 'INNER JOIN' || 
           tokens[i].text.toUpperCase() === 'LEFT JOIN' || 
           tokens[i].text.toUpperCase() === 'RIGHT JOIN') && 
          !tokens[i].inQuotes) {
        
        // Find the ON keyword
        for (let j = i + 1; j < tokens.length; j++) {
          if (tokens[j].text.toUpperCase() === 'ON' && !tokens[j].inQuotes) {
            // No need to modify standard JOIN syntax
            break;
          }
          
          // If we find a comma join, convert to explicit JOIN
          if (tokens[j].text === ',' && !tokens[j].inQuotes) {
            // This is a comma join that needs conversion
            const commaPos = tokens[j].start;
            const nextTableStart = tokens[j + 1].start;
            
            // Replace the comma with JOIN
            sql = sql.substring(0, commaPos) + ' JOIN ' + sql.substring(nextTableStart);
            
            // Retokenize after modification
            tokens.length = 0;
            StringUtils.tokenizeSql(sql).forEach(t => tokens.push(t));
            i = 0; // Restart the search
            break;
          }
        }
      }
    }
    
    return sql;
  }
}

export default BigQuerySparkTranslate;