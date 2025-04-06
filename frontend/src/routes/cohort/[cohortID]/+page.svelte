<script>
    import analysisData from '$lib/data/singleCohortAnalysisTest.json';
    import Footer from '$lib/components/Footer.svelte';
    let activeTab = 'default';
    const tabs = [
		{ key: 'definition', label: 'Definition' },
		{ key: 'features', label: 'Features' },
		{ key: 'default', label: 'Default Chart' },
		{ key: 'customizable', label: 'Customizable Chart' },
	];
    function switchTab(tab) { // 탭을 바꿀 때 활성 탭 상태 변경 함수
        activeTab = tab;
    }
</script>

<div class="pl-4 pr-4">
    <div class="border rounded-lg overflow-hidden mb-8 mt-3">
        <!-- 상단 정보 -->
        <div class="w-full flex items-center justify-between p-3 bg-gray-50">
            <div class="flex items-center gap-4">
                <div class="font-medium">
                    <span class="text-sm text-gray-400">ID  </span>
                    <span class="text-sm text-black-500">{analysisData.basicInfo.id}</span>
                </div>
                <div class="text-blue-600 font-medium">{analysisData.basicInfo.name}</div>
                <span class="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                    {analysisData.totalPatients}
                </span>
            </div>
        </div>
        
        <!-- 상세 정보 -->
        <div class="p-4 border-t">
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p class="text-gray-500">Author</p>
                    <p class="font-medium">{analysisData.basicInfo.author.name} ({analysisData.basicInfo.author.department})</p>
                </div>
                <div>
                    <p class="text-gray-500">Created at</p>
                    <p class="font-medium">{new Date(analysisData.basicInfo.createdAt).toLocaleString()}</p>
                </div>
                <div class="col-span-2">
                    <p class="text-gray-500">Description</p>
                    <p class="font-medium">{analysisData.basicInfo.description}</p>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="w-full mb-5 border-b border-gray-300">
	<div class="flex">
		{#each tabs as tab}
			<button
				class="tab {activeTab === tab.key ? 'active' : ''}"
				on:click={() => switchTab(tab.key)}
			>
				{tab.label}
			</button>
		{/each}
	</div>
</div>

<div class="pb-10">
    {#if activeTab === 'definition'}
        <div class="p-6">
            코호트 구성 탭 화면
        </div>
    {/if}

    {#if activeTab == 'customizable'}
        <div class="p-6">
            customizable tab 화면
        </div>
    {/if}
</div>

<Footer />

<style>
    .tab {
        padding: 0.75rem 1.5rem;
        margin-right: 1rem;
        cursor: pointer;
        border-bottom: 2px solid transparent;
    }
    
    .tab.active {
        border-bottom: 2px solid #000;
        font-weight: 500;
    }
</style>