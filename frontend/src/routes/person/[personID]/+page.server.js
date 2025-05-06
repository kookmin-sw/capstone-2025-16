export async function load({fetch, params}) {
    const res = await fetch(`/api/persondata/${params.personID}`);
    const personInfo = await res.json();
    
    const res2 = await fetch(`/api/visitdata/${params.personID}`);
    const visitData = await res2.json();

    const res3 = await fetch(`/api/personstatistics/${params.personID}`)
    const personStatistics = await res3.json();

    return { personInfo, visitData, personStatistics };
}
