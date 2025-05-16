import { PUBLIC_API_URI } from '$env/static/public';
    
self.onmessage = async (event) => {
    const { cohortID } = event.data;

    try {
        const res = await fetch(`${PUBLIC_API_URI}/api/cohort/${cohortID}/statistics/`);
        if (!res.ok) {
            throw new Error('Failed to fetch data');
        }
        const data = await res.json();

        // 데이터를 메인 스레드로 전송
        self.postMessage({ success: true, data });
    } catch (error) {
        self.postMessage({ success: false, error: error.message });
    }
};