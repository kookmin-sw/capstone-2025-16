import { API_ADDRESS } from "$env/static/private";

export async function load({ fetch }) {
    const res = await fetch(`${API_ADDRESS}/cohort/`); // ✅ SSR에서도 문제없이 실행
    const cohortList = await res.json();
    return { cohortList };
}