import { PUBLIC_API_URI } from '$env/static/public';

export async function load({ params }) {
    const response = await fetch(`${PUBLIC_API_URI}/api/cohort/${params.cohortId}`).then(res => res.json());
    response.cohort_definition = JSON.parse(response.cohort_definition);
    return {
        cohort: response,
    };
}