export async function xmlParse(path) {
    const response = await fetch(path);
    
    if (!response.ok) {
        throw new Error(`Failed to fetch XML: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    
    const xml = new DOMParser().parseFromString(text, 'application/xml');
    return xml;
}