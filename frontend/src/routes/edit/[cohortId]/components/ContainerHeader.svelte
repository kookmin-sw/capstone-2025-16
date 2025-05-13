<!-- 
  Container Header Component
  Features:
  - Displays container name with edit functionality
  - Shows patient count badge
  - Includes container operation selector (AND/OR/NOT)
  - Provides action buttons
-->
<script>
  // Container props
  export let name = "Container";
  export let operator = "AND";
  export let patientCount = null;
  export let canRemove = true;
  export let isFirstContainer = false;
  export let groupType = 'initialGroup';
  export let containerIndex = 0;
  
  // Event handlers
  export let onContainerNameChange = (groupType, index, name) => {};
  export let onOperatorChange = (groupType, index, operator) => {};
  export let onAddFilter = (groupType, index) => {};
  export let onRemove = (groupType, index) => {};
</script>

<div class="mb-4 flex items-center justify-between">
  <div class="flex items-center">
    {#if !isFirstContainer}
      <select
        class="mr-2 rounded border border-gray-300 bg-gray-50 px-2 py-1 pr-8 text-sm"
        value={operator}
        on:change={(e) => onOperatorChange(groupType, containerIndex, e.target.value)}
      >
        <option value="AND">AND</option>
        <option value="OR">OR</option>
        <option value="NOT">NOT</option>
      </select>
    {/if}
    <div>
      <h4 class="flex items-center text-lg font-medium text-blue-600">
        <svg
          class="h-4 w-4 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
        <input
          type="text"
          class="w-full rounded border-0 bg-transparent p-0 text-lg font-medium text-blue-600 transition-colors duration-200 hover:bg-blue-50 focus:ring-0"
          value={name}
          on:change={(e) => onContainerNameChange(groupType, containerIndex, e.target.value)}
        />
      </h4>
      {#if patientCount !== null}
        <div class="mt-1 flex items-center">
          <span class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
            <svg class="-ml-0.5 mr-1 inline h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
            Patients: {patientCount.toLocaleString()}
          </span>
        </div>
      {/if}
    </div>
  </div>
  <div class="flex space-x-2">
    <button
      class="text-sm text-blue-500 hover:text-blue-700"
      on:click={() => onAddFilter(groupType, containerIndex)}
    >
      Add Filter
    </button>
    {#if canRemove}
      <button
        class="text-sm text-red-500 hover:text-red-700"
        on:click={() => onRemove(groupType, containerIndex)}
      >
        Remove
      </button>
    {/if}
  </div>
</div>