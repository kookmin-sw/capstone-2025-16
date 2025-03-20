<script>
  export let drugEra;
  export let drugExposure;
  export let drugStrength;
</script>

<div class="drug-container">
  <h2 class="title">💊 Drug Information</h2>

  <!-- Drug Era (약물 복용 기록) -->
  {#each drugEra as era}
    <div class="drug-row">
      <span class="info"><strong>📌 Drug Era ID:</strong> {era.drug_era_id}</span>
      <span class="divider">|</span>
      <span class="info"><strong>🗓 Duration:</strong> {era.drug_era_start_date} ~ {era.drug_era_end_date}</span>
      <span class="divider">|</span>
      <span class="info"><strong>💊 Exposure Count:</strong> {era.drug_exposure_count}회</span>
      <span class="divider">|</span>
      <span class="info"><strong>⏳ Gap Days:</strong> {era.gap_days}일</span>
    </div>
  {/each}

  <!-- Drug Exposure (약물 투여 기록) -->
  {#each drugExposure as exposure}
    <div class="drug-row exposure">
      <span class="info"><strong>📌 Drug Exposure ID:</strong> {exposure.drug_exposure_id}</span>
      <span class="divider">|</span>
      <span class="info"><strong>🗓 Exposure Period:</strong> {exposure.drug_exposure_start_date} ~ {exposure.drug_exposure_end_date}</span>
      <span class="divider">|</span>
      <span class="info"><strong>💉 Quantity:</strong> {exposure.quantity}</span>
      <span class="divider">|</span>
      <span class="info"><strong>📅 Days Supply:</strong> {exposure.days_supply}일</span>
    </div>
  {/each}

  <!-- Drug Strength (약물 성분 및 용량) -->
  {#each drugStrength as strength}
    <div class="drug-row strength">
      <span class="info"><strong>🧪 Drug Concept ID:</strong> {strength.drug_concept_id}</span>
      <span class="divider">|</span>
      <span class="info"><strong>🧬 Ingredient ID:</strong> {strength.ingredient_concept_id}</span>
      <span class="divider">|</span>
      <span class="info"><strong>⚖ Total Amount:</strong> {strength.amount_value} mg</span>
      <span class="divider">|</span>
      <span class="info"><strong>📊 Concentration:</strong> {strength.numerator_value} / {strength.denominator_value}</span>
    </div>
  {/each}
</div>

<style>
  .drug-container {
    padding: 16px;
    background: #f9f9f9;
    border-radius: 8px;
    border: 1px solid #ddd;
    max-width: 100%;
  }

  .title {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 10px;
  }

  .drug-row {
    display: flex;
    align-items: center;
    padding: 8px 0;
    flex-wrap: wrap;
    font-size: 1rem;
    background: #fff;
    border-bottom: 1px solid #ddd;
    white-space: nowrap;
  }

  .exposure {
    background: #fff;
  }

  .strength {
    background: #fff;
  }

  .info {
    font-weight: normal;
    font-size: 1.1rem;
    margin-right: 10px;
  }

  .divider {
    color: #888;
    font-weight: bold;
    margin: 0 10px;
  }
</style>
