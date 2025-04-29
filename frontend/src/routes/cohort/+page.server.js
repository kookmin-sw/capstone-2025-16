export async function load({ fetch }) {
    const res = await fetch('/api/cohortlistdata'); // ✅ SSR에서도 문제없이 실행
    const cohortList = await res.json();
    return { cohortList };
}