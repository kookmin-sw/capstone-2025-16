<script>
    import { goto } from "$app/navigation";
    import { tick } from 'svelte';
    import { slide } from 'svelte/transition';
    import GroupedBarChart from '$lib/components/Charts/GroupedBarChart/GroupedBarChart.svelte';
    import { dndzone } from 'svelte-dnd-action';
    import ChartCard from "$lib/components/ChartCard.svelte";
    import BoxPlot from '$lib/components/Charts/BoxPlot/BoxPlot.svelte';
    import domtoimage from 'dom-to-image';

    const targetSetData = {
        statistics_id: "10001",
        name: "Custom Target Set 1",
        description: "Description for Custom Chart Set",
        cohort_ids: "100001,100002,100003",
        person_id: null,
        author : "Dr. Kim",
        createdAt: "2024/01/10 10:00",
        updatedAt: "2024/01/10 10:00",
    }

    // cohort_ids 문자열을 배열로 변환
    const cohortIds = targetSetData.cohort_ids.split(',');
    const cohortNames = ["Cohort 1", "Cohort 2", "Cohort 3"]; // API 연동 시 코호트 이름 받아와야 함

    let chartData = {
        "charts": [
            {
                "chart_id": "20002",
                "statistics_id": "10001",
                "name": "Custom Chart 2",
                "description": "Description for Custom Chart 2",
                "type": "bar",
                "definition": {
                    "groups": [
                        {
                            "name": "Group 1",
                            "definition": {
                                "conceptsets": [],
                                "initialGroup": {
                                    "containers": [
                                        {
                                            "name": "Measurement",
                                            "filters": [
                                                {
                                                    "type": "measurement"
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        },
                        {
                            "name": "Group 2",
                            "definition": {
                                "conceptsets": [],
                                "initialGroup": {
                                    "containers": [
                                        {
                                            "name": "Measurement",
                                            "filters": [
                                                {
                                                    "type": "measurement"
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    ]
                },
                "result": [
                    {
                        "cohortId": "100001",
                        "values": [10,20]
                    },
                    {
                        "cohortId": "100002",
                        "values": [30,40]
                    },
                    {
                        "cohortId": "100003",
                        "values": [50,60]
                    }
                ],
                "author": "Dr. Kim",
                "created_at": "2024-01-10 10:00:00.000",
                "updated_at": "2024-01-10 10:00:00.000"
            },
            {
                "chart_id": "20003",
                "statistics_id": "10001",
                "name": "Custom Chart 3",
                "description": "Description for Custom Chart 3",
                "type": "boxplot",
                "definition": {
                    "groups": [
                        {
                            "name": "Group 1",
                            "definition": {
                                "conceptsets": [],
                                "initialGroup": {
                                    "containers": [
                                        {
                                            "name": "Measurement",
                                            "filters": [
                                                {
                                                    "type": "measurement"
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        },
                        {
                            "name": "Group 2",
                            "definition": {
                                "conceptsets": [],
                                "initialGroup": {
                                    "containers": [
                                        {
                                            "name": "Measurement",
                                            "filters": [
                                                {
                                                    "type": "measurement"
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    "countBy": {
                        "concept": "21490888"
                    }
                },
                "result": [
                    {
                        "cohortId": "100001",
                        "values": [
                            [
                                { "type": "minimum", "value": 1 },
                                { "type": "maximum", "value": 10 },
                                { "type": "median", "value": 5 },
                                { "type": "lower", "value": 3 },
                                { "type": "upper", "value": 7 },
                                { "type": "outlier", "value": 0.5 },
                                { "type": "outlier", "value": 12 }
                            ],
                            [
                                { "type": "minimum", "value": 2 },
                                { "type": "maximum", "value": 20 },
                                { "type": "median", "value": 10 },
                                { "type": "lower", "value": 5 },
                                { "type": "upper", "value": 15 },
                                { "type": "outlier", "value": 1 },
                                { "type": "outlier", "value": 25 }
                            ],
                        ]
                    },
                    {
                        "cohortId": "100002",
                        "values": [
                            [
                                { "type": "minimum", "value": 0 },
                                { "type": "maximum", "value": 5 },
                                { "type": "median", "value": 2.5 },
                                { "type": "lower", "value": 1 },
                                { "type": "upper", "value": 4 },
                                { "type": "outlier", "value": -1 },
                                { "type": "outlier", "value": 6 }
                            ],
                            [
                                { "type": "minimum", "value": 3 },
                                { "type": "maximum", "value": 15 },
                                { "type": "median", "value": 8 },
                                { "type": "lower", "value": 5 },
                                { "type": "upper", "value": 12 },
                                { "type": "outlier", "value": 2 },
                                { "type": "outlier", "value": 18 }
                            ],
                        ]
                    },
                    {
                        "cohortId": "100003",
                        "values": [
                            [
                                { "type": "minimum", "value": 1 },
                                { "type": "maximum", "value": 10 },
                                { "type": "median", "value": 5 },
                                { "type": "lower", "value": 3 },
                                { "type": "upper", "value": 7 },
                                { "type": "outlier", "value": 0.5 },
                                { "type": "outlier", "value": 12 }
                            ],
                            [
                                { "type": "minimum", "value": 0 },
                                { "type": "maximum", "value": 5 },
                                { "type": "median", "value": 2.5 },
                                { "type": "lower", "value": 1 },
                                { "type": "upper", "value": 4 },
                                { "type": "outlier", "value": -1 },
                                { "type": "outlier", "value": 6 }
                            ],
                        ]
                    }
                ],
            }
        ],
        "total": 2,
        "page": 0,
        "limit": 50
    }
    
    let expandedStates = cohortIds.map(() => false);

    function handleDnd({ detail }) {
        chartData.charts = detail.items.map(item => {
        const { id, ...rest } = item;
        return {
                ...rest,
                chart_id: id  // id → chart_id로 복원
            };
        });
    }

    async function toggleExpand(index) { // 코호트 목록 toggle 펼치거나 접기 위한 함수
        await tick();
        expandedStates[index] = !expandedStates[index];
        expandedStates = [...expandedStates];
    }

    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('클립보드 복사 실패:', err);
        }
    }

    async function exportChartImage(chartId, format = 'png') {
        const chartElement = document.getElementById(`chart-${chartId}`);
        if (!chartElement) {
            console.error(`Chart element not found for id: chart-${chartId}`);
            return;
        }

        try {
            const dataUrl = await domtoimage.toPng(chartElement);
            const link = document.createElement('a');
            link.download = `${chartId}.${format}`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Export error:', error);
        }
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
                {#each cohortIds as id, index}
                    <button 
                        class="w-full flex items-center justify-between px-3 py-2 bg-white rounded-lg border hover:bg-blue-50 transition-colors group"
                        onclick={() => goto(`/cohort/${id}`)}
                    >
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-1">
                                <span class="text-[10px] font-medium text-gray-400 truncate">{id}</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <div class="text-xs font-medium text-blue-600 break-words whitespace-normal">{cohortNames[index]}</div>
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
                        <span class="text-sm text-black-500">{targetSetData.statistics_id}</span>
                    </div>
                    <div class="text-blue-600 font-medium">Custom Target Set 1</div>
                </div>
            </div>
            
            <div class="p-4 overflow-y-auto">
                <div class="grid grid-cols-3 gap-4 text-sm">
                    <div>
                        <p class="text-gray-500">Author</p>
                        <p class="font-medium">{targetSetData.author}</p>
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

<div use:dndzone={{ items: chartData.charts.map(chart => ({
                        ...chart,
                        id: chart.chart_id  // chart_id를 id로 복사
                    })),
                    flipDurationMs: 300,
                    dropTargetStyle: {
                        backgroundColor: 'transparent',
                        border: 'none'
                    },
                }}
                onconsider={handleDnd}
                onfinalize={handleDnd}
                class="space-y-2 py-4 px-10"
                >
    {#each chartData.charts as chart, index (chart.chart_id)}
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
                        <span class="text-xs font-medium text-gray-400 truncate">{chart.chart_id}</span>
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
                        if(confirm(`"${chart.name}" 차트를 삭제하시겠습니까?`)) {
                            chartData.charts = chartData.charts.filter((_, i) => i !== index);
                        }
                    }}
                >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                </button>
                <button 
                    aria-label="export chart image"
                    class="absolute top-2 right-10 p-1.5 rounded-full hover:bg-green-50 text-gray-400 hover:text-green-500 transition-colors"
                    onclick={(e) => {
                        e.stopPropagation();
                        exportChartImage(chart.chart_id, 'png'); // png or 'jpeg'
                    }}
                >
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
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
                        description="Visualize and compare data across different targets and groups"
                        hasXButton = {false}
                        height="400px"
                    >
                        <div id={"chart-"+chart.chart_id} class="w-full h-full flex items-center justify-center">
                            {#if chart.type === "boxplot"}
                                <BoxPlot data={chart} />
                            {:else}
                                <GroupedBarChart data={chart} />
                            {/if}
                        </div>
                    </ChartCard>
                </div>
                <div class="p-4 border-t mt-5">
                    <h4 class="text-md font-medium text-gray-700 mb-3">Chart Definition</h4>
                    {#each chart.definition.groups as group, index}
                        <div class="mb-4 last:mb-0">
                            <div class="flex items-center justify-between mb-2">
                                <h5 class="text-sm font-medium text-blue-600">{group.name}</h5>
                                <button 
                                    class="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors flex items-center gap-1"
                                    onclick={() => copyToClipboard(JSON.stringify(group.definition, null, 2))}
                                >
                                    <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                    Copy
                                </button>
                            </div>
                            <pre class="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(group.definition, null, 2)}</pre>
                        </div>
                    {/each}
                </div>
            </div>
          {/if}
        </div>
    {/each}
</div>