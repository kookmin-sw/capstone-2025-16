<!-- 
  Concept Set Management Modal Component
  Features:
  - View concept set list
  - Create/Edit/Delete concept sets
  - Search and add concepts
  - Edit concept properties (include/exclude, include descendants, include mapped concepts) 
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
  
  // Event dispatcher setup
  const dispatch = createEventDispatcher();
  
  // Modal visibility
  export let show = false;
  
  // Concept set list (from cohort expression)
  export let conceptSets = [];
  
  // Currently active tab
  let activeTab = 'list'; // 'list', 'edit', 'search', 'import'
  
  // Currently selected concept set index
  let selectedConceptSetIndex = -1;
  
  // Temporary object for editing concept set
  let editingConceptSet = null;
  
  // Create new concept set
  function createNewConceptSet() {
    const newConceptSet = createConceptSet({
      name: `Concept Set ${conceptSets.length + 1}`,
    });
    
    // Create data copy
    const updatedConceptSets = [...conceptSets, newConceptSet];
    
    // Notify parent component of update
    dispatch('update', { conceptSets: updatedConceptSets });
    
    // Switch to edit mode
    selectedConceptSetIndex = updatedConceptSets.length - 1;
    editConceptSet(selectedConceptSetIndex);
  }
  
  // Delete concept set
  function deleteConceptSet(index) {
    if (confirm("Are you sure you want to delete this concept set?")) {
      const updatedConceptSets = [...conceptSets];
      updatedConceptSets.splice(index, 1);
      
      // Notify parent component of update
      dispatch('update', { conceptSets: updatedConceptSets });
      
      // Reset current selected concept set
      if (selectedConceptSetIndex === index) {
        selectedConceptSetIndex = -1;
        editingConceptSet = null;
      } else if (selectedConceptSetIndex > index) {
        selectedConceptSetIndex--;
      }
    }
  }
  
  // Start editing concept set
  function editConceptSet(index) {
    selectedConceptSetIndex = index;
    editingConceptSet = JSON.parse(JSON.stringify(conceptSets[index])); // Deep copy
    activeTab = 'edit';
  }
  
  // Change concept set name
  function updateConceptSetName(name) {
    if (editingConceptSet) {
      editingConceptSet.name = name;
    }
  }
  
  // Save editing concept set
  function saveConceptSet() {
    if (editingConceptSet && selectedConceptSetIndex >= 0) {
      const updatedConceptSets = [...conceptSets];
      updatedConceptSets[selectedConceptSetIndex] = editingConceptSet;
      
      // Notify parent component of update
      dispatch('update', { conceptSets: updatedConceptSets });
      
      // Return to list view
      activeTab = 'list';
    }
  }
  
  // Update concept set item property
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
  
  // Remove item from concept set
  function removeItem(conceptId) {
    if (editingConceptSet) {
      const updatedSet = removeConceptFromSet(editingConceptSet, conceptId);
      editingConceptSet = updatedSet;
    }
  }
  
  // Search results (demo virtual data)
  let searchResults = [];
  let searchTerm = '';
  
  // Search function (API call needed in production)
  function searchConcepts() {
    // Demo virtual data - API call needed in production
    if (searchTerm.trim() === '') {
      searchResults = [];
      return;
    }
    
    // Demo virtual search results
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
  
  // Add concept from search results
  function addConceptFromSearch(concept) {
    if (editingConceptSet) {
      const updatedSet = addConceptToSet(editingConceptSet, concept);
      editingConceptSet = updatedSet;
    }
  }
  
  // JSON import/export
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
      
      // Validation (at least name exists)
      if (!imported.name) {
        alert('Invalid concept set JSON.');
        return;
      }
      
      const updatedConceptSets = [...conceptSets, imported];
      
      // Notify parent component of update
      dispatch('update', { conceptSets: updatedConceptSets });
      
      // Switch to edit mode
      selectedConceptSetIndex = updatedConceptSets.length - 1;
      editConceptSet(selectedConceptSetIndex);
      
      // Reset input
      importJson = '';
      
      // Success message
      alert('Concept set imported successfully.');
    } catch (e) {
      alert('JSON parsing error: ' + e.message);
    }
  }
  
  // Close modal
  function closeModal() {
    show = false;
    dispatch('close');
  }
</script>

{#if show}
  <!-- Modal overlay -->
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
    <!-- Modal container -->
    <div class="bg-white rounded-lg shadow-xl w-[800px] max-h-[90vh] flex flex-col">
      <!-- Modal header -->
      <div class="flex items-center justify-between px-6 py-4 border-b">
        <h2 class="text-xl font-bold text-gray-800">Concept Set Management</h2>
        <button 
          class="text-gray-400 hover:text-gray-600"
          on:click={closeModal}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Modal tabs -->
      <div class="flex border-b">
        <button 
          class="px-4 py-2 text-sm font-medium {activeTab === 'list' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
          on:click={() => activeTab = 'list'}
        >
          Concept Set List
        </button>
        {#if editingConceptSet}
          <button 
            class="px-4 py-2 text-sm font-medium {activeTab === 'edit' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
            on:click={() => activeTab = 'edit'}
          >
            Edit {editingConceptSet.name}
          </button>
          <button 
            class="px-4 py-2 text-sm font-medium {activeTab === 'search' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
            on:click={() => activeTab = 'search'}
          >
            Search Concepts
          </button>
        {/if}
        <button 
          class="px-4 py-2 text-sm font-medium {activeTab === 'import' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
          on:click={() => activeTab = 'import'}
        >
          Import/Export
        </button>
      </div>
      
      <!-- Modal content -->
      <div class="flex-1 p-6 overflow-auto">
        <!-- Concept set list tab -->
        {#if activeTab === 'list'}
          <div class="flex justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-800">Concept Set List</h3>
            <button 
              class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              on:click={createNewConceptSet}
            >
              + New Concept Set
            </button>
          </div>
          
          {#if conceptSets.length === 0}
            <div class="text-center py-10 text-gray-500">
              No concept sets. Create a new concept set.
            </div>
          {:else}
            <div class="space-y-2">
              {#each conceptSets as conceptSet, index}
                <div class="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
                  <div>
                    <p class="font-medium text-gray-800">{conceptSet.name}</p>
                    <p class="text-sm text-gray-500">{conceptSet.expression.items.length} concepts</p>
                  </div>
                  <div class="flex space-x-2">
                    <button 
                      class="px-2 py-1 text-sm text-blue-600 hover:text-blue-800"
                      on:click={() => editConceptSet(index)}
                    >
                      Edit
                    </button>
                    <button 
                      class="px-2 py-1 text-sm text-red-600 hover:text-red-800"
                      on:click={() => deleteConceptSet(index)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        
        <!-- Concept set edit tab -->
        {:else if activeTab === 'edit' && editingConceptSet}
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700">Concept Set Name</label>
            <input 
              type="text" 
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              value={editingConceptSet.name}
              on:input={(e) => updateConceptSetName(e.target.value)}
            />
          </div>
          
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-gray-800">Included Concepts</h3>
            <button 
              class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              on:click={() => activeTab = 'search'}
            >
              + Add Concept
            </button>
          </div>
          
          {#if editingConceptSet.expression.items.length === 0}
            <div class="text-center py-10 text-gray-500">
              No concepts. Add concepts from the search tab.
            </div>
          {:else}
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concept ID</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concept Name</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exclude</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Include Descendants</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Include Mapped</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                          Delete
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
              Save
            </button>
          </div>
        
        <!-- Concept search tab -->
        {:else if activeTab === 'search' && editingConceptSet}
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700">Search Concepts</label>
            <div class="mt-1 flex rounded-md shadow-sm">
              <input 
                type="text" 
                class="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300"
                placeholder="Search by concept name (e.g., diabetes, hypertension)"
                bind:value={searchTerm}
              />
              <button 
                class="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100"
                on:click={searchConcepts}
              >
                Search
              </button>
            </div>
            <p class="mt-1 text-xs text-gray-500">* In this demo, try searching with keywords like Type 2 diabetes, Hypertension, Myocardial infarction.</p>
          </div>
          
          {#if searchResults.length > 0}
            <div class="overflow-x-auto border rounded-md">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concept ID</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concept Name</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vocabulary</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                          Add
                        </button>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else if searchTerm}
            <div class="text-center py-10 text-gray-500">
              No search results. Try a different keyword.
            </div>
          {/if}
        
        <!-- Import/Export tab -->
        {:else if activeTab === 'import'}
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-medium text-gray-800 mb-2">Import Concept Set</h3>
              <textarea 
                class="w-full h-40 p-3 border rounded-md"
                placeholder="Paste concept set JSON here"
                bind:value={importJson}
              ></textarea>
              <button 
                class="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={!importJson.trim()}
                on:click={importFromJson}
              >
                Import
              </button>
            </div>
            
            {#if editingConceptSet}
              <div>
                <h3 class="text-lg font-medium text-gray-800 mb-2">Export Concept Set</h3>
                <textarea 
                  class="w-full h-40 p-3 border rounded-md"
                  readonly
                  value={exportToJson()}
                ></textarea>
                <button 
                  class="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  on:click={() => {
                    // Copy to clipboard
                    navigator.clipboard.writeText(exportToJson())
                      .then(() => alert('Copied to clipboard!'))
                      .catch(err => alert('Failed to copy to clipboard: ' + err));
                  }}
                >
                  Copy to Clipboard
                </button>
              </div>
            {/if}
          </div>
        {/if}
      </div>
      
      <!-- Modal footer -->
      <div class="px-6 py-4 border-t flex justify-end">
        <button 
          class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          on:click={closeModal}
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}