<script>
  export let show = false;
  export let selectedChartType = 'bar'; // Default chart type

  // Close the modal when clicking outside
  function handleClickOutside(event) {
    const modal = document.getElementById('chart-type-modal');
    if (modal && !modal.contains(event.target)) {
      close();
    }
  }

  function selectChartType(type) {
    selectedChartType = type;
  }

  function close() {
    show = false;
  }

  function handleSave() {
    // Dispatch the selected chart type
    dispatch('save', { chartType: selectedChartType });
    close();
  }

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
</script>

{#if show}
  <div 
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    on:click={handleClickOutside}
  >
    <div 
      id="chart-type-modal"
      class="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
    >
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-bold text-gray-800">Select Chart Type</h2>
        <button 
          class="text-gray-500 hover:text-gray-700"
          on:click={close}
        >
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-6">
        <!-- Bar Chart Option -->
        <div 
          class="flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all 
            {selectedChartType === 'bar' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'}"
          on:click={() => selectChartType('bar')}
        >
          <!-- Bar Chart SVG -->
          <svg width="100" height="80" viewBox="0 0 100 80" class="mb-2">
            <rect x="10" y="10" width="15" height="60" fill="#4B96FF" />
            <rect x="35" y="30" width="15" height="40" fill="#4B96FF" />
            <rect x="60" y="20" width="15" height="50" fill="#4B96FF" />
            <!-- X-axis -->
            <line x1="5" y1="70" x2="85" y2="70" stroke="black" stroke-width="2" />
            <!-- Y-axis -->
            <line x1="5" y1="10" x2="5" y2="70" stroke="black" stroke-width="2" />
          </svg>
          <span class="font-medium text-gray-700">Bar Chart</span>
        </div>

        <!-- Box Plot Chart Option -->
        <div 
          class="flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all 
            {selectedChartType === 'boxplot' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'}"
          on:click={() => selectChartType('boxplot')}
        >
          <!-- Box Plot SVG -->
          <svg width="100" height="80" viewBox="0 0 100 80" class="mb-2">
            <!-- Box Plot 1 -->
            <line x1="20" y1="20" x2="20" y2="60" stroke="black" stroke-width="1" /> <!-- Whisker -->
            <rect x="15" y="30" width="10" height="20" fill="#4B96FF" stroke="black" /> <!-- Box -->
            <line x1="15" y1="40" x2="25" y2="40" stroke="black" stroke-width="2" /> <!-- Median -->
            <line x1="10" y1="20" x2="30" y2="20" stroke="black" stroke-width="1" /> <!-- Top cap -->
            <line x1="10" y1="60" x2="30" y2="60" stroke="black" stroke-width="1" /> <!-- Bottom cap -->
            
            <!-- Box Plot 2 -->
            <line x1="50" y1="15" x2="50" y2="65" stroke="black" stroke-width="1" /> <!-- Whisker -->
            <rect x="45" y="25" width="10" height="30" fill="#4B96FF" stroke="black" /> <!-- Box -->
            <line x1="45" y1="45" x2="55" y2="45" stroke="black" stroke-width="2" /> <!-- Median -->
            <line x1="40" y1="15" x2="60" y2="15" stroke="black" stroke-width="1" /> <!-- Top cap -->
            <line x1="40" y1="65" x2="60" y2="65" stroke="black" stroke-width="1" /> <!-- Bottom cap -->
            
            <!-- Box Plot 3 -->
            <line x1="80" y1="10" x2="80" y2="70" stroke="black" stroke-width="1" /> <!-- Whisker -->
            <rect x="75" y="25" width="10" height="25" fill="#4B96FF" stroke="black" /> <!-- Box -->
            <line x1="75" y1="35" x2="85" y2="35" stroke="black" stroke-width="2" /> <!-- Median -->
            <line x1="70" y1="10" x2="90" y2="10" stroke="black" stroke-width="1" /> <!-- Top cap -->
            <line x1="70" y1="70" x2="90" y2="70" stroke="black" stroke-width="1" /> <!-- Bottom cap -->
          </svg>
          <span class="font-medium text-gray-700">Box-plot Chart</span>
        </div>
      </div>

      <div class="flex justify-end space-x-3">
        <button 
          class="rounded px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          on:click={close}
        >
          Cancel
        </button>
        <button 
          class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          on:click={handleSave}
        >
          Apply
        </button>
      </div>
    </div>
  </div>
{/if}