export async function load({ fetch, params }) {
    const res = await fetch(`/api/userdata/${params.cohortID}`); // ✅ SSR에서도 문제없이 실행
    const userData = await res.json();
    return { userData };
}