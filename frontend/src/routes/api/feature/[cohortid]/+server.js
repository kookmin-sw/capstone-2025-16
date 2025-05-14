import { API_ADDRESS } from '$env/static/private';

export async function GET({ fetch, params }) {
    const { cohortid } = params;

    const res = await fetch(`${API_ADDRESS}/feature/${cohortid}/`);

    if (!res.ok) {
        return new Response(JSON.stringify({ error: "Failed to Post" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }

    const data = await res.json();

    return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" }
    });
}


export async function POST({ fetch, params, request }) {
    const { cohortid } = params;
    const { k } = await request.json();
    const res = await fetch(`${API_ADDRESS}/feature/${cohortid}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            k: k
        })
    });

    if (!res.ok) {
        return new Response(JSON.stringify({ error: "Failed to Post" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
    return new Response({
        status: res.status,
        headers: { "Content-Type": "application/json" }
    });
}
