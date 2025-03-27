<script>
    import DataTable from "$lib/components/DataTable.svelte";

    export let data = [];
    export let domainKey = 'drug';
    export let orderedCohorts = [];
    export let cohortTotalCounts = {};
    export let cohortColorMap = {};

    const headers = [
        "No.",
        domainKey === 'drug' ? 'Drug Name' : domainKey.charAt(0).toUpperCase() + domainKey.slice(1),
        ...orderedCohorts
    ];

    const rows = data.map((item, index) => {
        const row = {
        "No.": index + 1,
        [headers[1]]: item[domainKey]
        };

        orderedCohorts.forEach(cohort => {
        const value = +item[cohort];
        const total = +cohortTotalCounts[cohort];
        row[cohort] = total ?
            `${value.toLocaleString()} (${((value / total) * 100).toFixed(2)}%)` :
            value.toLocaleString();
        });

        return row;
    });
</script>

<DataTable
    data={{ headers, rows }}
    colorMap={cohortColorMap}
    class="w-full h-full overflow-auto"
/>