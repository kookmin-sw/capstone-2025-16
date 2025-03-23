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

import { ConditionalOperations } from './ConditionalOperations';
import { ExecutiveOperations } from './ExecutiveOperations';
import { Execution } from './Execution';

export class Operations<T, V> implements ConditionalOperations<T, V>, ExecutiveOperations<T, V> {
  private result?: boolean;
  private readonly inputValue: T;
  private returnValue?: V;

  private constructor(value: T) {
    this.inputValue = value;
  }

  public static match<T, V>(value: T): ConditionalOperations<T, V> {
    return new Operations<T, V>(value);
  }

  when(condition: (value: T) => boolean): ExecutiveOperations<T, V> {
    this.result = this.inputValue !== null && this.inputValue !== undefined && condition(this.inputValue);
    return this;
  }

  isA(clazz: Function): ExecutiveOperations<T, V> {
    this.result = clazz !== null && clazz !== undefined && 
      this.inputValue !== null && this.inputValue !== undefined &&
      this.inputValue instanceof clazz;
    return this;
  }

  then(consumerOrExecution: ((value: T) => void) | Execution): ConditionalOperations<T, V> {
    if (this.result) {
      if (typeof consumerOrExecution === 'function') {
        (consumerOrExecution as (value: T) => void)(this.inputValue);
      } else {
        (consumerOrExecution as Execution).apply();
      }
    }
    return this;
  }

  thenReturn(func: (value: T) => V): ConditionalOperations<T, V> {
    if (this.result) {
      this.returnValue = func(this.inputValue);
    }
    return this;
  }

  orElse(consumer: (value: T) => void): void {
    if (!this.result) {
      consumer(this.inputValue);
    }
  }

  // Implementation of value() method from ConditionalOperations interface
  value(): V {
    return this.returnValue as V;
  }
}