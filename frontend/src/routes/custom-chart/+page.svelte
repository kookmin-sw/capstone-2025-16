<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import Footer from '$lib/components/Footer.svelte';

  let searchQuery = "";
  let searchInput = "";
  let errorMessage = "";

  // 페이지네이션 관련 변수
  let currentPage = 1;
  const itemsPerPage = 10;
  let totalPages = 0;

  let chartData = [
    {
      id: "",
      name: "",
      description: "",
      author: "",
      createdAt: "",
    },
  ];

  let filteredData = [...chartData];
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

  async function loadData() {
    try {
      const response = await fetch('/custom-chart-list-testdata.json'); // JSON 파일 경로
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      chartData = await response.json(); // 데이터를 배열로 변환
      filteredData = [...chartData]; // 초기 데이터 설정
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  function filterData() {
    if (!chartData.length) return;

    filteredData = chartData.filter(
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

  $: {
    if (!searchInput) {
      searchQuery = "";
      filteredData = [...chartData];
    }
  }

  onMount(() => {
    loadData();
  });
</script>

<div class="min-h-screen bg-gradient-to-b from-blue-50 to-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Custom Chart List</h1>
      <p class="text-gray-600">Manage your custom charts or create new ones.</p>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex gap-3 mb-6 items-center">
        <div class="flex-1">
          <div class="relative">
            <input
              type="text"
              bind:value={searchInput}
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
          New Chart
        </a>
      </div>
      
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr class="bg-gray-50 text-left">
              <th class="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th class="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th class="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th class="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
              <th class="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each paginatedData as item (item.id)}
              <tr class="hover:bg-gray-50 transition-colors cursor-pointer group">
                <td class="py-3 px-4 text-sm text-gray-500">{item.id}</td>
                <td class="py-3 px-4">
                  <a 
                    href={`/custom-chart/${item.id}`} 
                    class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {item.name}
                  </a>
                </td>
                <td class="py-3 px-4 text-sm text-gray-900">{item.description}</td>
                <td class="py-3 px-4 text-sm text-gray-500">{item.author}</td>
                <td class="py-3 px-4 text-sm text-gray-500">{item.createdAt}</td>
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
