<script>
  export let procedureOccurrence;

  let currentPage = 1;
  let itemsPerPage = 10;

  // 페이지네이션 함수
  function getPaginatedProcedureData() {
    if (!procedureOccurrence) return [];
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return procedureOccurrence.slice(start, end);
  }

  function nextPage() {
    if (currentPage * itemsPerPage < procedureOccurrence.length) currentPage++;
  }

  function prevPage() {
    if (currentPage > 1) currentPage--;
  }

  function goToPage(page) {
    const totalPages = Math.ceil(procedureOccurrence.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
    }
  }
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
        {#each getPaginatedProcedureData() as proc}
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-2 border-b">{proc.concept_name}</td>
            <td class="px-4 py-2 border-b">{proc.procedure_date}</td>
            <td class="px-4 py-2 border-b">{proc.procedure_source_value}</td>
            <td class="px-4 py-2 border-b">{proc.quantity}</td>
          </tr>
        {/each}
      </tbody>
    </table>

    <!-- 페이지네이션 컨트롤 -->
    <div class="flex justify-between items-center mt-4">
      <button class="px-3 py-1 bg-gray-200 rounded" on:click={prevPage}>Previous</button>
      <p class="text-sm">Page <input bind:value={currentPage} on:input={(e) => goToPage(e.target.value)} class="border-none w-10 p-0 text-center" /> of {Math.ceil(procedureOccurrence.length / itemsPerPage)}</p>
      <button class="px-3 py-1 bg-gray-200 rounded" on:click={nextPage}>Next</button>
    </div>
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
