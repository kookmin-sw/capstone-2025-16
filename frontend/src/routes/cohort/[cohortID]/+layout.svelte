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

<div class="fixed left-0 top-[65px] flex h-[calc(100vh-65px)] w-[200px] flex-col border-r border-zinc-200">
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
		<div class="relative flex-1">
			<input
				type="text"
				class="h-8 w-full rounded-lg border border-zinc-200 bg-white pl-3 pr-9 text-xs transition-colors placeholder:text-gray-400 hover:border-zinc-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				placeholder="Enter Person ID"
				bind:value={searchQuery}
				onkeydown={(e) => {
					if(e.key === "Enter") filterData();
				}}
			/>
			<button 
				onclick={filterData} 
				aria-label="Search-Person-ID"
				class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
			>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
					<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
				</svg>
			</button>
		</div>
	</div>

	<div class="flex-1 overflow-y-auto px-2" bind:this={cohortDiv}>
		<!-- 환자 목록 -->
		<div class="flex flex-col rounded-lg border border-zinc-200 bg-white shadow-sm">
			{#each paginatedData as user}
				<a href="/cohort/{cohortID}/{user.personid}" class="group transition-colors duration-200 hover:bg-zinc-50">
					<div class="flex items-center justify-between px-4 py-2 border-b border-zinc-100 h-[33px]">
						<div class="flex items-center w-full">
							<span class="text-xs text-zinc-400 w-[70px]">ID {user.personid}</span>
							<span class="text-xs text-zinc-600">{user.gender}</span>
							<span class="text-xs text-zinc-300 mx-1">•</span>
							<span class="text-xs text-zinc-600">{user.age}세</span>
						</div>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
							<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
						</svg>
					</div>
				</a>
			{/each}
		</div>
	
		<!-- 페이지네이션 -->
		<div class="flex justify-center items-center gap-6 py-3">
			<button
				aria-label="Previous-Page"
				onclick={prevPage}
				disabled={currentPage === 1}
				class="p-2 text-sm font-medium transition-colors"
				class:text-gray-400={currentPage === 1}
				class:text-blue-600={currentPage !== 1}
				class:hover:text-blue-800={currentPage !== 1}
			>
				‹
			</button>
	
			<span class="text-xs text-zinc-600">
				{currentPage} / {Math.ceil((filteredData.length || 1) / itemsPerPage)}
			</span>
	
			<button
				aria-label="Next-Page"
				onclick={nextPage}
				disabled={currentPage * itemsPerPage >= filteredData.length}
				class="p-2 text-sm font-medium transition-colors"
				class:text-gray-400={currentPage * itemsPerPage >= filteredData.length}
				class:text-blue-600={currentPage * itemsPerPage < filteredData.length}
				class:hover:text-blue-800={currentPage * itemsPerPage < filteredData.length}
			>
				›
			</button>
		</div>
	</div>
</div>

<div class="relative left-[200px] px-6 w-[calc(100%-206px)]">
    {@render children()}
</div>