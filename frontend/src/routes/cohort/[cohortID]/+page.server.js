export async function load({ fetch, params }) {
    const res = await fetch(`/api/cohortinfo/${params.cohortID}`); // ✅ SSR에서도 문제없이 실행
    const cohortinfo = await res.json();

    const res2 = await fetch(`/api/cohortstatistics/${params.cohortID}`); // ✅ SSR에서도 문제없이 실행
    const cohortStatistics = await res2.json();
    return { cohortinfo, cohortStatistics };
}