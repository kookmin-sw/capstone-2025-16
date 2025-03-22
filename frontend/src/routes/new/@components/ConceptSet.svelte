<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let { conceptSet } = $props();
	conceptSet = conceptSet ?? {};

	let searchTerm = $state('');
	let searchResults = $state([]);
	let selectedConcepts = $state([]);
	let currentView = $state('list'); // "search" 또는 "create" 또는 "list" 또는 "newSet" 상태 추가
	let conceptSets = $state([
		{
			id: 1,
			name: 'Common Diseases',
			description: 'A set of common disease concepts',
			conceptCount: 42,
			lastUpdated: '2023-12-05'
		},
		{
			id: 2,
			name: 'Medications',
			description: 'Medication concepts for prescriptions',
			conceptCount: 156,
			lastUpdated: '2023-11-28'
		},
		{
			id: 3,
			name: 'Vital Signs',
			description: 'Patient vital sign measurement concepts',
			conceptCount: 18,
			lastUpdated: '2023-12-10'
		},
		{
			id: 4,
			name: 'Lab Tests',
			description: 'Laboratory test concepts for diagnostics',
			conceptCount: 87,
			lastUpdated: '2023-11-15'
		},
		{
			id: 5,
			name: 'Procedures',
			description: 'Medical and surgical procedures',
			conceptCount: 64,
			lastUpdated: '2023-12-01'
		}
	]);

	// 새 컨셉 생성 관련 변수
	let newConceptName = $state('');
	let newConceptDescription = $state('');

	// 새 컨셉 창에서 검색 관련 변수
	let createViewSearchTerm = $state('');
	let createViewSearchResults = $state([]);
	let selectedRelatedConcepts = $state([]);

	// 정렬 상태
	let sortField = $state('name');
	let sortDirection = $state('asc');

	// 새 컨셉 세트 관련 변수
	let newConceptSetName = $state('');
	let newConceptSetDescription = $state('');
	let newConceptSetConcepts = $state([]);
	let conceptSearchTerm = $state('');
	let conceptSearchResults = $state([]);

	function handleSave() {
		dispatch('conceptSet', conceptSet);
	}

	function handleCancel() {
		dispatch('cancel');
	}

	function searchConcepts() {
		// 여기에 실제 검색 로직 추가 필요
		// 예시 데이터
		if (searchTerm.trim()) {
			searchResults = [
				{ id: 1, name: searchTerm + ' Related Concept 1', description: 'Description text...' },
				{ id: 2, name: searchTerm + ' Related Concept 2', description: 'Description text...' },
				{ id: 3, name: searchTerm + ' Related Concept 3', description: 'Description text...' }
			];
		} else {
			searchResults = [];
		}
	}

	function switchToCreateView() {
		currentView = 'create';
		newConceptName = '';
		newConceptDescription = '';
		createViewSearchTerm = '';
		createViewSearchResults = [];
		selectedRelatedConcepts = [];
	}

	function switchToListView() {
		currentView = 'list';
	}

	function createNewConcept() {
		if (newConceptName.trim()) {
			// 여기에 실제 컨셉 생성 로직 추가 필요
			const newConcept = {
				id: Date.now(), // 임시 ID
				name: newConceptName,
				description: newConceptDescription,
				relatedConcepts: selectedRelatedConcepts
			};
			selectedConcepts = [...selectedConcepts, newConcept];

			// 개념셋에 추가
			conceptSet.concepts = selectedConcepts;

			// 생성 후 검색 화면으로 돌아가기
			currentView = 'search';
		}
	}

	function selectConceptSet(conceptSetId) {
		// 여기에 컨셉 세트 선택 로직 추가
		console.log('Selected concept set:', conceptSetId);
		// 실제 구현에서는 선택된 컨셉 세트를 로드하고 화면 전환
		currentView = 'search';
	}

	function sortTable(field) {
		if (sortField === field) {
			// 같은 필드를 다시 클릭하면 정렬 방향 전환
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			// 새로운 필드로 정렬하면 오름차순으로 시작
			sortField = field;
			sortDirection = 'asc';
		}

		// 정렬 로직
		conceptSets = [...conceptSets].sort((a, b) => {
			let comparison = 0;
			if (field === 'conceptCount') {
				// 숫자 비교
				comparison = a[field] - b[field];
			} else {
				// 문자열 비교
				comparison = a[field].localeCompare(b[field]);
			}
			return sortDirection === 'asc' ? comparison : -comparison;
		});
	}

	function getSortIcon(field) {
		if (sortField !== field) return ''; // 정렬되지 않은 필드
		return sortDirection === 'asc' ? '↑' : '↓'; // 오름차순/내림차순 아이콘
	}

	function editConceptSet(id) {
		// 컨셉 세트 편집 기능
		console.log('Edit concept set:', id);
		// 여기에 편집 로직 구현
		// 예: 편집 모드로 전환 또는 편집 폼 열기
	}

	function deleteConceptSet(id) {
		// 컨셉 세트 삭제 기능
		console.log('Delete concept set:', id);
		// 여기에 삭제 로직 구현
		// 예: 삭제 확인 대화상자 표시 후 삭제 수행
		if (confirm('Are you sure you want to delete this concept set?')) {
			conceptSets = conceptSets.filter((set) => set.id !== id);
		}
	}

	function switchToSearchView() {
		currentView = 'search';
	}

	function switchToNewConceptSetView() {
		currentView = 'newSet';
		newConceptSetName = '';
		newConceptSetDescription = '';
		newConceptSetConcepts = [];
		conceptSearchTerm = '';
		conceptSearchResults = [];
	}

	function searchAvailableConcepts() {
		// 실제 API 호출 구현 필요
		if (conceptSearchTerm.trim()) {
			conceptSearchResults = [
				{ id: 101, name: conceptSearchTerm + ' Concept 1', description: 'Description for concept 1' },
				{ id: 102, name: conceptSearchTerm + ' Concept 2', description: 'Description for concept 2' },
				{ id: 103, name: conceptSearchTerm + ' Concept 3', description: 'Description for concept 3' }
			];
		} else {
			conceptSearchResults = [];
		}
	}
</script>

<div
	class="fixed inset-0 z-[9999] flex h-screen w-screen flex-col items-center justify-center bg-black/50 backdrop-blur-sm"
>
	<div
		class="flex h-[90%] w-full max-w-[800px] flex-col overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl"
	>
		<div class="mb-8 flex items-center justify-between">
			<h2 class="text-2xl font-bold tracking-tight">Concept Sets</h2>
			<div class="flex gap-2">
				{#if currentView === 'list'}
					<button
						class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-slate-50"
						on:click={handleCancel}
					>
						Cancel
					</button>
					<button
						class="rounded-lg bg-blue-100 px-4 py-2 text-sm font-medium text-blue-500 shadow-sm transition-colors hover:bg-blue-200"
						on:click={handleSave}
					>
						Save
					</button>
				{:else if currentView === 'create'}
					<button
						class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-slate-50"
						on:click={switchToSearchView}
					>
						Back
					</button>
				{/if}
			</div>
		</div>

		{#if currentView === 'list'}
			<!-- 컨셉 세트 목록 화면 (테이블 구조) -->
			<div class="space-y-6">
				<div class="flex items-center justify-between">
					<div class="relative">
						<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="text-slate-400"
								><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg
							>
						</div>
						<input
							type="text"
							placeholder="Search concept sets..."
							class="w-64 rounded-lg border border-slate-200 py-2 pl-10 pr-4 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
						/>
					</div>
					<button
						class="rounded-lg bg-blue-100 px-4 py-2 text-sm font-medium text-blue-500 shadow-sm transition-colors hover:bg-blue-200"
					>
						+ New Concept Set
					</button>
				</div>

				<!-- 테이블 구조 -->
				<div class="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
					<table class="min-w-full divide-y divide-slate-200">
						<thead class="bg-slate-50">
							<tr>
								<th
									scope="col"
									class="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 transition-colors hover:bg-slate-100"
									on:click={() => sortTable('name')}
								>
									<div class="flex items-center space-x-1">
										<span>Name</span>
										<span class="text-blue-500">{getSortIcon('name')}</span>
									</div>
								</th>
								<th
									scope="col"
									class="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 transition-colors hover:bg-slate-100"
									on:click={() => sortTable('description')}
								>
									<div class="flex items-center space-x-1">
										<span>Description</span>
										<span class="text-blue-500">{getSortIcon('description')}</span>
									</div>
								</th>
								<th
									scope="col"
									class="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 transition-colors hover:bg-slate-100"
									on:click={() => sortTable('conceptCount')}
								>
									<div class="flex items-center space-x-1">
										<span>Concepts</span>
										<span class="text-blue-500">{getSortIcon('conceptCount')}</span>
									</div>
								</th>
								<th
									scope="col"
									class="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 transition-colors hover:bg-slate-100"
									on:click={() => sortTable('lastUpdated')}
								>
									<div class="flex items-center space-x-1">
										<span>Updated</span>
										<span class="text-blue-500">{getSortIcon('lastUpdated')}</span>
									</div>
								</th>
								<th
									scope="col"
									class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500"
								>
									Actions
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-200 bg-white">
							{#each conceptSets as conceptSet}
								<tr
									class="cursor-pointer transition-colors hover:bg-slate-50"
									on:click={() => selectConceptSet(conceptSet.id)}
								>
									<td class="whitespace-nowrap px-6 py-4">
										<div class="text-sm font-medium text-slate-900">{conceptSet.name}</div>
									</td>
									<td class="px-6 py-4">
										<div class="max-w-xs truncate text-sm text-slate-500">
											{conceptSet.description}
										</div>
									</td>
									<td class="whitespace-nowrap px-6 py-4">
										<div class="text-sm text-slate-500">{conceptSet.conceptCount}</div>
									</td>
									<td class="whitespace-nowrap px-6 py-4">
										<div class="text-sm text-slate-500">{conceptSet.lastUpdated}</div>
									</td>
									<td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
										<div class="flex justify-end space-x-2">
											<button
												class="rounded px-2 py-1 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
												on:click|stopPropagation={() => editConceptSet(conceptSet.id)}
											>
												Edit
											</button>
											<button
												class="rounded px-2 py-1 text-red-500 hover:bg-red-50 hover:text-red-600"
												on:click|stopPropagation={() => deleteConceptSet(conceptSet.id)}
											>
												Delete
											</button>
										</div>
									</td>
								</tr>
							{:else}
								<tr>
									<td colspan="5" class="px-6 py-10 text-center text-slate-500">
										<div class="flex flex-col items-center justify-center space-y-2">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="24"
												height="24"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
												class="text-slate-300"
											>
												<rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
												<path d="M4 12h16"></path>
											</svg>
											<p>No concept sets found</p>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</div>
</div>
