<!-- 
  Direct Concept Selector Component
  Features:
  - Search for concepts
  - Directly uses the concept ID without operators
  - Simplified for single concept selection
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Concept } from '../../../routes/custom-chart/[chartID]/chart/[chartID]/models/ConceptSet';
  
  // Value is just the concept ID as a string
  export let value: string = '';
  export let label: string = "Select Concept";
  export let placeholder: string = "Search for concepts";
  
  const dispatch = createEventDispatcher();
  
  // UI State
  let showSearch = false;
  let searchQuery = '';
  let searchResults: Concept[] = [];
  let isSearching = false;
  let selectedConcept: Concept | null = null;
  let selectedDomain = ''; // For domain filtering
  
  // Pagination state
  let currentPage = 0;
  let pageSize = 10;
  let totalResults = 0;
  let totalPages = 0;

  // Available domains for filtering
  const availableDomains = [
    '', 'Measurement', 'Drug', 'Observation', 'Note', 'Procedure', 
    'Meas Value', 'Device', 'Condition', 'Metadata', 'Spec Anatomic Site', 
    'Specimen', 'Type Concept', 'Unit', 'Provider', 'Race', 'Relationship', 
    'Geography', 'Route', 'Language', 'Visit', 'Plan', 'Sponsor', 'Payer', 
    'Plan Stop Reason', 'Gender', 'Cost', 'Episode', 'Revenue Code', 
    'Condition Status', 'Regimen', 'Condition/Procedure', 'Condition/Obs', 
    'Obs/Procedure', 'Currency', 'Ethnicity', 'Meas/Procedure', 
    'Meas Value Operator', 'Condition/Meas', 'Device/Procedure', 
    'Drug/Procedure', 'Device/Drug', 'Place of Service', 'Condition/Device'
  ];
  
  // Filter display values
  let displayValue = '';
  
  // Initialize component
  $: {
    updateDisplayValue();
  }
  
  // Update display value based on current selection
  function updateDisplayValue() {
    if (value && selectedConcept) {
      displayValue = selectedConcept.concept_name || value;
    } else if (value) {
      displayValue = value;
    } else {
      displayValue = 'Select concept';
    }
  }
  
  // Initialize with existing value
  function initSelectedConcept() {
    if (value && !selectedConcept) {
      // If we have a value but no concept details, set a placeholder
      selectedConcept = {
        concept_id: value,
        concept_name: value,
        domain_id: '',
        vocabulary_id: '',
        concept_class_id: '',
        standard_concept: '',
        concept_code: '',
        valid_start_date: '',
        valid_end_date: ''
      };
    }
  }
  
  // Search for concepts
  async function searchConcepts() {

    isSearching = true;
    
    try {
      // Add domain parameter to query if a domain is selected
      const domainParam = selectedDomain ? `&domain=${encodeURIComponent(selectedDomain)}` : '';
      const response = await fetch(`https://bento.kookm.in/api/concept/search?query=${encodeURIComponent(searchQuery)}${domainParam}&page=${page}&limit=${pageSize}`);
      const data = await response.json();
      
      searchResults = data.concepts;
      totalResults = data.total || data.concepts.length;
      totalPages = Math.ceil(totalResults / pageSize);
    } catch (error) {
      console.error('Error searching concepts:', error);
      searchResults = [];
      totalResults = 0;
      totalPages = 0;
    } finally {
      isSearching = false;
    }
  }
  
  // Navigate to next page
  function nextPage() {
    if (currentPage < totalPages - 1) {
      currentPage++;
      searchConcepts();
    }
  }
  
  // Navigate to previous page
  function prevPage() {
    if (currentPage > 0) {
      currentPage--;
      searchConcepts();
    }
  }
  
  // Toggle search panel
  function toggleSearch() {
    showSearch = !showSearch;
    if (!selectedConcept && value) {
      initSelectedConcept();
    }
  }
  
  // Select a concept - this directly uses the concept ID as the value
  function selectConcept(concept: Concept) {
    selectedConcept = concept;
    value = concept.concept_id;
    dispatch('change', concept.concept_id);
    updateDisplayValue();
    showSearch = false; // Close the panel after selection
  }
  
  // Clear selection
  function clearSelection() {
    selectedConcept = null;
    value = '';
    dispatch('change', '');
    updateDisplayValue();
  }
</script>

<div class="relative w-full">
  <!-- Trigger button -->
  <button
    type="button"
    class="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-all hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    on:click={toggleSearch}
  >
    <span class="truncate">{displayValue}</span>
    <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
    </svg>
  </button>
  
  <!-- Dropdown panel -->
  {#if showSearch}
    <div class="absolute z-10 mt-1 w-full origin-top-right rounded-lg bg-white p-3 shadow-lg ring-1 ring-black ring-opacity-5">
      <div class="mb-3 flex items-center justify-between">
        <span class="text-sm font-medium text-gray-700">{label}</span>
      </div>
      
      <!-- Search input and domain filter -->
      <div class="mb-3 flex flex-col space-y-2">
        <div class="flex items-center space-x-2">
          <input
            type="text"
            placeholder={placeholder}
            class="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            bind:value={searchQuery}
            on:keydown={(e) => e.key === 'Enter' && searchConcepts()}
          />
          <button
            type="button"
            class="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            on:click={() => searchConcepts()}
            disabled={isSearching}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        <!-- Domain filter dropdown -->
        <div class="flex items-center space-x-2">
          <label for="domain-filter" class="text-sm font-medium text-gray-700">Domain:</label>
          <select 
            id="domain-filter"
            class="flex-1 rounded-md border border-gray-300 bg-white py-1.5 pl-3 pr-8 text-sm shadow-sm transition-all hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            bind:value={selectedDomain}
            on:change={() => { currentPage = 0; searchResults = []; totalResults = 0; totalPages = 0; }}
          >
            {#each availableDomains as domain}
              <option value={domain}>{domain || 'All Domains'}</option>
            {/each}
          </select>
        </div>
      </div>
      
      <!-- Selected concept -->
      {#if selectedConcept}
        <div class="mb-3">
          <h4 class="mb-1 text-xs font-medium text-gray-500">Selected</h4>
          <div class="max-h-28 space-y-1 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-2">
            <div class="flex items-center justify-between rounded-md bg-white px-2 py-1.5 text-sm shadow-sm">
              <div class="flex-1 truncate">
                <span class="font-medium text-gray-700">{selectedConcept.concept_name}</span>
                <span class="ml-1 text-gray-500">({selectedConcept.concept_id})</span>
              </div>
              <button
                type="button"
                class="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"
                on:click={clearSelection}
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      {/if}
      
      <!-- Search results -->
      {#if searchResults.length > 0}
        <div>
          <h4 class="mb-1 text-xs font-medium text-gray-500">Results</h4>
          <div class="max-h-40 space-y-1 overflow-y-auto rounded-md border border-gray-200 bg-white p-2">
            {#each searchResults as concept}
              <div 
                class="cursor-pointer rounded-md bg-white px-2 py-1.5 text-sm shadow-sm transition-all hover:bg-gray-50"
                on:click={() => selectConcept(concept)}
              >
                <div class="font-medium text-gray-700">{concept.concept_name}</div>
                <div class="text-xs text-gray-500">
                  ID: {concept.concept_id} | {concept.domain_id} | {concept.vocabulary_id}
                </div>
              </div>
            {/each}
          </div>
          
          <!-- Pagination controls -->
          <div class="mt-2 flex items-center justify-between">
            <div class="text-xs text-gray-500">
              Showing {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalResults)} of {totalResults} results
            </div>
            <div class="flex items-center space-x-2">
              <button
                class="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
                on:click={prevPage}
                disabled={currentPage === 0 || isSearching}
              >
                Previous
              </button>
              <span class="text-xs text-gray-500">Page {currentPage + 1} of {totalPages || 1}</span>
              <button
                class="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
                on:click={nextPage}
                disabled={currentPage >= totalPages - 1 || isSearching}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      {:else if searchQuery && !isSearching}
        <div class="rounded-md bg-gray-50 p-2 text-center text-xs text-gray-500">
          No concepts found. Try different search terms.
        </div>
      {/if}
      
      <!-- Action buttons -->
      <div class="mt-3 flex justify-end space-x-2">
        <button
          type="button"
          class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          on:click={() => showSearch = false}
        >
          Cancel
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  /* 스크롤바 스타일링 */
  .overflow-y-auto::-webkit-scrollbar {
    width: 6px;
  }

  .overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
</style>