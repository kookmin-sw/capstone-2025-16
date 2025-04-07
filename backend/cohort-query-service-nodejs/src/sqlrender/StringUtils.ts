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

// Direct port of the Java StringUtils class

/**
 * Token class for SQL parsing
 */
export class Token {
  public start: number;
  public end: number;
  public text: string;
  public inQuotes: boolean = false;

  constructor(start?: number, end?: number, text?: string) {
    this.start = start || 0;
    this.end = end || 0;
    this.text = text || '';
  }

  /**
   * Copy constructor
   */
  public static from(other: Token): Token {
    const token = new Token();
    token.start = other.start;
    token.end = other.end;
    token.text = other.text;
    token.inQuotes = other.inQuotes;
    return token;
  }

  /**
   * Checks if token is an identifier (only alphanumeric or underscore)
   */
  public isIdentifier(): boolean {
    for (let i = 0; i < this.text.length; i++) {
      const ch = this.text.charAt(i);
      if (!this.isLetterOrDigit(ch) && ch !== '_') {
        return false;
      }
    }
    return true;
  }

  private isLetterOrDigit(ch: string): boolean {
    return /^[a-zA-Z0-9]$/.test(ch);
  }
}

/**
 * Static utility methods for string operations in SQL processing
 */
export class StringUtils {
  // single quoted string with escaped single quotes
  public static readonly REGEX_ESCAPED_APOSTROPHES = "(['\"])((?!\\1).|\\1{2})*\\1";
  public static readonly HINT_KEY_WORD = "hint";

  /**
   * Replaces a character at a specific position in a string
   */
  public static replaceCharAt(string: string, pos: number, ch: string): string {
    return string.substring(0, pos) + ch + string.substring(pos + 1);
  }

  /**
   * Replaces a substring with another string
   */
  public static replace(string: string, start: number, end: number, replacement: string): string {
    if (end > string.length) {
      return string.substring(0, start) + replacement;
    } else {
      return string.substring(0, start) + replacement + string.substring(end);
    }
  }

  /**
   * Replaces all occurrences of a search string with a replacement
   */
  public static replaceAll(result: string, search: string, replace: string): string {
    let pos = 0;
    while ((pos = result.indexOf(search, pos)) !== -1) {
      result = this.replace(result, pos, pos + search.length, replace);
      pos += replace.length;
    }
    return result;
  }

  /**
   * Tokenizes SQL into individual tokens
   */
  public static tokenizeSql(sql: string): Token[] {
    const tokens: Token[] = [];
    let start = 0;
    let cursor = 0;
    let commentType1 = false; // Type 1: -- ... end of line
    let commentType2 = false; // Type 2: /* .. */
    let inSingleQuotes = false;
    let inDoubleQuotes = false;

    const isLetterOrDigit = (ch: string): boolean => /^[a-zA-Z0-9]$/.test(ch);
    const isWhitespace = (ch: string): boolean => /^[\s]$/.test(ch);

    for (; cursor < sql.length; cursor++) {
      const ch = sql.charAt(cursor);
      if (commentType1) {
        if (ch === '\n') {
          commentType1 = false;
          start = cursor + 1;
        }
      } else if (commentType2) {
        if (ch === '/' && cursor > 0 && sql.charAt(cursor - 1) === '*') {
          commentType2 = false;
          start = cursor + 1;
        }
      } else if (!isLetterOrDigit(ch) && ch !== '_' && ch !== '@') {
        if (cursor > start) {
          const token = new Token();
          token.start = start;
          token.end = cursor;
          token.text = sql.substring(start, cursor);
          token.inQuotes = inSingleQuotes || inDoubleQuotes;
          tokens.push(token);
        }
        if (ch === '-' && cursor < sql.length - 1 && sql.charAt(cursor + 1) === '-'
          && !inSingleQuotes && !inDoubleQuotes
          && (sql.length - cursor < 6 || sql.substring(cursor + 2, cursor + 6) !== this.HINT_KEY_WORD)) {
          commentType1 = true;
        } else if (ch === '/' && cursor < sql.length - 1 && sql.charAt(cursor + 1) === '*' && !inSingleQuotes && !inDoubleQuotes) {
          commentType2 = true;
        } else if (!isWhitespace(ch)) {
          const token = new Token();
          token.start = cursor;
          token.end = cursor + 1;
          token.text = sql.substring(cursor, cursor + 1);
          token.inQuotes = inSingleQuotes || inDoubleQuotes;
          tokens.push(token);
          if (ch === '\'' && !inDoubleQuotes) {
            inSingleQuotes = !inSingleQuotes;
          }
          if (ch === '"' && !inSingleQuotes) {
            inDoubleQuotes = !inDoubleQuotes;
          }
        }
        start = cursor + 1;
      }
    }

    if (cursor > start && !commentType1 && !commentType2) {
      const token = new Token();
      token.start = start;
      token.end = cursor;
      token.text = sql.substring(start, cursor);
      token.inQuotes = inSingleQuotes || inDoubleQuotes;
      tokens.push(token);
    }

    return tokens;
  }

  /**
   * Safe split that handles escaped characters
   */
  public static safeSplit(string: string, delimiter: string): string[] {
    const result: string[] = [];
    if (string.length === 0) {
      result.push("");
      return result;
    }

    let literal = false;
    let escape = false;
    let startpos = 0;
    let i = 0;
    let currentchar: string;

    while (i < string.length) {
      currentchar = string.charAt(i);
      if (currentchar === '"' && !escape) {
        literal = !literal;
      }
      if (!literal && (currentchar === delimiter && !escape)) {
        result.push(string.substring(startpos, i));
        startpos = i + 1;
      }
      if (currentchar === '\\') {
        escape = !escape;
      } else {
        escape = false;
      }
      i++;
    }
    result.push(string.substring(startpos, i));
    return result;
  }

  /**
   * Joins a collection of strings with a delimiter
   */
  public static join(s: any[], delimiter: string): string {
    if (s.length === 0) return '';
    
    let result = s[0].toString();
    for (let i = 1; i < s.length; i++) {
      result += delimiter + s[i].toString();
    }
    return result;
  }

  /**
   * Splits a string and keeps the delimiters
   */
  public static splitAndKeep(val: string, regex: string): string[] {
    const result: string[] = [];
    const regExp = new RegExp(regex, 'g');
    let match: RegExpExecArray | null;
    let pos = 0;

    while ((match = regExp.exec(val)) !== null) {
      result.push(val.substring(pos, match.index));
      result.push(match[0]);
      pos = match.index + match[0].length;
    }

    if (pos < val.length) {
      result.push(val.substring(pos));
    }

    return result;
  }

  /**
   * Check if a character is whitespace
   */
  public static isWhitespace(ch: string): boolean {
    return /^[\s]$/.test(ch);
  }
}

export default StringUtils;