<script>
  import { onMount } from "svelte";

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

  // 컴포넌트가 마운트될 때 데이터 로드
  onMount(() => {
    loadData();
  });
</script>

<div class="header">
  <input
    type="text"
    bind:value={searchQuery}
    placeholder="코호트 이름을 입력하세요."
    class="search-bar"
  />
  <button class="search-btn" on:click={filterData}>🔍</button>
  <button class="my-btn">MY</button>
  <button class="new-btn">New</button>
</div>

<table class="data-table">
  <thead>
    <tr>
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
  .header {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }

  .search-bar {
    flex: 1;
    padding: 8px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .search-btn,
  .my-btn,
  .new-btn {
    padding: 8px 16px;
    font-size: 14px;
    cursor: pointer;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #f9f9f9;
  }

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

  th {
    background-color: #f4f4f4;
  }
</style>
