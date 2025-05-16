import { redirect } from '@sveltejs/kit';

export async function GET({ fetch }) {

    const response = await fetch('https://bento.kookm.in/api/cohort', {
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