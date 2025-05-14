<script>
  export let conditionOccurrence;
  export let conditionEra;

  let currentPage = 1;
  let itemsPerPage = 10;

  // 두 배열을 합쳐 하나로 통합
  let combinedData = [];
  $: combinedData = [...(conditionOccurrence || []).map(cond => ({
    type: 'Occurrence',
    concept_name: cond.concept_name,
    period: `${cond.condition_start_date} ~ ${cond.condition_end_date}`,
    status: cond.condition_status_source_value ? cond.condition_status_source_value : 'null'
  })),
  ...(conditionEra || []).map(era => ({
    type: 'Era',
    concept_name: era.concept_name,
    period: `${era.condition_era_start_date} ~ ${era.condition_era_end_date}`,
    status: `${era.condition_occurrence_count} times`
  }))];

  // 페이지네이션 함수
  function getPaginatedData() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return combinedData.slice(start, end);
  }

  function nextPage() {
    if (currentPage * itemsPerPage < combinedData.length) currentPage++;
  }

  function prevPage() {
    if (currentPage > 1) currentPage--;
  }
</script>

<div class="flex flex-col bg-white border border-gray-300 rounded-lg shadow-md p-6 relative mb-1 w-full">
  <h2 class="title">Condition Information</h2>

  <!-- Condition Information -->
  {#if combinedData.length > 0}
    <table class="w-full border border-gray-200 text-sm text-left">
      <thead class="bg-gray-100">
        <tr>
          <th class="px-4 py-2 border-b">Type</th>
          <th class="px-4 py-2 border-b">Condition Concept ID</th>
          <th class="px-4 py-2 border-b">Period</th>
          <th class="px-4 py-2 border-b">Status / Count</th>
        </tr>
      </thead>
      <tbody>
        {#each getPaginatedData() as item}
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-2 border-b">{item.type}</td>
            <td class="px-4 py-2 border-b">{item.concept_name}</td>
            <td class="px-4 py-2 border-b">{item.period}</td>
            <td class="px-4 py-2 border-b">{item.status}</td>
          </tr>
        {/each}
      </tbody>
    </table>

    <!-- 페이지네이션 컨트롤 -->
    <div class="flex justify-between items-center mt-4">
      <button class="px-3 py-1 bg-gray-200 rounded" on:click={prevPage}>Previous</button>
      <p class="text-sm">Page <input bind:value={currentPage} on:input={(e) => goToPage(e.target.value)} class="border-none w-10 p-0 text-center" /> of {Math.ceil(combinedData.length / itemsPerPage)}</p>
      <button class="px-3 py-1 bg-gray-200 rounded" on:click={nextPage}>Next</button>
    </div>
  {:else}
    <p class="text-gray-500 text-sm">No condition data available.</p>
  {/if}
</div>


<style>
  .title {
    font-size: 1.3rem;
    font-weight: bold;
    margin-bottom: 10px;
  }
</style>
