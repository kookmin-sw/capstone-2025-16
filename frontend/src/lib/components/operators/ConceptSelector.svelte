<!-- 
  Concept Selector Component
  Features:
  - Search for concepts
  - Add selected concepts to filter
  - Support for single/multiple concept selection
  - Similar to ConceptSetModal but optimized for filter attributes
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Concept } from '../../../routes/custom-chart/[chartID]/chart/[chartID]/models/ConceptSet';
  
  // Operator type definition
  type ConceptOperatorType = {
    eq?: string | string[];
    neq?: string | string[];
    [key: string]: string | string[] | undefined;
  };
  
  export let value: ConceptOperatorType = {};
  export let label: string = "Select Concept";
  export let placeholder: string = "Search for concepts";
  export let singleModeOnly: boolean = false; // New prop to force single concept selection mode
  
  // Available operators
  const availableOperators = [
    { type: 'eq', label: 'Equal to (=)', icon: '=' },
    { type: 'neq', label: 'Not equal to (≠)', icon: '≠' }
  ];
  
  const dispatch = createEventDispatcher();
  
  // UI State
  let showSearch = false;
  let searchQuery = '';
  let searchResults: Concept[] = [];
  let isSearching = false;
  let selectedOperator = 'eq'; // Default operator
  let isMultipleMode = false;
  let selectedConcepts: Concept[] = [];
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
    // For displaying the current selection in the trigger button
    if (value.eq) {
      const opValue = value.eq;
      if (Array.isArray(opValue)) {
        displayValue = `${opValue.length} concepts selected`;
      } else {
        displayValue = getConceptNameById(opValue) || opValue;
      }
    } else if (value.neq) {
      const opValue = value.neq;
      if (Array.isArray(opValue)) {
        displayValue = `Not: ${opValue.length} concepts`;
      } else {
        displayValue = `Not: ${getConceptNameById(opValue) || opValue}`;
      }
    } else {
      displayValue = 'Select concept';
    }
  }
  
  // Helper to get a concept name from its ID (overridable by parent component)
  function getConceptNameById(id: string): string | undefined {
    const concept = selectedConcepts.find(c => c.concept_id === id);
    return concept?.concept_name;
  }
  
  // Initialize selected concepts from value
  function initSelectedConcepts() {
    for (const op of availableOperators) {
      const val = value[op.type];
      if (val) {
        if (Array.isArray(val)) {
          // When singleModeOnly is true, we only take the first concept from arrays
          if (singleModeOnly) {
            isMultipleMode = false;
            if (val.length > 0) {
              const id = val[0];
              if (!selectedConcepts.some(c => c.concept_id === id)) {
                selectedConcepts = [{
                  concept_id: id,
                  concept_name: getConceptNameById(id) || id,
                  domain_id: '',
                  vocabulary_id: '',
                  concept_class_id: '',
                  standard_concept: '',
                  concept_code: '',
                  valid_start_date: '',
                  valid_end_date: ''
                }];
              }
            }
          } else {
            isMultipleMode = true;
            // For now, just set the IDs - names will be loaded when searched
            for (const id of val) {
              if (!selectedConcepts.some(c => c.concept_id === id)) {
                selectedConcepts.push({
                  concept_id: id,
                  concept_name: getConceptNameById(id) || id,
                  domain_id: '',
                  vocabulary_id: '',
                  concept_class_id: '',
                  standard_concept: '',
                  concept_code: '',
                  valid_start_date: '',
                  valid_end_date: ''
                });
              }
            }
          }
        } else {
          isMultipleMode = false;
          if (!selectedConcepts.some(c => c.concept_id === val)) {
            selectedConcepts.push({
              concept_id: val,
              concept_name: getConceptNameById(val) || val,
              domain_id: '',
              vocabulary_id: '',
              concept_class_id: '',
              standard_concept: '',
              concept_code: '',
              valid_start_date: '',
              valid_end_date: ''
            });
          }
        }
        
        selectedOperator = op.type;
        break;
      }
    }
    
    // When singleModeOnly is true, force isMultipleMode to false
    if (singleModeOnly) {
      isMultipleMode = false;
    }
  }
  
  // Search for concepts
  async function searchConcepts() {
    if (!searchQuery.trim()) return;
    
    isSearching = true;
    currentPage;
    
    try {
      // Add domain parameter to query if a domain is selected
      const domainParam = selectedDomain ? `&domain=${encodeURIComponent(selectedDomain)}` : '';
      console.log(currentPage)
      const response = await fetch(`https://bento.kookm.in/api/concept/search?query=${encodeURIComponent(searchQuery)}${domainParam}&page=${currentPage}&limit=${pageSize}`);
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
    if (!selectedConcepts.length) {
      initSelectedConcepts();
    }
  }
  
  // Toggle multiple mode
  function toggleMultipleMode() {
    // If singleModeOnly is true, we shouldn't be able to enter multiple mode
    if (singleModeOnly) {
      isMultipleMode = false;
    } else {
      isMultipleMode = !isMultipleMode;
    }
    
    // Update the value object accordingly
    updateValue();
  }
  
  // Change operator
  function changeOperator(op: string) {
    selectedOperator = op;
    updateValue();
  }
  
  // Add concept
  function addConcept(concept: Concept) {
    // For single mode only, replace the current selection
    if (singleModeOnly) {
      selectedConcepts = [concept];
      updateValue();
      return;
    }
    
    // For regular mode, check if concept is already selected
    if (!selectedConcepts.some(c => c.concept_id === concept.concept_id)) {
      // In single mode, replace the current selection
      if (!isMultipleMode) {
        selectedConcepts = [concept];
      } else {
        // In multiple mode, add to the selection
        selectedConcepts = [...selectedConcepts, concept];
      }
      updateValue();
    }
  }
  
  // Remove concept
  function removeConcept(conceptId: string) {
    selectedConcepts = selectedConcepts.filter(c => c.concept_id !== conceptId);
    updateValue();
  }
  
  // Update value and dispatch change event
  function updateValue() {
    let newValue: ConceptOperatorType = {};
    
    if (selectedConcepts.length > 0) {
      if (isMultipleMode && !singleModeOnly) {
        newValue[selectedOperator] = selectedConcepts.map(c => c.concept_id);
      } else {
        // In single mode or when singleModeOnly is true, just use the first concept
        newValue[selectedOperator] = selectedConcepts[0].concept_id;
      }
    }
    
    value = newValue;
    dispatch('change', newValue);
    updateDisplayValue();
  }
  
  // Close dropdown and apply changes
  function applyChanges() {
    showSearch = false;
    updateValue();
  }

  // Get operator icon
  function getOperatorIcon(type: string): string {
    const op = availableOperators.find(o => o.type === type);
    return op ? op.icon : type;
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
        <div class="flex items-center space-x-2">
          <!-- Operator selection -->
          <select 
            class="rounded-md border border-gray-300 bg-white py-1.5 pl-3 pr-8 text-sm shadow-sm transition-all hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            bind:value={selectedOperator}
            on:change={() => updateValue()}
          >
            {#each availableOperators as op}
              <option value={op.type}>{op.label}</option>
            {/each}
          </select>
          
          <!-- Multiple/single toggle, hidden when singleModeOnly is true -->
          {#if !singleModeOnly}
            <button 
              type="button"
              class="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
              on:click={toggleMultipleMode}
            >
              {isMultipleMode ? 'Multiple' : 'Single'}
            </button>
          {/if}
        </div>
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
          >
            {#each availableDomains as domain}
              <option value={domain}>{domain || 'All Domains'}</option>
            {/each}
          </select>
        </div>
      </div>
      
      <!-- Selected concepts -->
      {#if selectedConcepts.length > 0}
        <div class="mb-3">
          <h4 class="mb-1 text-xs font-medium text-gray-500">Selected</h4>
          <div class="max-h-28 space-y-1 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-2">
            {#each selectedConcepts as concept}
              <div class="flex items-center justify-between rounded-md bg-white px-2 py-1.5 text-sm shadow-sm">
                <div class="flex-1 truncate">
                  <span class="font-medium text-gray-700">{concept.concept_name}</span>
                  <span class="ml-1 text-gray-500">({concept.concept_id})</span>
                </div>
                <button
                  type="button"
                  class="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"
                  on:click={() => removeConcept(concept.concept_id)}
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            {/each}
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
                on:click={() => addConcept(concept)}
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
        <button
          type="button"
          class="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          on:click={applyChanges}
        >
          Apply
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