export async function load({fetch, params}) {
    const res = await fetch(`/api/persondata/${params.person}`);
    const personInfo = await res.json();
    
    const res2 = await fetch(`/api/visitdata/${params.person}`);
    const visitData = await res2.json();

    const res3 = await fetch(`/api/personstatistics/${params.person}`)
    const personStatistics = await res3.json();

    console.log(personInfo);

    return { personInfo, visitData, personStatistics };
}
