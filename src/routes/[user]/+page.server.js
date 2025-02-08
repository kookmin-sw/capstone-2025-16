export async function load({fetch, params}) {
    const res = await fetch("/api/userdata"); // ✅ SSR에서도 문제없이 실행
    const userData = await res.json();
    const user = userData.find((user) => user.id == params.user);
    return { user };
}
