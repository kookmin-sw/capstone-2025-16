// ecgparse.js

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

        addAugmentedLeads(leadData);
        sortLeadData(leadData);
        console.log(leadData);

        return {
            WaveformType: getText("WaveformType", waveform),
            NumberOfLeads: getText("NumberOfLeads", waveform),
            SampleBase: getText("SampleBase", waveform),
            LeadData: leadData
        };
    });

    return results;
}

function addAugmentedLeads(leadData) {
    const leadI = leadData.find(lead => lead.LeadID === 'I');
    const leadII = leadData.find(lead => lead.LeadID === 'II');
    const leadSampleCountTotal = leadData[0].LeadSampleCountTotal;
    const leadAmplitudeUnitsPerBit = leadData[0].LeadAmplitudeUnitsPerBit;

    if (leadI && leadII) {
        leadData.push(
            { LeadSampleCountTotal: leadSampleCountTotal, LeadAmplitudeUnitsPerBit: leadAmplitudeUnitsPerBit, LeadID: 'aVR', WaveFormData: calculateLeadAVR(leadI, leadII) },
            { LeadSampleCountTotal: leadSampleCountTotal, LeadAmplitudeUnitsPerBit: leadAmplitudeUnitsPerBit, LeadID: 'aVL', WaveFormData: calculateLeadAVL(leadI, leadII) },
            { LeadSampleCountTotal: leadSampleCountTotal, LeadAmplitudeUnitsPerBit: leadAmplitudeUnitsPerBit, LeadID: 'aVF', WaveFormData: calculateLeadAVF(leadI, leadII) }
        );
    }
}

function sortLeadData(leadData) {
    const leadOrder = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];

    leadData.sort((a, b) => {
        const indexA = leadOrder.indexOf(a.LeadID);
        const indexB = leadOrder.indexOf(b.LeadID);

        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;

        return indexA - indexB;
    });
}

function calculateLeadAVR(leadI, leadII) {
    const values1 = decodeBase64ToInt16Array(leadI.WaveFormData);
    const values2 = decodeBase64ToInt16Array(leadII.WaveFormData);
    return encodeInt16ArrayToBase64(values1.map((v, i) => -(v + values2[i]) / 2));
}

function calculateLeadAVL(leadI, leadII) {
    const values1 = decodeBase64ToInt16Array(leadI.WaveFormData);
    const values2 = decodeBase64ToInt16Array(leadII.WaveFormData);
    return encodeInt16ArrayToBase64(values1.map((v, i) => v - (values2[i] / 2)));
}

function calculateLeadAVF(leadI, leadII) {
    const values1 = decodeBase64ToInt16Array(leadI.WaveFormData);
    const values2 = decodeBase64ToInt16Array(leadII.WaveFormData);
    return encodeInt16ArrayToBase64(values2.map((v, i) => v - (values1[i] / 2)));
}

function decodeBase64ToInt16Array(base64) {
    const binary = atob(base64);
    const len = binary.length / 2;
    const int16 = new Int16Array(len);

    for (let i = 0; i < len; i++) {
        const lo = binary.charCodeAt(i * 2);
        const hi = binary.charCodeAt(i * 2 + 1);
        int16[i] = (hi << 8) | lo;
    }

    return Array.from(int16);
}

function encodeInt16ArrayToBase64(int16Array) {
    const binary = String.fromCharCode(...new Uint8Array(new Int16Array(int16Array).buffer));
    return btoa(binary);
}
