<script>
  import { page } from "$app/stores";
  import Footer from "$lib/components/Footer.svelte";
</script>

<div class="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-[80px]">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl mb-8">
        Welcome to <span class="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">Bento</span>
      </h1>
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
      <a href="/concept-set" class="group">
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
      <a href="/cohort/comparison" class="group">
        <div class="bg-white rounded-lg shadow-md p-6 h-full hover:shadow-lg transition-shadow border border-gray-100">
          <div class="text-4xl mb-4">
            📊
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            Cohort Statistics
          </h3>
          <p class="text-gray-600">
            Compare and analyze cohort statistics with interactive visualizations. Get insights into demographics, conditions, drugs, and more.
          </p>
        </div>
      </a>
    </div>
  </div>
</div>
<Footer />