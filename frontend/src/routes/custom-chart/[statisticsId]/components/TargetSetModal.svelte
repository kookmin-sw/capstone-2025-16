<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade, fly } from 'svelte/transition';
	import { PUBLIC_API_URI } from '$env/static/public';
	interface Cohort {
		cohort_id: string;
		name: string;
		description: string;
	}

	interface Person {
		personId: string;
		name: string;
	}

	interface StatisticsRequest {
		name: string;
		description: string;
		cohortIds?: string[];
		personId?: string;
	}

	interface PaginationResponse {
		cohorts: Cohort[];
		total: number;
		page: number;
		limit: number;
	}

	let { show } = $props<{ show?: boolean }>();
	if (show == undefined) {
		show = true;
	}

	let page = $state(0); // API가 0부터 시작하는 페이지 인덱스를 사용
	let limit = $state(10); // 한 페이지당 표시할 항목 수
	let search = $state('');
	let totalItems = $state(0);
	let totalPages = $state(0);
	
	let cohortList = $state<Cohort[]>([]);
	let selected_Cohorts = $state<Cohort[]>([]);
	let selected_Person = $state<string | null>(null);
	let isPersonIdValid = $state(false);
	let isLoading = $state(false);
	let errorMessage = $state<string | null>(null);
	let statisticsName = $state('');
	let statisticsDescription = $state('');

	function close() {
		goto('/custom-chart');
	}

	async function verifyPersonId() {
		if (!selected_Person) return;

		isLoading = true;
		errorMessage = null;

		try {
			const response = await fetch(`${PUBLIC_API_URI}/api/person/${selected_Person}`);
			const data = await response.json();
			isPersonIdValid = !data.error;
			if (data.error) {
				errorMessage = 'Invalid person ID';
			}
		} catch (error) {
			errorMessage = 'Failed to verify person ID';
			isPersonIdValid = false;
		} finally {
			isLoading = false;
		}
	}

	async function getCohortList() {
		isLoading = true;
		errorMessage = null;

		try {
			// 페이지네이션 및 검색 쿼리 매개변수 추가
			const queryParams = new URLSearchParams();
			queryParams.set('page', page.toString());
			queryParams.set('limit', limit.toString());
			if (search.trim()) {
				queryParams.set('query', search);
			}

			const response = await fetch(`${PUBLIC_API_URI}/api/cohort?${queryParams.toString()}`);
			const data = await response.json() as PaginationResponse;
			
			cohortList = data.cohorts;
			totalItems = data.total;
			totalPages = Math.ceil(data.total / limit);
		} catch (error) {
			errorMessage = 'Failed to load cohorts';
		} finally {
			isLoading = false;
		}
	}

	function changeTab(tab: 'cohort' | 'person') {
		activeTab = tab;
		if (tab === 'cohort') {
			getCohortList();
		}
	}

	function nextPage() {
		if (page < totalPages - 1) {
			page++;
			getCohortList();
		}
	}

	function prevPage() {
		if (page > 0) {
			page--;
			getCohortList();
		}
	}

	function goToPage(pageNum: number) {
		if (pageNum >= 0 && pageNum < totalPages) {
			page = pageNum;
			getCohortList();
		}
	}

	function handleSearch() {
		page = 0; // 검색 시 첫 페이지로 이동
		getCohortList();
	}

	let activeTab = $state<'cohort' | 'person'>('cohort');
	getCohortList();

	async function handleCreate() {
		if (
			(activeTab === 'cohort' && selected_Cohorts.length === 0) ||
			(activeTab === 'person' && !isPersonIdValid)
		) {
			errorMessage = 'Please select valid targets';
			return;
		}

		isLoading = true;
		errorMessage = null;

		try {
			let requestsBody: StatisticsRequest = {
				name: statisticsName.trim() ? statisticsName : 'Custom Target Set',
				description: statisticsDescription.trim() ? statisticsDescription : ''
			};
			
			if (activeTab === 'cohort') {
				requestsBody = {
					...requestsBody,
					cohortIds: selected_Cohorts.map((cohort) => cohort.cohort_id)
				};
			} else if (selected_Person) {
				requestsBody = { ...requestsBody, personId: selected_Person };
			}

			console.log(requestsBody);
			const response = await fetch(`${PUBLIC_API_URI}/api/statistics`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(requestsBody)
			});

			const { statisticsId } = await response.json();
			goto(`/custom-chart/${statisticsId}/chart`);
			
		} catch (error) {
			errorMessage = 'Failed to create statistics';
		} finally {
			isLoading = false;
		}
	}
</script>

{#if show}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
		transition:fade={{ duration: 200 }}
	>
		<div
			id="target-set-modal"
			class="relative h-[90vh] w-full max-w-lg scale-100 transform overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl transition-all duration-300"
			transition:fly={{ y: 20, duration: 300 }}
		>
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-2xl font-bold text-gray-900">Select Target Set</h2>
				<button
					class="text-gray-400 transition-colors duration-200 hover:text-gray-600"
					on:click={close}
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			{#if errorMessage}
				<div class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600" transition:fade>
					{errorMessage}
				</div>
			{/if}

			<div class="mb-8 flex space-x-1 border-b border-gray-200">
				<button
					class="px-6 py-3 text-sm font-medium transition-all duration-200 {activeTab === 'cohort'
						? 'border-b-2 border-indigo-500 text-indigo-600'
						: 'text-gray-500 hover:text-gray-700'}"
					on:click={() => changeTab('cohort')}
				>
					Cohort
				</button>
				<button
					class="px-6 py-3 text-sm font-medium transition-all duration-200 {activeTab === 'person'
						? 'border-b-2 border-indigo-500 text-indigo-600'
						: 'text-gray-500 hover:text-gray-700'}"
					on:click={() => changeTab('person')}
				>
					Person
				</button>
			</div>

			<div class="mb-4 mt-4">
				<label class="block text-sm font-medium text-gray-700 mb-1">Target Set Name</label>
				<input type="text" class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-2" bind:value={statisticsName} placeholder="Enter target set name" />
				<label class="block text-sm font-medium text-gray-700 mb-1 mt-2">Target Set Description</label>
				<textarea class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" bind:value={statisticsDescription} placeholder="Enter target set description" rows="2"></textarea>
			</div>

			{#if isLoading}
				<div class="flex h-32 items-center justify-center">
					<div
						class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"
					></div>
				</div>
			{:else if activeTab === 'cohort'}
				<div class="w-full space-y-6">
					<div>
						<h3 class="mb-4 text-base font-semibold text-gray-900">Selected Cohorts</h3>
						<div class="flex min-h-[3rem] flex-wrap gap-2 rounded-lg bg-gray-50 p-2">
							{#each selected_Cohorts as cohort}
								<button
									on:click|stopPropagation={() => {
										selected_Cohorts = selected_Cohorts.filter((c) => c !== cohort);
									}}
									class="group flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1.5 text-sm font-medium text-indigo-700 transition-all duration-200 hover:bg-indigo-200"
									transition:fade
								>
									{cohort.name}
									<span
										class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-indigo-200 text-indigo-600 transition-colors duration-200 hover:bg-indigo-300"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-3 w-3"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</span>
								</button>
							{/each}
						</div>
					</div>

					<div>
						<h3 class="mb-4 text-base font-semibold text-gray-900">Available Cohorts</h3>
						<div class="flex gap-2 mb-2">
							<input 
                                type="text" 
                                class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                                placeholder="Enter search term" 
                                bind:value={search}
                                on:keypress={(e) => e.key === 'Enter' && handleSearch()}
                            />
							<button 
                                class="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-indigo-700 disabled:opacity-50"
                                on:click={handleSearch}
                            >Search</button>
						</div>
						<div class="max-h-[24rem] overflow-y-auto rounded-lg border border-gray-200">
							<div class="divide-y divide-gray-100">
								{#each cohortList.filter((cohort) => !selected_Cohorts.some(sc => sc.cohort_id === cohort.cohort_id)) as cohort}
									<button
										class="w-full px-4 py-2 text-left transition-colors duration-200 hover:bg-gray-50"
										on:click={() => {
											selected_Cohorts = [...selected_Cohorts, cohort];
										}}
									>
										<p class="text-base font-medium text-gray-900">{cohort.name}</p>
										<p class="mt-1 text-sm text-gray-500">{cohort.description}</p>
									</button>
								{/each}
                                {#if cohortList.length === 0}
                                    <div class="px-4 py-6 text-center text-gray-500">
                                        No search results.
                                    </div>
                                {/if}
							</div>
                            
                            {#if totalPages > 1}
                                <div class="flex items-center justify-center py-4 bg-gray-50 border-t border-gray-200">
                                    <div class="flex space-x-1">
                                        <button 
                                            class="px-3 py-1 text-sm rounded-md {page === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200'}"
                                            on:click={prevPage}
                                            disabled={page === 0}
                                        >
                                            Previous
                                        </button>
                                        
                                        {#if totalPages <= 7}
                                            {#each Array(totalPages) as _, i}
                                                <button 
                                                    class="px-3 py-1 text-sm rounded-md {page === i ? 'bg-indigo-100 text-indigo-600 font-medium' : 'text-gray-700 hover:bg-gray-200'}"
                                                    on:click={() => goToPage(i)}
                                                >
                                                    {i + 1}
                                                </button>
                                            {/each}
                                        {:else}
                                            {#if page > 2}
                                                <button 
                                                    class="px-3 py-1 text-sm rounded-md text-gray-700 hover:bg-gray-200"
                                                    on:click={() => goToPage(0)}
                                                >
                                                    1
                                                </button>
                                                {#if page > 3}
                                                    <span class="px-2 py-1 text-gray-500">...</span>
                                                {/if}
                                            {/if}
                                            
                                            {#each Array(Math.min(5, totalPages)).filter((_,i) => {
                                                const pageNum = page - 2 + i;
                                                return pageNum >= 0 && pageNum < totalPages;
                                            }) as _, i}
                                                {@const pageNum = page - 2 + i}
                                                <button 
                                                    class="px-3 py-1 text-sm rounded-md {page === pageNum ? 'bg-indigo-100 text-indigo-600 font-medium' : 'text-gray-700 hover:bg-gray-200'}"
                                                    on:click={() => goToPage(pageNum)}
                                                >
                                                    {pageNum + 1}
                                                </button>
                                            {/each}
                                            
                                            {#if page < totalPages - 3}
                                                {#if page < totalPages - 4}
                                                    <span class="px-2 py-1 text-gray-500">...</span>
                                                {/if}
                                                <button 
                                                    class="px-3 py-1 text-sm rounded-md text-gray-700 hover:bg-gray-200"
                                                    on:click={() => goToPage(totalPages - 1)}
                                                >
                                                    {totalPages}
                                                </button>
                                            {/if}
                                        {/if}
                                        
                                        <button 
                                            class="px-3 py-1 text-sm rounded-md {page === totalPages - 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200'}"
                                            on:click={nextPage}
                                            disabled={page === totalPages - 1}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            {/if}
						</div>
					</div>
				</div>
			{:else if activeTab === 'person'}
				<div class="space-y-6">
					<div>
						<h3 class="mb-4 text-base font-semibold text-gray-900">Person ID</h3>
						<div class="flex min-h-[3rem] flex-wrap gap-4 rounded-lg bg-gray-50 p-4">
							<div class="flex-1">
								<input
									type="text"
									value={selected_Person ?? ''}
									placeholder="Enter person ID"
									class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
									on:input={(e) => {
										selected_Person = (e.target as HTMLInputElement).value;
										isPersonIdValid = false;
									}}
								/>
							</div>
							<button
								class="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-indigo-700 disabled:opacity-50"
								on:click={verifyPersonId}
								disabled={!selected_Person || isLoading}
							>
								{#if isLoading}
									<div
										class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
									></div>
								{:else if isPersonIdValid}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="mr-1 h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										/>
									</svg>
									Verified
								{:else}
									Verify
								{/if}
							</button>
						</div>
					</div>
				</div>
			{/if}

			<div class="mt-8 flex justify-end space-x-3">
				<button
					class="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-100"
					on:click={close}
					disabled={isLoading}
				>
					Cancel
				</button>
				<button
					class="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-indigo-700 disabled:opacity-50"
					on:click={handleCreate}
					disabled={isLoading ||
						(activeTab === 'cohort' && selected_Cohorts.length === 0) ||
						(activeTab === 'person' && !isPersonIdValid)}
				>
					{#if isLoading}
						<div
							class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
						></div>
					{/if}
					Create
				</button>
			</div>
		</div>
	</div>
{/if}
