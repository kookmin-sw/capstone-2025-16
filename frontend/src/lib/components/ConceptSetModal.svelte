<!-- 
  Concept Set Management Modal Component
  Features:
  - View concept set list
  - Create/Edit/Delete concept sets
  - Search and add concepts
  - Edit concept properties (include/exclude, include descendants, include mapped concepts) 
-->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import {
		createConceptSet,
		addConceptToSet,
		removeConceptFromSet,
		updateConceptSetItem,
		exportConceptSetToJson,
		importConceptSetFromJson,
		type ConceptSet,
		type Concept
	} from '$lib/models/ConceptSet';
	import { PUBLIC_API_URI } from '$env/static/public';

	// 인터페이스 정의
	export let show = false;
	export let conceptSets: ConceptSet[] = [];

	// 이벤트 디스패처
	const dispatch = createEventDispatcher();

	// 현재 편집 중인 개념 집합
	let editingConceptSet: ConceptSet | null = null;
	let activeTab = 'list'; // list, edit, search, import, export

	// 개념 검색 상태
	let searchQuery = '';
	let searchResults: Concept[] = [];
	let isSearching = false;
	let selectedDomain = ''; // For domain filtering

	// Pagination state
	let currentPage = 0;
	let pageSize = 50;
	let totalResults = 0;
	let totalPages = 0;

	// Available domains for filtering
	const availableDomains = [
		'',
		'Condition',
		'Condition Status',
		'Condition/Device',
		'Condition/Meas',
		'Condition/Obs',
		'Condition/Procedure',
		'Cost',
		'Currency',
		'Device',
		'Device/Drug',
		'Device/Procedure',
		'Drug',
		'Drug/Procedure',
		'Episode',
		'Ethnicity',
		'Gender',
		'Geography',
		'Language',
		'Meas Value',
		'Meas Value Operator',
		'Meas/Procedure',
		'Measurement',
		'Metadata',
		'Note',
		'Obs/Procedure',
		'Observation',
		'Payer',
		'Place of Service',
		'Plan',
		'Plan Stop Reason',
		'Procedure',
		'Provider',
		'Race',
		'Regimen',
		'Relationship',
		'Revenue Code',
		'Route',
		'Spec Anatomic Site',
		'Specimen',
		'Sponsor',
		'Type Concept',
		'Unit',
		'Visit'
	];

	// 탭 변경 함수
	function changeTab(tab: string) {
		activeTab = tab;
	}

	// 새 개념 집합 생성
	function createNewConceptSet() {
		const newSet = createConceptSet({
			conceptset_id: `${conceptSets.length + 1}`,
			name: `Concept Set ${conceptSets.length + 1}`,
			items: []
		});

		editingConceptSet = newSet;
		activeTab = 'edit';
	}

	// 개념 집합 편집
	function editConceptSet(set: ConceptSet) {
		editingConceptSet = { ...set };
		activeTab = 'edit';
	}

	// 개념 집합 삭제
	function deleteConceptSet(index: number) {
		if (confirm('Are you sure you want to delete this concept set?')) {
			conceptSets.splice(index, 1);
			dispatch('update', { conceptSets });
		}
	}

	// 개념 검색
	async function searchConcepts() {
		isSearching = true;

		// 실제 서비스에서는 API 호출로 구현
		// Add domain parameter to query if a domain is selected
		const domainParam = selectedDomain ? `&domain=${encodeURIComponent(selectedDomain)}` : '';

		await fetch(
			`${PUBLIC_API_URI}/api/concept/search?query=${encodeURIComponent(searchQuery)}${domainParam}&page=${currentPage}&limit=${pageSize}`
		)
			.then((response) => response.json())
			.then((data) => {
				searchResults = data.concepts;
				totalResults = data.total || data.concepts.length;
				totalPages = Math.ceil(totalResults / pageSize);
			})
			.catch((error) => {
				console.error('Error searching concepts:', error);
				searchResults = [];
				totalResults = 0;
				totalPages = 0;
			})
			.finally(() => {
				isSearching = false;
			});
	}

	// Navigate to next page
	function nextPage() {
		if (currentPage < totalPages - 1) {
			currentPage++;
			searchConcepts();
		}
	}

	// Navigate to previous page
	function prevPage() {
		if (currentPage > 0) {
			currentPage--;
			searchConcepts();
		}
	}

	// 개념 집합에 개념 추가
	function addConcept(concept: Concept) {
		if (!editingConceptSet) return;

		editingConceptSet = addConceptToSet(editingConceptSet, concept);
	}

	// 개념 집합에서 개념 제거
	function removeConcept(index: number) {
		if (!editingConceptSet) return;

		editingConceptSet = removeConceptFromSet(editingConceptSet, index);
	}

	// 개념 속성 업데이트
	function updateConcept(
		index: number,
		isExcluded: boolean,
		includeDescendants: boolean,
		includeMapped: boolean
	) {
		if (!editingConceptSet) return;

		editingConceptSet = updateConceptSetItem(
			editingConceptSet,
			index,
			isExcluded,
			includeDescendants,
			includeMapped
		);
	}

	// 변경사항 저장
	function saveChanges() {
		if (!editingConceptSet) return;

		const index = conceptSets.findIndex(
			(set) => set.conceptset_id === editingConceptSet?.conceptset_id
		);

		if (index === -1) {
			// 새 개념 집합 추가
			conceptSets = [...conceptSets, editingConceptSet];
		} else {
			// 기존 개념 집합 업데이트
			conceptSets[index] = editingConceptSet;
		}

		dispatch('update', { conceptSets });
		activeTab = 'list';
	}

	// JSON 내보내기
	function exportToJson() {
		if (!editingConceptSet) return;

		const json = exportConceptSetToJson(editingConceptSet);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = `${editingConceptSet.name.replace(/\s+/g, '_')}.json`;
		a.click();

		URL.revokeObjectURL(url);
	}

	// JSON 가져오기
	async function importFromJson(event: Event) {
		const target = event.target as HTMLInputElement;
		if (!target.files?.length) return;

		const file = target.files[0];
		const reader = new FileReader();

		reader.onload = (e) => {
			try {
				const json = e.target?.result as string;
				const importedSet = importConceptSetFromJson(json);

				editingConceptSet = importedSet;
				activeTab = 'edit';
			} catch (error) {
				console.error('Error importing concept set:', error);
				alert('Failed to import concept set. Invalid format.');
			}
		};

		reader.readAsText(file);
	}

	// 모달 닫기
	function closeModal() {
		show = false;
		dispatch('close');
	}
</script>

<!-- 모달 컨테이너 -->
{#if show}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
		<div class="w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl">
			<!-- 모달 헤더 -->
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-xl font-bold text-gray-900">Concept Set Manager</h2>
				<button class="text-gray-600 hover:text-gray-900" on:click={closeModal}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
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
				</button>
			</div>

			<!-- 탭 메뉴 -->
			<div class="mb-6 flex border-b border-gray-200">
				<button
					class="px-4 py-2 {activeTab === 'list'
						? 'border-b-2 border-blue-500 text-blue-600'
						: 'text-gray-600'}"
					on:click={() => changeTab('list')}
				>
					Concept Sets
				</button>
				<button
					class="px-4 py-2 {activeTab === 'edit'
						? 'border-b-2 border-blue-500 text-blue-600'
						: 'text-gray-600'}"
					on:click={() => changeTab('edit')}
					disabled={!editingConceptSet}
				>
					Edit
				</button>
				<button
					class="px-4 py-2 {activeTab === 'search'
						? 'border-b-2 border-blue-500 text-blue-600'
						: 'text-gray-600'}"
					on:click={() => changeTab('search')}
					disabled={!editingConceptSet}
				>
					Search
				</button>
				<button
					class="px-4 py-2 {activeTab === 'import'
						? 'border-b-2 border-blue-500 text-blue-600'
						: 'text-gray-600'}"
					on:click={() => changeTab('import')}
				>
					Import
				</button>
				<button
					class="px-4 py-2 {activeTab === 'export'
						? 'border-b-2 border-blue-500 text-blue-600'
						: 'text-gray-600'}"
					on:click={() => changeTab('export')}
					disabled={!editingConceptSet}
				>
					Export
				</button>
			</div>

			<!-- 탭 컨텐츠 -->
			<div class="max-h-96 overflow-y-auto">
				<!-- 목록 탭 -->
				{#if activeTab === 'list'}
					<div class="flex flex-col">
						<!-- 개념 집합 목록 헤더 -->
						<div class="mb-4 flex justify-between">
							<h3 class="text-lg font-medium text-gray-700">Available Concept Sets</h3>
							<button
								class="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
								on:click={createNewConceptSet}
							>
								New Concept Set
							</button>
						</div>

						<!-- 개념 집합 목록 -->
						{#if conceptSets.length === 0}
							<div class="rounded-md border border-gray-200 bg-gray-50 p-4">
								<p class="text-center text-sm text-gray-500">No concept sets defined yet.</p>
							</div>
						{:else}
							<div class="space-y-2">
								{#each conceptSets as set, i}
									<div
										class="flex items-center justify-between rounded-md border border-gray-200 p-3 hover:bg-gray-50"
									>
										<span class="font-medium text-gray-700">{set.name}</span>
										<div class="flex space-x-2">
											<button
												class="rounded bg-blue-100 px-2 py-1 text-xs text-blue-600 hover:bg-blue-200"
												on:click={() => editConceptSet(set)}
											>
												Edit
											</button>
											<button
												class="rounded bg-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-200"
												on:click={() => deleteConceptSet(i)}
											>
												Delete
											</button>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}

				<!-- 편집 모드 탭 -->
				{#if activeTab === 'edit' && editingConceptSet}
					<div class="grid grid-cols-1 gap-6">
						<!-- 개념 집합 이름 입력 -->
						<div>
							<label for="conceptSetName" class="mb-2 block text-sm font-medium text-gray-700"
								>Concept Set Name</label
							>
							<input
								type="text"
								id="conceptSetName"
								class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
								bind:value={editingConceptSet.name}
							/>
						</div>
						<!-- 개념 목록 테이블 -->
						<div>
							<h3 class="mb-3 text-base font-medium text-gray-700">Included Concepts</h3>

							{#if editingConceptSet.items.length === 0}
								<div class="rounded-md border border-gray-200 bg-gray-50 p-4">
									<p class="text-center text-sm text-gray-500">
										No concepts added to this set yet.
									</p>
								</div>
							{:else}
								<div class="mb-4 overflow-x-scroll rounded-lg border border-gray-200 shadow">
									<table class="min-w-full divide-y divide-gray-200">
										<thead class="bg-gray-50">
											<tr>
												<th
													scope="col"
													class="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
												>
													Concept
												</th>
												<th
													scope="col"
													class="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
												>
													Excluded
												</th>
												<th
													scope="col"
													class="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
												>
													Descendants
												</th>
												<th
													scope="col"
													class="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
												>
													Mapped
												</th>
												<th
													scope="col"
													class="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
												>
													Actions
												</th>
											</tr>
										</thead>
										<tbody class="divide-y divide-gray-200 bg-white">
											{#each editingConceptSet.items || [] as item, index}
												<tr class="hover:bg-gray-50">
													<td class="whitespace-nowrap px-2 py-2 text-sm">
														<div class="flex items-center">
															<span
																class={item.isExcluded
																	? 'text-red-600 line-through'
																	: 'text-gray-900'}
															>
																{item.concept_name}
															</span>
														</div>
														<div class="text-xs text-gray-500">
															ID: {item.concept_id} | {item.domain_id} | {item.vocabulary_id}
														</div>
													</td>
													<td class="whitespace-nowrap px-2 py-2 text-sm">
														<label class="flex items-center space-x-2">
															<input
																type="checkbox"
																class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
																checked={item.isExcluded || false}
																on:change={(e) =>
																	updateConcept(
																		index,
																		(e.target as HTMLInputElement).checked,
																		item.includeDescendants || false,
																		item.includeMapped || false
																	)}
															/>
															<span class="text-xs">Excluded</span>
														</label>
													</td>
													<td class="whitespace-nowrap px-2 py-2 text-sm">
														<label class="flex items-center space-x-2">
															<input
																type="checkbox"
																class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
																checked={item.includeDescendants || false}
																on:change={(e) =>
																	updateConcept(
																		index,
																		item.isExcluded || false,
																		(e.target as HTMLInputElement).checked,
																		item.includeMapped || false
																	)}
															/>
															<span class="text-xs">Descendants</span>
														</label>
													</td>
													<td class="whitespace-nowrap px-2 py-2 text-sm">
														<label class="flex items-center space-x-2">
															<input
																type="checkbox"
																class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
																checked={item.includeMapped || false}
																on:change={(e) =>
																	updateConcept(
																		index,
																		item.isExcluded || false,
																		item.includeDescendants || false,
																		(e.target as HTMLInputElement).checked
																	)}
															/>
															<span class="text-xs">Mapped</span>
														</label>
													</td>
													<td class="whitespace-nowrap px-2 py-2 text-sm">
														<button
															class="text-red-600 hover:text-red-900"
															on:click={() => removeConcept(index)}
														>
															<svg
																xmlns="http://www.w3.org/2000/svg"
																class="h-4 w-4"
																fill="none"
																viewBox="0 0 24 24"
																stroke="currentColor"
															>
																<path
																	stroke-linecap="round"
																	stroke-linejoin="round"
																	stroke-width="2"
																	d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
																/>
															</svg>
														</button>
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							{/if}

							<!-- 개념 추가 버튼 -->
							<div class="mt-3 flex justify-end">
								<button
									class="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
									on:click={() => changeTab('search')}
								>
									Add Concepts
								</button>
							</div>
						</div>

						<!-- 저장 버튼 -->
						<div class="mt-4 flex justify-end">
							<button
								class="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
								on:click={saveChanges}
							>
								Save Changes
							</button>
						</div>
					</div>
				{/if}

				<!-- 검색 탭 -->
				{#if activeTab === 'search' && editingConceptSet}
					<div class="grid grid-cols-1 gap-6">
						<div>
							<h3 class="mb-3 text-base font-medium text-gray-700">Search Concepts</h3>
							<div class="flex flex-col space-y-2">
								<div class="flex items-center space-x-2">
									<input
										type="text"
										placeholder="Search by concept name, code, etc."
										class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
										bind:value={searchQuery}
									/>
									<button
										class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
										on:click={() => searchConcepts()}
										disabled={isSearching}
									>
										{isSearching ? 'Searching...' : 'Search'}
									</button>
								</div>

								<!-- Domain filter dropdown -->
								<div class="flex items-center space-x-2">
									<label for="domain-filter-modal" class="text-sm font-medium text-gray-700"
										>Domain:</label
									>
									<select
										id="domain-filter-modal"
										class="flex-1 rounded-md border-gray-300 bg-white py-1.5 pl-3 pr-8 text-sm shadow-sm transition-all hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
										bind:value={selectedDomain}
										on:change={() => {
											currentPage = 0;
											searchResults = [];
											totalResults = 0;
											totalPages = 0;
										}}
									>
										{#each availableDomains as domain}
											<option value={domain}>{domain || 'All Domains'}</option>
										{/each}
									</select>
								</div>
							</div>
						</div>

						<!-- 검색 결과 -->
						<div>
							<h3 class="mb-3 text-base font-medium text-gray-700">Results</h3>

							{#if isSearching}
								<div class="flex justify-center p-4">
									<svg
										class="h-8 w-8 animate-spin text-blue-600"
										viewBox="0 0 24 24"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<circle
											class="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											stroke-width="4"
										></circle>
										<path
											class="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8v2a6 6 0 00-6 6h2z"
										></path>
									</svg>
								</div>
							{:else if searchResults.length > 0}
								<div class="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow">
									<h3 class="mb-2 text-sm font-medium text-gray-800">Search Results</h3>
									<div class="max-h-60 overflow-y-auto">
										<ul class="divide-y divide-gray-200">
											{#each searchResults as concept}
												<li class="py-2">
													<div class="flex items-center justify-between">
														<div>
															<p class="text-sm font-medium text-gray-900">
																{concept.concept_name}
															</p>
															<p class="text-xs text-gray-500">
																ID: {concept.concept_id} | {concept.domain_id} | {concept.vocabulary_id}
																| {concept.concept_class_id}
															</p>
														</div>
														<button
															class="rounded bg-blue-100 px-2 py-1 text-xs font-medium {editingConceptSet.items.some(
																(item: any) => item.concept_id === concept.concept_id
															)
																? 'bg-green-100 text-green-600 hover:bg-green-200'
																: 'text-blue-600 hover:bg-blue-200'}"
															on:click={() => addConcept(concept)}
															disabled={editingConceptSet.items.some(
																(item: any) => item.concept_id === concept.concept_id
															)}
														>
															{#if editingConceptSet.items.some((item: any) => item.concept_id === concept.concept_id)}
																Added
															{:else}
																Add
															{/if}
														</button>
													</div>
												</li>
											{/each}
										</ul>
									</div>

									<!-- Pagination controls -->
									<div class="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
										<div class="text-xs text-gray-500">
											Showing {currentPage * pageSize + 1}-{Math.min(
												(currentPage + 1) * pageSize,
												totalResults
											)} of {totalResults} results
										</div>
										<div class="flex items-center space-x-2">
											<button
												class="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
												on:click={prevPage}
												disabled={currentPage === 0 || isSearching}
											>
												Previous
											</button>
											<span class="text-xs text-gray-500"
												>Page {currentPage + 1} of {totalPages || 1}</span
											>
											<button
												class="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
												on:click={nextPage}
												disabled={currentPage >= totalPages - 1 || isSearching}
											>
												Next
											</button>
										</div>
									</div>
								</div>
							{:else if searchQuery}
								<div class="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow">
									<p class="text-center text-sm text-gray-500">No results found.</p>
								</div>
							{/if}
						</div>

						<!-- 뒤로 가기 버튼 -->
						<div class="mt-4 flex justify-end">
							<button
								class="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
								on:click={() => changeTab('edit')}
							>
								Back to Edit
							</button>
						</div>
					</div>
				{/if}

				<!-- 가져오기 탭 -->
				{#if activeTab === 'import'}
					<div class="grid grid-cols-1 gap-6">
						<div>
							<h3 class="mb-3 text-base font-medium text-gray-700">Import Concept Set from JSON</h3>
							<p class="mb-4 text-sm text-gray-600">
								Upload a JSON file containing a concept set definition.
							</p>

							<input
								type="file"
								accept=".json"
								class="block w-full text-sm text-gray-500 file:mr-4 file:rounded file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
								on:change={importFromJson}
							/>
						</div>
					</div>
				{/if}

				<!-- 내보내기 탭 -->
				{#if activeTab === 'export' && editingConceptSet}
					<div class="grid grid-cols-1 gap-6">
						<div>
							<h3 class="mb-3 text-base font-medium text-gray-700">Export Concept Set as JSON</h3>
							<p class="mb-4 text-sm text-gray-600">
								Download the current concept set as a JSON file that can be imported later.
							</p>

							<button
								class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
								on:click={exportToJson}
							>
								Download JSON
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
