// ecgparse.js

export async function xmlParseToJson(path) {
    const response = await fetch(path);
    const text = await response.text();
    const xml = new DOMParser().parseFromString(text, 'application/xml');

    const waveformElements = Array.from(xml.getElementsByTagName("Waveform"));

    const getText = (tagName, parent) =>
        parent.getElementsByTagName(tagName)[0]?.textContent || null;

    const results = waveformElements.map(waveform => {
        const waveformType = getText("WaveformType", waveform);
        const leadDataElements = Array.from(waveform.getElementsByTagName("LeadData"));
        let leadData = leadDataElements.map(lead => ({
            LeadSampleCountTotal: getText("LeadSampleCountTotal", lead),
            LeadAmplitudeUnitsPerBit: getText("LeadAmplitudeUnitsPerBit", lead),
            LeadID: getText("LeadID", lead),
            WaveFormData: getText("WaveFormData", lead)
        }));

        addAugmentedLeads(leadData);
        
        if(waveformType === 'Median'){
            sortLeadData(leadData);
        }

        return {
            WaveformType: waveformType,
            NumberOfLeads: getText("NumberOfLeads", waveform),
            SampleBase: getText("SampleBase", waveform),
            LeadData: leadData
        };
    });
    
    console.log(results);
    return results;
}

function addAugmentedLeads(leadData) {
    const leadI = leadData.find(lead => lead.LeadID === 'I');
    const leadII = leadData.find(lead => lead.LeadID === 'II');
    const leadIII = leadData.find(lead => lead.LeadID === 'III' ? lead.LeadID === 'III' : []);
    const leadSampleCountTotal = leadData[0].LeadSampleCountTotal;
    const leadAmplitudeUnitsPerBit = leadData[0].LeadAmplitudeUnitsPerBit;

    if (leadI && leadII) {
        leadData.push(
            { LeadSampleCountTotal: leadSampleCountTotal, LeadAmplitudeUnitsPerBit: leadAmplitudeUnitsPerBit, LeadID: 'aVR', WaveFormData: calculateLeadAVR(leadI, leadII) },
            { LeadSampleCountTotal: leadSampleCountTotal, LeadAmplitudeUnitsPerBit: leadAmplitudeUnitsPerBit, LeadID: 'aVL', WaveFormData: calculateLeadAVL(leadI, leadIII) },
            { LeadSampleCountTotal: leadSampleCountTotal, LeadAmplitudeUnitsPerBit: leadAmplitudeUnitsPerBit, LeadID: 'aVF', WaveFormData: calculateLeadAVF(leadII, leadIII) },
            { LeadSampleCountTotal: leadSampleCountTotal, LeadAmplitudeUnitsPerBit: leadAmplitudeUnitsPerBit, LeadID: 'III', WaveFormData: '' }
        );
    }

    
}

function sortLeadData(leadData) {
    const leadOrder = ['I', 'aVR', 'V1', 'V4', 'II', 'aVL', 'V2', 'V5', 'III', 'aVF', 'V3', 'V6'];
    const leadList1 = ['I', 'aVR', 'V1', 'V4'];
    const leadList2 = ['II', 'aVL', 'V2', 'V5'];
    const leadList3 = ['III', 'aVF', 'V3', 'V6'];

    leadData.sort((a, b) => {
        const indexA = leadOrder.indexOf(a.LeadID);
        const indexB = leadOrder.indexOf(b.LeadID);

        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;

        return indexA - indexB;
    });

    const lead1 = [leadData.filter(lead => leadList1.includes(lead.LeadID))];
    const lead2 = [leadData.filter(lead => leadList2.includes(lead.LeadID))];
    const lead3 = [leadData.filter(lead => leadList3.includes(lead.LeadID))];

    leadData = [];
    console.log(lead1);
    if (lead1) leadData.push(lead1);
    if (lead2) leadData.push(lead2);
    if (lead3) leadData.push(lead3);
}

function calculateLeadAVR(leadI, leadII) {
    const values1 = decodeBase64ToInt16Array(leadI.WaveFormData);
    const values2 = decodeBase64ToInt16Array(leadII.WaveFormData);
    return encodeInt16ArrayToBase64(values1.map((v, i) => -(v + values2[i]) / 2));
}

function calculateLeadAVL(leadI, leadIII) {
    const values1 = decodeBase64ToInt16Array(leadI.WaveFormData);
    const values2 = decodeBase64ToInt16Array(leadIII?.WaveFormData);
    return encodeInt16ArrayToBase64(values1.map((v, i) => v - (values2[i] / 2)));
}

function calculateLeadAVF(leadII, leadIII) {
    const values1 = decodeBase64ToInt16Array(leadII.WaveFormData);
    const values2 = decodeBase64ToInt16Array(leadIII?.WaveFormData);
    return encodeInt16ArrayToBase64(values2.map((v, i) => v - (values1[i] / 2)));
}

function decodeBase64ToInt16Array(base64) {
    if (!base64) return [];
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
