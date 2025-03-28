<script>
    import analysisData from '$lib/data/singleCohortAnalysisTest.json';
</script>

<div class="p-4">
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

    (코호트 구성에 대한 내용 추가 예정)
</div>