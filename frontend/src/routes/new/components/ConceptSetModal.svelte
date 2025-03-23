<!-- 
  개념 집합(Concept Set) 관리 모달 컴포넌트
  기능:
  - 개념 집합 목록 보기
  - 개념 집합 생성/편집/삭제
  - 개념 검색 및 추가
  - 개념 속성 편집(포함/제외, 하위계층 포함, 매핑된 개념 포함) 
-->
<script>
  import { createEventDispatcher } from 'svelte';
  import { 
    createConceptSet, 
    addConceptToSet, 
    removeConceptFromSet, 
    updateConceptSetItem,
    exportConceptSetToJson,
    importConceptSetFromJson
  } from '../models/ConceptSet.js';
  
  // 이벤트 디스패처 설정
  const dispatch = createEventDispatcher();
  
  // 모달 표시 여부
  export let show = false;
  
  // 개념 집합 목록 (코호트 표현식에서 가져옴)
  export let conceptSets = [];
  
  // 현재 활성화된 탭
  let activeTab = 'list'; // 'list', 'edit', 'search', 'import'
  
  // 현재 선택된 개념 집합 인덱스
  let selectedConceptSetIndex = -1;
  
  // 개념 집합 편집용 임시 객체
  let editingConceptSet = null;
  
  // 새 개념 집합 생성
  function createNewConceptSet() {
    const newConceptSet = createConceptSet({
      name: `Concept Set ${conceptSets.length + 1}`,
    });
    
    // 데이터 복사본 만들기
    const updatedConceptSets = [...conceptSets, newConceptSet];
    
    // 상위 컴포넌트에 업데이트 알림
    dispatch('update', { conceptSets: updatedConceptSets });
    
    // 편집 모드로 전환
    selectedConceptSetIndex = updatedConceptSets.length - 1;
    editConceptSet(selectedConceptSetIndex);
  }
  
  // 개념 집합 삭제
  function deleteConceptSet(index) {
    if (confirm("정말로 이 개념 집합을 삭제하시겠습니까?")) {
      const updatedConceptSets = [...conceptSets];
      updatedConceptSets.splice(index, 1);
      
      // 상위 컴포넌트에 업데이트 알림
      dispatch('update', { conceptSets: updatedConceptSets });
      
      // 현재 선택된 개념 집합 초기화
      if (selectedConceptSetIndex === index) {
        selectedConceptSetIndex = -1;
        editingConceptSet = null;
      } else if (selectedConceptSetIndex > index) {
        selectedConceptSetIndex--;
      }
    }
  }
  
  // 개념 집합 편집 시작
  function editConceptSet(index) {
    selectedConceptSetIndex = index;
    editingConceptSet = JSON.parse(JSON.stringify(conceptSets[index])); // 깊은 복사
    activeTab = 'edit';
  }
  
  // 개념 집합 이름 변경
  function updateConceptSetName(name) {
    if (editingConceptSet) {
      editingConceptSet.name = name;
    }
  }
  
  // 편집 중인 개념 집합 저장
  function saveConceptSet() {
    if (editingConceptSet && selectedConceptSetIndex >= 0) {
      const updatedConceptSets = [...conceptSets];
      updatedConceptSets[selectedConceptSetIndex] = editingConceptSet;
      
      // 상위 컴포넌트에 업데이트 알림
      dispatch('update', { conceptSets: updatedConceptSets });
      
      // 목록 화면으로 돌아가기
      activeTab = 'list';
    }
  }
  
  // 개념 집합 항목 속성 업데이트
  function updateItemProperty(conceptId, property, value) {
    if (editingConceptSet) {
      const updatedSet = updateConceptSetItem(
        editingConceptSet, 
        conceptId, 
        property, 
        value
      );
      editingConceptSet = updatedSet;
    }
  }
  
  // 개념 집합에서 항목 제거
  function removeItem(conceptId) {
    if (editingConceptSet) {
      const updatedSet = removeConceptFromSet(editingConceptSet, conceptId);
      editingConceptSet = updatedSet;
    }
  }
  
  // 검색 결과 (데모용 가상 데이터)
  let searchResults = [];
  let searchTerm = '';
  
  // 검색 기능 (실제로는 API 호출이 필요)
  function searchConcepts() {
    // 데모용 가상 데이터 - 실제로는 API 호출 필요
    if (searchTerm.trim() === '') {
      searchResults = [];
      return;
    }
    
    // 데모용 가상 검색 결과
    searchResults = [
      {
        CONCEPT_ID: 1,
        CONCEPT_NAME: "Type 2 diabetes mellitus",
        STANDARD_CONCEPT: "S",
        STANDARD_CONCEPT_CAPTION: "Standard",
        INVALID_REASON: null,
        INVALID_REASON_CAPTION: null,
        CONCEPT_CODE: "44054006",
        DOMAIN_ID: "Condition",
        VOCABULARY_ID: "SNOMED",
        CONCEPT_CLASS_ID: "Clinical Finding"
      },
      {
        CONCEPT_ID: 2,
        CONCEPT_NAME: "Hypertension",
        STANDARD_CONCEPT: "S",
        STANDARD_CONCEPT_CAPTION: "Standard",
        INVALID_REASON: null,
        INVALID_REASON_CAPTION: null,
        CONCEPT_CODE: "38341003",
        DOMAIN_ID: "Condition",
        VOCABULARY_ID: "SNOMED",
        CONCEPT_CLASS_ID: "Clinical Finding"
      },
      {
        CONCEPT_ID: 3,
        CONCEPT_NAME: "Myocardial infarction",
        STANDARD_CONCEPT: "S",
        STANDARD_CONCEPT_CAPTION: "Standard",
        INVALID_REASON: null,
        INVALID_REASON_CAPTION: null,
        CONCEPT_CODE: "22298006",
        DOMAIN_ID: "Condition",
        VOCABULARY_ID: "SNOMED",
        CONCEPT_CLASS_ID: "Clinical Finding"
      }
    ].filter(concept => 
      concept.CONCEPT_NAME.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  // 검색 결과에서 개념 추가
  function addConceptFromSearch(concept) {
    if (editingConceptSet) {
      const updatedSet = addConceptToSet(editingConceptSet, concept);
      editingConceptSet = updatedSet;
    }
  }
  
  // JSON 가져오기/내보내기
  let importJson = '';
  
  function exportToJson() {
    if (editingConceptSet) {
      return exportConceptSetToJson(editingConceptSet);
    }
    return '';
  }
  
  function importFromJson() {
    try {
      const imported = importConceptSetFromJson(importJson);
      
      // 유효성 검사 (최소한 이름이 있는지)
      if (!imported.name) {
        alert('유효하지 않은 개념 집합 JSON입니다.');
        return;
      }
      
      const updatedConceptSets = [...conceptSets, imported];
      
      // 상위 컴포넌트에 업데이트 알림
      dispatch('update', { conceptSets: updatedConceptSets });
      
      // 편집 모드로 전환
      selectedConceptSetIndex = updatedConceptSets.length - 1;
      editConceptSet(selectedConceptSetIndex);
      
      // 입력 초기화
      importJson = '';
      
      // 성공 메시지
      alert('개념 집합이 성공적으로 가져와졌습니다.');
    } catch (e) {
      alert('JSON 파싱 오류: ' + e.message);
    }
  }
  
  // 모달 닫기
  function closeModal() {
    show = false;
    dispatch('close');
  }
</script>

{#if show}
  <!-- 모달 오버레이 -->
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
    <!-- 모달 컨테이너 -->
    <div class="bg-white rounded-lg shadow-xl w-[800px] max-h-[90vh] flex flex-col">
      <!-- 모달 헤더 -->
      <div class="flex items-center justify-between px-6 py-4 border-b">
        <h2 class="text-xl font-bold text-gray-800">개념 집합 관리</h2>
        <button 
          class="text-gray-400 hover:text-gray-600"
          on:click={closeModal}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- 모달 탭 -->
      <div class="flex border-b">
        <button 
          class="px-4 py-2 text-sm font-medium {activeTab === 'list' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
          on:click={() => activeTab = 'list'}
        >
          개념 집합 목록
        </button>
        {#if editingConceptSet}
          <button 
            class="px-4 py-2 text-sm font-medium {activeTab === 'edit' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
            on:click={() => activeTab = 'edit'}
          >
            {editingConceptSet.name} 편집
          </button>
          <button 
            class="px-4 py-2 text-sm font-medium {activeTab === 'search' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
            on:click={() => activeTab = 'search'}
          >
            개념 검색
          </button>
        {/if}
        <button 
          class="px-4 py-2 text-sm font-medium {activeTab === 'import' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
          on:click={() => activeTab = 'import'}
        >
          가져오기/내보내기
        </button>
      </div>
      
      <!-- 모달 콘텐츠 -->
      <div class="flex-1 p-6 overflow-auto">
        <!-- 개념 집합 목록 탭 -->
        {#if activeTab === 'list'}
          <div class="flex justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-800">개념 집합 목록</h3>
            <button 
              class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              on:click={createNewConceptSet}
            >
              + 새 개념 집합
            </button>
          </div>
          
          {#if conceptSets.length === 0}
            <div class="text-center py-10 text-gray-500">
              개념 집합이 없습니다. 새 개념 집합을 만들어보세요.
            </div>
          {:else}
            <div class="space-y-2">
              {#each conceptSets as conceptSet, index}
                <div class="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
                  <div>
                    <p class="font-medium text-gray-800">{conceptSet.name}</p>
                    <p class="text-sm text-gray-500">{conceptSet.expression.items.length}개 개념</p>
                  </div>
                  <div class="flex space-x-2">
                    <button 
                      class="px-2 py-1 text-sm text-blue-600 hover:text-blue-800"
                      on:click={() => editConceptSet(index)}
                    >
                      편집
                    </button>
                    <button 
                      class="px-2 py-1 text-sm text-red-600 hover:text-red-800"
                      on:click={() => deleteConceptSet(index)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        
        <!-- 개념 집합 편집 탭 -->
        {:else if activeTab === 'edit' && editingConceptSet}
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700">개념 집합 이름</label>
            <input 
              type="text" 
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              value={editingConceptSet.name}
              on:input={(e) => updateConceptSetName(e.target.value)}
            />
          </div>
          
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-gray-800">포함된 개념</h3>
            <button 
              class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              on:click={() => activeTab = 'search'}
            >
              + 개념 추가
            </button>
          </div>
          
          {#if editingConceptSet.expression.items.length === 0}
            <div class="text-center py-10 text-gray-500">
              개념이 없습니다. 개념 검색 탭에서 개념을 추가하세요.
            </div>
          {:else}
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">개념 ID</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">개념 이름</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제외</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">하위계층 포함</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">매핑된 개념 포함</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {#each editingConceptSet.expression.items as item}
                    <tr>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.concept.CONCEPT_ID}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.concept.CONCEPT_NAME}</td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <input 
                          type="checkbox" 
                          class="h-4 w-4 text-blue-600 rounded border-gray-300"
                          checked={item.isExcluded}
                          on:change={(e) => updateItemProperty(item.concept.CONCEPT_ID, 'isExcluded', e.target.checked)}
                        />
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <input 
                          type="checkbox" 
                          class="h-4 w-4 text-blue-600 rounded border-gray-300"
                          checked={item.includeDescendants}
                          on:change={(e) => updateItemProperty(item.concept.CONCEPT_ID, 'includeDescendants', e.target.checked)}
                        />
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <input 
                          type="checkbox" 
                          class="h-4 w-4 text-blue-600 rounded border-gray-300"
                          checked={item.includeMapped}
                          on:change={(e) => updateItemProperty(item.concept.CONCEPT_ID, 'includeMapped', e.target.checked)}
                        />
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button 
                          class="text-red-600 hover:text-red-900"
                          on:click={() => removeItem(item.concept.CONCEPT_ID)}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
          
          <div class="mt-6 flex justify-end">
            <button 
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              on:click={saveConceptSet}
            >
              저장
            </button>
          </div>
        
        <!-- 개념 검색 탭 -->
        {:else if activeTab === 'search' && editingConceptSet}
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700">개념 검색</label>
            <div class="mt-1 flex rounded-md shadow-sm">
              <input 
                type="text" 
                class="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300"
                placeholder="개념 이름으로 검색 (예: diabetes, hypertension)"
                bind:value={searchTerm}
              />
              <button 
                class="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100"
                on:click={searchConcepts}
              >
                검색
              </button>
            </div>
            <p class="mt-1 text-xs text-gray-500">* 이 데모에서는 Type 2 diabetes, Hypertension, Myocardial infarction 등의 키워드로 검색해보세요.</p>
          </div>
          
          {#if searchResults.length > 0}
            <div class="overflow-x-auto border rounded-md">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">개념 ID</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">개념 이름</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">도메인</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">어휘</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">클래스</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {#each searchResults as concept}
                    <tr>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{concept.CONCEPT_ID}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{concept.CONCEPT_NAME}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{concept.DOMAIN_ID}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{concept.VOCABULARY_ID}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{concept.CONCEPT_CLASS_ID}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button 
                          class="text-blue-600 hover:text-blue-900"
                          on:click={() => addConceptFromSearch(concept)}
                        >
                          추가
                        </button>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else if searchTerm}
            <div class="text-center py-10 text-gray-500">
              검색 결과가 없습니다. 다른 키워드로 검색해보세요.
            </div>
          {/if}
        
        <!-- 가져오기/내보내기 탭 -->
        {:else if activeTab === 'import'}
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-medium text-gray-800 mb-2">개념 집합 가져오기</h3>
              <textarea 
                class="w-full h-40 p-3 border rounded-md"
                placeholder="여기에 개념 집합 JSON을 붙여넣으세요"
                bind:value={importJson}
              ></textarea>
              <button 
                class="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={!importJson.trim()}
                on:click={importFromJson}
              >
                가져오기
              </button>
            </div>
            
            {#if editingConceptSet}
              <div>
                <h3 class="text-lg font-medium text-gray-800 mb-2">개념 집합 내보내기</h3>
                <textarea 
                  class="w-full h-40 p-3 border rounded-md"
                  readonly
                  value={exportToJson()}
                ></textarea>
                <button 
                  class="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  on:click={() => {
                    // 클립보드에 복사
                    navigator.clipboard.writeText(exportToJson())
                      .then(() => alert('클립보드에 복사되었습니다!'))
                      .catch(err => alert('클립보드 복사 실패: ' + err));
                  }}
                >
                  클립보드에 복사
                </button>
              </div>
            {/if}
          </div>
        {/if}
      </div>
      
      <!-- 모달 푸터 -->
      <div class="px-6 py-4 border-t flex justify-end">
        <button 
          class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          on:click={closeModal}
        >
          닫기
        </button>
      </div>
    </div>
  </div>
{/if}