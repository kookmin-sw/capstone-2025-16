<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import LoadingComponent from "$lib/components/LoadingComponent.svelte";
  import Footer from '$lib/components/Footer.svelte';

  let loading = true;
  let searchQuery = "";
  let searchInput = "";
  let errorMessage = "";

  // 페이지네이션 관련 변수
  let currentPage = 1;
  const itemsPerPage = 10;
  let totalPages = 0;

  let cohortList = [];
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

  function handleCheckboxChange(id) {
    selectedItems[id] = !selectedItems[id];
    errorMessage = "";
  }

  function filterData() {
    if (!searchQuery) {
      filteredData = [...cohortList];
      return;
    }

    filteredData = cohortList.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author.toLowerCase().includes(searchQuery.toLowerCase())
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
    if (selectedCount > 5) {
      errorMessage = "You can select up to 5 cohorts for comparison.";
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

  async function handleDelete() {
    const selectedCount = Object.values(selectedItems).filter(Boolean).length;
    if (selectedCount === 0) return;

    // 선택된 코호트들의 ID 배열
    const selectedCohorts = Object.entries(selectedItems)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);

    // 확인 알림
    if (!confirm(`Are you sure you want to delete the selected ${selectedCount} cohorts? This action cannot be undone.`)) {
      return;
    }

    loading = true;
    let deleteError = false;

    // 여러 코호트 삭제 요청
    for (const cohortID of selectedCohorts) {
      try {
        const res = await fetch(`https://bento.kookm.in/api/cohort/${cohortID}`, {
          method: 'DELETE'
        });
        if (!res.ok) {
          deleteError = true;
        }
      } catch (e) {
        deleteError = true;
      }
    }

    // 삭제 후 목록 갱신
    try {
      const res = await fetch('/api/cohortlistdata');
      if (!res.ok) throw new Error();
      const cohortListData = await res.json();
      cohortList = cohortListData.cohorts;
      filterData();
      selectedItems = {};
    } catch (e) {
      errorMessage = "Failed to refresh cohort list.";
      setTimeout(() => { errorMessage = ""; }, 5000);
    } finally {
      loading = false;
    }

    if (deleteError) {
      errorMessage = "Failed to delete some cohorts.";
      setTimeout(() => { errorMessage = ""; }, 5000);
    }
  }

  onMount(async() => {
    try{
      const res = await fetch('/api/cohortlistdata');
      if (!res.ok) {
        throw new Error('Failed to fetch data');
      }
      const cohortListData = await res.json(); 
      if (cohortListData.error) {
        errorMessage = cohortListData.error;
        setTimeout(() => {
          errorMessage = "";
        }, 5000);
      } else {
        cohortList = cohortListData.cohorts;
        filteredData = cohortListData.cohorts;
        totalPages = Math.ceil(filteredData.length / itemsPerPage);
        loading = false;
      }
    }catch (error) {
      errorMessage = "An error occurred while fetching data.";
      setTimeout(() => {
        errorMessage = "";
      }, 5000);
    } finally {
      loading = false;
    }
  });
</script>


{#if loading}
  <LoadingComponent message="Loading cohort data..." />
{:else}
<div class="min-h-screen bg-gradient-to-b from-blue-50 to-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Cohort List</h1>
      <p class="text-gray-600">Manage and compare your cohorts</p>
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
              placeholder="Search cohorts by name, description, or author"
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
        
        <button 
          class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors border"
          class:bg-blue-50={Object.values(selectedItems).filter(Boolean).length >= 2 && Object.values(selectedItems).filter(Boolean).length <= 5}
          class:bg-white={Object.values(selectedItems).filter(Boolean).length < 2}
          class:bg-red-50={Object.values(selectedItems).filter(Boolean).length > 5}
          class:border-gray-300={Object.values(selectedItems).filter(Boolean).length < 2}
          class:border-blue-600={Object.values(selectedItems).filter(Boolean).length >= 2 && Object.values(selectedItems).filter(Boolean).length <= 5}
          class:border-red-600={Object.values(selectedItems).filter(Boolean).length > 5}
          class:text-gray-500={Object.values(selectedItems).filter(Boolean).length < 2}
          class:text-blue-600={Object.values(selectedItems).filter(Boolean).length >= 2 && Object.values(selectedItems).filter(Boolean).length <= 5}
          class:text-red-600={Object.values(selectedItems).filter(Boolean).length > 5}
          class:hover:bg-gray-50={Object.values(selectedItems).filter(Boolean).length < 2}
          class:hover:bg-blue-100={Object.values(selectedItems).filter(Boolean).length >= 2 && Object.values(selectedItems).filter(Boolean).length <= 5}
          class:hover:bg-red-100={Object.values(selectedItems).filter(Boolean).length > 5}
          on:click={handleComparison}
        >
          <span>Compare</span>
          <span class="flex items-center justify-center rounded-full w-5 h-5 text-xs"
            class:bg-blue-100={Object.values(selectedItems).filter(Boolean).length < 2}
            class:bg-blue-600={Object.values(selectedItems).filter(Boolean).length >= 2 && Object.values(selectedItems).filter(Boolean).length <= 5}
            class:bg-red-600={Object.values(selectedItems).filter(Boolean).length > 5}
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
        <button 
          aria-label="Delete Cohorts"
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
            {#each paginatedData as item (item.cohort_id)}
              <tr 
                class="hover:bg-gray-50 transition-colors cursor-pointer group"
                class:bg-blue-50={selectedItems[item.cohort_id]}
                on:click={() => handleCheckboxChange(item.cohort_id)}
              >
                <td class="py-3 px-4">
                  <div class="flex items-center">
                    <div class="w-4 h-4 border-2 flex items-center justify-center transition-colors"
                      class:border-blue-600={selectedItems[item.cohort_id]}
                      class:border-gray-300={!selectedItems[item.cohort_id]}
                    >
                      {#if selectedItems[item.cohort_id]}
                        <div class="w-2 h-2 bg-blue-600"></div>
                      {/if}
                    </div>
                  </div>
                </td>
                <td class="py-3 px-4 text-sm text-gray-500">{item.cohort_id}</td>
                <td class="py-3 px-4">
                  <a 
                    href={`/cohort/${item.cohort_id}`} 
                    class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {item.name}
                  </a>
                </td>
                <td class="py-3 px-4 text-sm text-gray-900">{item.description}</td>
                <td class="py-3 px-4 text-sm text-gray-500">{item.author}</td>
                <td class="py-3 px-4 text-sm text-gray-500">{item.created_at}</td>
                <td class="py-3 px-4 text-sm text-gray-500">{item.updated_at}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<!-- 중앙 하단에만 에러메시지 표시 -->
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
{/if}