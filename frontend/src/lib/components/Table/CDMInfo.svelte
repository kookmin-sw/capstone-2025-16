<script>
  export let visitOccurrence;
  export let careSite;
  export let location;
</script>

<div class="visit-container">
  <h2 class="title">Visit & Care Site Information</h2>
  <div class="visit-row">
    <div class="visit-info">
      <span class="info"><strong>Visit ID:</strong> {visitOccurrence.visit_occurrence_id}</span>
      <span class="info"><strong>Visit Dates:</strong> {visitOccurrence.visit_start_date} ~ {visitOccurrence.visit_end_date}</span>
      <span class="info"><strong>Concept ID:</strong> {visitOccurrence.concept_name}</span>
    </div>
    <div class="care-info">
      <span class="info"><strong>Care Site:</strong> {careSite?.care_site_name ? careSite?.care_site_name : "No data"}</span>
      <span class="info"><strong>Address:</strong> {location ? `${location?.address_1}, ${location?.address_2} / ${location?.zip}` : "No data"}</span>
    </div>
  </div>
</div>


<style>
  .visit-container {
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
    text-align: center;
  }

  .visit-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    border-bottom: 1px solid #ddd;
    background: #fff;
    border-radius: 8px;
    box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.1);
  }

  .visit-info, .care-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 8px;
    min-width: 280px; /* 최소 너비 설정 */
  }

  .info {
    font-weight: normal;
    font-size: 1rem;
    margin-bottom: 6px;
  }

  /* 반응형 조정 */
  @media (max-width: 768px) {
    .visit-row {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
