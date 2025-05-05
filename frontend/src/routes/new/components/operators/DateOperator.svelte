<!-- 
  날짜 연산자 컴포넌트
  특징:
  - 등호, 부등호 등 날짜 비교 연산자 지원 (eq, neq, gt, lt, gte, lte)
  - 단일 날짜 또는 여러 날짜 지원
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  // 날짜 연산자 타입 정의
  type DateOperatorType = {
    eq?: string | string[];
    neq?: string | string[];
    gt?: string | string[];
    gte?: string | string[];
    lt?: string | string[];
    lte?: string | string[];
    [key: string]: string | string[] | undefined;
  };
  
  export let value: DateOperatorType = {};
  
  export let label = "날짜";
  
  const dispatch = createEventDispatcher();
  
  // 모든 가능한 연산자 목록 - 가장 먼저 정의
  const availableOperators = [
    { type: 'eq', label: '같음 (=)' },
    { type: 'neq', label: '같지 않음 (≠)' },
    { type: 'gt', label: '이후 (>)' },
    { type: 'lt', label: '이전 (<)' },
    { type: 'gte', label: '이후이거나 같음 (≥)' },
    { type: 'lte', label: '이전이거나 같음 (≤)' }
  ];
  
  // 활성화된 연산자 타입들 - 이제 availableOperators 이후에 초기화
  let activeOperators = getActiveOperators();
  // 각 연산자 값 (단일 값)
  let operatorValues: {[key: string]: string} = getOperatorValues();
  // 각 연산자의 다중 값 모드 상태
  let isMultipleMode: {[key: string]: boolean} = getMultipleModes();
  // 각 연산자의 다중 값
  let multipleValues: {[key: string]: string[]} = getMultipleValues();
  
  // 새 값 입력용
  let newValues: {[key: string]: string} = {};
  
  // 활성화된 연산자 확인
  function getActiveOperators(): string[] {
    const active = [];
    for (const op of availableOperators) {
      if (value[op.type] !== undefined) {
        active.push(op.type);
      }
    }
    return active.length > 0 ? active : ['eq']; // 기본값
  }
  
  // 각 연산자의 값 가져오기
  function getOperatorValues(): {[key: string]: string} {
    const values: {[key: string]: string} = {};
    for (const op of availableOperators) {
      const currentValue = value[op.type];
      if (currentValue !== undefined && !Array.isArray(currentValue)) {
        values[op.type] = currentValue.toString();
      } else {
        values[op.type] = '';
      }
    }
    return values;
  }
  
  // 각 연산자의 다중 값 모드 상태 가져오기
  function getMultipleModes(): {[key: string]: boolean} {
    const modes: {[key: string]: boolean} = {};
    for (const op of availableOperators) {
      modes[op.type] = Array.isArray(value[op.type]);
    }
    return modes;
  }
  
  // 각 연산자의 다중 값 가져오기
  function getMultipleValues(): {[key: string]: string[]} {
    const values: {[key: string]: string[]} = {};
    for (const op of availableOperators) {
      const currentValue = value[op.type];
      if (Array.isArray(currentValue)) {
        values[op.type] = currentValue;
      } else {
        values[op.type] = [];
      }
    }
    return values;
  }
  
  // 연산자 추가
  function addOperator(type: string) {
    if (!activeOperators.includes(type)) {
      activeOperators = [...activeOperators, type];
      updateValue();
    }
  }
  
  // 연산자 제거
  function removeOperator(type: string) {
    activeOperators = activeOperators.filter(op => op !== type);
    updateValue();
  }
  
  // 단일 값 변경 시 처리
  function handleValueChange(type: string, e: Event) {
    const target = e.target as HTMLInputElement;
    operatorValues[type] = target.value;
    updateValue();
  }
  
  // 다중 값 모드 전환
  function toggleMultipleMode(type: string) {
    isMultipleMode[type] = !isMultipleMode[type];
    
    if (isMultipleMode[type]) {
      // 단일 값을 다중 값으로 변환
      if (operatorValues[type]) {
        multipleValues[type] = [operatorValues[type]];
        operatorValues[type] = '';
      }
    } else {
      // 다중 값을 단일 값으로 변환
      if (multipleValues[type].length > 0) {
        operatorValues[type] = multipleValues[type][0];
        multipleValues[type] = [];
      }
    }
    
    updateValue();
  }
  
  // 새 값 입력 변경 처리
  function handleNewValueChange(type: string, e: Event) {
    const target = e.target as HTMLInputElement;
    newValues[type] = target.value;
  }
  
  // 새 값 추가
  function addValue(type: string) {
    if (newValues[type] && !multipleValues[type].includes(newValues[type])) {
      multipleValues[type] = [...multipleValues[type], newValues[type]];
      newValues[type] = '';
      updateValue();
    }
  }
  
  // 값 삭제
  function removeValue(type: string, index: number) {
    multipleValues[type].splice(index, 1);
    multipleValues[type] = [...multipleValues[type]];
    updateValue();
  }
  
  // 값 업데이트 및 이벤트 발송
  function updateValue() {
    // 이전 값 초기화
    let updatedValue: DateOperatorType = {};
    
    // 각 활성화된 연산자 처리
    for (const type of activeOperators) {
      if (isMultipleMode[type]) {
        // 다중 값 처리
        if (multipleValues[type] && multipleValues[type].length > 0) {
          updatedValue[type] = multipleValues[type];
        }
      } else {
        // 단일 값 처리
        if (operatorValues[type]) {
          updatedValue[type] = operatorValues[type];
        }
      }
    }
    
    dispatch('change', updatedValue);
  }
  
  // 연산자 라벨 가져오기
  function getOperatorLabel(type: string): string {
    const op = availableOperators.find(o => o.type === type);
    return op ? op.label : type;
  }
</script>

<div class="date-operator">
  <div class="flex flex-col space-y-4">
    <div class="flex items-center space-x-2">
      <span class="text-sm font-medium text-gray-700">{label}</span>
      
      <!-- 연산자 추가 드롭다운 -->
      {#if activeOperators.length < availableOperators.length}
        <div class="relative">
          <select 
            class="rounded-md border border-gray-300 py-1 px-2 text-sm"
            on:change={(e) => {
              const target = e.target as HTMLSelectElement;
              if (target.value) {
                addOperator(target.value);
                target.value = '';
              }
            }}
          >
            <option value="">연산자 추가...</option>
            {#each availableOperators.filter(op => !activeOperators.includes(op.type)) as op}
              <option value={op.type}>{op.label}</option>
            {/each}
          </select>
        </div>
      {/if}
    </div>
    
    <!-- 활성화된 연산자들 -->
    {#each activeOperators as type}
      <div class="ml-2 rounded-md border border-gray-200 bg-gray-50 p-2">
        <div class="mb-2 flex items-center justify-between">
          <div class="flex items-center">
            <span class="text-sm font-medium text-gray-700">{getOperatorLabel(type)}</span>
            
            <!-- 단일/다중 값 모드 전환 버튼 -->
            <button 
              type="button"
              class="ml-2 text-xs text-blue-600 hover:text-blue-800"
              on:click={() => toggleMultipleMode(type)}
            >
              {isMultipleMode[type] ? '단일 값으로 전환' : '여러 값으로 전환'}
            </button>
          </div>
          
          <!-- 연산자 제거 버튼 -->
          {#if activeOperators.length > 1}
            <button 
              type="button"
              class="text-xs text-red-600 hover:text-red-800"
              on:click={() => removeOperator(type)}
            >
              제거
            </button>
          {/if}
        </div>
        
        {#if isMultipleMode[type]}
          <!-- 다중 값 입력 UI -->
          <div class="space-y-2">
            <div class="flex items-center space-x-2">
              <input 
                type="date" 
                class="w-full rounded-md border border-gray-300 py-1 px-2 text-sm"
                bind:value={newValues[type]}
                on:input={(e) => handleNewValueChange(type, e)}
              />
              <button 
                type="button"
                class="rounded-md bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                on:click={() => addValue(type)}
              >
                추가
              </button>
            </div>
            
            {#if multipleValues[type] && multipleValues[type].length > 0}
              <ul class="max-h-40 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-2">
                {#each multipleValues[type] as date, i}
                  <li class="mb-1 flex items-center justify-between rounded bg-white px-2 py-1 text-xs">
                    <span>{date}</span>
                    <button 
                      type="button"
                      class="text-red-600 hover:text-red-800"
                      on:click={() => removeValue(type, i)}
                    >
                      ×
                    </button>
                  </li>
                {/each}
              </ul>
            {:else}
              <p class="text-xs text-gray-500">날짜를 하나 이상 추가하세요</p>
            {/if}
          </div>
        {:else}
          <!-- 단일 값 입력 UI -->
          <input 
            type="date" 
            class="w-full rounded-md border border-gray-300 py-1 px-2 text-sm"
            bind:value={operatorValues[type]}
            on:input={(e) => handleValueChange(type, e)}
          />
        {/if}
      </div>
    {/each}
  </div>
</div> 