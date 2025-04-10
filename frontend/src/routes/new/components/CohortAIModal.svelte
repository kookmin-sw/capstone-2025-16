<script>
  export let show = false;
  
  // Callback functions
  export let onClose = () => {};
  export let onSubmit = () => {};
  
  // Form data
  let pdfFile = null;
  let cohortText = "";
  let isLoading = false;
  
  // Handle file upload
  function handleFileChange(event) {
    const files = event.target.files;
    if (files.length > 0) {
      pdfFile = files[0];
    }
  }
  
  function handleSubmit() {
    if (!pdfFile && !cohortText) {
      alert("Please upload a PDF or enter text");
      return;
    }
    
    isLoading = true;
    
    // Here you would implement the actual submission logic
    // For now we'll just simulate a successful submission
    setTimeout(() => {
      isLoading = false;
      onSubmit({ pdfFile, cohortText });
      onClose();
    }, 1000);
  }
</script>

{#if show}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
  <div class="w-full max-w-2xl rounded-lg bg-white p-8 shadow-xl">
    <div class="flex items-center justify-between border-b border-gray-200 pb-4">
      <h2 class="text-xl font-bold text-gray-800">Cohort AI</h2>
      <button 
        class="text-gray-500 hover:text-gray-700"
        on:click={onClose}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    
    <div class="py-4">
      <p class="mb-4 text-sm text-gray-600">
        Upload a paper PDF and/or enter cohort description text to automatically generate a cohort definition.
      </p>
      
      <div class="mb-6">
        <label class="mb-2 block text-sm font-medium text-gray-700">
          Upload Research Paper (PDF)
        </label>
        <div class="flex items-center justify-center w-full">
          <label class="flex flex-col w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
            <div class="flex flex-col items-center justify-center pt-5 pb-6">
              <svg class="w-8 h-8 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              <p class="mb-1 text-sm text-gray-500">
                <span class="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p class="text-xs text-gray-500">PDF only (MAX. 20MB)</p>
            </div>
            <input 
              type="file" 
              class="hidden" 
              accept=".pdf" 
              on:change={handleFileChange}
            />
          </label>
        </div>
        {#if pdfFile}
          <p class="mt-2 text-sm text-green-600">File selected: {pdfFile.name}</p>
        {/if}
      </div>
      
      <div class="mb-6">
        <label class="mb-2 block text-sm font-medium text-gray-700">
          Cohort Description (Optional)
        </label>
        <textarea
          bind:value={cohortText}
          rows="6"
          class="w-full rounded-md border border-gray-300 p-2 text-sm"
          placeholder="Describe the cohort characteristics in natural language, e.g., 'Patients over 50 with type 2 diabetes who were prescribed metformin...'"
        ></textarea>
      </div>
    </div>
    
    <div class="flex justify-end gap-4 border-t border-gray-200 pt-4">
      <button
        class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        on:click={onClose}
      >
        Cancel
      </button>
      <button
        class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        on:click={handleSubmit}
        disabled={isLoading}
      >
        {#if isLoading}
          <span class="flex items-center">
            <svg class="mr-2 h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        {:else}
          Generate Cohort
        {/if}
      </button>
    </div>
  </div>
</div>
{/if}