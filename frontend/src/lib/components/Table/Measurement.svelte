<script>
  export let measurement;

  let currentPage = 1;
  let itemsPerPage = 10;

  // 페이지네이션 함수
  function getPaginatedMeasurementData() {
    if (!measurement) return [];
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return measurement.slice(start, end);
  }

  function nextPage() {
    if (currentPage * itemsPerPage < measurement.length) currentPage++;
  }

  function prevPage() {
    if (currentPage > 1) currentPage--;
  }

  function goToPage(page) {
    const totalPages = Math.ceil(measurement.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
    }
  }
</script>

<div class="flex flex-col bg-white border border-gray-300 rounded-lg shadow-md p-6 relative mb-1 w-full">
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
        {#each getPaginatedMeasurementData() as measure}
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-2 border-b">{measure.concept_name}</td>
            <td class="px-4 py-2 border-b">{measure.measurement_date}</td>
            <td class="px-4 py-2 border-b">{measure.value_as_number} {measure.unit_source_value}</td>
          </tr>
        {/each}
      </tbody>
    </table>

    <!-- 페이지네이션 컨트롤 -->
    <div class="flex justify-between items-center mt-4">
      <button class="px-3 py-1 bg-gray-200 rounded" on:click={prevPage}>Previous</button>
      <p class="text-sm">Page <input bind:value={currentPage} on:input={(e) => goToPage(e.target.value)} class="border-none w-10 p-0 text-center" /> of {Math.ceil(measurement.length / itemsPerPage)}</p>
      <button class="px-3 py-1 bg-gray-200 rounded" on:click={nextPage}>Next</button>
    </div>
  {:else}
    <p class="text-gray-500 text-sm mb-6">No measurement data available.</p>
  {/if}
</div>

<style>
  .title {
    font-size: 1.3rem;
    font-weight: bold;
    margin-bottom: 10px;
  }
</style>
 
