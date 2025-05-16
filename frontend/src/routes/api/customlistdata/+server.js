import { PUBLIC_API_URI } from '$env/static/public';

export async function GET(event) {
    const res = await event.fetch(`${PUBLIC_API_URI}/statistics/`);
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
