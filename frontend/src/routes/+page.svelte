<script>
  import { page } from "$app/stores";
  import Footer from "$lib/components/Footer.svelte";
</script>

<div class="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-[80px] relative overflow-hidden">
  <!-- 배경 로고 -->
  <div class="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] opacity-[0.05] pointer-events-none">
    <svg 
      class="w-[720px] h-[720px]" 
      viewBox="130 130 340 340"
      fill="none">
      <path 
        fill="#2463eb"
        d="M269.21,189.19h-10.93c-1.39,0-2.52,1.13-2.52,2.52v14.68h-14.68c-1.39,0-2.52,1.13-2.52,2.52v10.93c0,1.39,1.13,2.52,2.52,2.52h14.68v13.45c0,1.39,1.13,2.52,2.52,2.52h10.93c1.39,0,2.52-1.13,2.52-2.52v-13.45h14.68c1.39,0,2.52-1.13,2.52-2.52v-10.93c0-1.39-1.13-2.52-2.52-2.52h-14.68v-14.68c0-1.39-1.13-2.52-2.52-2.52Z" 
      />
      <path 
        fill="#155dfc"
        d="M301.84,137.49c-65.8,0-119.55,52.12-119.81,116.18l12.29,.05c.24-57.32,48.47-103.95,107.52-103.95,9.11,0,17.96,1.11,26.42,3.19v109.95h-37.09c-4.22,0-8.27,1.56-11.41,4.38l-18.25,16.43-18.25-16.43c-3.14-2.82-7.19-4.38-11.41-4.38h-35.17c-1.7-2.93-4.87-4.92-8.5-4.92-5.42,0-9.83,4.41-9.83,9.83s4.41,9.83,9.83,9.83c3.63,0,6.8-1.98,8.5-4.92h35.18c1.79,0,3.5,.66,4.83,1.86l24.83,22.35,24.83-22.35c1.33-1.2,3.04-1.85,4.83-1.85h118.2v53.05c0,25.17-9.23,48.3-24.58,66.34v-27.23c0-2.71-2.2-4.92-4.92-4.92s-4.92,2.2-4.92,4.92v37.34c-1.6,1.44-3.23,2.84-4.92,4.18v-53.81c0-2.71-2.2-4.92-4.92-4.92s-4.92,2.2-4.92,4.92v60.79c-2,1.26-4.05,2.46-6.14,3.59v-82.81c0-2.71-2.2-4.92-4.92-4.92s-4.92,2.2-4.92,4.92v87.52c-1.62,.68-3.26,1.32-4.92,1.92v-109.1c0-2.71-2.2-4.92-4.92-4.92s-4.92,2.2-4.92,4.92v112.14c-8.83,2.28-18.09,3.5-27.65,3.5-42.35,0-79.05-23.89-96.57-58.51,13.95-.03,27.63,1.41,40.73,4.28,15.92,3.49,27.19,8.22,37.13,12.39,11.07,4.64,21.74,10,31.71,15.94,1.01,.6,2.15,.9,3.3,.9s2.2-.28,3.19-.84c2-1.14,3.24-3.27,3.24-5.57v-69.49c0-2.71-2.2-4.92-4.92-4.92s-4.92,2.2-4.92,4.92v63.58c-8.86-4.99-18.19-9.55-27.81-13.58-9.81-4.12-22.03-9.24-38.82-12.92-15.15-3.32-31-4.8-47.16-4.44-4.29-11.26-6.64-23.42-6.64-36.11v-44.45h-12.29v44.45c0,64.33,53.75,116.66,119.81,116.66s119.81-52.33,119.81-116.66v-71.65c0-64.33-53.75-116.66-119.81-116.66ZM340.55,262.92v-106.14c40.22,15.12,68.82,53.06,68.82,97.37v8.77h-68.82Z" 
      />
    </svg>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
    <div class="text-center">
      <div class="flex justify-center items-center mb-6">
        <h1 class="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
          Welcome to <span class="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">Bento</span>
        </h1>
      </div>
      <p class="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
        Explore and analyze your CDM data with powerful cohort analysis tools
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
      <!-- Cohort Builder Card -->
      <a href="/cohort" class="group">
        <div class="bg-white rounded-lg shadow-md p-6 h-full hover:shadow-lg transition-shadow border border-gray-100">
          <div class="text-4xl mb-4">
            👥
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            Cohort Builder
          </h3>
          <p class="text-gray-600">
            Create and manage cohorts with an intuitive interface. Define inclusion/exclusion criteria and build complex patient groups.
          </p>
        </div>
      </a>

      <!-- CDM Viewer Card -->
      <a href="/cohort" class="group">
        <div class="bg-white rounded-lg shadow-md p-6 h-full hover:shadow-lg transition-shadow border border-gray-100">
          <div class="text-4xl mb-4">
            🔍
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            CDM Viewer
          </h3>
          <p class="text-gray-600">
            Browse and analyze your Common Data Model (CDM) data. Explore concept sets and understand your data structure.
          </p>
        </div>
      </a>

      <!-- Cohort Statistics Card -->
      <a href="/custom-chart" class="group">
        <div class="bg-white rounded-lg shadow-md p-6 h-full hover:shadow-lg transition-shadow border border-gray-100">
          <div class="text-4xl mb-4">
            📊
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            Custom Chart
          </h3>
          <p class="text-gray-600">
            Create and manage custom charts with an intuitive interface. Visualize and compare medical data across different cohorts, and export chart results as images.
          </p>
        </div>
      </a>
    </div>

    <!-- Info and Guide Section -->
    <div class="mt-20 text-center">
      <h2 class="text-xl font-semibold text-gray-600 mb-8">Need more information?</h2>
      <div class="flex flex-col md:flex-row gap-6 justify-center">
        <a href="https://kookmin-sw.github.io/capstone-2025-16" class="group relative inline-flex items-center justify-center px-8 py-3 overflow-hidden rounded-full bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
          <span class="relative flex items-center gap-2">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            About Bento
          </span>
        </a>
        <a href="/guide" class="group relative inline-flex items-center justify-center px-8 py-3 overflow-hidden rounded-full bg-white border border-blue-200 text-blue-600 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-blue-300 hover:scale-105">
          <span class="relative flex items-center gap-2">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            User Guide
          </span>
        </a>
      </div>
    </div>
  </div>
</div>
<Footer />