export async function load({ fetch }) {
    const res = await fetch("/api/userdata"); // ✅ SSR에서도 문제없이 실행
    const userData = await res.json();
    return { userData };
}