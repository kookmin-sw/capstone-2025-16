<script>
  export let conditionOccurrence;
  export let conditionEra;
</script>

<div class="flex flex-col bg-white border border-gray-300 rounded-lg shadow-md p-6 relative mb-1 w-full">
  <h2 class="title">Condition Information</h2>

  <!-- Condition Information -->
  {#if (conditionOccurrence && conditionOccurrence.length > 0) || (conditionEra && conditionEra.length > 0)}
    <table class="w-full border border-gray-200 text-sm text-left">
      <thead class="bg-gray-100">
        <tr>
          <th class="px-4 py-2 border-b">Type</th>
          <th class="px-4 py-2 border-b">Condition Concept ID</th>
          <th class="px-4 py-2 border-b">Period</th>
          <th class="px-4 py-2 border-b">Status / Count</th>
        </tr>
      </thead>
      <tbody>
        {#if conditionOccurrence}
          {#each conditionOccurrence as cond}
            <tr class="hover:bg-gray-50">
              <td class="px-4 py-2 border-b">Occurrence</td>
              <td class="px-4 py-2 border-b">{cond.condition_concept_id}</td>
              <td class="px-4 py-2 border-b">{cond.condition_start_date} ~ {cond.condition_end_date}</td>
              <td class="px-4 py-2 border-b">{cond.condition_status_source_value}</td>
            </tr>
          {/each}
        {/if}
        {#if conditionEra}
          {#each conditionEra as era}
            <tr class="hover:bg-gray-50">
              <td class="px-4 py-2 border-b">Era</td>
              <td class="px-4 py-2 border-b">{12345}</td>
              <td class="px-4 py-2 border-b">{era.condition_era_start_date} ~ {era.condition_era_end_date}</td>
              <td class="px-4 py-2 border-b">{era.condition_occurrence_count} times</td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  {:else}
    <p class="text-gray-500 text-sm">No condition data available.</p>
  {/if}
</div>



<style>
  .title {
    font-size: 1.3rem;
    font-weight: bold;
    margin-bottom: 10px;
  }
</style>
