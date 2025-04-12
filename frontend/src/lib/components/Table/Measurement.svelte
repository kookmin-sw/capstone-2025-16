<script>
  export let measurement;
</script>

<div class="measurement-container">
  <h2 class="title">Measurement Information</h2>

  {#if measurement && measurement.length > 0}
    <table class="measurement-table w-full border border-gray-200 text-sm text-left">
      <thead class="bg-gray-100">
        <tr>
          <th class="px-4 py-2 border-b">Concept ID</th>
          <th class="px-4 py-2 border-b">Date</th>
          <th class="px-4 py-2 border-b">Value</th>
        </tr>
      </thead>
      <tbody>
        {#each measurement as measure}
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-2 border-b">{measure.measurement_concept_id}</td>
            <td class="px-4 py-2 border-b">{measure.measurement_date}</td>
            <td class="px-4 py-2 border-b">{measure.value_as_number} {measure.unit_source_value}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p class="text-gray-500 text-sm mb-6">No measurement data available.</p>
  {/if}
</div>

<style>
  .measurement-container {
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
