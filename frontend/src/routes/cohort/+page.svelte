<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  let searchQuery = "";
  let searchInput = "";
  let errorMessage = "";

  // 페이지네이션 관련 변수
  let currentPage = 1;
  const itemsPerPage = 10;
  let totalPages = 0;

  let data = [
    {
      id: "",
      name: "",
      description: "",
      author: "",
      createdAt: "",
      updatedAt: "",
    },
  ];

  let filteredData = [...data];
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

  function handleCheckboxChange(id) {
    const currentSelectedCount = Object.values(selectedItems).filter(Boolean).length;
    
    if (!selectedItems[id]) {
      if (currentSelectedCount >= 5) {
        errorMessage = "You can select up to 5 cohorts for comparison.";
        setTimeout(() => {
          errorMessage = "";
        }, 5000);
        return;
      }
    }
    
    selectedItems[id] = !selectedItems[id];
    errorMessage = "";
  }

  async function loadData() {
    try {
      const response = await fetch('/cohort-list-testdata.json'); // JSON 파일 경로
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      data = await response.json(); // 데이터를 배열로 변환
      filteredData = [...data]; // 초기 데이터 설정
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  function filterData() {
    if (!data.length) return;

    filteredData = data.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    currentPage = 1; // 검색 시 첫 페이지로 이동
  }

  function handleComparison() {
    const selectedCount = Object.values(selectedItems).filter(Boolean).length;
    
    if (selectedCount < 2) {
      errorMessage = "Please select at least 2 cohorts to compare.";
      setTimeout(() => {
        errorMessage = "";
      }, 5000);
      return;
    }

    // 선택된 코호트들의 ID를 배열로 만들기
    const selectedCohorts = Object.entries(selectedItems)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);

    // 쿼리 파라미터로 선택된 코호트 ID들을 전달
    goto(`/cohort/comparison?cohorts=${selectedCohorts.join(',')}`);
  }

  function handleSearch() {
    searchQuery = searchInput;
    filterData();
  }

  $: {
    if (!searchInput) {
      searchQuery = "";
      filteredData = [...data];
    }
  }

  onMount(() => {
    loadData();
  });
</script>

<div class="min-h-screen bg-gradient-to-b from-blue-50 to-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Cohort List</h1>
      <p class="text-gray-600">Manage and compare your cohorts</p>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex gap-3 mb-6 items-center">
        <div class="flex-1 flex gap-2 items-center">
          <div class="flex-1 relative">
            <input
              type="text"
              bind:value={searchInput}
              placeholder="Search cohorts by name or description"
              class="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span class="absolute left-3 top-2 text-gray-400">🔍</span>
          </div>
          <button
            class="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            on:click={handleSearch}
          >
            Search
          </button>
        </div>
        
        <button 
          class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors border"
          class:bg-blue-50={Object.values(selectedItems).filter(Boolean).length >= 2}
          class:bg-white={Object.values(selectedItems).filter(Boolean).length < 2}
          class:border-gray-300={Object.values(selectedItems).filter(Boolean).length < 2}
          class:border-blue-600={Object.values(selectedItems).filter(Boolean).length >= 2}
          class:text-gray-500={Object.values(selectedItems).filter(Boolean).length < 2}
          class:text-blue-600={Object.values(selectedItems).filter(Boolean).length >= 2}
          class:hover:bg-gray-50={Object.values(selectedItems).filter(Boolean).length < 2}
          class:hover:bg-blue-100={Object.values(selectedItems).filter(Boolean).length >= 2}
          on:click={handleComparison}
        >
          <span>Compare</span>
          <span class="flex items-center justify-center rounded-full w-5 h-5 text-xs"
            class:bg-blue-100={Object.values(selectedItems).filter(Boolean).length < 2}
            class:bg-blue-600={Object.values(selectedItems).filter(Boolean).length >= 2}
            class:text-blue-400={Object.values(selectedItems).filter(Boolean).length < 2}
            class:text-white={Object.values(selectedItems).filter(Boolean).length >= 2}
          >
            {Object.values(selectedItems).filter(Boolean).length}
          </span>
        </button>
        
        <a 
          href="/new"
          class="px-3 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
        >
          New Cohort
        </a>
      </div>
      
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr class="bg-gray-50 text-left">
              <th class="w-10 py-3 px-4">
                <span class="sr-only">Select</span>
              </th>
              <th class="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th class="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th class="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th class="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
              <th class="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th class="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each paginatedData as item (item.id)}
              <tr 
                class="hover:bg-gray-50 transition-colors cursor-pointer group"
                class:bg-blue-50={selectedItems[item.id]}
                on:click={() => handleCheckboxChange(item.id)}
              >
                <td class="py-3 px-4">
                  <div class="flex items-center">
                    <div class="w-4 h-4 border-2 flex items-center justify-center transition-colors"
                      class:border-blue-600={selectedItems[item.id]}
                      class:border-gray-300={!selectedItems[item.id]}
                    >
                      {#if selectedItems[item.id]}
                        <div class="w-2 h-2 bg-blue-600"></div>
                      {/if}
                    </div>
                  </div>
                </td>
                <td class="py-3 px-4 text-sm text-gray-500">{item.id}</td>
                <td class="py-3 px-4">
                  <a 
                    href={`/cohort/${item.id}`} 
                    class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {item.name}
                  </a>
                </td>
                <td class="py-3 px-4 text-sm text-gray-900">{item.description}</td>
                <td class="py-3 px-4 text-sm text-gray-500">{item.author}</td>
                <td class="py-3 px-4 text-sm text-gray-500">{item.createdAt}</td>
                <td class="py-3 px-4 text-sm text-gray-500">{item.updatedAt}</td>
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

  <!-- 에러 메시지 - 화면 하단 중앙에 고정 -->
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
</div>