<script>
  export let observation;
</script>

<div class="observation-container">
  <h2 class="title">Observation Information</h2>

  {#each observation as obs}
    <div class="observation-row">
      <span class="info"><strong>Date:</strong> {obs.observation_date}</span>
      <span class="divider">|</span>
      <span class="info"><strong>Concept ID:</strong> {obs.observation_concept_id}</span>
      <span class="divider">|</span>
      <span class="info"><strong>Value:</strong> 
        <span class="highlight">{obs.value_as_string}</span>
      </span>
      <span class="divider">|</span>
      <span class="info"><strong>Visit ID:</strong> {obs.visit_occurrence_id}</span>
    </div>
  {/each}
</div>

<style>
  .observation-container {
    padding: 16px;
    background: #f9f9f9;
    border-radius: 8px;
    border: 1px solid #ddd;
    max-width: 100%;
  }

  .title {
    font-size: 1.3rem;
    font-weight: bold;
    margin-bottom: 10px;
  }

  .observation-row {
    display: flex;
    align-items: center;
    padding: 8px 0;
    font-size: 1rem;
    background: #fff;
    flex-wrap: wrap;
    border-bottom: 1px solid #ddd;
    white-space: nowrap;
  }

  .info {
    font-weight: normal;
    font-size: 1.0rem;
    margin-right: 10px;
  }

  .divider {
    color: #888;
    font-weight: bold;
    margin: 0 10px;
  }

  /* 강조 표시 (예: 흡연자, 비흡연자 등) */
  .highlight {
    color: #d35400;
    font-weight: bold;
  }
</style>
