import { PUBLIC_API_URI } from '$env/static/public';

export async function GET({ fetch, params }) {
    const { cohortid } = params;
    
    const res = await fetch(`${PUBLIC_API_URI}/cohort/${cohortid}/statistics/`);
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
