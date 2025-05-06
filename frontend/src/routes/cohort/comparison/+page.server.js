export async function load({ fetch, url }) {
    const cohortIds = url.searchParams.get('cohorts')?.split(',') || [];

    const result = await Promise.all(
        cohortIds.map(async (id) => {
            const res = await fetch(`/api/cohortinfo/${id}`);
            const data = await res.json();

            const res2 = await fetch(`/api/cohortstatistics/${id}`);
            const data2 = await res2.json();

            return {[id] : {basicInfo:data, statistics:data2}};
        })
    );
    const cohortList = Object.assign({}, ...result);

    return { cohortList };
}