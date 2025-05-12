<script>
    import { goto } from "$app/navigation";
    import { onMount, tick } from 'svelte';
    import { page } from "$app/stores";
    import { slide } from 'svelte/transition';
    import GroupedBarChart from '$lib/components/Charts/GroupedBarChart/GroupedBarChart.svelte';
    import { dndzone } from 'svelte-dnd-action';
    import ChartCard from "$lib/components/ChartCard.svelte";
    import LoadingComponent from "$lib/components/LoadingComponent.svelte";
	import { utcDay } from "d3";

    let isLoading = true;
    let chartID = $page.params.chartID;
    let isDragging = false;

    let cumtomInfo = [];
    let targetSetData = [];
    let customChartData = [];
    let expandedStates = [];

    function handleDnd({ detail }) {
        console.log(detail);
        isDragging = true;
        customChartData = Array.isArray(detail.items) ? detail.items : customChartData;
        isDragging = false;
    }

    async function toggleExpand(index) { // 코호트 목록 toggle 펼치거나 접기 위한 함수
        await tick();
        expandedStates[index] = !expandedStates[index];
        expandedStates = [...expandedStates];
    }
    
    onMount(async() => {
        try{
            const res = await fetch(`/api/custominfo/${chartID}`);
            if (!res.ok) {
                throw new Error("Failed to fetch data");
            }
            const data = await res.json();
            cumtomInfo = data;
            const targetID = data.cohort_ids.split(',');
            const result = await Promise.all(
                targetID.map(async(element) => {
                    const res2 = await fetch(`/api/cohortinfo/${element}`);
                    if (!res2.ok) {
                        throw new Error("Failed to fetch data");
                    }
                    return res2.json();
                })
            );

            const res3 = await fetch(`/api/customchart/${chartID}`);
            if (!res3.ok) {
                throw new Error("Failed to fetch data");
            }
            const data3 = await res3.json();
            
            customChartData= data3.charts.map((chart) => ({
                ...chart,
                id:chart.chart_id
            }));
            targetSetData = result;
            expandedStates = targetID.map(() => false)
        } catch(error) {
            console.error("Error loading data:", error);
        } finally {
            isLoading = false;
        }
    });
</script>

{#if isLoading}
    <LoadingComponent />
{:else}
<div class="px-10">
    <div class="w-full h-[200px] border rounded-lg overflow-hidden mb-3 mt-3 flex">
        <!-- 좌측: Custom Target 영역 -->
        <div class="w-[20%] border-r flex flex-col">
            <div class="flex items-center justify-between p-3 bg-gray-50 border-b">
                <div class="text-blue-600 font-medium">Chart Target Set</div>
            </div>
            
            <div class="p-4 overflow-y-auto flex flex-col gap-2">
                {#each targetSetData as id, index}
                    <button 
                        class="w-full flex items-center justify-between px-3 py-2 bg-white rounded-lg border hover:bg-blue-50 transition-colors group"
                        onclick={() => goto(`/cohort/${id.cohort_id}`)}
                    >
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-1">
                                <span class="text-[10px] font-medium text-gray-400 truncate">{id.cohort_id}</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <div class="text-xs font-medium text-blue-600 break-words whitespace-normal">{id.name}</div>
                            </div>
                        </div>
                        <div class="flex items-center text-gray-400 group-hover:text-blue-600">
                            ›
                        </div>
                    </button>
                {/each}
            </div>
        </div>

        <!-- 우측: 상세 정보 영역 -->
        <div class="w-[80%] flex flex-col">
            <div class="flex items-center justify-between p-3 bg-gray-50 border-b">
                <div class="flex items-center gap-4">
                    <div class="font-medium">
                        <span class="text-sm text-gray-400">ID</span>
                        <span class="text-sm text-black-500">{cumtomInfo.statistics_id}</span>
                    </div>
                    <div class="text-blue-600 font-medium">Custom Target Set 1</div>
                </div>
            </div>
            
            <div class="p-4 overflow-y-auto">
                <div class="grid grid-cols-3 gap-4 text-sm">
                    <div>
                        <p class="text-gray-500">Author</p>
                        <p class="font-medium">{cumtomInfo.author}</p>
                    </div>
                    <div>
                        <p class="text-gray-500">Created at</p>
                        <p class="font-medium">{new Date(cumtomInfo.created_at).toLocaleString()}</p>
                    </div>
                    <div class="col-span-3">
                        <p class="text-gray-500">Description</p>
                        <p class="font-medium">{cumtomInfo.description}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div>
    <div class="flex items-center justify-between px-10 pt-4">
        <h3 class="text-lg font-semibold text-gray-800">Custom Charts</h3>
        <div class="flex items-center space-x-2">
            <div class="text-[14px] text-gray-500">Add a new chart for this target</div>
            <button class="bg-blue-600 text-white text-xl w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-700 transition shadow font-medium">
                + 
            </button>
        </div>   
    </div>
</div>

<div use:dndzone={{ items: customChartData,
                    flipDurationMs: 300,
                    dropTargetStyle: {
                        backgroundColor: 'transparent',
                        border: 'none'
                    }
                }}
                onconsider={handleDnd}
                onfinalize={handleDnd}
                class="space-y-2 py-4 px-10"
                >
    {#each customChartData as chart, index (chart.id)}
        <div class="border rounded-lg overflow-hidden bg-white">
            <button 
                class="w-full flex items-center justify-between p-2 hover:bg-gray-50 transition-colors"
                onclick={() => toggleExpand(index)}
            >
                <div class="flex items-start gap-2 min-w-0">
                    <svg 
                        class="w-3 h-3 flex-shrink-0 transform transition-transform {expandedStates[index] ? 'rotate-180' : ''}" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-1">
                            <span class="text-xs font-medium text-gray-400 truncate">{chart.id}</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <div class="text-sm font-medium text-blue-600 break-words whitespace-normal">{chart.name}</div>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0 pr-2">
                    <svg class="w-5 h-5 cursor-move text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </div>
            </button>
          
          {#if expandedStates[index]}
            <div class="p-2 border-t text-sm relative" transition:slide>
                <button 
                    aria-label="custom chart delete button",
                    class="absolute top-2 right-2 p-1.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    onclick={(e) => {
                        e.stopPropagation();
                        if(!isDragging && confirm(`"${chart.name}" 차트를 삭제하시겠습니까?`)) {
                            customChartData = [...customChartData.filter((_, i) => i !== index)];
                        }
                    }}
                >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                </button>

                <div class="space-y-1">
                    <div>
                        <span class="text-gray-500">Author:</span>
                        <span class="font-regular">{chart.author}</span>
                    </div>
                    <div>
                        <span class="text-gray-500">Created at:</span>
                        <span class="font-regular">{chart.created_at}</span>
                    </div>
                    <div>
                        <span class="text-gray-500">Description:</span>
                        <span class="font-regular">{chart.description}</span>
                    </div>
                    <div>
                        <span class="text-gray-500">Chart Type:</span>
                        <span class="font-regular">{chart.type}</span>
                    </div>
                </div>
                <!-- 차트 및 설명 영역 추가 -->
                <div class="pt-4 px-2">
                    <ChartCard 
                        title="Custom Chart"
                        hasXButton = {false}
                    >
                        <div class="w-full h-full flex items-center justify-center">
                            <GroupedBarChart data={chart.result} />
                        </div>
                    </ChartCard>
                </div>
                <div class="p-4 border-t">
                    <p class="text-gray-500">Chart Detail Information will be displayed here.</p>
                </div>
            </div>
          {/if}
        </div>
    {/each}
</div>
{/if}