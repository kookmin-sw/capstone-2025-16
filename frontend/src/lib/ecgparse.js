
export async function xmlParseToJson(path) {
    const response = await fetch(path);
    const text = await response.text();
    const xml = new DOMParser().parseFromString(text, 'application/xml');

    const waveformElements = Array.from(xml.getElementsByTagName("Waveform"));

    const getText = (tagName, parent) =>
        parent.getElementsByTagName(tagName)[0]?.textContent || null;

    const results = waveformElements.map(waveform => {
        const leadDataElements = Array.from(waveform.getElementsByTagName("LeadData"));
        const leadData = leadDataElements.map(lead => ({
            LeadSampleCountTotal: getText("LeadSampleCountTotal", lead),
            LeadAmplitudeUnitsPerBit: getText("LeadAmplitudeUnitsPerBit", lead),
            LeadID: getText("LeadID", lead),
            WaveFormData: getText("WaveFormData", lead)
        }));

        return {
            WaveformType: getText("WaveformType", waveform),
            NumberOfLeads: getText("NumberOfLeads", waveform),
            SampleBase: getText("SampleBase", waveform),
            LeadData: leadData
        };
    });

    return results;
}
