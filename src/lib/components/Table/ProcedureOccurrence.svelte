<script>
  export let procedureOccurrence;
</script>

<div class="procedure-container">
  <h2 class="title">Procedure Occurrence</h2>

  {#each procedureOccurrence as proc}
    <div class="procedure-row">
      <span class="info"><strong>Procedure ID:</strong> {proc.procedure_occurrence_id}</span>
      <span class="divider">|</span>
      <span class="info"><strong>Date:</strong> {proc.procedure_date}</span>
      <span class="divider">|</span>
      <span class="info"><strong>Concept ID:</strong> 
        <span class="highlight">{proc.procedure_concept_id}</span>
      </span>
      <span class="divider">|</span>
      <span class="info"><strong>Type Concept ID:</strong> {proc.procedure_type_concept_id ? proc.procedure_type_concept_id : "N/A"}</span>
      <span class="divider">|</span>
      <span class="info"><strong>Quantity:</strong> 
        <span class="highlight-blue">{proc.quantity}</span>
      </span>
      <span class="divider">|</span>
      <span class="info"><strong>Visit ID:</strong> {proc.visit_occurrence_id}</span>
    </div>
  {/each}
</div>

<style>
  .procedure-container {
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

  .procedure-row {
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
    font-size: 1.1rem;
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
