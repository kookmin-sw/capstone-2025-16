<script>
  export let drugExposure;
</script>

<div class="flex flex-col bg-white border border-gray-300 rounded-lg shadow-md p-6 relative mb-1 w-full">
  <h2 class="title">Drug Information</h2>

  <!-- Drug Era (약물 복용 기록) -->
  <!-- {#each drugEra as era}
    <div class="drug-row">
      <span class="info"><strong>Drug Era ID:</strong> {era.drug_era_id}</span>
      <span class="divider">|</span>
      <span class="info"><strong>Duration:</strong> {era.drug_era_start_date} ~ {era.drug_era_end_date}</span>
      <span class="divider">|</span>
      <span class="info"><strong>Exposure Count:</strong> {era.drug_exposure_count}회</span>
      <span class="divider">|</span>
      <span class="info"><strong>Gap Days:</strong> {era.gap_days}일</span>
    </div>
  {/each} -->

  <!-- Drug Exposure (약물 투여 기록) -->
  {#if drugExposure && drugExposure.length > 0}
    <table class="drug-table w-full border border-gray-200 text-sm text-left">
      <thead class="bg-gray-100">
        <tr>
          <th class="px-4 py-2 border-b">Drug Concept ID</th>
          <th class="px-4 py-2 border-b">Exposure Period</th>
          <th class="px-4 py-2 border-b">Quantity</th>
          <th class="px-4 py-2 border-b">Days Supply</th>
        </tr>
      </thead>
      <tbody>
        {#each drugExposure as exposure}
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-2 border-b">{exposure.drug_concept_id}</td>
            <td class="px-4 py-2 border-b">
              {exposure.drug_exposure_start_date} ~ {exposure.drug_exposure_end_date}
            </td>
            <td class="px-4 py-2 border-b">{exposure.quantity}</td>
            <td class="px-4 py-2 border-b">{exposure.days_supply} days</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p class="text-gray-500 text-sm">No drug exposure data available.</p>
  {/if}

  <!-- Drug Strength (약물 성분 및 용량) -->
  <!-- {#each drugStrength as strength}
    <div class="drug-row strength">
      <span class="info"><strong>Ingredient ID:</strong> {strength.ingredient_concept_id}</span>
      <span class="divider">|</span>
      <span class="info"><strong>Total Amount:</strong> {strength.amount_value} mg</span>
      <span class="divider">|</span>
      <span class="info"><strong>Concentration:</strong> {strength.numerator_value} / {strength.denominator_value}</span>
    </div>
  {/each} -->
</div>

<style>
  .title {
    font-size: 1.3rem;
    font-weight: bold;
    margin-bottom: 10px;
  }
</style>
