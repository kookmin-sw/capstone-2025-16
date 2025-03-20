<script>
  export let conditionOccurrence;
  export let conditionEra;
</script>

<div class="condition-container">
  <h2 class="title">🩺 Condition Information</h2>

  <span class="info"><strong>🧬 Condition:</strong> {conditionOccurrence[0].condition_concept_id}</span>
  
  {#each conditionOccurrence as cond}
    <div class="condition-row">
      <span class="info"><strong>📌 ID:</strong> {cond.condition_occurrence_id}</span>
      <span class="divider">|</span>
      <span class="info"><strong>🗓 Diagnosis Date:</strong> {cond.condition_start_date} ~ {cond.condition_end_date}</span>
      <span class="divider">|</span>
      <span class="info"><strong>🏥 Visit ID:</strong> {cond.visit_occurrence_id}</span>
      <span class="divider">|</span>
      <span class="info"><strong>📋 Condition Status:</strong> {cond.condition_status_source_value}</span>
    </div>
  {/each}

  {#each conditionEra as era}
    <div class="condition-row era">
      <span class="info"><strong>📌 ID:</strong> {era.condition_era_id}</span>
      <span class="divider">|</span>
      <span class="info"><strong>📆 Era Duration:</strong> {era.condition_era_start_date} ~ {era.condition_era_end_date}</span>
      <span class="divider">|</span>
      <span class="info"><strong>🔢 Occurrence Count:</strong> {era.condition_occurrence_count}회</span>
    </div>
  {/each}
</div>

<style>
  .condition-container {
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

  .condition-row {
    display: flex;
    align-items: center;
    padding: 8px 0;
    font-size: 1rem;
    background: #fff;
    border-bottom: 1px solid #ddd;
    white-space: nowrap;
  }

  .era {
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
