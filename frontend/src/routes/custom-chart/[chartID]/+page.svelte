<script>
    import { goto } from "$app/navigation";
    import { tick } from 'svelte';
    import { slide } from 'svelte/transition';
    import GroupedBarChart from '$lib/components/Charts/GroupedBarChart/GroupedBarChart.svelte';
    import { dndzone } from 'svelte-dnd-action';


    const targetSetData = {
        id: "10001",
        name: "Custom Target Set 1",
        description: "Description for Custom Chart Set",
        author : {
            name: "Dr. Kim",
            department: "Lab 1"
        },
        createdAt: "2024/01/10 10:00",
        targetID: ["100001", "100002", "100003"],
        targetName: ["Cohort 1", "Cohort 2", "Cohort 3"]
    }

    let customChartData = [
        {
            id: "20001",
            name: "Custom Target 1",
            description: "Description for Custom Chart 1",
            author : {
                name: "Dr. Kim",
                department: "Lab 2"
            },
            createdAt: "2024/01/10 10:00",
            chartType: "Bar Chart",
            chartData : [
                { state: 'California', age: '0-18', population: 5000000 },
                { state: 'California', age: '19-35', population: 7000000 },
                { state: 'California', age: '36-60', population: 6000000 },
                { state: 'Texas', age: '0-18', population: 4000000 },
                { state: 'Texas', age: '19-35', population: 6500000 },
                { state: 'Texas', age: '36-60', population: 5500000 },
            ]
        },
        {
            id: "20002",
            name: "Custom Target 2",
            description: "Description for Custom Chart 2",
            author : {
                name: "Dr. Kim",
                department: "Endocrinology"
            },
            createdAt: "2024/01/10 10:00",
            chartType: "Bar Chart",
            chartData: [
                { target: 'Diabetes Group', age: '0-18', population: 5000000 },
                { target: 'Diabetes Group', age: '19-35', population: 7000000 },
                { target: 'Diabetes Group', age: '36-60', population: 6000000 },
                { target: 'Hypertension Group', age: '0-18', population: 4000000 },
                { target: 'Hypertension Group', age: '19-35', population: 6500000 },
                { target: 'Hypertension Group', age: '36-60', population: 5500000 },
            ]
        },
    ]

    let expandedStates = targetSetData.targetID.map(() => false);

    function handleDnd({ detail }) {
        customChartData = detail.items;
    }

    async function toggleExpand(index) { // 코호트 목록 toggle 펼치거나 접기 위한 함수
        await tick();
        expandedStates[index] = !expandedStates[index];
        expandedStates = [...expandedStates];
    }
</script>

<div class="px-10">
    <div class="w-full h-[200px] border rounded-lg overflow-hidden mb-3 mt-3 flex">
        <!-- 좌측: Custom Target 영역 -->
        <div class="w-[20%] border-r flex flex-col">
            <div class="flex items-center justify-between p-3 bg-gray-50 border-b">
                <div class="text-blue-600 font-medium">Chart Target Set</div>
            </div>
            
            <div class="p-4 overflow-y-auto flex flex-col gap-2">
                {#each targetSetData.targetID as id, index}
                    <button 
                        class="w-full flex items-center justify-between px-3 py-2 bg-white rounded-lg border hover:bg-blue-50 transition-colors group"
                        onclick={() => goto(`/cohort/${id}`)}
                    >
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-1">
                                <span class="text-[10px] font-medium text-gray-400 truncate">{id}</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <div class="text-xs font-medium text-blue-600 break-words whitespace-normal">{targetSetData.targetName[index]}</div>
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
                        <span class="text-sm text-black-500">{targetSetData.id}</span>
                    </div>
                    <div class="text-blue-600 font-medium">Custom Target Set 1</div>
                </div>
            </div>
            
            <div class="p-4 overflow-y-auto">
                <div class="grid grid-cols-3 gap-4 text-sm">
                    <div>
                        <p class="text-gray-500">Author</p>
                        <p class="font-medium">{targetSetData.author.name}</p>
                    </div>
                    <div>
                        <p class="text-gray-500">Created at</p>
                        <p class="font-medium">{new Date(targetSetData.createdAt).toLocaleString()}</p>
                    </div>
                    <div class="col-span-3">
                        <p class="text-gray-500">Description</p>
                        <p class="font-medium">{targetSetData.description}</p>
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
            <div class="p-2 border-t text-sm" transition:slide>
                <div class="space-y-1">
                    <div>
                        <span class="text-gray-500">Author:</span>
                        <span class="font-regular">{chart.author.name} ({chart.author.department})</span>
                    </div>
                    <div>
                        <span class="text-gray-500">Created at:</span>
                        <span class="font-regular">{chart.createdAt}</span>
                    </div>
                    <div>
                        <span class="text-gray-500">Description:</span>
                        <span class="font-regular">{chart.description}</span>
                    </div>
                    <div>
                        <span class="text-gray-500">Chart Type:</span>
                        <span class="font-regular">{chart.chartType}</span>
                    </div>
                </div>
                <!-- 차트 및 설명 영역 추가 -->
                <div class="pt-4">
                    <h3 class="text-lg font-semibold text-gray-800">Custom Chart</h3>
                    <div class="mt-2">
                        <div class="h-80 bg-gray-200 flex items-center justify-center">
                            <p class="text-gray-500">Chart will be displayed here.</p>
                        </div>
                    </div>
                </div>
                <div class="p-4 border-t">
                    <p class="text-gray-500">Chart Detail Information will be displayed here.</p>
                </div>
            </div>
          {/if}
        </div>
    {/each}
</div>