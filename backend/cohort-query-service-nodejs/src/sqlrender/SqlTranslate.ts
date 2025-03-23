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

import { SqlRender } from './SqlRender';
import { SqlSplit } from './SqlSplit';
import { StringUtils, Token } from './StringUtils';
import * as fs from 'fs';
import * as path from 'path';

interface SourceTargetReplacement {
  source: string;
  target: string;
  replacement: string;
}

/**
 * Utility for translating SQL from one dialect to another
 */
export class SqlTranslate {
  private static replacementPatterns: SourceTargetReplacement[] = [];
  private static supportedDialects: string[] = [];
  private static targetToReplacements: Map<string, SourceTargetReplacement[]> = new Map();

  /**
   * Translates SQL from one dialect to another
   * @param sql SQL to translate
   * @param targetDialect Target SQL dialect
   * @param pathToReplacementPatterns Path to replacement patterns CSV file
   * @returns Translated SQL
   */
  public static translateSql(sql: string, targetDialect: string, parameters?: string[], values?: string[], 
                             pathToReplacementPatterns?: string): string {
    if (!targetDialect || targetDialect.toLowerCase() === "sql server") {
      return sql;
    }

    if (this.replacementPatterns.length === 0) {
      this.loadReplacementPatterns(pathToReplacementPatterns);
    }

    sql = this.translateSqlBatch(sql, targetDialect);
    return sql;
  }

  /**
   * Translates a batch of SQL statements
   */
  private static translateSqlBatch(sql: string, targetDialect: string): string {
    // Split into individual statements
    const statements = SqlSplit.splitSql(sql);
    
    // Translate each statement
    for (let i = 0; i < statements.length; i++) {
      statements[i] = this.translateSqlStatement(statements[i], targetDialect);
    }
    
    // Join statements back together
    return statements.join(";\n\n");
  }

  /**
   * Translates a single SQL statement
   */
  private static translateSqlStatement(sql: string, targetDialect: string): string {
    // Get replacements for this dialect
    let replacements = this.targetToReplacements.get(targetDialect.toLowerCase());
    
    if (!replacements) {
      replacements = this.replacementPatterns.filter(
        pattern => pattern.target.toLowerCase() === targetDialect.toLowerCase()
      );
      this.targetToReplacements.set(targetDialect.toLowerCase(), replacements);
    }
    
    // Apply replacements
    for (const replacement of replacements) {
      if (sql.includes(replacement.source)) {
        // Only replace if the pattern exists in the SQL
        sql = sql.replace(new RegExp(replacement.source, 'g'), replacement.replacement);
      }
    }
    
    return sql;
  }

  /**
   * Load replacement patterns from CSV
   */
  private static loadReplacementPatterns(csvPath?: string): void {
    // Default path if not provided
    const defaultPath = path.join(__dirname, 'resources', 'csv', 'replacementPatterns.csv');
    const filePath = csvPath || defaultPath;
    
    // Simple synchronous implementation for now
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const parts = line.split(',');
          if (parts.length >= 3) {
            this.replacementPatterns.push({
              source: parts[0],
              target: parts[1],
              replacement: parts[2]
            });
            
            // Add to supported dialects if not already there
            const dialect = parts[1].toLowerCase();
            if (!this.supportedDialects.includes(dialect)) {
              this.supportedDialects.push(dialect);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading replacement patterns:', error);
    }
  }

  /**
   * Get list of supported target dialects
   */
  public static getTargetDialects(): string[] {
    if (this.supportedDialects.length === 0) {
      this.loadReplacementPatterns();
    }
    return [...this.supportedDialects];
  }
}

export default SqlTranslate;