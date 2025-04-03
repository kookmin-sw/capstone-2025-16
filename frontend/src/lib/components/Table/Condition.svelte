<script>
  export let conditionOccurrence;
  export let conditionEra;
</script>

<div class="condition-container">
  <h2 class="title">Condition Information</h2>

  <span class="info"><strong>Condition:</strong> {conditionOccurrence[0].condition_concept_id}</span>

  <!-- Condition Information -->
  {#if (conditionOccurrence && conditionOccurrence.length > 0) || (conditionEra && conditionEra.length > 0)}
    <table class="w-full border border-gray-200 text-sm text-left">
      <thead class="bg-gray-100">
        <tr>
          <th class="px-4 py-2 border-b">Type</th>
          <th class="px-4 py-2 border-b">ID</th>
          <th class="px-4 py-2 border-b">Period</th>
          <th class="px-4 py-2 border-b">Status / Count</th>
        </tr>
      </thead>
      <tbody>
        {#if conditionOccurrence}
          {#each conditionOccurrence as cond}
            <tr class="hover:bg-gray-50">
              <td class="px-4 py-2 border-b">Occurrence</td>
              <td class="px-4 py-2 border-b">{cond.condition_occurrence_id}</td>
              <td class="px-4 py-2 border-b">{cond.condition_start_date} ~ {cond.condition_end_date}</td>
              <td class="px-4 py-2 border-b">{cond.condition_status_source_value}</td>
            </tr>
          {/each}
        {/if}
        {#if conditionEra}
          {#each conditionEra as era}
            <tr class="hover:bg-gray-50">
              <td class="px-4 py-2 border-b">Era</td>
              <td class="px-4 py-2 border-b">{era.condition_era_id}</td>
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
  .condition-container {
    padding: 16px;
    background: #f9f9f9;
    border-radius: 8px;
    border: 1px solid #ddd;
    max-width: 100%;
  }

  .title {
    font-size: 1.3rem;
    font-weight: bold;
    margin-bottom: 10px;
  }
  
  .info {
    font-weight: normal;
    font-size: 1.0rem;
    margin-right: 10px;
  }
</style>
