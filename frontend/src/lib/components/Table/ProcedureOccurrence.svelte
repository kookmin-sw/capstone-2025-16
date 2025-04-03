<script>
  export let procedureOccurrence;
</script>

<div class="procedure-container">
  <h2 class="title">Procedure Occurrence</h2>

  {#if procedureOccurrence && procedureOccurrence.length > 0}
    <table class="procedure-table w-full border border-gray-200 text-sm text-left mb-6">
      <thead class="bg-gray-100">
        <tr>
          <th class="px-4 py-2 border-b">Date</th>
          <th class="px-4 py-2 border-b">Concept ID</th>
          <th class="px-4 py-2 border-b">Type Concept ID</th>
          <th class="px-4 py-2 border-b">Quantity</th>
        </tr>
      </thead>
      <tbody>
        {#each procedureOccurrence as proc}
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-2 border-b">{proc.procedure_date}</td>
            <td class="px-4 py-2 border-b">{proc.procedure_concept_id}</td>
            <td class="px-4 py-2 border-b">{proc.procedure_type_concept_id ? proc.procedure_type_concept_id : "N/A"}</td>
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
  .procedure-container {
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
