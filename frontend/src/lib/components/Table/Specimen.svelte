<script>
  export let specimen;
</script>

<div class="specimen-container">
  <h2 class="title">Specimen Information</h2>

  {#each specimen as spec}
    <div class="specimen-row">
      <span class="info"><strong>Date:</strong> {spec.specimen_date}</span>
      <span class="divider">|</span>
      <span class="info"><strong>Concept ID:</strong> 
        <span class="highlight">{spec.specimen_concept_id}</span>
      </span>
      <span class="divider">|</span>
      <span class="info"><strong>Quantity:</strong> 
        <span class="highlight-blue">{spec.quantity}</span>
      </span>
      <span class="divider">|</span>
      <span class="info"><strong>Unit Concept ID:</strong> {spec.unit_concept_id}</span>
    </div>
  {/each}
</div>

<style>
  .specimen-container {
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

  .specimen-row {
    display: flex;
    align-items: center;
    padding: 8px 0;
    flex-wrap: wrap;
    font-size: 1rem;
    background: #fff;
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

  /* 강조 표시 (Concept ID) */
  .highlight {
    color: #16a34a; /* Tailwind text-green-600 */
    font-weight: bold;
  }

  /* 강조 표시 (Quantity) */
  .highlight-blue {
    color: #2563eb; /* Tailwind text-blue-600 */
    font-weight: bold;
  }
</style>
