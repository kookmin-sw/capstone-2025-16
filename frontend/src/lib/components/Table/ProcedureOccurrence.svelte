<script>
  export let procedureOccurrence;
</script>

<div class="flex flex-col bg-white border border-gray-300 rounded-lg shadow-md p-6 relative mb-1 w-full">
  <h2 class="title">Procedure Occurrence</h2>

  {#if procedureOccurrence && procedureOccurrence.length > 0}
    <table class="procedure-table w-full border border-gray-200 text-sm text-left">
      <thead class="bg-gray-100">
        <tr>
          <th class="px-4 py-2 border-b">Concept ID</th>
          <th class="px-4 py-2 border-b">Date</th>
          <th class="px-4 py-2 border-b">Value</th>
          <th class="px-4 py-2 border-b">Quantity</th>
        </tr>
      </thead>
      <tbody>
        {#each procedureOccurrence as proc}
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-2 border-b">{proc.procedure_concept_id}</td>
            <td class="px-4 py-2 border-b">{proc.procedure_date}</td>
            <td class="px-4 py-2 border-b">{proc.procedure_source_value}</td>
            <td class="px-4 py-2 border-b">{proc.quantity}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p class="text-gray-500 text-sm mb-6">No procedure data available.</p>
  {/if}
</div>

<style>
  .title {
    font-size: 1.3rem;
    font-weight: bold;
    margin-bottom: 10px;
  }
</style>
