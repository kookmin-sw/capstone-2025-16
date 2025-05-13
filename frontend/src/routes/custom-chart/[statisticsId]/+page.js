async function load({ params }) {
    const { statisticsId } = params;
    const response = await fetch(`/api/statistics/${statisticsId}`);
    const data = await response.json();
    return { data };
}
