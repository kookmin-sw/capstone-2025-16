<script>
    import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { filter } from 'd3';
	import { onMount, tick } from 'svelte';
	import { slide } from 'svelte/transition';
	import analysisData from '$lib/data/singleCohortAnalysisTest.json';

	let { children, data } = $props();
    const cohortID = $page.params.cohortID;
	let searchQuery = $state("");
	let filteredData = $state([]);
	let itemsPerPage = $state(10);
	let currentPage = $state(0);
	let paginatedData = $state([]);
	let cohortDiv;
	let resizeObserver;

	const rowHeight = 35;

	function calculateItemsPerPage() {
		const availableHeight = cohortDiv.clientHeight - 32;
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

	onMount(async () => {
		if (data.userData.length !== 0) {
			currentPage = 1;
			filteredData = data.userData;
		}

		await tick();

		if (cohortDiv) {
			calculateItemsPerPage();

			resizeObserver = new ResizeObserver(() => {
				calculateItemsPerPage();
			});
			resizeObserver.observe(cohortDiv);
		}

		window.addEventListener('resize', calculateItemsPerPage);

		return () => {
			window.removeEventListener('resize', calculateItemsPerPage);
			if (resizeObserver) resizeObserver.disconnect();
		};
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

<div class="fixed left-0 top-[65px] flex h-[calc(100vh-60px)] w-[200px] flex-col border-r border-zinc-200">
	<div class="px-2 pt-2">
		<button 
			class="w-full flex items-center justify-between px-3 py-2 bg-white rounded-lg border hover:bg-blue-50 transition-colors group"
			onclick={() => goto(`/cohort/${cohortID}`)}
		>
			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-1">
					<span class="text-[10px] font-medium text-gray-400 truncate">{analysisData.basicInfo?.id || cohortID}</span>
				</div>
				<div class="flex items-center gap-1">
					<div class="text-xs font-medium text-blue-600 break-words whitespace-normal">{analysisData.basicInfo?.name || "Cohort"}</div>
				</div>
			</div>
			<div class="flex items-center text-gray-400 group-hover:text-blue-600">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
				</svg>
			</div>
		</button>
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
	<div class="h-[100vh] w-full px-2" bind:this={cohortDiv}>
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