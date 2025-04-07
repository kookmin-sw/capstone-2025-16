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

import { StringUtils } from './StringUtils';

/**
 * Spans used to track regions of SQL during processing
 */
class Span {
  public start: number;
  public end: number;
  public valid: boolean;

  constructor(start: number, end: number) {
    this.start = start;
    this.end = end;
    this.valid = true;
  }
}

/**
 * Structure to represent if-then-else blocks in SQL templates
 */
class IfThenElse {
  public condition: Span;
  public ifTrue: Span;
  public ifFalse: Span;
  public hasIfFalse: boolean = false;

  constructor() {
    this.condition = new Span(0, 0);
    this.ifTrue = new Span(0, 0);
    this.ifFalse = new Span(0, 0);
  }

  public start(): number {
    return this.condition.start;
  }

  public end(): number {
    return this.hasIfFalse ? this.ifFalse.end : this.ifTrue.end;
  }
}

/**
 * SQL rendering utility to process parameterized SQL templates
 */
export class SqlRender {

  /**
   * Find all curly bracket spans in a string
   */
  private static findCurlyBracketSpans(str: string): Span[] {
    const starts: number[] = [];
    const spans: Span[] = [];
    for (let i = 0; i < str.length; i++) {
      if (str.charAt(i) === '{') {
        starts.push(i);
      } else if (str.charAt(i) === '}') {
        if (starts.length !== 0) {
          spans.push(new Span(starts.pop() as number, i + 1));
        }
      }
    }
    return spans;
  }

  /**
   * Find all parentheses spans in a string
   */
  private static findParentheses(str: string): Span[] {
    const starts: number[] = [];
    const spans: Span[] = [];
    for (let i = 0; i < str.length; i++) {
      if (str.charAt(i) === '(') {
        starts.push(i);
      } else if (str.charAt(i) === ')') {
        if (starts.length !== 0) {
          spans.push(new Span(starts.pop() as number, i + 1));
        }
      }
    }
    return spans;
  }

  /**
   * Link curly bracket spans into if-then-else structures
   */
  private static linkIfThenElses(str: string, spans: Span[]): IfThenElse[] {
    const ifThenElses: IfThenElse[] = [];
    if (spans.length > 1) {
      for (let i = 0; i < spans.length - 1; i++) {
        for (let j = i + 1; j < spans.length; j++) {
          if (spans[j].start > spans[i].end) {
            let inBetween = str.substring(spans[i].end, spans[j].start);
            inBetween = inBetween.trim();
            if (inBetween === "?") {
              const ifThenElse = new IfThenElse();
              ifThenElse.condition = spans[i];
              ifThenElse.ifTrue = spans[j];
              if (j < spans.length) {
                for (let k = j + 1; k < spans.length; k++) {
                  if (spans[k].start > spans[j].end) {
                    inBetween = str.substring(spans[j].end, spans[k].start);
                    inBetween = inBetween.trim();
                    if (inBetween === ":") {
                      ifThenElse.ifFalse = spans[k];
                      ifThenElse.hasIfFalse = true;
                    }
                  }
                }
              }
              ifThenElses.push(ifThenElse);
            }
          }
        }
      }
    }
    return ifThenElses;
  }

  /**
   * Evaluate a SQL condition
   */
  private static evaluateCondition(str: string): boolean {
    str = str.trim();
    const spans = SqlRender.findParentheses(str);
    
    // Spans are in order of closing parenthesis, so if we go from first to last 
    // we'll always process nested parentheses first
    for (const span of spans) {
      if (!SqlRender.precededByIn(span.start, str)) {
        const evaluation = SqlRender.evaluateBooleanCondition(str.substring(span.start + 1, span.end - 1));
        str = StringUtils.replaceCharAt(str, span.start, evaluation ? '1' : '0');
        str = SqlRender.replace(str, spans, span.start, span.end, span.start, span.start);
      }
    }
    return SqlRender.evaluateBooleanCondition(str);
  }

  /**
   * Evaluate a boolean condition
   */
  private static evaluateBooleanCondition(str: string): boolean {
    str = str.trim();
    const str_lc = str.toLowerCase();
    
    if (str_lc === "false" || str_lc === "0" || str_lc === "!true" || str_lc === "!1") {
      return false;
    }
    if (str_lc === "true" || str_lc === "1" || str_lc === "!false" || str_lc === "!0") {
      return true;
    }

    let found = str.indexOf("&");
    if (found !== -1) {
      const parts = str.split("&");
      for (const part of parts) {
        if (!SqlRender.evaluatePrimitiveCondition(part)) {
          return false;
        }
      }
      return true;
    }
    
    found = str.indexOf("|");
    if (found !== -1) {
      // Note: In JavaScript, we need to escape the pipe character in the split
      const parts = str.split("|");
      for (const part of parts) {
        if (SqlRender.evaluatePrimitiveCondition(part)) {
          return true;
        }
      }
      return false;
    }
    
    return SqlRender.evaluatePrimitiveCondition(str);
  }

  /**
   * Check if the character is preceded by 'in' (for IN clauses)
   */
  private static precededByIn(start: number, str: string): boolean {
    str = str.toLowerCase();
    let matched = 0;
    for (let i = start - 1; i >= 0; i--) {
      if (!StringUtils.isWhitespace(str.charAt(i))) {
        if (matched === 0 && str.charAt(i) === 'n') {
          matched++;
        } else if (matched === 1 && str.charAt(i) === 'i') {
          matched++;
        } else {
          return false;
        }
      } else if (matched === 2) {
        return true;
      }
    }
    return false;
  }

  /**
   * Remove parentheses or quotes from a string
   */
  private static removeParentheses(s: string): string {
    if (s.length > 1 && ((s.charAt(0) === '\'' && s.charAt(s.length - 1) === '\'') || 
        (s.charAt(0) === '"' && s.charAt(s.length - 1) === '"'))) {
      return s.substring(1, s.length - 1);
    } else {
      return s;
    }
  }

  /**
   * Evaluate a primitive condition
   */
  private static evaluatePrimitiveCondition(str: string): boolean {
    str = str.trim();
    const str_lc = str.toLowerCase();
    
    if (str_lc === "false" || str_lc === "0" || str_lc === "!true" || str_lc === "!1") {
      return false;
    }
    if (str_lc === "true" || str_lc === "1" || str_lc === "!false" || str_lc === "!0") {
      return true;
    }

    let found = str.indexOf("==");
    if (found !== -1) {
      let left = str.substring(0, found);
      left = left.trim();
      left = SqlRender.removeParentheses(left);
      let right = str.substring(found + 2);
      right = right.trim();
      right = SqlRender.removeParentheses(right);
      return (left === right);
    }
    
    found = str.indexOf("!=");
    if (found === -1) {
      found = str.indexOf("<>");
    }
    
    if (found !== -1) {
      let left = str.substring(0, found);
      left = left.trim();
      left = SqlRender.removeParentheses(left);
      let right = str.substring(found + 2);
      right = right.trim();
      right = SqlRender.removeParentheses(right);
      return (left !== right);
    }
    
    found = str_lc.indexOf(" in ");
    if (found !== -1) {
      let left = str.substring(0, found);
      left = left.trim();
      left = SqlRender.removeParentheses(left);
      let right = str.substring(found + 4);
      right = right.trim();
      if (right.length > 2 && right.charAt(0) === '(' && right.charAt(right.length - 1) === ')') {
        right = right.substring(1, right.length - 1);
        const parts = right.split(",");
        for (const part of parts) {
          const partString = SqlRender.removeParentheses(part.trim());
          if (left === partString) {
            return true;
          }
        }
        return false;
      }
    }
    
    throw new Error(`Error parsing boolean condition: "${str}"`);
  }

  /**
   * Replace a span of text
   */
  private static replace(str: string, spans: Span[], toReplaceStart: number, 
                        toReplaceEnd: number, replaceWithStart: number, replaceWithEnd: number): string {
    const replaceWithString = str.substring(replaceWithStart, replaceWithEnd + 1);
    str = StringUtils.replace(str, toReplaceStart, toReplaceEnd, replaceWithString);
    
    for (const span of spans) {
      if (span.valid) {
        if (span.start > toReplaceStart) {
          if (span.start >= replaceWithStart && span.start < replaceWithEnd) {
            const delta = toReplaceStart - replaceWithStart;
            span.start += delta;
            span.end += delta;
          } else if (span.start > toReplaceEnd) {
            const delta = toReplaceStart - toReplaceEnd + replaceWithString.length;
            span.start += delta;
            span.end += delta;
          } else {
            span.valid = false;
          }
        } else if (span.end > toReplaceEnd) {
          const delta = toReplaceStart - toReplaceEnd + replaceWithString.length;
          span.end += delta;
        }
      }
    }
    
    return str;
  }

  /**
   * Extract default values from template
   */
  private static extractDefaults(str: string): Record<string, string> {
    // Find all spans containing defaults
    const defaults: Record<string, string> = {};
    let defaultStart = 0;
    let defaultEnd = 0;
    const pre = "{DEFAULT ";
    const post = "}";
    
    while (defaultStart !== -1 && defaultEnd !== -1) {
      defaultStart = str.indexOf(pre, defaultEnd);
      if (defaultStart !== -1) {
        defaultEnd = str.indexOf(post, defaultStart + pre.length);
        if (defaultEnd !== -1) {
          const span = str.substring(defaultStart + pre.length, defaultEnd);
          const found = span.indexOf("=");
          if (found !== -1) {
            let parameter = span.substring(0, found);
            parameter = parameter.trim();
            if (parameter.length > 0 && parameter.charAt(0) === '@') {
              parameter = parameter.substring(1);
            }
            let defaultValue = span.substring(found + 1);
            defaultValue = defaultValue.trim();
            defaultValue = SqlRender.removeParentheses(defaultValue);
            defaults[parameter] = defaultValue;
          }
        }
      }
    }
    
    return defaults;
  }

  /**
   * Substitute parameters into SQL template
   */
  private static substituteParameters(string: string, parameterToValue: Record<string, string>): string {
    const defaults = SqlRender.extractDefaults(string);
    string = SqlRender.removeDefaults(string);
    
    // Add defaults if parameter not already provided
    for (const key in defaults) {
      if (!parameterToValue[key]) {
        parameterToValue[key] = defaults[key];
      }
    }

    // Sort parameters from longest to shortest so if one parameter name is a substring of another, it won't go wrong:
    const sortedParameterToValue = Object.entries(parameterToValue).sort((o1, o2) => {
      const l1 = o1[0].length;
      const l2 = o2[0].length;
      if (l1 > l2) {
        return -1;
      } else if (l1 < l2) {
        return 1;
      }
      return 0;
    });
    
    // Replace all parameters
    for (const [key, value] of sortedParameterToValue) {
      if (value === null || value === undefined) {
        // Replace with null if value is null or undefined
        string = string.replace(new RegExp("@" + key, "g"), "null");
        continue;
      }
      
      // Following Java implementation: escape backslashes
      let processedValue = String(value).replace(/\\/g, "\\\\\\\\");
      
      // Replace all instances of the parameter with the value
      string = string.replace(new RegExp("@" + key, "g"), SqlRender.escapeDollarSign(processedValue));
    }
    
    return string;
  }

  /**
   * Escape dollar sign in strings
   */
  public static escapeDollarSign(s: string): string {
    if (s.indexOf('$') === -1) {
      return s;
    }
    
    let sb = "";
    for (let i = 0; i < s.length; i++) {
      const c = s.charAt(i);
      if (c === '$') {
        sb += '\\';
      }
      sb += c;
    }
    
    return sb;
  }

  /**
   * Remove default declarations from the SQL
   */
  private static removeDefaults(string: string): string {
    return string.replace(/\{DEFAULT[^}]*\}\s*\n?/g, "");
  }

  /**
   * Parse and evaluate if-then-else structures
   */
  private static parseIfThenElse(str: string): string {
    const spans = SqlRender.findCurlyBracketSpans(str);
    const ifThenElses = SqlRender.linkIfThenElses(str, spans);

    // Create a copy of the string
    let result = String(str);
    
    for (const ifThenElse of ifThenElses) {
      if (ifThenElse.condition.valid) {
        if (SqlRender.evaluateCondition(result.substring(ifThenElse.condition.start + 1, ifThenElse.condition.end - 1))) {
          result = SqlRender.replace(result, spans, ifThenElse.start(), ifThenElse.end(), 
                                   ifThenElse.ifTrue.start + 1, ifThenElse.ifTrue.end - 2);
        } else {
          if (ifThenElse.hasIfFalse) {
            result = SqlRender.replace(result, spans, ifThenElse.start(), ifThenElse.end(), 
                                     ifThenElse.ifFalse.start + 1, ifThenElse.ifFalse.end - 2);
          } else {
            result = SqlRender.replace(result, spans, ifThenElse.start(), ifThenElse.end(), 0, -1);
          }
        }
      }
    }
    
    return result;
  }

  /**
   * Main rendering function
   */
  private static renderSqlWithParams(str: string, parameterToValue: Record<string, string>): string {
    let result = SqlRender.substituteParameters(str, parameterToValue);
    result = SqlRender.parseIfThenElse(result);
    return result;
  }

  /**
   * This function takes parameterized SQL and a list of parameter values and renders the SQL that can be send to the server. Parameterization syntax:<br/>
   * &#64;parameterName<br/>
   * Parameters are indicated using a &#64; prefix, and are replaced with the actual values provided in the renderSql call.<br/>
   * <br/>
   * {DEFAULT &#64;parameterName = parameterValue}<br/>
   * Default values for parameters can be defined using curly and the DEFAULT keyword.<br/>
   * <br/>
   * {if}?{then}:{else}<br/>
   * The if-then-else pattern is used to turn on or off blocks of SQL code.
   * 
   * @param sql The parameterized SQL
   * @param parameters The names of the parameters (without the &#64;-sign).
   * @param values The values of the parameters.
   * @return The rendered sql
   */
  public static renderSql(sql: string, parameters?: string[], values?: any[]): string {
    const parameterToValue: Record<string, string> = {};
    
    if (parameters && values) {
      for (let i = 0; i < parameters.length; i++) {
        if (values[i] === null || values[i] === undefined) {
          parameterToValue[parameters[i]] = "null";
        } else {
          parameterToValue[parameters[i]] = String(values[i]);
        }
      }
    }
    
    // Debug logging for troubleshooting
    console.debug(`Rendering SQL with ${Object.keys(parameterToValue).length} parameters`);
    
    return SqlRender.renderSqlWithParams(sql, parameterToValue);
  }

  /**
   * Check if all parameters are used in the SQL
   */
  public static check(sql: string, parameters?: string[], values?: string[]): string[] {
    const warnings: string[] = [];
    
    if (parameters) {
      for (const parameter of parameters) {
        if (!sql.includes("@" + parameter)) {
          warnings.push(`Parameter '${parameter}' not found in SQL`);
        }
      }
    }
    
    return warnings;
  }
}

export default SqlRender;