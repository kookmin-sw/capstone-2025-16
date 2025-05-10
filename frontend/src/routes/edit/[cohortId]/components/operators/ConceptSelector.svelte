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
  import type { Concept } from '../../models/ConceptSet';
  
  // Operator type definition
  type ConceptOperatorType = {
    eq?: string | string[];
    neq?: string | string[];
    [key: string]: string | string[] | undefined;
  };
  
  export let value: ConceptOperatorType = {};
  export let label: string = "Select Concept";
  export let placeholder: string = "Search for concepts";
  
  // Available operators
  const availableOperators = [
    { type: 'eq', label: 'Equal to (=)' },
    { type: 'neq', label: 'Not equal to (≠)' }
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
  }
  
  // Search for concepts
  async function searchConcepts() {
    if (!searchQuery.trim()) return;
    
    isSearching = true;
    
    try {
      const response = await fetch(`https://bento.kookm.in/api/concept/search?query=${searchQuery}&page=0&limit=100`);
      const data = await response.json();
      searchResults = data.concepts;
    } catch (error) {
      console.error('Error searching concepts:', error);
      searchResults = [];
    } finally {
      isSearching = false;
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
    isMultipleMode = !isMultipleMode;
    
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
    // Check if concept is already selected
    if (!selectedConcepts.some(c => c.concept_id === concept.concept_id)) {
      selectedConcepts = [...selectedConcepts, concept];
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
      if (isMultipleMode) {
        newValue[selectedOperator] = selectedConcepts.map(c => c.concept_id);
      } else {
        // In single mode, just use the first concept
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
</script>

<div class="relative w-full">
  <!-- Trigger button -->
  <button
    type="button"
    class="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm hover:bg-gray-50"
    on:click={toggleSearch}
  >
    <span class="truncate">{displayValue}</span>
    <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
    </svg>
  </button>
  
  <!-- Dropdown panel -->
  {#if showSearch}
    <div class="absolute z-10 mt-1 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
      <div class="p-3">
        <div class="mb-3 flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700">{label}</span>
          <div class="flex items-center space-x-2">
            <!-- Operator selection -->
            <select 
              class="rounded-md border border-gray-300 py-1 text-xs"
              bind:value={selectedOperator}
              on:change={() => updateValue()}
            >
              {#each availableOperators as op}
                <option value={op.type}>{op.label}</option>
              {/each}
            </select>
            
            <!-- Multiple/single toggle -->
            <button 
              type="button"
              class="text-xs text-blue-600 hover:text-blue-800"
              on:click={toggleMultipleMode}
            >
              {isMultipleMode ? 'Single' : 'Multiple'}
            </button>
          </div>
        </div>
        
        <!-- Search input -->
        <div class="mb-3 flex items-center space-x-2">
          <input
            type="text"
            placeholder={placeholder}
            class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            bind:value={searchQuery}
            on:keydown={(e) => e.key === 'Enter' && searchConcepts()}
          />
          <button
            type="button"
            class="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            on:click={searchConcepts}
            disabled={isSearching}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        <!-- Selected concepts -->
        {#if selectedConcepts.length > 0}
          <div class="mb-3">
            <h4 class="mb-1 text-xs font-medium text-gray-500">Selected</h4>
            <div class="max-h-28 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-2">
              {#each selectedConcepts as concept}
                <div class="mb-1 flex items-center justify-between rounded bg-white px-2 py-1 text-xs">
                  <div class="flex-1 truncate">
                    <span class="font-medium">{concept.concept_name}</span>
                    <span class="ml-1 text-gray-500">({concept.concept_id})</span>
                  </div>
                  <button
                    type="button"
                    class="ml-1 text-red-600 hover:text-red-800"
                    on:click={() => removeConcept(concept.concept_id)}
                  >
                    ×
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
            <div class="max-h-40 overflow-y-auto rounded-md border border-gray-200 bg-white p-2">
              {#each searchResults as concept}
                <div 
                  class="mb-1 cursor-pointer rounded px-2 py-1 text-xs hover:bg-gray-100"
                  on:click={() => addConcept(concept)}
                >
                  <div class="font-medium">{concept.concept_name}</div>
                  <div class="text-gray-500">
                    ID: {concept.concept_id} | {concept.domain_id} | {concept.vocabulary_id}
                  </div>
                </div>
              {/each}
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
            class="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
            on:click={() => showSearch = false}
          >
            Cancel
          </button>
          <button
            type="button"
            class="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
            on:click={applyChanges}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>