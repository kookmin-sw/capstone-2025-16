export async function GET({ params }) {
    const { type } = params;
    
    try {
        // 각 타입별 static 파일 경로 매핑
        const fileMap = {
            'topTenDrug': 'http://localhost:5173/topTenDrug-testdata.json',
            'patientAge': 'http://localhost:5173/patientAge-testdata.json',
            'gender': 'http://localhost:5173/gender-testdata.json',
            'deathRatio': 'http://localhost:5173/deathRatio-testdata.json'
        };

        const fileUrl = fileMap[type];
        if (!fileUrl) {
            return new Response(JSON.stringify({ error: '잘못된 데이터 요청' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const response = await fetch(fileUrl);
        const data = await response.json();
        
        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
} 