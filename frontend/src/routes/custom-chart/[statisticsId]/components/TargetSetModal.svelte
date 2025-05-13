<script>
	let { show } = $props();
	if (show == undefined) {
		show = true;
	}

	let cohortList = $state([]);
	let personList = $state([]);

	async function getCohortList() {
		const response = await fetch('https://bento.kookm.in/api/cohort');
		const data = await response.json();
		cohortList = data.cohorts;
	}

	async function getPersonList() {
		const response = await fetch('https://bento.kookm.in/api/person');
		const data = await response.json();
		personList = data.persons;
	}

	function changeTab(tab) {
		activeTab = tab;
		if (tab == 'cohort') {
			getCohortList();
		} else {
			getPersonList();
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
	function handleCreate() {
		// Dispatch the selected chart type
		dispatch('save', { chartType: selectedTargetSet });
		close();
	}

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
</script>

{#if show}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
		on:click={handleClickOutside}
	>
		<div id="target-set-modal" class="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-bold text-gray-800">Select Target Set</h2>
				<button class="text-gray-500 hover:text-gray-700" on:click={close}>
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

			<div class="mb-6 flex border-b border-gray-200">
				<button
					class="px-4 py-2 {activeTab === 'cohort'
						? 'border-b-2 border-blue-500 text-blue-600'
						: 'text-gray-600'}"
					on:click={() => changeTab('cohort')}
				>
					Cohort
				</button>
				<button
					class="px-4 py-2 {activeTab === 'person'
						? 'border-b-2 border-blue-500 text-blue-600'
						: 'text-gray-600'}"
					on:click={() => changeTab('person')}
				>
					Person
				</button>
			</div>

			{#if activeTab === 'cohort'}
				<div class="max-h-96 overflow-y-auto">
					<div>
						{#each cohortList as cohort}
							<button
								class="w-full rounded px-4 py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-100"
								on:click={() => {
									selectedCohort = cohort;
								}}
							>
								<p class="text-lg font-bold">{cohort.name}</p>
								<p class="text-sm text-gray-500">{cohort.description}</p>
							</button>
						{/each}
					</div>
				</div>
			{/if}
			<div class="flex justify-end space-x-3">
				<button
					class="rounded px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
					on:click={close}
				>
					Cancel
				</button>
				<button
					class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
					on:click={handleSave}
				>
					Apply
				</button>
			</div>
		</div>
	</div>
{/if}
