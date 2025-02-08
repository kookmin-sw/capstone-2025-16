export async function GET(event) {
    const res = await event.fetch('http://localhost:5173/user-testdata.json'); // ✅ 절대 경로 사용
    if (!res.ok) {
        return new Response(JSON.stringify({ error: "Failed to load data" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }

    const data = await res.json(); // ✅ 데이터를 JSON으로 변환

    return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" }
    });
}
