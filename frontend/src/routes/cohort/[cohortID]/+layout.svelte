<script>
    import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { filter } from 'd3';
	import { onMount } from 'svelte';

	let { children, data } = $props();
    const cohortID = $page.params.cohortID;
	let searchQuery = $state("");
	let filteredData = $state([]);
	let itemsPerPage = $state(10);
	let currentPage = $state(0);
	let paginatedData = $state([]);

	const rowHeight = 42;

	function calculateItemsPerPage() {
		const availableHeight = window.innerHeight - 50;
		itemsPerPage = Math.floor(availableHeight / rowHeight);
	}
	// 검색어에 따라 데이터를 필터링
	function filterData() {
		if(searchQuery.length === 0){
			filteredData = data.userData;
			return;	
		}

		filteredData = data.userData.filter((item) =>
			item.personid === parseInt(searchQuery)
		);
	}

	onMount(() => {
		if(data.userData.length !== 0){
			currentPage = 1;
			filteredData = data.userData;
			calculateItemsPerPage();
		}
		window.addEventListener('resize', calculateItemsPerPage);
	});

	$effect(() => {
		paginatedData = filteredData.slice(
			(currentPage - 1) * itemsPerPage,
			currentPage * itemsPerPage
		);
	})

	function nextPage() {
		if (currentPage * itemsPerPage < filteredData.length) currentPage++;
	}
	function prevPage() {
		if (currentPage > 1) currentPage--;
	}
</script>

<div class="fixed left-0 top-10 flex h-full w-[200px] flex-col border-r border-zinc-200">
	<div>
		<div class="flex justify-center mt-2 ml-2 mr-2">
			<button
			  class="h-8 w-full text-sm cursor-pointer border border-gray-300 rounded bg-gray-50 hover:bg-gray-100"
			  onclick={() => goto(`/cohort/${cohortID}/analysis`)}
			>
			  Analysis Report
			</button>
		</div>
	</div>
	<div class="flex w-full px-2 py-2">
		<input
			type="text"
			class="h-8 w-full rounded-sm border border-zinc-200 bg-zinc-50 text-left shadow-sm placeholder:text-xs text-xs"
			placeholder="Enter Person ID"
			bind:value={searchQuery}
			onkeydown={(e) => {
				if(e.key === "Enter") filterData();
			}}
		/>
		<button onclick={filterData} aria-label="Search-Person-ID">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
				<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
			</svg>
		</button>
	</div>
	<div class="h-full w-full px-2">
		<div class="flex flex-col rounded-sm border-r border-t border-l border-zinc-200 bg-zinc-50 max-h-full overflow-y-auto">
			{#each paginatedData as user}
				<a href="/cohort/{cohortID}/{user.personid}">
					<button class="w-full border-b border-zinc-200 px-2 py-2 text-left text-xs overflow-wrap">
						{user.gender} ({user.age}) | {user.personid}
					</button>
				</a>
			{/each}
		</div>

		<!-- Pagination -->
		<div class="flex justify-between px-2 py-2 text-xs">
			<button onclick={prevPage} disabled={currentPage === 1} class="text-blue-600 disabled:text-gray-300">{"<"}</button>
			<span>Page {currentPage} / {Math.ceil((filteredData.length ? filteredData.length : 1) / itemsPerPage)}</span>
			<button onclick={nextPage} disabled={currentPage * itemsPerPage >= filteredData.length} class="text-blue-600 disabled:text-gray-300">{">"}</button>
		</div>
	</div>
</div>

<div class="relative left-[200px] px-6 w-[calc(100%-206px)]">
    {@render children()}
</div>