import { API_ADDRESS } from '$env/static/private';

export async function GET(event) {
    const res = await event.fetch(`${API_ADDRESS}/user-testdata.json`);
    if (!res.ok) {
        return new Response(JSON.stringify({ error: "Failed to load data" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }

    const data = await res.json();

    return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" }
    });
}
