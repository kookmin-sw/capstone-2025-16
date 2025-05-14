<script>
  export let specimen;

  let currentPage = 1;
  let itemsPerPage = 10;

  // 페이지네이션 함수
  function getPaginatedSpecimenData() {
    if (!specimen) return [];
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return specimen.slice(start, end);
  }

  function nextPage() {
    if (currentPage * itemsPerPage < specimen.length) currentPage++;
  }

  function prevPage() {
    if (currentPage > 1) currentPage--;
  }

  function goToPage(page) {
    const totalPages = Math.ceil(specimen.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
    }
  }
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
        {#each getPaginatedSpecimenData() as spec}
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-2 border-b">{spec.concept_name}</td>
            <td class="px-4 py-2 border-b">{spec.specimen_date}</td>
            <td class="px-4 py-2 border-b">{spec.specimen_source_value}</td>
          </tr>
        {/each}
      </tbody>
    </table>

    <!-- 페이지네이션 컨트롤 -->
    <div class="flex justify-between items-center mt-4">
      <button class="px-3 py-1 bg-gray-200 rounded" on:click={prevPage}>Previous</button>
      <p class="text-sm">Page <input bind:value={currentPage} on:input={(e) => goToPage(e.target.value)} class="border-none w-10 p-0 text-center" /> of {Math.ceil(specimen.length / itemsPerPage)}</p>
      <button class="px-3 py-1 bg-gray-200 rounded" on:click={nextPage}>Next</button>
    </div>
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
