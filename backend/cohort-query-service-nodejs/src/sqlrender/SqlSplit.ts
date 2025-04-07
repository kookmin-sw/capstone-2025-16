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
 * Utility for splitting SQL statements
 */
export class SqlSplit {

  /**
   * Split a SQL script into individual statements
   * @param sql The SQL script to split
   * @returns Array of SQL statements
   */
  public static splitSql(sql: string): string[] {
    // Process line endings for consistent handling
    sql = sql.replace(/\r\n/g, '\n');
    
    // Tokenize SQL
    const tokens = StringUtils.tokenizeSql(sql);
    const result: string[] = [];
    
    let start = 0;
    let cursor = 0;

    // Process tokens to split on semicolons
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      if (!token.inQuotes && token.text === ';') {
        result.push(sql.substring(start, token.end).trim());
        start = token.end;
      }
    }
    
    // Add any remaining SQL after the last semicolon
    const remaining = sql.substring(start).trim();
    if (remaining.length > 0) {
      result.push(remaining);
    }
    
    return result.filter(stmt => stmt.trim().length > 0);
  }

  /**
   * Gets position of the 'FROM' keyword for a SELECT statement 
   * @param sql SQL statement to analyze
   */
  public static getFromPos(sql: string): number {
    const tokens = StringUtils.tokenizeSql(sql);
    let level = 0;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.text === '(') {
        level++;
      } else if (token.text === ')') {
        level--;
      } else if (level === 0 && token.text.toUpperCase() === 'FROM') {
        return token.start;
      }
    }
    return -1;
  }
}

export default SqlSplit;