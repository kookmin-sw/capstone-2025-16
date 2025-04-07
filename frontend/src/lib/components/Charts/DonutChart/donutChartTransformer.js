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

    const headers = ["Category", ...dataArray.map(d => d.cohortName || "Value")];

    const rows = categories.map(category => {
        const row = { "Category": category };

        dataArray.forEach(cohort => {
            if (cohort.cohortName) {
                // 코호트가 있는 경우 기존 로직대로 처리
                const value = cohort.data[category] || 0;
                const percent = ((value / cohort.totalPatients) * 100).toFixed(2);
                row[cohort.cohortName] = `${value.toLocaleString()} (${percent}%)`;
            } else {
                // 단일 환자의 경우 모든 데이터 합산
                const totalValue = Object.values(cohort.data).reduce((sum, val) => sum + val, 0);
                const value = cohort.data[category] || 0;
                const percent = ((value / totalValue) * 100).toFixed(2);
                row["Value"] = `${value.toLocaleString()} (${percent}%)`;
            }
        });
        
        return row;
    });

    return { headers, rows };
}