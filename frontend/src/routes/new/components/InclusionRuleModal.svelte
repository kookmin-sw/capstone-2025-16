
<script>
  import { createEventDispatcher } from 'svelte';
  import { 
    createInclusionRule, 
    updateName, 
    updateDescription,
    updateExpression 
  } from '../models/InclusionRule.js';
  import {
    createCriteriaGroup,
    addWindowedCriteria,
    addDemographicCriteria, 
    addSubGroup,
    removeWindowedCriteria,
    removeDemographicCriteria,
    removeSubGroup,
    updateGroupType,
    updateAtLeastCount
  } from '../models/CriteriaGroup.js';
  import {
    createWindowedCriteria,
    updateCriteria,
    updateStartWindow,
    updateEndWindow,
    updateOccurrenceType,
    updateOccurrenceCount,
    updateOccurrenceIsDistinct
  } from '../models/WindowedCriteria.js';
  import {
    createCriteria
  } from '../models/Criteria.js';
  import {
    createDemographicCriteria
  } from '../models/DemographicCriteria.js';
  import { typeMapping } from '../models/index.js';
  
  // 이벤트 디스패처 설정
  const dispatch = createEventDispatcher();
  
  // 모달 표시 여부
  export let show = false;
  
  // 편집중인 포함 규칙
  export let inclusionRule = null;
  
  // 포함 규칙 인덱스
  export let ruleIndex = -1;

  // 개념 집합 목록
  export let conceptSets = [];
  
  // 조건 유형 옵션
  const groupTypeOptions = [
    { value: "ALL", label: "All criteria are true (AND)" },
    { value: "ANY", label: "Any criterion is true (OR)" },
    { value: "AT_LEAST", label: "At least N criteria are true" }
  ];

  // 발생 유형 옵션
  const occurrenceTypeOptions = [
    { value: 0, label: "At least" },
    { value: 1, label: "Exactly" },
    { value: 2, label: "At most" }
  ];

  // 조건 유형 옵션
  const criteriaTypes = [
    { id: "condition-era", name: "Condition Era" },
    { id: "condition-occurrence", name: "Condition Occurrence" },
    { id: "death", name: "Death" },
    { id: "device-exposure", name: "Device Exposure" },
    { id: "dose-era", name: "Dose Era" },
    { id: "drug-era", name: "Drug Era" },
    { id: "drug-exposure", name: "Drug Exposure" },
    { id: "measurement", name: "Measurement" },
    { id: "observation", name: "Observation" },
    { id: "observation-period", name: "Observation Period" },
    { id: "procedure-occurrence", name: "Procedure Occurrence" },
    { id: "specimen", name: "Specimen" },
    { id: "visit-occurrence", name: "Visit Occurrence" },
    { id: "visit-detail", name: "Visit Detail" }
  ];

  // 인구통계학 속성
  const demographicProps = [
    { name: "age", label: "Age" },
    { name: "gender", label: "Gender" },
    { name: "race", label: "Race" },
    { name: "ethnicity", label: "Ethnicity" }
  ];

  // 인터페이스 상태 관리
  let selectedCriteriaType = null;
  let editingWindowedCriteriaIndex = -1;
  let editingDemographicCriteriaIndex = -1;
  let editingSubGroupIndex = -1;
  let expandedGroups = {};

  // 새 규칙 생성 (처음 모달이 열릴 때 규칙이 없는 경우)
  function initializeRule() {
    if (!inclusionRule) {
      inclusionRule = createInclusionRule({
        name: `Inclusion Criteria ${ruleIndex + 1}`,
        description: "",
        expression: {
          Type: "ALL",
          CriteriaList: [],
          DemographicCriteriaList: [],
          Groups: []
        }
      });
    }
  }

  // 모달이 열릴 때 규칙 초기화
  $: if (show) {
    initializeRule();
  }

  // 규칙 이름 업데이트
  function handleNameChange(event) {
    inclusionRule = updateName(inclusionRule, event.target.value);
  }

  // 규칙 설명 업데이트
  function handleDescriptionChange(event) {
    inclusionRule = updateDescription(inclusionRule, event.target.value);
  }

  // 조건 그룹 유형 변경
  function handleGroupTypeChange(group, type) {
    let updatedGroup = updateGroupType(group, type);
    
    // AT_LEAST인 경우 기본 카운트 설정
    if (type === 'AT_LEAST') {
      updatedGroup = updateAtLeastCount(updatedGroup, 1);
    }
    
    return updatedGroup;
  }

  // 최상위 그룹 유형 변경
  function updateRootGroupType(type) {
    const updatedExpression = handleGroupTypeChange(inclusionRule.expression, type);
    inclusionRule = updateExpression(inclusionRule, updatedExpression);
  }

  // 하위 그룹 유형 변경
  function updateSubGroupType(groupPath, type) {
    // 경로를 기반으로 중첩된 그룹 업데이트
    let newExpression = {...inclusionRule.expression};
    let currentGroup = newExpression;
    
    // 마지막 하나 전까지의 경로를 통해 중첩 그룹으로 이동
    for (let i = 0; i < groupPath.length - 1; i++) {
      currentGroup = currentGroup.Groups[groupPath[i]];
    }
    
    // 마지막 인덱스의 그룹 업데이트
    const lastIndex = groupPath[groupPath.length - 1];
    currentGroup.Groups[lastIndex] = handleGroupTypeChange(
      currentGroup.Groups[lastIndex], 
      type
    );
    
    inclusionRule = updateExpression(inclusionRule, newExpression);
  }

  // AT_LEAST 카운트 업데이트
  function updateCount(group, count, groupPath = []) {
    const intCount = parseInt(count) || 1;
    
    if (groupPath.length === 0) {
      // 최상위 그룹인 경우
      const updatedExpression = updateAtLeastCount(group, intCount);
      inclusionRule = updateExpression(inclusionRule, updatedExpression);
    } else {
      // 하위 그룹인 경우
      let newExpression = {...inclusionRule.expression};
      let currentGroup = newExpression;
      
      // 마지막 하나 전까지의 경로를 통해 중첩 그룹으로 이동
      for (let i = 0; i < groupPath.length - 1; i++) {
        currentGroup = currentGroup.Groups[groupPath[i]];
      }
      
      // 마지막 인덱스의 그룹 업데이트
      const lastIndex = groupPath[groupPath.length - 1];
      currentGroup.Groups[lastIndex] = updateAtLeastCount(
        currentGroup.Groups[lastIndex], 
        intCount
      );
      
      inclusionRule = updateExpression(inclusionRule, newExpression);
    }
  }

  // 윈도우 조건 추가
  function addNewWindowedCriteria(criteriaType, toGroup = inclusionRule.expression, groupPath = []) {
    // 선택된 이벤트 타입에서 Atlas 형식의 타입 이름으로 변환
    const atlasType = typeMapping[criteriaType];
    
    // 기본 조건 생성
    const criteria = {};
    criteria[atlasType] = { CodesetId: null };
    
    // 윈도우 조건 생성
    const windowedCriteria = createWindowedCriteria({
      Criteria: criteria
    });
    
    // 그룹에 조건 추가
    if (groupPath.length === 0) {
      // 최상위 그룹에 추가
      const updatedExpression = addWindowedCriteria(toGroup, windowedCriteria);
      inclusionRule = updateExpression(inclusionRule, updatedExpression);
    } else {
      // 하위 그룹에 추가
      let newExpression = {...inclusionRule.expression};
      let currentGroup = newExpression;
      
      // 경로를 따라 중첩 그룹으로 이동
      for (let i = 0; i < groupPath.length - 1; i++) {
        currentGroup = currentGroup.Groups[groupPath[i]];
      }
      
      // 마지막 인덱스의 그룹에 추가
      const lastIndex = groupPath[groupPath.length - 1];
      currentGroup.Groups[lastIndex] = addWindowedCriteria(
        currentGroup.Groups[lastIndex], 
        windowedCriteria
      );
      
      inclusionRule = updateExpression(inclusionRule, newExpression);
    }
    
    // 선택 초기화
    selectedCriteriaType = null;
  }

  // 인구통계학 조건 추가
  function addNewDemographicCriteria(toGroup = inclusionRule.expression, groupPath = []) {
    // 기본 인구통계학 조건 생성
    const demographicCriteria = createDemographicCriteria();
    
    // 그룹에 조건 추가
    if (groupPath.length === 0) {
      // 최상위 그룹에 추가
      const updatedExpression = addDemographicCriteria(toGroup, demographicCriteria);
      inclusionRule = updateExpression(inclusionRule, updatedExpression);
    } else {
      // 하위 그룹에 추가
      let newExpression = {...inclusionRule.expression};
      let currentGroup = newExpression;
      
      // 경로를 따라 중첩 그룹으로 이동
      for (let i = 0; i < groupPath.length - 1; i++) {
        currentGroup = currentGroup.Groups[groupPath[i]];
      }
      
      // 마지막 인덱스의 그룹에 추가
      const lastIndex = groupPath[groupPath.length - 1];
      currentGroup.Groups[lastIndex] = addDemographicCriteria(
        currentGroup.Groups[lastIndex], 
        demographicCriteria
      );
      
      inclusionRule = updateExpression(inclusionRule, newExpression);
    }
  }

  // 하위 그룹 추가
  function addNewSubGroup(toGroup = inclusionRule.expression, groupPath = []) {
    // 기본 조건 그룹 생성
    const subGroup = createCriteriaGroup();
    
    // 그룹에 하위 그룹 추가
    if (groupPath.length === 0) {
      // 최상위 그룹에 추가
      const updatedExpression = addSubGroup(toGroup, subGroup);
      inclusionRule = updateExpression(inclusionRule, updatedExpression);
    } else {
      // 하위 그룹에 추가
      let newExpression = {...inclusionRule.expression};
      let currentGroup = newExpression;
      
      // 경로를 따라 중첩 그룹으로 이동
      for (let i = 0; i < groupPath.length - 1; i++) {
        currentGroup = currentGroup.Groups[groupPath[i]];
      }
      
      // 마지막 인덱스의 그룹에 추가
      const lastIndex = groupPath[groupPath.length - 1];
      currentGroup.Groups[lastIndex] = addSubGroup(
        currentGroup.Groups[lastIndex], 
        subGroup
      );
      
      inclusionRule = updateExpression(inclusionRule, newExpression);
    }
  }

  // 윈도우 조건 제거
  function removeWindowedCriteriaItem(index, fromGroup = inclusionRule.expression, groupPath = []) {
    if (groupPath.length === 0) {
      // 최상위 그룹에서 제거
      const updatedExpression = removeWindowedCriteria(fromGroup, index);
      inclusionRule = updateExpression(inclusionRule, updatedExpression);
    } else {
      // 하위 그룹에서 제거
      let newExpression = {...inclusionRule.expression};
      let currentGroup = newExpression;
      
      // 경로를 따라 중첩 그룹으로 이동
      for (let i = 0; i < groupPath.length - 1; i++) {
        currentGroup = currentGroup.Groups[groupPath[i]];
      }
      
      // 마지막 인덱스의 그룹에서 제거
      const lastIndex = groupPath[groupPath.length - 1];
      currentGroup.Groups[lastIndex] = removeWindowedCriteria(
        currentGroup.Groups[lastIndex], 
        index
      );
      
      inclusionRule = updateExpression(inclusionRule, newExpression);
    }
  }

  // 인구통계학 조건 제거
  function removeDemographicCriteriaItem(index, fromGroup = inclusionRule.expression, groupPath = []) {
    if (groupPath.length === 0) {
      // 최상위 그룹에서 제거
      const updatedExpression = removeDemographicCriteria(fromGroup, index);
      inclusionRule = updateExpression(inclusionRule, updatedExpression);
    } else {
      // 하위 그룹에서 제거
      let newExpression = {...inclusionRule.expression};
      let currentGroup = newExpression;
      
      // 경로를 따라 중첩 그룹으로 이동
      for (let i = 0; i < groupPath.length - 1; i++) {
        currentGroup = currentGroup.Groups[groupPath[i]];
      }
      
      // 마지막 인덱스의 그룹에서 제거
      const lastIndex = groupPath[groupPath.length - 1];
      currentGroup.Groups[lastIndex] = removeDemographicCriteria(
        currentGroup.Groups[lastIndex], 
        index
      );
      
      inclusionRule = updateExpression(inclusionRule, newExpression);
    }
  }

  // 하위 그룹 제거
  function removeSubGroupItem(index, fromGroup = inclusionRule.expression, groupPath = []) {
    if (groupPath.length === 0) {
      // 최상위 그룹에서 제거
      const updatedExpression = removeSubGroup(fromGroup, index);
      inclusionRule = updateExpression(inclusionRule, updatedExpression);
    } else {
      // 하위 그룹에서 제거
      let newExpression = {...inclusionRule.expression};
      let currentGroup = newExpression;
      
      // 경로를 따라 중첩 그룹으로 이동
      for (let i = 0; i < groupPath.length - 1; i++) {
        currentGroup = currentGroup.Groups[groupPath[i]];
      }
      
      // 마지막 인덱스의 그룹에서 제거
      const lastIndex = groupPath[groupPath.length - 1];
      currentGroup.Groups[lastIndex] = removeSubGroup(
        currentGroup.Groups[lastIndex], 
        index
      );
      
      inclusionRule = updateExpression(inclusionRule, newExpression);
    }
  }

  // 조건 유형 이름 가져오기
  function getCriteriaTypeName(criteria) {
    const type = Object.keys(criteria)[0];
    // 타입에서 대문자 앞에 공백 추가하여 표시 이름 생성
    return type.replace(/([A-Z])/g, ' $1').trim();
  }

  // 윈도우 조건의 조건 유형 UI ID 가져오기
  function getCriteriaTypeId(criteria) {
    const type = Object.keys(criteria)[0];
    return typeMapping[type]; // Atlas 유형에서 UI ID로 변환
  }

  // 윈도우 조건 속성 업데이트
  function updateWindowedCriteriaProperty(windowedCriteria, property, value, groupPath = [], index) {
    let updatedCriteria = {...windowedCriteria};
    
    // 속성에 따라 적절한 업데이트 함수 호출
    if (property === 'occurrenceType') {
      updatedCriteria = updateOccurrenceType(updatedCriteria, parseInt(value));
    } else if (property === 'occurrenceCount') {
      updatedCriteria = updateOccurrenceCount(updatedCriteria, parseInt(value) || 1);
    } else if (property === 'isDistinct') {
      updatedCriteria = updateOccurrenceIsDistinct(updatedCriteria, value);
    } else if (property === 'startDaysBefore') {
      const newStartWindow = {
        Start: {
          ...updatedCriteria.StartWindow.Start,
          Days: parseInt(value) || 0
        }
      };
      updatedCriteria = updateStartWindow(updatedCriteria, newStartWindow);
    } else if (property === 'startDaysAfter') {
      const newStartWindow = {
        End: {
          ...updatedCriteria.StartWindow.End,
          Days: parseInt(value) || 0
        }
      };
      updatedCriteria = updateStartWindow(updatedCriteria, newStartWindow);
    } else if (property === 'useEventEnd') {
      const newStartWindow = {
        UseEventEnd: value
      };
      updatedCriteria = updateStartWindow(updatedCriteria, newStartWindow);
    } else if (property === 'conceptSetId') {
      // Criteria 객체의 CodesetId 업데이트
      const type = Object.keys(updatedCriteria.Criteria)[0];
      const newCriteria = {...updatedCriteria.Criteria};
      newCriteria[type] = {
        ...newCriteria[type],
        CodesetId: value === "null" ? null : parseInt(value)
      };
      updatedCriteria = updateCriteria(updatedCriteria, newCriteria);
    }

    // 업데이트된 조건을 규칙에 반영
    if (groupPath.length === 0) {
      // 최상위 그룹의 조건 업데이트
      const updatedCriteriaList = [...inclusionRule.expression.CriteriaList];
      updatedCriteriaList[index] = updatedCriteria;
      
      const updatedExpression = {
        ...inclusionRule.expression,
        CriteriaList: updatedCriteriaList
      };
      
      inclusionRule = updateExpression(inclusionRule, updatedExpression);
    } else {
      // 하위 그룹의 조건 업데이트
      let newExpression = {...inclusionRule.expression};
      let currentGroup = newExpression;
      
      // 경로를 따라 중첩 그룹으로 이동
      for (let i = 0; i < groupPath.length - 1; i++) {
        currentGroup = currentGroup.Groups[groupPath[i]];
      }
      
      // 마지막 인덱스의 그룹의 조건 업데이트
      const lastIndex = groupPath[groupPath.length - 1];
      const updatedCriteriaList = [...currentGroup.Groups[lastIndex].CriteriaList];
      updatedCriteriaList[index] = updatedCriteria;
      
      currentGroup.Groups[lastIndex] = {
        ...currentGroup.Groups[lastIndex],
        CriteriaList: updatedCriteriaList
      };
      
      inclusionRule = updateExpression(inclusionRule, newExpression);
    }
  }
  
  // 저장 및 모달 닫기
  function saveAndClose() {
    // 상위 컴포넌트에 업데이트 이벤트 디스패치
    dispatch('update', { inclusionRule, index: ruleIndex });
    
    // 모달 닫기
    closeModal();
  }
  
  // 모달 닫기
  function closeModal() {
    show = false;
    dispatch('close');
  }

  // 토글 그룹 확장/축소
  function toggleGroupExpand(groupId) {
    expandedGroups = {
      ...expandedGroups,
      [groupId]: !expandedGroups[groupId]
    };
  }

  // 재귀적 조건 그룹 렌더링을 위한 함수
  function renderGroup(group, groupPath = [], groupId = "root") {
    const isExpanded = expandedGroups[groupId] !== false; // 기본적으로 확장
    
    return {
      id: groupId,
      expanded: isExpanded,
      type: group.Type,
      count: group.Count,
      criteriaList: group.CriteriaList,
      demographicCriteriaList: group.DemographicCriteriaList,
      groups: group.Groups.map((subGroup, index) => 
        renderGroup(subGroup, [...groupPath, index], `${groupId}_${index}`)
      ),
      path: groupPath
    };
  }

  // 렌더링을 위한 그룹 데이터 생성
  $: rootGroup = inclusionRule ? renderGroup(inclusionRule.expression) : null;
</script>

{#if show}
  <!-- 모달 오버레이 -->
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
    <!-- 모달 컨테이너 -->
    <div class="bg-white rounded-lg shadow-xl w-[900px] max-h-[90vh] flex flex-col">
      <!-- 모달 헤더 -->
      <div class="flex items-center justify-between px-6 py-4 border-b">
        <h2 class="text-xl font-bold text-gray-800">포함 규칙 편집</h2>
        <button 
          class="text-gray-400 hover:text-gray-600"
          on:click={closeModal}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- 모달 콘텐츠 -->
      <div class="flex-1 p-6 overflow-auto">
        <!-- 규칙 이름 및 설명 -->
        <div class="mb-6 grid grid-cols-1 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">규칙 이름</label>
            <input
              type="text"
              class="w-full rounded-md border border-gray-300 p-2 text-sm"
              value={inclusionRule?.name || ''}
              on:input={handleNameChange}
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">설명 (선택사항)</label>
            <textarea
              class="w-full rounded-md border border-gray-300 p-2 text-sm"
              rows="2"
              value={inclusionRule?.description || ''}
              on:input={handleDescriptionChange}
            ></textarea>
          </div>
        </div>

        <!-- 조건 그룹 편집기 -->
        {#if rootGroup}
          <div class="mb-4 border rounded-md p-4 bg-gray-50">
            <!-- 루트 그룹 헤더 - 논리 연산자 선택 -->
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-2">
                <select
                  class="rounded-md border border-gray-300 p-2 text-sm"
                  value={rootGroup.type}
                  on:change={(e) => updateRootGroupType(e.target.value)}
                >
                  {#each groupTypeOptions as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
                
                {#if rootGroup.type === 'AT_LEAST'}
                  <input
                    type="number"
                    min="1"
                    class="w-16 rounded-md border border-gray-300 p-2 text-sm"
                    value={rootGroup.count || 1}
                    on:input={(e) => updateCount(inclusionRule.expression, e.target.value)}
                  />
                  <span class="text-sm text-gray-700">criteria</span>
                {/if}
              </div>
              
              <div class="flex space-x-2">
                <button 
                  class="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded hover:bg-blue-50"
                  on:click={() => selectedCriteriaType = ""}
                >
                  + 조건 추가
                </button>
                <!-- <button 
                  class="px-2 py-1 text-xs text-green-600 hover:text-green-800 border border-green-200 rounded hover:bg-green-50"
                  on:click={() => addNewDemographicCriteria()}
                >
                  + 인구통계학
                </button> -->
                <button 
                  class="px-2 py-1 text-xs text-purple-600 hover:text-purple-800 border border-purple-200 rounded hover:bg-purple-50"
                  on:click={() => addNewSubGroup()}
                >
                  + 하위 그룹
                </button>
              </div>
            </div>

            <!-- 조건 선택 UI (선택된 경우) -->
            {#if selectedCriteriaType === ""}
              <div class="mb-4 p-3 border rounded-md bg-white">
                <h4 class="text-sm font-medium text-gray-700 mb-2">추가할 조건 유형 선택:</h4>
                <div class="grid grid-cols-2 gap-2">
                  {#each criteriaTypes as type}
                    <button
                      class="text-left p-2 text-xs border rounded hover:bg-blue-50"
                      on:click={() => addNewWindowedCriteria(type.id)}
                    >
                      {type.name}
                    </button>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- 윈도우 조건 목록 -->
            {#if rootGroup.criteriaList.length > 0}
              <div class="mb-4">
                <h4 class="text-sm font-medium text-gray-700 mb-2">조건:</h4>
                <div class="space-y-2">
                  {#each rootGroup.criteriaList as criteria, index}
                    <div class="border rounded-md p-3 bg-white">
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center">
                          <span class="text-sm font-medium text-blue-600">
                            {getCriteriaTypeName(criteria.Criteria)}
                          </span>
                        </div>
                        <button 
                          class="text-xs text-red-500 hover:text-red-700"
                          on:click={() => removeWindowedCriteriaItem(index)}
                        >
                          삭제
                        </button>
                      </div>
                      
                      <!-- 윈도우 조건 상세 설정 -->
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <!-- 개념 집합 선택 -->
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">개념 집합</label>
                          <select
                            class="w-full rounded-md border border-gray-300 p-1 text-xs"
                            on:change={(e) => updateWindowedCriteriaProperty(
                              criteria, 
                              'conceptSetId', 
                              e.target.value,
                              rootGroup.path,
                              index
                            )}
                          >
                            <option value="null">Any</option>
                            {#each conceptSets as conceptSet, i}
                              <option 
                                value={i} 
                                selected={criteria.Criteria[Object.keys(criteria.Criteria)[0]].CodesetId === i}
                              >
                                {conceptSet.name || `Concept Set ${i+1}`}
                              </option>
                            {/each}
                          </select>
                        </div>
                        
                        <!-- 발생 유형 -->
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">발생 유형</label>
                          <div class="flex items-center space-x-2">
                            <select
                              class="rounded-md border border-gray-300 p-1 text-xs"
                              value={criteria.Occurrence.Type}
                              on:change={(e) => updateWindowedCriteriaProperty(
                                criteria, 
                                'occurrenceType', 
                                e.target.value,
                                rootGroup.path,
                                index
                              )}
                            >
                              {#each occurrenceTypeOptions as option}
                                <option value={option.value}>{option.label}</option>
                              {/each}
                            </select>
                            <input
                              type="number"
                              min="1"
                              class="w-16 rounded-md border border-gray-300 p-1 text-xs"
                              value={criteria.Occurrence.Count}
                              on:input={(e) => updateWindowedCriteriaProperty(
                                criteria, 
                                'occurrenceCount', 
                                e.target.value,
                                rootGroup.path,
                                index
                              )}
                            />
                            <span class="text-xs text-gray-700">times</span>
                          </div>
                        </div>
                        
                        <!-- 고유 발생 여부 -->
                        <div>
                          <label class="flex items-center">
                            <input
                              type="checkbox"
                              class="h-3 w-3 text-blue-600 rounded"
                              checked={criteria.Occurrence.IsDistinct}
                              on:change={(e) => updateWindowedCriteriaProperty(
                                criteria, 
                                'isDistinct', 
                                e.target.checked,
                                rootGroup.path,
                                index
                              )}
                            />
                            <span class="ml-1 text-xs text-gray-700">고유 발생만 계산</span>
                          </label>
                        </div>
                        
                        <!-- 시간 윈도우 설정 -->
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">시간 윈도우</label>
                          <div class="flex items-center space-x-1">
                            <input
                              type="number"
                              class="w-12 rounded-md border border-gray-300 p-1 text-xs"
                              value={criteria.StartWindow.Start.Days}
                              on:input={(e) => updateWindowedCriteriaProperty(
                                criteria, 
                                'startDaysBefore', 
                                e.target.value,
                                rootGroup.path,
                                index
                              )}
                            />
                            <span class="text-xs text-gray-700">일 전부터</span>
                            <input
                              type="number"
                              class="w-12 rounded-md border border-gray-300 p-1 text-xs"
                              value={criteria.StartWindow.End.Days}
                              on:input={(e) => updateWindowedCriteriaProperty(
                                criteria, 
                                'startDaysAfter', 
                                e.target.value,
                                rootGroup.path,
                                index
                              )}
                            />
                            <span class="text-xs text-gray-700">일 후까지</span>
                          </div>
                        </div>
                        
                        <!-- 이벤트 종료 사용 여부 -->
                        <div>
                          <label class="flex items-center">
                            <input
                              type="checkbox"
                              class="h-3 w-3 text-blue-600 rounded"
                              checked={criteria.StartWindow.UseEventEnd}
                              on:change={(e) => updateWindowedCriteriaProperty(
                                criteria, 
                                'useEventEnd', 
                                e.target.checked,
                                rootGroup.path,
                                index
                              )}
                            />
                            <span class="ml-1 text-xs text-gray-700">이벤트 종료일 사용</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- 인구통계학 조건 목록 -->
            {#if rootGroup.demographicCriteriaList.length > 0}
              <div class="mb-4">
                <h4 class="text-sm font-medium text-gray-700 mb-2">인구통계학:</h4>
                <div class="space-y-2">
                  {#each rootGroup.demographicCriteriaList as demographic, index}
                    <div class="border rounded-md p-3 bg-white">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-green-600">인구통계학 조건</span>
                        <button 
                          class="text-xs text-red-500 hover:text-red-700"
                          on:click={() => removeDemographicCriteriaItem(index)}
                        >
                          삭제
                        </button>
                      </div>
                      
                      <!-- 인구통계학 상세 설정 - 실제 구현에서는 속성별 편집기 추가 필요 -->
                      <div class="text-xs text-gray-500 italic">
                        인구통계학 속성 편집기가 이 데모에 구현되지 않았습니다.
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- 하위 그룹 목록 (재귀적) -->
            {#if rootGroup.groups.length > 0}
              <div class="mb-4">
                <h4 class="text-sm font-medium text-gray-700 mb-2">하위 그룹:</h4>
                <div class="space-y-3">
                  {#each rootGroup.groups as group, index}
                    <div class="border rounded-md p-3 bg-white">
                      <!-- 그룹 헤더 - 논리 연산자 선택 -->
                      <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center space-x-2">
                          <button 
                            class="text-gray-500 hover:text-gray-700"
                            on:click={() => toggleGroupExpand(group.id)}
                          >
                            {#if group.expanded}
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            {:else}
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                              </svg>
                            {/if}
                          </button>
                          
                          <select
                            class="rounded-md border border-gray-300 p-1 text-xs"
                            value={group.type}
                            on:change={(e) => updateSubGroupType(group.path, e.target.value)}
                          >
                            {#each groupTypeOptions as option}
                              <option value={option.value}>{option.label}</option>
                            {/each}
                          </select>
                          
                          {#if group.type === 'AT_LEAST'}
                            <input
                              type="number"
                              min="1"
                              class="w-12 rounded-md border border-gray-300 p-1 text-xs"
                              value={group.count || 1}
                              on:input={(e) => {
                                const currentGroup = inclusionRule.expression;
                                let targetGroup = currentGroup;
                                
                                // 경로를 따라 중첩 그룹으로 이동
                                for (let i = 0; i < group.path.length; i++) {
                                  targetGroup = targetGroup.Groups[group.path[i]];
                                }
                                
                                updateCount(targetGroup, e.target.value, group.path);
                              }}
                            />
                            <span class="text-xs text-gray-700">criteria</span>
                          {/if}
                        </div>
                        
                        <div class="flex space-x-2">
                          <button 
                            class="text-xs text-red-500 hover:text-red-700"
                            on:click={() => removeSubGroupItem(index)}
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                      
                      <!-- 하위 그룹 내용 - 확장된 경우에만 표시 -->
                      {#if group.expanded}
                        <div class="pl-4 border-l-2 border-gray-200">
                          <!-- 하위 그룹 조건 추가 버튼 -->
                          <div class="flex space-x-2 mb-3">
                            <button 
                              class="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded hover:bg-blue-50"
                              on:click={() => selectedCriteriaType = `${group.id}_criteria`}
                            >
                              + 조건 추가
                            </button>
                            <!-- <button 
                              class="px-2 py-1 text-xs text-green-600 hover:text-green-800 border border-green-200 rounded hover:bg-green-50"
                              on:click={() => addNewDemographicCriteria(null, group.path)}
                            >
                              + 인구통계학
                            </button> -->
                            <button 
                              class="px-2 py-1 text-xs text-purple-600 hover:text-purple-800 border border-purple-200 rounded hover:bg-purple-50"
                              on:click={() => addNewSubGroup(null, group.path)}
                            >
                              + 하위 그룹
                            </button>
                          </div>

                          <!-- 조건 선택 UI (선택된 경우) -->
                          {#if selectedCriteriaType === `${group.id}_criteria`}
                            <div class="mb-3 p-3 border rounded-md bg-white">
                              <h4 class="text-xs font-medium text-gray-700 mb-2">추가할 조건 유형 선택:</h4>
                              <div class="grid grid-cols-2 gap-2">
                                {#each criteriaTypes as type}
                                  <button
                                    class="text-left p-2 text-xs border rounded hover:bg-blue-50"
                                    on:click={() => {
                                      addNewWindowedCriteria(type.id, null, group.path);
                                      selectedCriteriaType = null;
                                    }}
                                  >
                                    {type.name}
                                  </button>
                                {/each}
                              </div>
                            </div>
                          {/if}

                          <!-- 하위 그룹의 윈도우 조건 목록 -->
                          {#if group.criteriaList.length > 0}
                            <div class="mb-3">
                              <h5 class="text-xs font-medium text-gray-700 mb-2">조건:</h5>
                              <div class="space-y-2">
                                {#each group.criteriaList as criteria, criteriaIndex}
                                  <div class="border rounded-md p-3 bg-white">
                                    <div class="flex items-center justify-between mb-2">
                                      <span class="text-xs font-medium text-blue-600">
                                        {getCriteriaTypeName(criteria.Criteria)}
                                      </span>
                                      <button 
                                        class="text-xs text-red-500 hover:text-red-700"
                                        on:click={() => removeWindowedCriteriaItem(criteriaIndex, null, group.path)}
                                      >
                                        삭제
                                      </button>
                                    </div>
                                    
                                    <!-- 하위 그룹의 윈도우 조건 상세 설정 -->
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                      <!-- 개념 집합 선택 -->
                                      <div>
                                        <label class="block text-xs font-medium text-gray-700 mb-1">개념 집합</label>
                                        <select
                                          class="w-full rounded-md border border-gray-300 p-1 text-xs"
                                          on:change={(e) => updateWindowedCriteriaProperty(
                                            criteria, 
                                            'conceptSetId', 
                                            e.target.value,
                                            group.path,
                                            criteriaIndex
                                          )}
                                        >
                                          <option value="null">Any</option>
                                          {#each conceptSets as conceptSet, i}
                                            <option 
                                              value={i} 
                                              selected={criteria.Criteria[Object.keys(criteria.Criteria)[0]].CodesetId === i}
                                            >
                                              {conceptSet.name || `Concept Set ${i+1}`}
                                            </option>
                                          {/each}
                                        </select>
                                      </div>
                                      
                                      <!-- 발생 유형 -->
                                      <div>
                                        <label class="block text-xs font-medium text-gray-700 mb-1">발생 유형</label>
                                        <div class="flex items-center space-x-2">
                                          <select
                                            class="rounded-md border border-gray-300 p-1 text-xs"
                                            value={criteria.Occurrence.Type}
                                            on:change={(e) => updateWindowedCriteriaProperty(
                                              criteria, 
                                              'occurrenceType', 
                                              e.target.value,
                                              group.path,
                                              criteriaIndex
                                            )}
                                          >
                                            {#each occurrenceTypeOptions as option}
                                              <option value={option.value}>{option.label}</option>
                                            {/each}
                                          </select>
                                          <input
                                            type="number"
                                            min="1"
                                            class="w-12 rounded-md border border-gray-300 p-1 text-xs"
                                            value={criteria.Occurrence.Count}
                                            on:input={(e) => updateWindowedCriteriaProperty(
                                              criteria, 
                                              'occurrenceCount', 
                                              e.target.value,
                                              group.path,
                                              criteriaIndex
                                            )}
                                          />
                                          <span class="text-xs text-gray-700">times</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                {/each}
                              </div>
                            </div>
                          {/if}

                          <!-- 하위 그룹의 인구통계학 조건 목록 -->
                          {#if group.demographicCriteriaList.length > 0}
                            <div class="mb-3">
                              <h5 class="text-xs font-medium text-gray-700 mb-2">인구통계학:</h5>
                              <div class="space-y-2">
                                {#each group.demographicCriteriaList as demographic, demoIndex}
                                  <div class="border rounded-md p-3 bg-white">
                                    <div class="flex items-center justify-between mb-2">
                                      <span class="text-xs font-medium text-green-600">인구통계학 조건</span>
                                      <button 
                                        class="text-xs text-red-500 hover:text-red-700"
                                        on:click={() => removeDemographicCriteriaItem(demoIndex, null, group.path)}
                                      >
                                        삭제
                                      </button>
                                    </div>
                                    
                                    <!-- 하위 그룹의 인구통계학 상세 설정 -->
                                    <div class="text-xs text-gray-500 italic">
                                      인구통계학 속성 편집기가 이 데모에 구현되지 않았습니다.
                                    </div>
                                  </div>
                                {/each}
                              </div>
                            </div>
                          {/if}

                          <!-- 재귀적으로 더 깊은 하위 그룹 렌더링 -->
                          {#if group.groups.length > 0}
                            <div>
                              <h5 class="text-xs font-medium text-gray-700 mb-2">하위 그룹:</h5>
                              <div class="space-y-2">
                                <!-- 이 위치에서 중첩된 하위 그룹을 재귀적으로 렌더링할 수 있음 -->
                                <p class="text-xs text-gray-500 italic">중첩된 하위 그룹 지원은 이 데모에서 제한적으로 구현되었습니다.</p>
                              </div>
                            </div>
                          {/if}
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
      
      <!-- 모달 푸터 -->
      <div class="px-6 py-4 border-t flex justify-end">
        <button 
          class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 mr-2"
          on:click={closeModal}
        >
          취소
        </button>
        <button 
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          on:click={saveAndClose}
        >
          저장
        </button>
      </div>
    </div>
  </div>
{/if}