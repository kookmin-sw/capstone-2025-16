export async function load({fetch, params}) {
    const res = await fetch("/api/visitdata");
    const visitData = await res.json();
    const personVisits = visitData.filter((person) => person.personid == params.person);
    return { personVisits: personVisits ?? [] };
}
