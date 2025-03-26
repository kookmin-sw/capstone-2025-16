/**
 * DonutChart 데이터를 DataTable 형식으로 변환
 * @param {Array} donutChartData - DonutChart 컴포넌트의 원본 데이터
 * @returns {Object} DataTable 컴포넌트에서 사용할 수 있는 형식의 데이터
 */

export function transformDonutChartToTableData(donutChartData) {
    // 단일 객체일 경우 배열로 변환
    const dataArray = Array.isArray(donutChartData) ? donutChartData : [donutChartData];

    const categories = [...new Set(
        dataArray.flatMap(cohort => Object.keys(cohort.data))
    )];

    const headers = ["Category", ...dataArray.map(d => d.cohortName)];

    const rows = categories.map(category => {
        const row = { "Category": category };

        dataArray.forEach(cohort => {
            const value = cohort.data[category] || 0;
            const percent = ((value / cohort.totalPatients) * 100).toFixed(2);
            row[cohort.cohortName] = `${value.toLocaleString()} (${percent}%)`;
        });
        
        return row;
    });

    return { headers, rows };
}