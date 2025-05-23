<script>
  import { onMount, tick } from 'svelte';
  import { slide } from 'svelte/transition';

  const categories = [
    {
      name: "코호트 정의하기",
      children: [
        { guides: [ { title: "코호트 정의하기", steps: [
          { title: "1단계: 코호트 이름 및 설명 입력", content: "코호트의 이름과 설명을 입력하세요.", image: "/guide_images/cohort/cohort-define-1.png" },
          { title: "2단계: 컨셉세트 설정", content: "좌측 사이드바 하단의 Concept Set Manage 버튼을 클릭하여 컨셉세트 모달에서 컨셉세트를 설정하세요.", image: "/guide_images/cohort/cohort-define-2.png" },
          { title: "3단계: 조건 추가", content: "필터링 조건을 걸어 코호트 정의에 추가하세요. 조건을 추가하면 해당 조건에 의해 필터링된 환자수가 표시됩니다.", image: "/guide_images/cohort/cohort-define-3.png" },
          { title: "4단계: 코호트 정의 저장", content: "좌측 상단의 Save 버튼을 클릭하여 코호트 정의를 저장하세요.", image: "/guide_images/cohort/cohort-define-4.png"}
        ] } ] },
        { guides: [ { title: "Cohort AI로 코호트 자동 정의하기", steps: [
          { title: "1단계: Cohort AI 버튼 클릭", content: "코호트 정의 페이지 내 우측 상단에 위치한 Cohort AI 버튼을 클릭하세요. 정의하고자 하는 코호트가 실린 논문을 넣으면 자동으로 코호트 정의를 할 수 있습니다.", image: "/guide_images/cohort/cohort-ai-1.png" },
          { title: "2단계: 논문 Text 입력 혹은 논문 PDF 첨부", content: "Input Text 탭에서 코호트 정의 부분을 Text로 입력하거나 Upload PDF 탭에서 논문 PDF를 그대로 첨부할 수 있습니다.", image: "/guide_images/cohort/cohort-ai-2.png" },
          { title: "3단계: 코호트 생성 시작", content: "모달 내 우측 하단의 Generate Cohort 버튼을 클릭하세요. 잠시 기다리면 코호트 정의가 완료됩니다.", image: "/guide_images/cohort/cohort-ai-3.png" },
          { title: "4단계: 생성된 코호트 정의 적용", content: "AI로 생성된 코호트 정의를 json으로 확인 후 우측 상단의 Apply 버튼을 클릭하세요.", image: "/guide_images/cohort/cohort-ai-4.png" },
          { title: "5단계: 결과 확인", content: "AI가 제안한 코호트 조건이 추가된 내용을 코호트 정의 페이지에서 확인하세요.", image: "/guide_images/cohort/cohort-ai-5.png" }
        ] } ] },
      ]
    },
    {
      name: "단일 코호트 보기",
      children: [
        {
          name: "단일 코호트 보기",
          guides: [
            { title: "단일 코호트 보기", steps: [
              { title: "1단계: 코호트 목록에서 코호트를 클릭", content: "코호트 목록에서 보고자 하는 코호트의 이름을 눌러 코호트 상세 페이지로 이동합니다.", image: "guide_images/cohort/cohort-list.png"},
              { title: "2단계: 코호트 상세 페이지로 이동", content: "코호트 상세 페이지의 상단에서 코호트의 기본 정보를 확인할 수 있으며 좌측에는 코호트 내 환자들의 목록이 있습니다.", image: "guide_images/cohort/single-cohort-page.png" }
            ] },
            { title: "코호트 정의 내용 확인하기", steps: [
              { title: "코호트 정의 내용 확인하기", content: "Definition 탭에서 코호트가 어떻게 정의되어 있는지를 json 형식으로 확인할 수 있습니다. 우측 상단의 Copy 버튼을 누르면 json이 복사됩니다.", image: "guide_images/cohort/cohort-definition.png" }
            ] },
            { title: "코호트 내 주요 Feature 확인하기", steps: [
              { title: "1단계: Features 탭 클릭", content: "단일 코호트 페이지에서 Features 탭을 클릭합니다.", image: "guide_images/single-cohort/feature-extractor/feature-extractor-1.png" },
              { title: "2단계: 학습에 사용할 환자 배수 입력", content: "주요 Feature를 분석하기 위한 학습에 사용할 환자 배수 k를 입력합니다. 코호트 환자 수의 k배에 해당하는 비교군 환자를 PSM으로 나이와 성별이 비슷한 환자들을 구성해 학습에 사용합니다.", image: "guide_images/single-cohort/feature-extractor/feature-extractor-2.png" },
              { title: "3단계: 분석 시작 버튼 클릭", content: "분석 시작 버튼을 클릭하여 학습을 시작합니다. 페이지를 나가도 학습은 계속 진행됩니다.\n준비된 데이터를 랜덤하게 학습/검증용으로 나누어 분류 모델을 학습하고, Shap를 적용해 각 피처의 중요도를 계산합니다. 이 과정을 여러 번 반복해 나온 SHAP 값들의 평균을 내 분석합니다.", image: "guide_images/single-cohort/feature-extractor/feature-extractor-3.png" },
              { title: "4단계: 결과 확인", content: "학습이 완료되면 결과가 표로 나옵니다. Condition과 Procedure 도메인에 대해 influence 값이 높은 top 10 Concept을 확인할 수 있습니다. 각 도메인에 사용된 모델의 F1 Score도 제공됩니다.", image: "guide_images/single-cohort/feature-extractor/feature-extractor-4.png" },
              { title: "5단계: 분석 결과 다운로드", content: "분석 결과를 다운로드 합니다. 다운로드 파일은 코호트 이름과 날짜를 포함한 파일명으로 한 csv 파일로 저장됩니다. 가장 최근의 분석 결과만 기록되기에 이전 분석 기록은 확인할 수 없으므로 필요시 다운로드를 받아야 합니다.", image: "guide_images/single-cohort/feature-extractor/feature-extractor-5.png" }
            ] },
            { title: "코호트 기본 통계 보기", steps: [
              { title: "기본 통계 보기", content: "단일 코호트 페이지에서 Charts 탭을 클릭하면 코호트 기본 통계가 표시됩니다. 차트 혹은 테이블로 확인할 수 있습니다.", image: "guide_images/cohort/cohort-chart.png" },
            ] },
            { title: "코호트 수정하기", steps: [
              { title: "1단계: 우측 상단의 수정 버튼 클릭", content: "우측 상단의 수정 버튼을 클릭합니다.", image: "guide_images/cohort/cohort-edit-1.png" },
              { title: "2단계: 코호트 정의 페이지로 이동", content: "코호트 정의 페이지로 이동하여 코호트 정의를 수정합니다. 완료 시 다시 코호트 상세 페이지로 이동합니다.", image: "guide_images/cohort/cohort-edit-2.png" },
            ] },
            { title: "코호트 복제하기", steps: [
              { title: "1단계: 우측 상단의 복제 버튼 클릭", content: "우측 상단의 복제 버튼을 클릭합니다.", image: "guide_images/cohort/cohort-duplicate-1.png" },
              { title: "2단계: 복제된 코호트의 정의 수정", content: "복제된 코호트의 정의 페이지로 이동합니다. 코호트 이름은 원본 코호트 이름 뒤 Copy가 붙어 추가됩니다. 필요 시 코호트 정의를 추가하거나 수정하여 완료하면 코호트가 생성됩니다.", image: "guide_images/cohort/cohort-duplicate-2.png" },
            ] },
            { title: "코호트 삭제하기", steps: [
              { title: "코호트 삭제하기", content: "우측 상단의 삭제 버튼을 클릭하면 코호트가 삭제되며 코호트 목록으로 페이지가 이동됩니다.", image: "guide_images/cohort/cohort-delete.png" },
            ] },
          ]
        },
        {
          name: "코호트 내 환자 데이터 보기",
          guides: [
            { title: "코호트 내 환자 데이터 보기", steps: [
              { title: "1단계: 환자 ID 선택", content: "코호트 페이지 내 좌측 사이드바의 환자 목록 중 환자 ID를 선택해 환자 통계 페이지로 이동합니다.", image: "guide_images/cohort/cohort-person-select.png" },
              { title: "2단계: 환자 통계 확인", content: "클릭한 ID에 해당하는 환자의 통계를 확인할 수 있습니다.", image: "guide_images/cohort/cohort-person-statistics.png" },
              { title: "3단계: 환자의 특정 CDM 데이터 확인", content: "상단 타임라인에서 특정 방문 기록을 선택하면 해당 방문 기록에 해당하는 CDM 데이터를 확인할 수 있습니다.", image: "guide_images/cohort/cohort-patient-cdm-3.png" },
            ] }
          ]
        }
      ]
    },
    {
      name: "다중 코호트 비교하기",
      children: [
        { guides: [ { title: "다중 코호트 비교하기", steps: [
          { title: "1단계: 비교할 코호트 선택", content: "목록에서 비교할 코호트들을 선택하고, Compare 버튼을 클릭합니다. 2개에서 최대 5개의 코호트를 선택할 수 있습니다.", image: "guide_images/cohort-comparison/cohort-comparison-1.png" },
          { title: "2단계: 다중 코호트 비교 페이지로 이동", content: "다중 코호트 비교 페이지에서 여러 차트를 확인할 수 있습니다. 모든 차트는 테이블로 변환하여 볼 수 있으며, Top 10 차트의 경우 기준 코호트(Anchor Cohort)를 지정하여 Top 10을 확인할 수도 있습니다.", image: "guide_images/cohort-comparison/cohort-comparison-2.png" },
        ] } ] },
      ]
    },
    {
      name: "환자 검색하기",
      children: [
        { guides: [ { title: "검색하기", steps: [
          { title: "1단계: 검색창에 환자의 ID 입력", content: "Person Search 페이지에서 검색창에 환자의 ID를 입력하세요.", image: "guide_images/person-search/person-search-1.png" },
          { title: "2단계: 검색", content: "검색 버튼을 누르면 해당 환자의 정보가 표시됩니다.", image: "guide_images/person-search/person-search-2.png" },
          { title: "3단계: 단일 환자 통계 확인", content: "해당 환자의 타임라인과 기본 통계를 확인할 수 있습니다.", image: "guide_images/person-search/person-search-3.png" },
          { title: "4단계: 개별 CDM 확인", content: "타임라인에서 하나의 방문 기록을 누르면 해당 방문 기록에 해당하는 데이터를 확인할 수 있습니다.", image: "guide_images/person-search/person-search-4.png" }
        ] } ] }
      ]
    },
    {
      name: "커스텀 차트 사용하기",
      children: [
        { name: "커스텀 차트 정의하기", guides: [ { title: "커스텀 차트 정의하기", steps: [
          { title: "1단계: 커스텀 차트 페이지 생성", content: "커스텀 차트 목록에서 새로운 페이지를 생성하기 위해 '+ New Chart Page'버튼을 클릭합니다.", image: "guide_images/custom-chart/custom-chart-new-1.png"},
          { title: "2단계: 커스텀 대상 집합(Target Set) 설정", content: "커스텀의 대상이 될 대상 집합(Target Set)을 선택합니다. 코호트(1~5개) 혹은 단일 환자로 커스텀 대상을 구성할 수 있습니다. Target Set의 이름과 설명도 기입합니다.", image: "guide_images/custom-chart/custom-chart-new-2.png"},
          { title: "3단계: 차트 유형 선택", content: "Bar Chart와 Box Plot 중 시각화하고자 하는 형태의 차트를 선택합니다. 환자 수 혹은 데이터 수를 y축으로 하는 시각화를 할 경우 Bar Chart를, Value 값을 시각화할 경우 Box Plot을 선택합니다.", image: "guide_images/custom-chart/custom-chart-new-3.png"},
          { title: "4단계: 커스텀 차트 정의", content: "커스텀 차트의 이름과 설명을 기입합니다. 시각화하고자 하는 형태로 그룹을 나누고, 코호트 정의를 하듯이 커스텀 차트에도 필터링을 걸어 조건을 추가해줍니다. 모든 정의를 마치면 하단의 '+ Create New Chart' 버튼을 눌러 차트 생성을 완료합니다.", image: "guide_images/custom-chart/custom-chart-new-4.png"},
        ] } ] },
        {
          name: "정의된 커스텀 차트 보기",
          guides: [
            {
              title: "커스텀 차트 보기",
              steps: [
                { title: "1단계: 커스텀 차트 목록 확인", content: "커스텀 차트 목록에서 커스텀 차트를 클릭합니다.", image: "guide_images/custom-chart/custom-chart-1.png" },
                { title: "2단계: 커스텀 차트 상세 페이지 이동", content: "커스텀 차트 상세 페이지에서 차트 이미지를 확인할 수 있습니다.", image: "guide_images/custom-chart/custom-chart-2.png" },
                { title: "3단계: 차트 토글 클릭", content: "차트 토글을 클릭하면 차트 이미지가 표시됩니다.", image: "guide_images/custom-chart/custom-chart-3.png" }
              ]
            },
            { title: "차트 다운로드하기", steps: [
              { title: "차트 다운로드 버튼 클릭", content: "하나의 차트 토글을 열면 우측 상단에 위치한 다운로드 버튼을 클릭합니다. 버튼 클릭 시 png 이미지로 차트 이미지가 다운로드됩니다.", image: "guide_images/custom-chart/custom-chart-download.png" }
            ] },
            { title: "커스텀 차트 삭제하기", steps: [
              { title: "커스텀 차트 삭제하기", content: "하나의 차트 토글을 열면 우측 상단에 위치한 삭제 버튼을 클릭합니다. 버튼 클릭 시 해당 차트가 삭제됩니다.", image: "guide_images/custom-chart/custom-chart-delete.png" },
            ] },
            { title: "동일한 대상으로 커스텀 차트 추가하기", steps: [
              { title: "1단계: 추가 버튼 클릭", content: "우측 중앙의 파란 색 + 버튼을 클릭합니다.", image: "guide_images/custom-chart/custom-chart-add-1.png" },
              { title: "2단계: 차트 커스텀 진행", content: "차트 커스텀 페이지로 이동합니다. 이 페이지에서는 동일한 대상(target)으로 커스텀 차트를 추가할 수 있습니다. 대상은 동일하므로 차트 타입을 선택하는 모달부터 시작합니다.", image: "guide_images/custom-chart/custom-chart-add-2.png" },
              { title: "3단계: 추가된 차트 확인", content: "이전 페이지에서 생성한 차트가 추가된 것을 확인할 수 있습니다.", image: "guide_images/custom-chart/custom-chart-add-3.png" }
            ] }
          ]
        }
      ]
    }
  ];

  // 카테고리 이름 영어 매핑
  const categoryTitleMap = {
    "코호트 정의하기": "Define Cohort",
    "단일 코호트 보기": "View Single Cohort",
    "다중 코호트 비교하기": "Compare Multiple Cohorts",
    "환자 검색하기": "Search Patients",
    "커스텀 차트 사용하기": "Use Custom Charts",
    "코호트 내 환자 CDM 보기": "View Patient CDM in Cohort",
    "커스텀 차트 정의하기": "Define Custom Charts",
    "정의된 커스텀 차트 보기": "View Defined Custom Charts"
  };

  // 네비게이션 토글 상태
  let openCategoryIndexes = new Set();
  let openSubIndexes = new Map(); // 카테고리별로 따로 관리
  let selectedCategoryIdx = 0;
  let selectedSub = null;
  let openGuideIndexes = new Set();
  
  // 단계별 상세 토글 상태 (가이드별로 따로 관리)
  let openStepIndexesMap = new Map();

  function toggleCategory(idx) {
    if (openCategoryIndexes.has(idx)) {
      openCategoryIndexes.delete(idx);
    } else {
      openCategoryIndexes.add(idx);
      selectedCategoryIdx = idx;
    }
    openCategoryIndexes = new Set(openCategoryIndexes);
  }

  function toggleSub(cIdx, sIdx) {
    let subSet = openSubIndexes.get(cIdx) || new Set();
    if (subSet.has(sIdx)) {
      subSet.delete(sIdx);
    } else {
      subSet.add(sIdx);
    }
    openSubIndexes.set(cIdx, subSet);
    openSubIndexes = new Map(openSubIndexes);
  }

  $: if (categories && categories[selectedCategoryIdx]) {
    // 카테고리 변경 시 모든 step을 펼침
    openStepIndexesMap = new Map();
    for (const sub of categories[selectedCategoryIdx].children) {
      if (sub.guides) {
        for (const guide of sub.guides) {
          if (guide.steps && guide.steps.length > 0) {
            openStepIndexesMap.set(
              guide.title,
              new Set(Array.from({ length: guide.steps.length }, (_, i) => i))
            );
          }
        }
      }
    }
  }

  $: if (selectedSub) {
    // selectedSub가 바뀔 때 → 모든 guide index 열기
    if (selectedSub.guides && selectedSub.guides.length > 0) {
      openGuideIndexes = new Set(selectedSub.guides.map((_, idx) => idx));
    } else {
      openGuideIndexes = new Set();
    }
  }

  // 페이지 타이틀 관리
  $: pageTitle = selectedSub 
    ? `${selectedSub.name ? categoryTitleMap[selectedSub.name] || selectedSub.name : categoryTitleMap[categories[selectedCategoryIdx].name] || categories[selectedCategoryIdx].name} - User Guide` 
    : 'User Guide';
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<div class="flex h-screen bg-gray-50 flex-col md:flex-row">
  <!-- 좌측 네비게이션 -->
  <aside class="w-full md:w-72 bg-white border-b md:border-b-0 md:border-r border-gray-200 p-4 md:pt-8 md:pl-6 flex flex-row md:flex-col items-start md:items-stretch gap-8 md:gap-0 overflow-y-auto h-full">
    <nav class="w-full">      
      <h2 class="text-xl font-semibold text-blue-700 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
        Guide
      </h2>      
      <ul class="list-none p-0 w-full">
        {#each categories as cat, cIdx}
          <li>
            <button class="flex items-center w-full px-2 py-2 rounded-lg font-semibold text-gray-900 hover:bg-blue-50 transition-colors" on:click={() => toggleCategory(cIdx)}>
              <span class="flex-1 text-left">{cat.name}</span>
              <svg class="w-5 h-5 ml-2 text-gray-400 transform transition-transform {openCategoryIndexes.has(cIdx) ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </button>
            {#if openCategoryIndexes.has(cIdx)}
              <ul class="ml-4 mt-1 border-l border-gray-100 pl-2">
                {#each cat.children as sub, sIdx}
                  <li>
                    {#if sub.name}
                      <button class="flex items-center w-full px-2 py-1 rounded text-gray-800 hover:bg-blue-50 transition-colors font-medium"
                        on:click={() => {toggleSub(cIdx, sIdx); selectedSub = sub;}}>
                        <span class="flex-1 text-left">{sub.name}</span>
                        <svg class="w-4 h-4 ml-1 text-gray-400 transform transition-transform {openSubIndexes.get(cIdx)?.has(sIdx) ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                      </button>
                      {#if openSubIndexes.get(cIdx)?.has(sIdx)}
                        <ul class="ml-4 mt-1 max-h-60 overflow-y-auto pr-1">
                          {#each sub.guides as guide, gIdx}
                            <button
                              class="text-gray-700 text-sm px-2 py-1 w-full text-left hover:bg-blue-50 rounded"
                              on:click={async () => {
                                selectedSub = sub;
                                await tick();

                                const el = document.getElementById(`guide-${gIdx}`);
                                const container = document.getElementById('guide-scroll-area');

                                if (el && container) {
                                  const yOffset = -80;
                                  const containerTop = container.getBoundingClientRect().top;
                                  const elementTop = el.getBoundingClientRect().top;
                                  const scrollY = elementTop - containerTop + container.scrollTop + yOffset;
                                  container.scrollTo({ top: scrollY, behavior: 'smooth' });
                                }
                              }}
                            >
                              {guide.title}
                            </button>
                          {/each}

                        </ul>
                      {/if}
                    {:else}
                      {#each sub.guides as guide, gIdx}
                        <button
                          class="flex items-center w-full px-2 py-1 rounded text-gray-700 hover:bg-blue-100 transition-colors text-sm"
                          on:click={() => {
                            selectedSub = { name: categories[selectedCategoryIdx].name, guides: sub.guides };
                          }}>
                          {guide.title}
                        </button>
                      {/each}
                    {/if}
                  </li>
                {/each}
              </ul>
            {/if}
          </li>
        {/each}
      </ul>
    </nav>
  </aside>
  <!-- 우측 상세: 카테고리별 전체 가이드/매뉴얼 페이지 -->
  <main id="guide-container" class="flex-1 p-4 md:p-12 flex flex-col overflow-y-auto h-full">
    {#if selectedSub}
      <header class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">{selectedSub.name ?? categories[selectedCategoryIdx].name}</h1>
      </header>
      <section id="guide-scroll-area" class="flex-1 space-y-15 overflow-y-auto">
        {#each selectedSub.guides as guide, gIdx}
          <div class="mb-8" id={"guide-" + gIdx}>
            <button class="text-xl font-semibold text-blue-700 mb-3 flex items-center justify-between w-full text-left cursor-pointer" transition:slide
              on:click={() => {
                if (openGuideIndexes.has(gIdx)) {
                  openGuideIndexes.delete(gIdx);
                } else {
                  openGuideIndexes.add(gIdx);
                }
                openGuideIndexes = new Set(openGuideIndexes);
              }}>
              <span>{guide.title}</span>
              <svg
                class="w-5 h-5 text-gray-400 transform transition-transform {openGuideIndexes.has(gIdx) ? 'rotate-180' : ''}"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
  
            {#if openGuideIndexes.has(gIdx)}
              {#if guide.steps.length === 0}
                <div class="text-gray-400 text-center py-8">아직 매뉴얼이 등록되지 않았습니다.</div>
              {:else}
                <div class="space-y-3">
                  {#each guide.steps as step, idx (idx)}
                    <div class="border rounded-lg bg-white">
                      <div class="w-full flex items-center justify-between px-4 py-3 text-left font-medium text-blue-700 hover:bg-blue-50 rounded-t-lg focus:outline-none">
                        <span>{step.title}</span>
                      </div>
                      <div id={`step-${gIdx}-${idx}`} class="px-6 py-4 border-t text-gray-800 space-y-2">
                        <div>{step.content}</div>
                        {#if step.image}
                          <img src={step.image} alt={step.title} class="rounded-lg border border-gray-200 max-w-full mt-2 shadow-sm" />
                        {/if}
                        {#if step.link}
                          <a href={step.link} class="text-blue-600 underline" target="_blank">관련 링크</a>
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            {/if}
          </div>
        {/each}
      </section>
    {:else}
      <div class="flex flex-1 items-center justify-center text-gray-500 text-lg">
        좌측에서 항목을 선택해주세요.
      </div>
    {/if}
  </main>  
</div>
