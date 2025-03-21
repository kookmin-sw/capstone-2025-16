<script>
  export let measurement;
</script>

<div class="measurement-container">
  <h2 class="title">Measurement Information</h2>

  {#each measurement as measure}
    <div class="measurement-row">
      <span class="info"><strong>Measurement ID:</strong> {measure.measurement_id}</span>
      <span class="divider">|</span>
      <span class="info"><strong>Date:</strong> {measure.measurement_date}</span>
      <span class="divider">|</span>
      <span class="info"><strong>Measurement Concept ID:</strong> {measure.measurement_concept_id}</span>
      <span class="divider">|</span>
      <span class="info"><strong>Value:</strong> 
        <span class="{measure.value_as_number >= measure.range_low && measure.value_as_number <= measure.range_high ? 'normal' : 'abnormal'}">
          {measure.value_as_number}
        </span>
      </span>
      <span class="divider">|</span>
      <span class="info"><strong>Normal Range:</strong> {measure.range_low} - {measure.range_high}</span>
      <span class="divider">|</span>
      <span class="info"><strong>Visit ID:</strong> {measure.visit_occurrence_id}</span>
    </div>
  {/each}
</div>

<style>
  .measurement-container {
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

  .measurement-row {
    display: flex;
    align-items: center;
    padding: 8px 0;
    font-size: 1rem;
    flex-wrap: wrap;
    background: #fff;
    border-bottom: 1px solid #ddd;
    white-space: nowrap;
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

  /* 정상 값 (초록색) */
  .normal {
    color: green;
    font-weight: bold;
  }

  /* 비정상 값 (빨간색) */
  .abnormal {
    color: red;
    font-weight: bold;
  }
</style>
