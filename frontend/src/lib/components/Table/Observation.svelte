<script>
  export let observation;
</script>

<div class="observation-container">
  <h2 class="title">Observation Information</h2>

  {#if observation && observation.length > 0}
    <table class="observation-table w-full border border-gray-200 text-sm text-left mb-6">
      <thead class="bg-gray-100">
        <tr>
          <th class="px-4 py-2 border-b">Concept ID</th>
          <th class="px-4 py-2 border-b">Date</th>
          <th class="px-4 py-2 border-b">Value</th>
        </tr>
      </thead>
      <tbody>
        {#each observation as obs}
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-2 border-b">{obs.observation_concept_id}</td>
            <td class="px-4 py-2 border-b">{obs.observation_date}</td>
            <td class="px-4 py-2 border-b">
              <span class="font-medium">{obs.value_as_string} {(String.toString(obs.unit_source_value) === "N/A") ? obs.unit_source_value : "" }</span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p class="text-gray-500 text-sm mb-6">No observation data available.</p>
  {/if}
</div>

<style>
  .observation-container {
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
</style>
