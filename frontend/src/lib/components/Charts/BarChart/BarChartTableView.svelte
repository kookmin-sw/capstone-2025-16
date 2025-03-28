<script>
  import DataTable from "$lib/components/DataTable.svelte";
  import { SINGLE_DATA_COLOR } from '$lib/constants.js';
  
  export let data = [];
  export let domainKey;
  export let cohortName = '';
  export let cohortTotalCount = 0;

  const headers = [
    "No.",
    domainKey.charAt(0).toUpperCase() + domainKey.slice(1),
    cohortName
  ];

  const rows = data.map((item, index) => {
    const value = +item.count;
    return {
      "No.": index + 1,
      [headers[1]]: item.name,
      [headers[2]]: cohortTotalCount
        ? `${value.toLocaleString()} (${((value / cohortTotalCount) * 100).toFixed(2)}%)`
        : value.toLocaleString()
    };
  });
</script>

<DataTable
  data={{ headers, rows }}
/>