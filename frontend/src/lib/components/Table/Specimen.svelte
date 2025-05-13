<script>
  export let specimen;
</script>

<div class="flex flex-col bg-white border border-gray-300 rounded-lg shadow-md p-6 relative mb-1 w-full">
  <h2 class="title">Specimen Information</h2>

  {#if specimen && specimen.length > 0}
    <table class="specimen-table w-full border border-gray-200 text-sm text-left">
      <thead class="bg-gray-100">
        <tr>
          <th class="px-4 py-2 border-b">Concept ID</th>
          <th class="px-4 py-2 border-b">Date</th>
          <th class="px-4 py-2 border-b">Value</th>
        </tr>
      </thead>
      <tbody>
        {#each specimen as spec}
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-2 border-b">{spec.concept_name}</td>
            <td class="px-4 py-2 border-b">{spec.specimen_date}</td>
            <td class="px-4 py-2 border-b">{spec.specimen_source_value}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p class="text-gray-500 text-sm mb-6">No specimen data available.</p>
  {/if}
</div>

<style>
  .title {
    font-size: 1.3rem;
    font-weight: bold;
    margin-bottom: 10px;
  }
</style>
