export async function load({ params }) {
    const response = await fetch(`https://bento.kookm.in/api/cohort/${params.cohortId}`).then(res => res.json());
    response.cohort_definition = JSON.parse(response.cohort_definition);
    
    const countsResponse = await fetch(`https://bento.kookm.in/api/cohort`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: response.name,
            description: response.description,
            cohortDefinition: response.cohort_definition,
            temporary: true
        })
    });
    const counts = await countsResponse.json();
    return {
        cohort: response,
        counts: counts
    };
}