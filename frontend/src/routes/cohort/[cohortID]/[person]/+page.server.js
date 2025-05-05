export async function load({fetch, params}) {
    const res = await fetch(`/api/persondata/${params.person}`);
    const personInfo = await res.json();
    
    const res2 = await fetch(`/api/visitdata/${params.person}`);
    const visitData = await res2.json();
    
    return { personInfo, visitData };
}
