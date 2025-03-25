/**
 * StackedBarChart 데이터를 DataTable 형식으로 변환
 * @param {Array} data - 원본 데이터 (코호트별 도메인 아이템 포함)
 * @param {string} domainKey - 도메인 키 (예: 'drug', 'condition')
 * @param {string} viewType - 뷰 타입 ('combined' 또는 anchor cohort 이름)
 * @returns {{ domainKey: string, viewType: string, transformedData: Array, top10ItemNames: Array, orderedCohorts: Array }}
 */

import * as d3 from "d3";

export function transformTopTenData(data, domainKey, viewType) {

    let orderedCohorts;
    let transformedData;
    let top10ItemNames;

    // 데이터 변환: Top 10 아이템 추출
    $: if (data.length > 0) {
        const cohorts = [...new Set(data.map(d => d.cohort))];
        orderedCohorts = viewType === 'combined' 
        ? cohorts  // combined view에서는 원래 순서 유지
        : [
            viewType,  // anchor 코호트를 첫 번째로
            ...cohorts.filter(c => c !== viewType)  // 나머지 코호트들
            ];

        if(viewType === 'combined'){ // Combined Cohorts View인 경우 
        const totalItemCounts = d3.rollup(
        data,
        v => d3.sum(v, d => d.count), // 각 그룹의 count를 합산
        d => d[domainKey]  // domainKey를 사용하여 그룹화
        );

        // Top 10 선택
        const top10Items = Array.from(totalItemCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([item, total]) => ({ item, total }));

        // 선택된 Top 10 이름 목록
        top10ItemNames = top10Items.map(d => d.item);
        } else { // Anchor Cohort View인 경우
        const anchorCohortData = data.filter(d => d.cohort === viewType);
        const anchorTop10 = anchorCohortData
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
            .map(d => d[domainKey]);

        top10ItemNames = anchorTop10;
        }

        // 각 코호트별로 Top 10의 count를 가져오기
        transformedData = top10ItemNames.map(itemName => {
        let itemData = { [domainKey]: itemName };  // 동적 키 사용
        
        // 모든 코호트에 대해 0으로 초기화
        orderedCohorts.forEach(cohort => {
            itemData[cohort] = 0;
        });
        
        // 실제 데이터로 업데이트
        data.forEach(d => {
            if (d[domainKey] === itemName) {
            itemData[d.cohort] = +d.count || 0;
            }
        });
        return itemData;
        });
    }
    return { domainKey, viewType, transformedData, top10ItemNames, orderedCohorts};
}