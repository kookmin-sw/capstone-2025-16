<script>
  export let specimen;
</script>

<div class="specimen-container">
  <h2 class="title">Specimen Information</h2>

  {#if specimen && specimen.length > 0}
    <table class="specimen-table w-full border border-gray-200 text-sm text-left mb-6">
      <thead class="bg-gray-100">
        <tr>
          <th class="px-4 py-2 border-b">Date</th>
          <th class="px-4 py-2 border-b">Concept ID</th>
          <th class="px-4 py-2 border-b">Quantity</th>
          <th class="px-4 py-2 border-b">Unit Concept ID</th>
        </tr>
      </thead>
      <tbody>
        {#each specimen as spec}
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-2 border-b">{spec.specimen_date}</td>
            <td class="px-4 py-2 border-b">{spec.specimen_concept_id}</td>
            <td class="px-4 py-2 border-b">{spec.quantity}</td>
            <td class="px-4 py-2 border-b">{spec.unit_concept_id}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p class="text-gray-500 text-sm mb-6">No specimen data available.</p>
  {/if}
</div>

<style>
  .specimen-container {
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
