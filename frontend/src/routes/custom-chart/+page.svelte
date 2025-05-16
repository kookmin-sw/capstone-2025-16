<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import LoadingComponent from "$lib/components/LoadingComponent.svelte";
  import Footer from '$lib/components/Footer.svelte';
	import { filter } from "d3";

  let searchQuery = "";
  let searchInput = "";
  let errorMessage = "";
  let isLoading = true;

  // 페이지네이션 관련 변수
  let currentPage = 1;
  const itemsPerPage = 10;
  let totalPages = 0;

  let chartData = [];
  let filteredData = [];
  let selectedItems = {};

  // 현재 페이지의 데이터만 반환하는 함수
  $: paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 전체 페이지 수 계산
  $: totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // 페이지 번호 배열 생성
  $: pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  function changePage(page) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
    }
  }

  function filterData() {
    if (!searchQuery) {
      filteredData = chartData.statistics; // 검색어가 없으면 전체 데이터로 초기화
      return;
    }

    filteredData = chartData.statistics.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
    currentPage = 1; // 검색 시 첫 페이지로 이동
  }

  function handleSearch() {
    searchQuery = searchInput;
    filterData();
  }

  function handleCheckboxChange(id) {
    selectedItems[id] = !selectedItems[id];
    errorMessage = "";
  }

  async function handleDelete() {
    const selectedCount = Object.values(selectedItems).filter(Boolean).length;
    if (selectedCount === 0) return;

    const selectedCharts = Object.entries(selectedItems)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);

    if (!confirm(`Are you sure you want to delete the selected ${selectedCount} chart pages? This action cannot be undone.`)) {
      return;
    }

    isLoading = true;
    let deleteError = false;

    for (const statistics_id of selectedCharts) {
      try {
        const res = await fetch(`https://bento.kookm.in/api/statistics/${statistics_id}`, {
          method: 'DELETE'
        });
        if (!res.ok) {
          deleteError = true;
        }
      } catch (e) {
        deleteError = true;
      }
    }

    // 목록 갱신
    try {
      const res = await fetch('/api/customlistdata/');
      if (!res.ok) throw new Error();
      chartData = await res.json();
      filteredData = chartData.statistics;
      selectedItems = {};
    } catch (e) {
      errorMessage = "Failed to refresh chart list.";
      setTimeout(() => { errorMessage = ""; }, 5000);
    } finally {
      isLoading = false;
    }

    if (deleteError) {
      errorMessage = "Failed to delete some charts.";
      setTimeout(() => { errorMessage = ""; }, 5000);
    }
  }

  onMount(async() => {
    try{
      const res = await fetch('/api/customlistdata/');
      if (!res.ok) {
        throw new Error("Failed to fetch data");
      }
      chartData = await res.json();
      filteredData = chartData.statistics; // 초기 데이터 설정
    } catch(error) {
      console.error("Error loading data:", error);
      errorMessage = "Failed to load data. Please try again later.";
    } finally {
      isLoading = false;
    }
  });
</script>

<svelte:head>
  <title>Custom Chart - Bento</title>
</svelte:head>

{#if isLoading}
  <LoadingComponent />
{:else}
<div class="min-h-screen bg-gradient-to-b from-blue-50 to-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Custom Chart Set List</h1>
      <p class="text-gray-600">Researchers can directly configure statistics for the data they want to view, targeting cohorts or patients. Custom charts provide options for Bar Charts and Box-Plot Charts.</p>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex gap-3 mb-6 items-center">
        <div class="flex-1">
          <div class="relative">
            <input
              type="text"
              bind:value={searchInput}
              on:keydown={event => {
                if (event.key === 'Enter') {
                  handleSearch();
                }
              }}
              placeholder="Search charts by name, description, or author"
              class="w-full pl-10 pr-24 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span class="absolute left-3 top-2 text-gray-400">🔍</span>
            <button
              class="absolute right-0 top-0 h-full px-4 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors border-l border-gray-300"
              on:click={handleSearch}
            >
              Search
            </button>
          </div>
        </div>

        <a 
          href="/custom-chart/new"
          class="px-3 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
        >
          + New Chart Page
        </a>
        <button 
          aria-label="Delete Charts"
          class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors border"
          class:bg-red-50={Object.values(selectedItems).filter(Boolean).length > 0}
          class:bg-white={Object.values(selectedItems).filter(Boolean).length === 0}
          class:border-gray-300={Object.values(selectedItems).filter(Boolean).length === 0}
          class:border-red-600={Object.values(selectedItems).filter(Boolean).length > 0}
          class:text-gray-500={Object.values(selectedItems).filter(Boolean).length === 0}
          class:text-red-600={Object.values(selectedItems).filter(Boolean).length > 0}
          class:hover:bg-gray-50={Object.values(selectedItems).filter(Boolean).length === 0}
          class:hover:bg-red-100={Object.values(selectedItems).filter(Boolean).length > 0}
          on:click={handleDelete}
          disabled={Object.values(selectedItems).filter(Boolean).length === 0}
        >
          <svg
            class="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="3 6 5 6 21 6"></polyline>
            <path
              d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
            ></path>
          </svg>
        </button>
      </div>
      
      <div class="overflow-x-auto">
        <table class="table-fixed min-w-full">
          <thead>
            <tr class="bg-gray-50 text-left">
              <th class="w-[5%] py-3 px-4">
                  <span class="sr-only">Select</span>
              </th>
              <th class="w-[5%] py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">No.</th>
              <th class="w-[30%] py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Name</th>
              <th class="w-[40%] py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Description</th>
              <th class="w-[10%] py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Author</th>
              <th class="w-[10%] py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Created At</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each paginatedData as item (item.statistics_id)}
              <tr class="hover:bg-gray-50 transition-colors cursor-pointer group"
                class:bg-blue-50={selectedItems[item.statistics_id]}
                on:click={() => handleCheckboxChange(item.statistics_id)}>
                <td class="py-3 px-4">
                  <div class="flex items-center">
                    <div class="w-4 h-4 border-2 flex items-center justify-center transition-colors"
                      class:border-blue-600={selectedItems[item.statistics_id]}
                      class:border-gray-300={!selectedItems[item.statistics_id]}
                    >
                      {#if selectedItems[item.statistics_id]}
                        <div class="w-2 h-2 bg-blue-600"></div>
                      {/if}
                    </div>
                  </div>
                </td>
                <td class="py-3 px-4 text-sm text-gray-500">{filteredData.length - ((currentPage - 1) * itemsPerPage + paginatedData.indexOf(item)) - 1 + 1}</td>
                <td class="py-3 px-4">
                  <a 
                    href={`/custom-chart/${item.statistics_id}`} 
                    class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {item.name}
                  </a>
                </td>
                <td class="py-3 px-4 text-sm text-gray-900">
                  <div class="line-clamp-2 whitespace-pre-line">
                    {item.description}
                  </div>
                </td>
                <!-- <td class="py-3 px-4 text-sm text-gray-500">{item.author}</td> -->
                <td class="py-3 px-4 text-sm text-gray-500">anonymous</td>
                <td class="py-3 px-4 text-sm text-gray-500 text-center">{item.created_at.slice(0,16)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- 페이지네이션 UI -->
      {#if totalPages > 1}
        <div class="flex items-center justify-center space-x-2 mt-6">
          <button
            class="p-2 text-sm font-medium rounded-md transition-colors"
            class:text-gray-400={currentPage === 1}
            class:text-blue-600={currentPage !== 1}
            class:hover:text-blue-800={currentPage !== 1}
            disabled={currentPage === 1}
            on:click={() => changePage(currentPage - 1)}
            aria-label="Previous page"
          >
            ‹
          </button>

          {#each pageNumbers as page}
            <button
              class="px-3 py-1 text-sm font-medium rounded-md transition-colors"
              class:bg-blue-600={currentPage === page}
              class:text-white={currentPage === page}
              class:text-gray-600={currentPage !== page}
              class:hover:bg-blue-100={currentPage !== page}
              on:click={() => changePage(page)}
            >
              {page}
            </button>
          {/each}

          <button
            class="p-2 text-sm font-medium rounded-md transition-colors"
            class:text-gray-400={currentPage === totalPages}
            class:text-blue-600={currentPage !== totalPages}
            class:hover:text-blue-800={currentPage !== totalPages}
            disabled={currentPage === totalPages}
            on:click={() => changePage(currentPage + 1)}
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Error Message -->
  {#if errorMessage}
    <div class="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
      <div class="bg-red-50 border border-red-200 rounded-md shadow-lg px-6 py-3 text-sm text-red-600 flex items-center">
        <span>{errorMessage}</span>
        <button 
          class="ml-4 text-red-400 hover:text-red-600"
          on:click={() => errorMessage = ""}
        >
          ×
        </button>
      </div>
    </div>
  {/if}
  <Footer />
</div>

{/if}