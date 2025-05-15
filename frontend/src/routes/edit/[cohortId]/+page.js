export async function load({ params }) {
    const response = await fetch(`https://bento.kookm.in/api/cohort/${params.cohortId}`).then(res => res.json());
    response.cohort_definition = JSON.parse(response.cohort_definition);
    return {
        cohort: response,
    };
}