<script>
    import { goto } from "$app/navigation";

    const analysisData = {
        id: "200001",
        name: "Metformin Usage in Diabetes Cohort",
        description: "Bar chart displaying the number of patients in the diabetes cohort based on Metformin usage.",
        author: {
            name: "Dr. Kim",
            department: "Endocrinology"
        },
        createdAt: "2024/01/10 10:00",
        totalPatients: 150,
        targetType: "cohort",
        targetID: ["100001", "100002", "100003", "100004", "100005"],
        targetName: ["Diabetes Group", "Hypertension Group", "Respiratory Disease Group", "Asthma Control Cohort", "COVID-19 Recovered Cohort"],
        chartType: "barchart"
    };
</script>

<div class="pl-10 pr-10 flex flex-col md:flex-row gap-4">

    <div class="w-[20%] border rounded-lg overflow-hidden mb-3 mt-3">
        <!-- 상단 정보 -->
        <div class="w-full flex items-center justify-between p-3 bg-gray-50">
            <div class="flex items-center gap-4">
                <div class="text-blue-600 font-medium">Chart Target</div>
                <div class="font-medium">
                    <span class="text-sm text-gray-400">Type</span>
                    <span class="text-sm text-gray-600">{analysisData.targetType}</span>
                </div>
            </div>
        </div>
        
        <!-- 상세 정보 -->
        <div class="p-4 border-t overflow-y-auto max-h-[200px]">
            <div class="flex flex-col gap-2">
                {#each analysisData.targetID as id, index}
                    <button 
                        class="w-full flex items-center justify-between px-3 py-2 bg-white rounded-lg border hover:bg-blue-50 transition-colors group"
                        onclick={() => goto(`/cohort/${id}`)}
                    >
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-1">
                                <span class="text-[10px] font-medium text-gray-400 truncate">{id}</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <div class="text-xs font-medium text-blue-600 break-words whitespace-normal">{analysisData.targetName[index]}</div>
                            </div>
                        </div>
                        <div class="flex items-center text-gray-400 group-hover:text-blue-600">
                            ›
                        </div>
                    </button>
                {/each}
            </div>
        </div>
    </div>

    <div class="w-[80%] border rounded-lg overflow-hidden mb-3 mt-3">
        <!-- 상단 정보 -->
        <div class="w-full flex items-center justify-between p-3 bg-gray-50">
            <div class="flex items-center gap-4">
                <div class="font-medium">
                    <span class="text-sm text-gray-400">ID</span>
                    <span class="text-sm text-black-500">{analysisData.id}</span>
                </div>
                <div class="text-blue-600 font-medium">{analysisData.name}</div>
            </div>
        </div>
        
        <!-- 상세 정보 -->
        <div class="p-4 border-t">
            <div class="grid grid-cols-3 gap-4 text-sm">
                <div>
                    <p class="text-gray-500">Author</p>
                    <p class="font-medium">{analysisData.author.name}</p>
                </div>
                <div>
                    <p class="text-gray-500">Created at</p>
                    <p class="font-medium">{new Date(analysisData.createdAt).toLocaleString()}</p>
                </div>
                <div>
                    <p class="text-gray-500">Chart Type</p>
                    <p class="font-medium">{analysisData.chartType}</p>
                </div>
                <div class="col-span-3">
                    <p class="text-gray-500">Description</p>
                    <p class="font-medium">{analysisData.description}</p>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- 차트 및 설명 영역 추가 -->
<div class="border rounded-lg overflow-hidden mb-8 mt-2 ml-10 mr-10">
    <div class="p-4">
        <h3 class="text-lg font-semibold text-gray-800">Custom Chart</h3>
        <div class="mt-2">
            <!-- 차트 컴포넌트가 들어갈 자리 -->
            <div class="h-80 bg-gray-200 flex items-center justify-center">
                <p class="text-gray-500">Chart will be displayed here.</p>
            </div>
        </div>
    </div>
    <div class="p-4 border-t">
        <p class="text-gray-500">Chart Detail Information will be displayed here.</p>
    </div>
</div>