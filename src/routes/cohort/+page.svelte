<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  let searchQuery = "";

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

  // 체크박스 상태를 관리하기 위한 객체 추가
  let selectedItems = {};

  // 체크박스 상태 변경 핸들러
  function handleCheckboxChange(id) {
    selectedItems[id] = !selectedItems[id];
  }

  // JSON 파일에서 데이터를 로드 함수
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

  // 검색어에 따라 데이터를 필터링
  function filterData() {
    if (!data.length) return; // 데이터가 로드되기 전 방어 코드

    filteredData = data.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || // 이름 검색
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) // 설명 검색
    );
  }

  function handleComparison() {
    const selectedCount = Object.values(selectedItems).filter(Boolean).length;
    
    if (selectedCount < 2) {
      alert("최소 2개의 코호트를 선택해주세요.");
      return;
    }
    if (selectedCount > 5) {
      alert("최대 5개까지만 선택 가능합니다.");
      return;
    }

    // 선택된 코호트들의 ID를 배열로 만들기
    const selectedCohorts = Object.entries(selectedItems)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);

    // 쿼리 파라미터로 선택된 코호트 ID들을 전달
    goto(`/cohort/comparison?cohorts=${selectedCohorts.join(',')}`);
  }

  // 컴포넌트가 마운트될 때 데이터 로드
  onMount(() => {
    loadData();
  });
</script>

<div class="flex gap-2 mb-5">
  <input
    type="text"
    bind:value={searchQuery}
    placeholder="코호트 이름을 입력하세요."
    class="flex-1 p-2 text-base border border-gray-300 rounded"
  />
  <button class="px-4 py-2 text-sm cursor-pointer border border-gray-300 rounded bg-gray-50 hover:bg-gray-100" on:click={filterData}>🔍</button>
  <button 
    class="px-4 py-2 text-sm cursor-pointer border border-gray-300 rounded bg-gray-50 hover:bg-gray-100"
    on:click={handleComparison}
  >
    Comparison
  </button>
  <button class="px-4 py-2 text-sm cursor-pointer border border-gray-300 rounded bg-gray-50 hover:bg-gray-100">New</button>
</div>

<table class="data-table">
  <thead>
    <tr>
      <th></th>
      <th>ID</th>
      <th>Name</th>
      <th>Description</th>
      <th>Author</th>
      <th>Created At</th>
      <th>Updated At</th>
      
    </tr>
  </thead>
  <tbody>
    {#each filteredData as item (item.id)}
      <tr>
        <td>
          <input
            type="checkbox"
            checked={selectedItems[item.id] || false}
            on:change={() => handleCheckboxChange(item.id)}
          />
        </td>
        <td>{item.id}</td>
        <td>{item.name}</td>
        <td>{item.description}</td>
        <td>{item.author}</td>
        <td>{item.createdAt}</td>
        <td>{item.updatedAt}</td>
        
      </tr>
    {/each}
  </tbody>
</table>
<style>
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }

  th,
  td {
    padding: 10px;
    text-align: left;
    border: 1px solid #ccc;
  }
  td input[type="checkbox"] {
    display: block;
    margin: 0 auto;
  }  

  th {
    background-color: #f4f4f4;
  }

  td:last-child {
    text-align: center;
  }
</style>

