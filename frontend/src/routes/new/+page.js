import { redirect } from '@sveltejs/kit';
import { PUBLIC_API_URI } from '$env/static/public';
export async function load({ fetch }) {

    const response = await fetch(`${PUBLIC_API_URI}/api/cohort`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: 'Cohort Name',
            description: 'Cohort Description',
            cohortDefinition: {
                conceptsets: [],
                initialGroup: {
                  containers: [
                  ]
                },
                comparisonGroup: {
                  containers: [
                  ]
                }
              },
            temporary: false
        })
    }).then(res => res.json());
    console.log(response);
    return redirect(302, '/edit/' + response.cohortId);
}