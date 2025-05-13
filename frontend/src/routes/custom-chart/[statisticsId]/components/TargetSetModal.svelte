<script>
	import { goto } from '$app/navigation';

	let { show } = $props();
	if (show == undefined) {
		show = true;
	}

	let cohortList = $state([]);
	let personList = $state([]);

	let selected_Cohorts = $state([]);
	let selected_Person = $state(null);
	let isPersonIdValid = $state(false);

	async function verifyPersonId() {
		const response = await fetch(`https://bento.kookm.in/api/person/${selected_Person}`);
		const data = await response.json();
		if (data.error) {
			isPersonIdValid = false;
		} else {
			isPersonIdValid = true;
		}
	}

	async function getCohortList() {
		const response = await fetch('https://bento.kookm.in/api/cohort');
		const data = await response.json();
		cohortList = data.cohorts;
	}

	function changeTab(tab) {
		activeTab = tab;
		if (tab == 'cohort') {
			getCohortList();
		}
	}
	// Close the modal when clicking outside
	function handleClickOutside(event) {
		const modal = document.getElementById('target-set-modal');
		if (modal && !modal.contains(event.target)) {
			close();
		}
	}
	let activeTab = $state('cohort'); // cohort, person
	getCohortList();

	async function handleCreate() {
		let requestsBody = {
			name: 'Statistics name',
			description: 'Statistics description'
		};
		if (activeTab === 'cohort' && selected_Cohorts.length > 0) {
			requestsBody = {
				...requestsBody,
				cohortIds: selected_Cohorts.map((cohort) => cohort.cohortId)
			};
		} else if (activeTab === 'person' && isPersonIdValid) {
			requestsBody = { ...requestsBody, personId: selected_Person };
		}
		await fetch('https://bento.kookm.in/api/statistics', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(requestsBody)
		})
			.then((res) => res.json())
			.then(({ statisticsId }) => {
				goto(`/custom-chart/${statisticsId}/chart`);
			});

		close();
	}

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
</script>

{#if show}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300"
		on:click={handleClickOutside}
	>
		<div
			id="target-set-modal"
			class="relative h-[90vh] w-full max-w-lg scale-100 transform overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl transition-all duration-300"
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

			{#if activeTab === 'cohort'}
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
											selected_Cohorts.push(cohort);
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
				<div>
					<h3 class="mb-4 text-lg font-semibold text-gray-900">Selected Persons</h3>
					<div class="flex min-h-[3rem] flex-wrap gap-2 rounded-lg bg-gray-50 p-2">
						<input
							value={selected_Person}
							placeholder="Input person id"
							on:input={(e) => {
								selected_Person = e.target.value;
							}}
						/>
						<button
							class="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-indigo-700"
							on:click={verifyPersonId}
						>
							{#if isPersonIdValid}
								Check
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
							{:else}
								Check
							{/if}
						</button>
					</div>
				</div>
			{/if}

			<div class="mt-8 flex justify-end space-x-3">
				<button
					class="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-100"
					on:click={close}
				>
					Cancel
				</button>
				<button
					class="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-indigo-700"
					on:click={handleCreate}
				>
					Apply
				</button>
			</div>
		</div>
	</div>
{/if}
