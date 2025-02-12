export async function load({fetch, params}) {
    const res = await fetch("/api/userdata");
    const userData = await res.json();
    const user = userData.find((user) => user.id == params.user);
    const userId = user.userid;
    const userCdms = userData.filter((user) => user.userid == userId);
    return { user, userCdms };
}
