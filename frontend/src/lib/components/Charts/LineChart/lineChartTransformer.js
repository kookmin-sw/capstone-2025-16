/**
LineChart 데이터를 DataTable 형식으로 변환
 * @param {Array} lineChartData - LineChart 컴포넌트의 원본 데이터
 * @returns {Object} DataTable 컴포넌트에서 사용할 수 있는 형식의 데이터
 */

export function transformLineChartToTableData(lineChartData) {
    const labels = [...new Set(lineChartData.map(d => d.label))];
    const series = [...new Set(lineChartData.map(d => d.series))];
    const headers = ["Cohort", ...labels];
    const rows = series.map(seriesName => {
        const row = { Cohort: seriesName };
        labels.forEach(label => {
            const dataPoint = lineChartData.find(
                d => d.label === label && d.series === seriesName
            );
            row[label] = dataPoint ? dataPoint.value : 0;
        });
        
        return row;
    });
    return {
        headers,
        rows
    };
} 