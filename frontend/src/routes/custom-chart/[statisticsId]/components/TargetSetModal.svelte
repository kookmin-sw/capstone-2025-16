<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade, fly } from 'svelte/transition';

	interface Cohort {
		cohortId: string;
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

	let { show } = $props<{ show?: boolean }>();
	if (show == undefined) {
		show = true;
	}

	let cohortList = $state<Cohort[]>([]);
	let selected_Cohorts = $state<Cohort[]>([]);
	let selected_Person = $state<string | null>(null);
	let isPersonIdValid = $state(false);
	let isLoading = $state(false);
	let errorMessage = $state<string | null>(null);

	async function verifyPersonId() {
		if (!selected_Person) return;

		isLoading = true;
		errorMessage = null;

		try {
			const response = await fetch(`https://bento.kookm.in/api/person/${selected_Person}`);
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
			const response = await fetch('https://bento.kookm.in/api/cohort');
			const data = await response.json();
			cohortList = data.cohorts;
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

	function handleClickOutside(event: MouseEvent) {
		const modal = document.getElementById('target-set-modal');
		if (modal && !modal.contains(event.target as Node)) {
			close();
		}
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
				name: 'Statistics name',
				description: 'Statistics description'
			};

			if (activeTab === 'cohort') {
				requestsBody = {
					...requestsBody,
					cohortIds: selected_Cohorts.map((cohort) => cohort.cohortId)
				};
			} else if (selected_Person) {
				requestsBody = { ...requestsBody, personId: selected_Person };
			}

			const response = await fetch('https://bento.kookm.in/api/statistics', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(requestsBody)
			});

			const { statisticsId } = await response.json();
			await goto(`/custom-chart/${statisticsId}/chart`);
			close();
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
		on:click={handleClickOutside}
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

			{#if isLoading}
				<div class="flex h-32 items-center justify-center">
					<div
						class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"
					></div>
				</div>
			{:else if activeTab === 'cohort'}
				<div class="w-full space-y-6">
					<div>
						<h3 class="mb-4 text-lg font-semibold text-gray-900">Selected Cohorts</h3>
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
						<h3 class="mb-4 text-lg font-semibold text-gray-900">Available Cohorts</h3>
						<div class="max-h-[24rem] overflow-y-auto rounded-lg border border-gray-200">
							<div class="divide-y divide-gray-100">
								{#each cohortList.filter((cohort) => !selected_Cohorts.includes(cohort)) as cohort}
									<button
										class="w-full px-4 py-4 text-left transition-colors duration-200 hover:bg-gray-50"
										on:click={() => {
											selected_Cohorts = [...selected_Cohorts, cohort];
										}}
									>
										<p class="text-base font-medium text-gray-900">{cohort.name}</p>
										<p class="mt-1 text-sm text-gray-500">{cohort.description}</p>
									</button>
								{/each}
							</div>
						</div>
					</div>
				</div>
			{:else if activeTab === 'person'}
				<div class="space-y-6">
					<div>
						<h3 class="mb-4 text-lg font-semibold text-gray-900">Person ID</h3>
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
