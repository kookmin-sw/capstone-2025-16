<!-- 
  End Strategy Modal Component for Atlas-compatible Cohort Builder
  
  This component allows editing of cohort end strategy, including:
  - Selecting strategy type (default, dateOffset, customEra)
  - Configuring date offset strategy parameters
  - Configuring custom era strategy parameters
-->

<script>
  import { createEventDispatcher } from 'svelte';
  import { 
    createDateOffsetStrategy, 
    createCustomEraStrategy, 
    updateDateField,
    updateDateOffset,
    updateDrugCodesetId,
    updateGapDays,
    updateCustomEraOffset
  } from '../models/EndStrategy.js';
  
  // Props

  // let {show = false, endStrategy = null, conceptSets = []} = $props();
  let {show = false, endStrategy = null, conceptSets = []} = $props();
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  // Strategy type
  let strategyType = $state("default");
  
  // DateOffset strategy fields
  let dateField = $state("StartDate");
  let dateOffset = $state(0);
  
  // CustomEra strategy fields
  let drugCodesetId = $state(null);
  let gapDays = $state(0);
  let customEraOffset = $state(0);
  
  // Strategy options
  const strategyOptions = [
    { value: "default", text: "end of continuous observation" },
    { value: "dateOffset", text: "fixed duration relative to initial event" },
    { value: "customEra", text: "end of a continuous drug exposure" }
  ];
  
  // DateOffset field options
  const dateFieldOptions = [
    { value: "StartDate", text: "Start Date" },
    { value: "EndDate", text: "End Date" }
  ];
  
  // Initialize form data when the modal opens or strategy changes
  let isInitialized = $state(false);
  
  $effect(() => {
    if (show && !isInitialized) {
      loadStrategyData();
      isInitialized = true;
    } else if (!show) {
      isInitialized = false;
    }
  });
  
  // Get strategy type from data
  function getStrategyTypeFromData() {
    if (!endStrategy) return "default";
    if (endStrategy.DateOffset) return "dateOffset";
    if (endStrategy.CustomEra) return "customEra";
    return "default";
  }
  
  // Load strategy data into form
  function loadStrategyData() {
    strategyType = getStrategyTypeFromData();
    
    if (strategyType === "dateOffset" && endStrategy && endStrategy.DateOffset) {
      dateField = endStrategy.DateOffset.DateField || "StartDate";
      dateOffset = endStrategy.DateOffset.Offset || 0;
    } else if (strategyType === "customEra" && endStrategy && endStrategy.CustomEra) {
      drugCodesetId = endStrategy.CustomEra.DrugCodesetId;
      gapDays = endStrategy.CustomEra.GapDays || 0;
      customEraOffset = endStrategy.CustomEra.Offset || 0;
    } else {
      resetFormFields();
    }
  }
  
  // Reset form fields
  function resetFormFields() {
    dateField = "StartDate";
    dateOffset = 0;
    drugCodesetId = null;
    gapDays = 0;
    customEraOffset = 0;
  }
  
  // Handle strategy type change
  function handleStrategyTypeChange() {
    console.log(strategyType);
    // When strategy type changes, reset values for the newly selected type
    if (strategyType === "default") {
      // No strategy - nothing to reset
    } else if (strategyType === "dateOffset") {
      // Reset date offset fields to defaults if not already a date offset strategy
      if (!endStrategy || !endStrategy.DateOffset) {
        dateField = "StartDate";
        dateOffset = 0;
      }
    } else if (strategyType === "customEra") {
      // Reset custom era fields to defaults if not already a custom era strategy
      if (!endStrategy || !endStrategy.CustomEra) {
        drugCodesetId = null;
        gapDays = 0;
        customEraOffset = 0;
      }
    }
  }
  
  // Update DateOffset strategy
  function updateDateOffsetStrategy() {
    if (!endStrategy || !endStrategy.DateOffset) {
      endStrategy = createDateOffsetStrategy({
        DateField: dateField,
        Offset: dateOffset
      });
    } else {
      endStrategy = updateDateField(endStrategy, dateField);
      endStrategy = updateDateOffset(endStrategy, dateOffset);
    }
  }
  
  // Update CustomEra strategy
  function updateCustomEraStrategy() {
    if (!endStrategy || !endStrategy.CustomEra) {
      endStrategy = createCustomEraStrategy({
        DrugCodesetId: drugCodesetId,
        GapDays: gapDays,
        Offset: customEraOffset
      });
    } else {
      endStrategy = updateDrugCodesetId(endStrategy, drugCodesetId);
      endStrategy = updateGapDays(endStrategy, gapDays);
      endStrategy = updateCustomEraOffset(endStrategy, customEraOffset);
    }
  }
  
  // Save changes
  function saveChanges() {
    // Create/update strategy based on the selected type
    let newEndStrategy;
    
    if (strategyType === "dateOffset") {
      newEndStrategy = createDateOffsetStrategy({
        DateField: dateField,
        Offset: dateOffset
      });
    } else if (strategyType === "customEra") {
      newEndStrategy = createCustomEraStrategy({
        DrugCodesetId: drugCodesetId,
        GapDays: gapDays,
        Offset: customEraOffset
      });
    } else {
      // Default - no strategy
      newEndStrategy = null;
    }
    
    // Dispatch update event with new strategy
    dispatch('update', { endStrategy: newEndStrategy });
    
    // Close modal
    close();
  }
  
  // Close modal
  function close() {
    dispatch('close');
  }
</script>

{#if show}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-75">
  <div class="max-h-[90vh] w-[800px] overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
    <header class="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
      <h2 class="text-xl font-bold text-gray-800">End Strategy Configuration</h2>
      <button 
        class="text-gray-500 hover:text-gray-700" 
        on:click={close}
      >
        ✕
      </button>
    </header>
    
    <div class="space-y-6">
      <!-- Strategy Type Selection -->
      <div class="mb-4">
        <label class="mb-2 block text-sm font-medium text-gray-700">
          Event will persist until:
        </label>
        <select 
          class="w-full rounded-md border border-gray-300 p-2 text-sm"
          bind:value={strategyType}
          on:change={handleStrategyTypeChange}
        >
          {#each strategyOptions as option}
            <option value={option.value}>{option.text}</option>
          {/each}
        </select>
      </div>
      <!-- 디버그 출력 제거 -->
      
      <!-- DateOffset Strategy -->
      {#if strategyType === "dateOffset"}
        <div class="rounded-md bg-blue-50 p-4">
          <h3 class="mb-2 text-lg font-medium text-blue-800">Fixed Duration Persistence</h3>
          
          <p class="mb-4 text-sm text-gray-600">
            The event end date is derived from adding a number of days to the event's start or end date.
            If an offset is added to the event's start date, all cohort episodes will have the same fixed duration.
            If an offset is added to the event's end date, persons may have varying cohort duration times due to the varying event durations.
          </p>
          
          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                Event date to offset from:
              </label>
              <select 
                class="w-full rounded-md border border-gray-300 p-2 text-sm"
                bind:value={dateField}
              >
                {#each dateFieldOptions as option}
                  <option value={option.value}>{option.text}</option>
                {/each}
              </select>
            </div>
            
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                Number of days offset:
              </label>
              <div class="flex items-center gap-2">
                <input 
                  type="number" 
                  class="w-24 rounded-md border border-gray-300 p-2 text-sm"
                  bind:value={dateOffset}
                />
                <span class="text-sm text-gray-600">days</span>
              </div>
            </div>
          </div>
        </div>
      {/if}
      
      <!-- CustomEra Strategy -->
      {#if strategyType === "customEra"}
        <div class="rounded-md bg-green-50 p-4">
          <h3 class="mb-2 text-lg font-medium text-green-800">Continuous Exposure Persistence</h3>
          
          <p class="mb-4 text-sm text-gray-600">
            A drug era will be derived from all drug exposure events for any of the drugs within the selected concept set,
            using the specified persistence window as a maximum allowable gap in days between successive exposure events
            and adding a specified surveillance window to the final exposure event.
          </p>
          
          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                Concept set containing the drug(s) of interest:
              </label>
              <select 
                class="w-full rounded-md border border-gray-300 p-2 text-sm"
                bind:value={drugCodesetId}
              >
                <option value={null}>Select Drug Concept Set</option>
                {#each conceptSets as conceptSet, i}
                  <option value={i}>{conceptSet.name || `Concept Set ${i+1}`}</option>
                {/each}
              </select>
            </div>
            
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                Persistence window (max gap days):
              </label>
              <div class="flex items-center gap-2">
                <input 
                  type="number" 
                  min="0"
                  class="w-24 rounded-md border border-gray-300 p-2 text-sm"
                  bind:value={gapDays}
                />
                <span class="text-sm text-gray-600">days between exposure records</span>
              </div>
            </div>
            
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                Surveillance window (add days):
              </label>
              <div class="flex items-center gap-2">
                <input 
                  type="number" 
                  min="0"
                  class="w-24 rounded-md border border-gray-300 p-2 text-sm"
                  bind:value={customEraOffset}
                />
                <span class="text-sm text-gray-600">days to the end of the era</span>
              </div>
            </div>
          </div>
        </div>
      {/if}
      
      <!-- Default Strategy (No config needed) -->
      {#if strategyType === "default"}
        <div class="rounded-md bg-gray-50 p-4">
          <p class="text-sm text-gray-600">
            Using default strategy: cohort membership will end at the end of continuous observation.
            No additional configuration is needed.
          </p>
        </div>
      {/if}
    </div>
    
    <footer class="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4">
      <button 
        class="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
        on:click={close}
      >
        Cancel
      </button>
      <button 
        class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        on:click={saveChanges}
      >
        Save
      </button>
    </footer>
  </div>
</div>
{/if}