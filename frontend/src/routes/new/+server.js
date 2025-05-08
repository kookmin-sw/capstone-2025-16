import { redirect } from '@sveltejs/kit';

async function GET({ fetch }) {
    const response = await fetch('https://bento.kookm.in/api/cohort', {
        method: 'POST',
        body: JSON.stringify({
            cohortName: 'Cohort Name',
            cohortDescription: 'Cohort Description',
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
    return redirect(302, '/edit/' + response.cohortId);
}