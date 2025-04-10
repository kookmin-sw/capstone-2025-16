<script>
  export let show = false;
  
  // Callback functions
  export let onClose = () => {};
  export let onSubmit = () => {};
  
  // Active tab - "text" or "file"
  let activeTab = "text";
  
  // Form data
  let files = [];
  let cohortText = "";
  let isLoading = false;
  
  // Generated cohort data
  let generatedCohort = null;
  let editableSummary = "";
  let isGeneratingCohort = false;
  let isApplyingCohort = false;
  let generationStep = ""; // "generated", "applying", "completed"
  
  // Handle file upload
  function handleFileUpload(event) {
    const uploadedFiles = event.target.files;
    if (uploadedFiles.length > 0) {
      files = [...files, ...Array.from(uploadedFiles)];
    }
  }
  
  // Generate cohort based on inputs
  function generateCohort() {
    if (activeTab === "text" && !cohortText.trim()) {
      alert("코호트 기준을 텍스트로 입력해주세요");
      return;
    }
    
    if (activeTab === "file" && files.length === 0) {
      alert("논문 파일을 업로드해주세요");
      return;
    }
    
    isLoading = true;
    
    // Here would be the actual API call to generate the cohort
    // For now, simulate a response
    setTimeout(() => {
      generatedCohort = {
        summary: "고혈압 환자 중 ACE 억제제를 복용하고 있는 50세 이상인 환자 코호트를 생성했습니다. 이 코호트는 최근 5년간 최소 2회 이상 병원을 방문한 환자들을 대상으로 하며, 당뇨병 진단을 받은 환자는 제외하였습니다.\n\n총 환자 수는 약 5,000명으로 예상되며, 이 중 65% 이상이 남성입니다. 약 35%의 환자가 심혈관 질환 관련 약물을 복용 중입니다.",
        technicalDetails: [
          "포함 기준: 고혈압 진단(ICD-10: I10-I15), ACE 억제제 처방, 연령 ≥ 50세",
          "제외 기준: 당뇨병 진단(ICD-10: E10-E14)",
          "시간적 기준: 최근 5년 내 진료 기록, 최소 2회 이상 방문 기록"
        ]
      };
      
      // Set the editable summary to the generated summary
      editableSummary = generatedCohort.summary;
      generationStep = "generated";
      isLoading = false;
    }, 2000);
  }
  
  // Apply cohort definition to create the actual cohort
  function applyCohort() {
    if (!generatedCohort) return;
    
    // Update the summary with the edited version
    generatedCohort.summary = editableSummary;
    
    isApplyingCohort = true;
    generationStep = "applying";
    
    // Simulate cohort creation process
    setTimeout(() => {
      isApplyingCohort = false;
      generationStep = "completed";
      
      // Submit after a short delay to show the "completed" status
      setTimeout(() => {
        onSubmit({
          summary: generatedCohort.summary,
          details: generatedCohort.technicalDetails
        });
        
        // Reset state
        resetForm();
        
        // Close modal
        onClose();
      }, 1000);
    }, 2000);
  }
  
  // Reset the form
  function resetForm() {
    cohortText = "";
    files = [];
    generatedCohort = null;
    editableSummary = "";
    generationStep = "";
  }
  
  // Remove file from list
  function removeFile(index) {
    files = files.filter((_, i) => i !== index);
  }
  
  // Switch to text tab
  function switchToTextTab() {
    activeTab = "text";
  }
  
  // Switch to file tab
  function switchToFileTab() {
    activeTab = "file";
  }
  
  // Go back from results to input
  function goBackToInput() {
    generatedCohort = null;
    editableSummary = "";
    generationStep = "";
  }
</script>

{#if show}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
  <div class="w-full max-w-3xl h-[80vh] rounded-lg bg-white shadow-xl flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-gray-200 p-4">
      <h2 class="text-xl font-bold text-gray-800">Cohort AI</h2>
      <button 
        class="text-gray-500 hover:text-gray-700"
        on:click={onClose}
        disabled={isLoading || isApplyingCohort}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    
    <!-- Content Area -->
    <div class="flex-1 overflow-auto p-6">
      {#if generatedCohort}
        <!-- Results View -->
        <div>
          {#if generationStep === "completed"}
            <!-- Completion View -->
            <div class="text-center py-12">
              <div class="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg class="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-gray-900">코호트 생성 완료</h3>
              <p class="mt-2 text-sm text-gray-500">코호트가 성공적으로 생성되었습니다.</p>
            </div>
          {:else if generationStep === "applying"}
            <!-- Processing View -->
            <div class="text-center py-12">
              <div class="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full">
                <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 class="text-lg font-medium text-gray-900">코호트 생성 중</h3>
              <p class="mt-2 text-sm text-gray-500">요청하신 코호트를 생성하고 있습니다. 잠시만 기다려주세요.</p>
            </div>
          {:else}
            <!-- Editable Summary View -->
            <div class="mb-6">
              <h3 class="font-semibold text-gray-800 mb-2">생성된 코호트 요약 (수정 가능)</h3>
              <textarea
                bind:value={editableSummary}
                rows="8"
                class="w-full rounded-md border border-gray-300 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
              <p class="text-xs text-gray-500 mt-1">요약 내용을 검토하고 필요에 따라 수정하세요.</p>
            </div>
            
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h3 class="font-semibold text-gray-700 mb-2">기술적 세부사항</h3>
              <ul class="list-disc pl-5 text-sm text-gray-600 space-y-1">
                {#each generatedCohort.technicalDetails as detail}
                  <li>{detail}</li>
                {/each}
              </ul>
            </div>
            
            <!-- Action Buttons -->
            <div class="mt-6 flex justify-end space-x-4">
              <button
                class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                on:click={goBackToInput}
              >
                취소하기
              </button>
              <button
                class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                on:click={applyCohort}
              >
                적용하기
              </button>
            </div>
          {/if}
        </div>
        
      {:else}
        <!-- Tabs -->
        <div class="mb-6">
          <div class="border-b border-gray-200">
            <div class="flex">
              <button 
                class="py-3 px-6 font-medium text-sm {activeTab === 'text' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}"
                on:click={switchToTextTab}
              >
                텍스트 입력
              </button>
              <button 
                class="py-3 px-6 font-medium text-sm {activeTab === 'file' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}"
                on:click={switchToFileTab}
              >
                논문 파일 업로드
              </button>
            </div>
          </div>
        </div>
        
        <!-- Input View -->
        <div>
          <div class="mb-8 text-center">
            <div class="inline-block mb-3 rounded-full bg-blue-100 p-3">
              {#if activeTab === "text"}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              {:else}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              {/if}
            </div>
            <h3 class="text-lg font-medium text-gray-800 mb-2">
              {#if activeTab === "text"}
                코호트 기준을 텍스트로 입력해주세요
              {:else}
                논문 파일을 업로드해주세요
              {/if}
            </h3>
            <p class="text-sm text-gray-600">
              {#if activeTab === "text"}
                코호트 정의 기준, 포함/제외 기준 등을 자연어로 입력해주세요.
              {:else}
                코호트 정의가 담긴 PDF 논문 파일을 업로드해주세요.
              {/if}
            </p>
          </div>
          
          {#if activeTab === "text"}
            <!-- Text Input -->
            <div>
              <textarea
                bind:value={cohortText}
                rows="10"
                class="w-full rounded-md border border-gray-300 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="여기에 코호트 정의 기준을 직접 입력하세요. 예: '고혈압 환자 중 50세 이상이며, 최근 5년간 최소 2회 이상 병원을 방문한 환자들...'"
              ></textarea>
            </div>
          {:else}
            <!-- File Upload -->
            <div>
              <div class="flex items-center justify-center w-full">
                <label class="flex flex-col w-full h-40 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div class="flex flex-col items-center justify-center pt-7 pb-7">
                    <svg class="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <p class="mb-2 text-sm text-gray-500">
                      <span class="font-semibold">클릭하여 파일 선택</span> 또는 여기에 드래그 앤 드롭
                    </p>
                    <p class="text-xs text-gray-500">PDF 파일만 가능 (여러 파일 선택 가능)</p>
                  </div>
                  <input 
                    type="file" 
                    class="hidden" 
                    accept=".pdf" 
                    multiple
                    on:change={handleFileUpload}
                  />
                </label>
              </div>
              
              <!-- Uploaded Files List -->
              {#if files.length > 0}
                <div class="mt-6">
                  <h4 class="text-sm font-medium text-gray-700 mb-2">업로드된 파일 ({files.length})</h4>
                  <div class="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {#each files as file, index}
                      <div class="flex items-center justify-between bg-gray-50 rounded-md p-2 text-sm">
                        <div class="flex items-center">
                          <svg class="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"></path>
                          </svg>
                          <span class="text-gray-800 truncate max-w-md">{file.name}</span>
                        </div>
                        <button 
                          class="text-gray-500 hover:text-red-500"
                          on:click={() => removeFile(index)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </div>
    
    <!-- Footer -->
    {#if !generatedCohort || (generationStep !== "applying" && generationStep !== "completed")}
      <div class="border-t border-gray-200 p-4 flex justify-end space-x-4 items-center">
        {#if isLoading}
          <div class="flex items-center mr-auto">
            <svg class="animate-spin h-5 w-5 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-sm text-gray-600">코호트 요약 생성 중...</span>
          </div>
        {/if}
        
        <button
          class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          on:click={onClose}
          disabled={isLoading}
        >
          취소
        </button>
        
        {#if !generatedCohort}
          <button
            class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            on:click={generateCohort}
            disabled={isLoading || (activeTab === "text" && !cohortText.trim()) || (activeTab === "file" && files.length === 0)}
          >
            코호트 요약 생성
          </button>
        {/if}
      </div>
    {/if}
  </div>
</div>
{/if}