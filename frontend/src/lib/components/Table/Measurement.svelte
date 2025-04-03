<script>
  export let measurement;
</script>

<div class="measurement-container">
  <h2 class="title">Measurement Information</h2>

  {#if measurement && measurement.length > 0}
    <table class="measurement-table w-full border border-gray-200 text-sm text-left">
      <thead class="bg-gray-100">
        <tr>
          <th class="px-4 py-2 border-b">Date</th>
          <th class="px-4 py-2 border-b">Concept ID</th>
          <th class="px-4 py-2 border-b">Value</th>
        </tr>
      </thead>
      <tbody>
        {#each measurement as measure}
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-2 border-b">{measure.measurement_date}</td>
            <td class="px-4 py-2 border-b">{measure.measurement_concept_id}</td>
            <td class="px-4 py-2 border-b">
              <span class="{measure.value_as_number >= measure.range_low && measure.value_as_number <= measure.range_high ? 'text-green-600' : 'text-red-600'}">
                {measure.value_as_number}
              </span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p class="text-gray-500 text-sm mb-6">No measurement data available.</p>
  {/if}
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
    font-size: 1.3rem;
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
    font-size: 1.0rem;
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
