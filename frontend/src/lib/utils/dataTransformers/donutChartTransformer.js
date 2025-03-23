/**
 * DonutChart 데이터를 DataTable 형식으로 변환
 * @param {Array} donutChartData - DonutChart 컴포넌트의 원본 데이터
 * @returns {Object} DataTable 컴포넌트에서 사용할 수 있는 형식의 데이터
 */

export function transformDonutChartToTableData(donutChartData) {
    console.log('Input data:', donutChartData);
    
    // 1. 모든 가능한 성별 카테고리 수집
    const categories = [...new Set(
        donutChartData.flatMap(cohort => Object.keys(cohort.data))
    )];
    
    // 2. 헤더 생성 ["Category", "코호트1", "코호트2", ...]
    const headers = ["Category", ...donutChartData.map(d => d.cohortName)];
    
    // 3. 각 성별 카테고리별로 행 데이터 생성
    const rows = categories.map(category => {
        const row = { "Category": category };
        
        // 각 코호트의 데이터 추가
        donutChartData.forEach(cohort => {
            const value = cohort.data[category] || 0;
            const percent = ((value / cohort.totalPatients) * 100).toFixed(2);
            row[cohort.cohortName] = `${value.toLocaleString()} (${percent}%)`;
        });
        
        return row;
    });

    return { headers, rows };
}