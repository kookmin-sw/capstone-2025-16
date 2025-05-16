import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { getBaseDB } from '../query-builder/base';
import { uuidv7 } from 'uuidv7';
import * as moment from 'moment';
import {
  CreateStatisticsDto,
  UpdateStatisticsDto,
  StatisticsResponse,
  StatisticsListResponse,
  CreateStatisticsResponse,
  UpdateStatisticsResponse,
  DeleteStatisticsResponse,
  CreateChartDto,
  UpdateChartDto,
  ChartResponse,
  ChartListResponse,
  CreateChartResponse,
  UpdateChartResponse,
  DeleteChartResponse,
} from './dto/statistics.dto';
import {
  BarChartCohortDefinition,
  BoxPlotCountBy,
  CohortDefinition,
} from 'src/types/type';
import { buildBarChartQuery } from 'src/query-builder';
import { buildBoxPlotQuery } from 'src/query-builder/statistics';

@Injectable()
export class StatisticsService {
  async getStatistics(
    page: number = 0,
    limit: number = 50,
    query?: string,
  ): Promise<StatisticsListResponse> {
    const offset = page * limit;

    query = query?.trim() || '';

    // 통계 목록 조회 쿼리
    let statisticsQuery = getBaseDB()
      .selectFrom('statistics')
      .selectAll()
      .limit(limit)
      .offset(offset)
      .orderBy('updated_at', 'desc');

    if (query) {
      statisticsQuery = statisticsQuery.where(({ eb }) =>
        eb.or([
          eb('name', 'ilike', `%${query.replaceAll('%', '%%')}%`),
          eb('description', 'ilike', `%${query.replaceAll('%', '%%')}%`),
        ]),
      );
    }
    // 총 결과 수를 계산하기 위한 쿼리
    let countQuery = getBaseDB()
      .selectFrom('statistics')
      .select(({ fn }) => [fn.count('statistics_id').as('total')]);

    if (query) {
      countQuery = countQuery.where(({ eb }) =>
        eb.or([
          eb('name', 'ilike', `%${query.replaceAll('%', '%%')}%`),
          eb('description', 'ilike', `%${query.replaceAll('%', '%%')}%`),
        ]),
      );
    }

    // 두 쿼리를 병렬로 실행
    const [statistics, countResult] = await Promise.all([
      statisticsQuery.execute(),
      countQuery.executeTakeFirst(),
    ]);

    return {
      statistics,
      total: Number(countResult?.total || 0),
      page,
      limit,
    };
  }

  async getStatisticsById(id: string): Promise<StatisticsResponse> {
    const statistics = await getBaseDB()
      .selectFrom('statistics')
      .selectAll()
      .where('statistics_id', '=', id)
      .executeTakeFirst();

    if (!statistics) {
      throw new NotFoundException('Statistics not found.');
    }

    return statistics;
  }

  async executeBarChart(
    id: { cohortId?: string; personId?: string },
    chartCohortDefs: BarChartCohortDefinition[],
  ) {
    let values: number[] = [];
    await getBaseDB()
      .connection()
      .execute(async (db) => {
        for (let chartCohortDef of chartCohortDefs) {
          let queries = buildBarChartQuery(db, {
            ...id,
            chartCohortDef,
          });
          for (let query of queries) {
            if (!Array.isArray(query)) {
              query = [query];
            }
            let results = await Promise.all(query.map((q) => q.execute()));
            for (let i = 0; i < query.length; i++) {
              if ('select' in query[i]) {
                let cnt = (
                  results[i] as {
                    count: number;
                  }[]
                ).at(0)?.count;
                values.push(Number(cnt || 0));
              }
            }
          }
        }
      });
    return values;
  }

  async processBarChart(options: {
    cohortIds?: string[];
    personId?: string;
    chartCohortDefs: BarChartCohortDefinition[];
  }) {
    let { cohortIds, personId, chartCohortDefs } = options;
    let result: {
      cohortId?: string;
      personId?: string;
      values: number[];
    }[] = [];

    if (cohortIds) {
      for (const cohortId of cohortIds) {
        const values = await this.executeBarChart(
          { cohortId },
          chartCohortDefs,
        );
        result.push({ cohortId, values });
      }
    } else if (personId) {
      const values = await this.executeBarChart({ personId }, chartCohortDefs);
      result.push({ personId, values });
    } else {
      throw new BadRequestException(
        'Either cohortIds or personId must be provided.',
      );
    }

    return result;
  }

  async executeBoxPlotChart(
    id: { cohortId?: string; personId?: string },
    chartCohortDefs: CohortDefinition[],
    countBy: BoxPlotCountBy,
  ) {
    let values: {
      type: string;
      value: number;
    }[][] = [];
    await getBaseDB()
      .connection()
      .execute(async (db) => {
        for (let chartCohortDef of chartCohortDefs) {
          let queries = buildBoxPlotQuery(db, {
            ...id,
            cohortDef: chartCohortDef,
            countBy: countBy,
            database: process.env.DB_TYPE,
          });
          for (let query of queries) {
            if (!Array.isArray(query)) {
              query = [query];
            }
            let results = await Promise.all(query.map((q) => q.execute()));
            for (let i = 0; i < query.length; i++) {
              if ('select' in query[i]) {
                values.push(
                  (results[i] as { type: string; value: number }[]).map(
                    ({ type, value }) => ({ type, value: Number(value) }),
                  ),
                );
              }
            }
          }
        }
      });
    return values;
  }

  async processBoxPlotChart(options: {
    cohortIds?: string[];
    personId?: string;
    chartCohortDefs: CohortDefinition[];
    countBy: BoxPlotCountBy;
  }) {
    let { cohortIds, personId, chartCohortDefs, countBy } = options;
    let result: {
      cohortId?: string;
      personId?: string;
      values: {
        type: string;
        value: number;
      }[][];
    }[] = [];

    if (cohortIds) {
      for (const cohortId of cohortIds) {
        const values = await this.executeBoxPlotChart(
          { cohortId },
          chartCohortDefs,
          countBy,
        );
        result.push({ cohortId, values });
      }
    } else if (personId) {
      const values = await this.executeBoxPlotChart(
        { personId },
        chartCohortDefs,
        countBy,
      );
      result.push({ personId, values });
    } else {
      throw new BadRequestException(
        'Either cohortIds or personId must be provided.',
      );
    }

    return result;
  }

  async createStatistics(
    createStatisticsDto: CreateStatisticsDto,
  ): Promise<CreateStatisticsResponse> {
    const statisticsId = uuidv7();
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    // DTO에서 소스 정보만 추출
    const { name, description, cohortIds, personId } = createStatisticsDto;

    await getBaseDB()
      .insertInto('statistics')
      .values({
        statistics_id: statisticsId,
        name,
        description,
        ...(cohortIds
          ? { cohort_ids: cohortIds.join(',') }
          : { person_id: personId }),
        author: '00000000-0000-0000-0000-000000000000', // TODO: add author
        created_at: now,
        updated_at: now,
      })
      .execute();

    return {
      message: 'Statistics created successfully',
      statisticsId,
    };
  }

  async updateStatistics(
    id: string,
    updateStatisticsDto: UpdateStatisticsDto,
  ): Promise<UpdateStatisticsResponse> {
    const statistics = await getBaseDB()
      .selectFrom('statistics')
      .selectAll()
      .where('statistics_id', '=', id)
      .executeTakeFirst();

    if (!statistics) {
      throw new NotFoundException('Statistics not found.');
    }

    // 업데이트할 필드 구성
    const updateFields: Record<string, any> = {
      updated_at: moment().format('YYYY-MM-DD HH:mm:ss'),
    };
    let definitionUpdated = false;

    // 이름과 설명 업데이트
    if (updateStatisticsDto.name !== undefined) {
      updateFields.name = updateStatisticsDto.name;
    }

    if (updateStatisticsDto.description !== undefined) {
      updateFields.description = updateStatisticsDto.description;
    }

    // DTO에서 소스 정보가 변경되었으면 정의 업데이트
    if (updateStatisticsDto.cohortIds !== undefined) {
      updateFields.cohort_ids = updateStatisticsDto.cohortIds.join(',');
      updateFields.person_id = null; // personId는 null로 설정
      definitionUpdated = true;
    } else if (updateStatisticsDto.personId !== undefined) {
      updateFields.cohort_ids = null; // cohortIds는 null로 설정
      updateFields.person_id = updateStatisticsDto.personId;
      definitionUpdated = true;
    }

    // 데이터베이스 업데이트
    await getBaseDB()
      .updateTable('statistics')
      .set(updateFields)
      .where('statistics_id', '=', id)
      .execute();

    return {
      message: 'Statistics updated successfully',
    };
  }

  async deleteStatistics(id: string): Promise<DeleteStatisticsResponse> {
    const statistics = await getBaseDB()
      .selectFrom('statistics')
      .selectAll()
      .where('statistics_id', '=', id)
      .executeTakeFirst();

    if (!statistics) {
      throw new NotFoundException('Statistics not found.');
    }

    // 통계에 속한 모든 차트도 함께 삭제
    await getBaseDB()
      .deleteFrom('statistics_chart')
      .where('statistics_id', '=', id)
      .execute();

    await getBaseDB()
      .deleteFrom('statistics')
      .where('statistics_id', '=', id)
      .execute();

    return {
      message: 'Statistics deleted successfully',
    };
  }

  // 통계 차트 관련 메서드
  async getCharts(
    statisticsId: string,
    page: number = 0,
    limit: number = 50,
  ): Promise<ChartListResponse> {
    const offset = page * limit;

    // 통계 존재 여부 확인
    const statistics = await getBaseDB()
      .selectFrom('statistics')
      .selectAll()
      .where('statistics_id', '=', statisticsId)
      .executeTakeFirst();

    if (!statistics) {
      throw new NotFoundException('Statistics not found.');
    }

    // 차트 목록 조회 쿼리
    const chartsQuery = getBaseDB()
      .selectFrom('statistics_chart')
      .selectAll()
      .where('statistics_id', '=', statisticsId)
      .limit(limit)
      .offset(offset)
      .orderBy('updated_at', 'desc');

    // 총 결과 수를 계산하기 위한 쿼리
    const countQuery = getBaseDB()
      .selectFrom('statistics_chart')
      .select(({ fn }) => [fn.count('chart_id').as('total')])
      .where('statistics_id', '=', statisticsId);

    // 두 쿼리를 병렬로 실행
    const [charts, countResult] = await Promise.all([
      chartsQuery.execute(),
      countQuery.executeTakeFirst(),
    ]);

    return {
      charts,
      total: Number(countResult?.total || 0),
      page,
      limit,
    };
  }

  async getChartById(
    statisticsId: string,
    chartId: string,
  ): Promise<ChartResponse> {
    // 통계 존재 여부 확인
    const statistics = await getBaseDB()
      .selectFrom('statistics')
      .selectAll()
      .where('statistics_id', '=', statisticsId)
      .executeTakeFirst();

    if (!statistics) {
      throw new NotFoundException('Statistics not found.');
    }

    const chart = await getBaseDB()
      .selectFrom('statistics_chart')
      .selectAll()
      .where('statistics_id', '=', statisticsId)
      .where('chart_id', '=', chartId)
      .executeTakeFirst();

    if (!chart) {
      throw new NotFoundException('Chart not found.');
    }

    return chart;
  }

  async createChart(
    statisticsId: string,
    createChartDto: CreateChartDto,
  ): Promise<CreateChartResponse> {
    // 통계 존재 여부 확인
    const statistics = await getBaseDB()
      .selectFrom('statistics')
      .selectAll()
      .where('statistics_id', '=', statisticsId)
      .executeTakeFirst();

    if (!statistics) {
      throw new NotFoundException('Statistics not found.');
    }

    const chartId = uuidv7();
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    // DTO에서 필요한 필드 추출
    const { name, description, type, groups, countBy } = createChartDto;

    // 통계 소스 정보 가져오기
    const cohortIds = statistics.cohort_ids?.split(',') || undefined;
    const personId = statistics.person_id || undefined;

    let result: any;
    switch (type) {
      case 'bar':
        result = await this.processBarChart({
          cohortIds,
          personId,
          chartCohortDefs: groups.map((e) => e.definition),
        });
        break;
      case 'boxplot':
        if (!countBy) {
          throw new BadRequestException(
            'countBy is required for boxplot type.',
          );
        }

        result = await this.processBoxPlotChart({
          cohortIds,
          personId,
          chartCohortDefs: groups.map((e) => e.definition),
          countBy,
        });
        break;
      default:
        throw new BadRequestException(
          'Invalid type. Only "bar" and "boxplot" are supported.',
        );
    }

    // 데이터베이스에 저장할 definition 객체 생성
    const definition = {
      groups,
      countBy,
    };

    await getBaseDB()
      .insertInto('statistics_chart')
      .values({
        chart_id: chartId,
        statistics_id: statisticsId,
        name,
        description,
        type,
        definition: JSON.stringify(definition),
        result: JSON.stringify(result),
        author: '00000000-0000-0000-0000-000000000000', // TODO: add author
        created_at: now,
        updated_at: now,
      })
      .execute();

    return {
      message: 'Chart created successfully',
      chartId,
    };
  }

  async updateChart(
    statisticsId: string,
    chartId: string,
    updateChartDto: UpdateChartDto,
  ): Promise<UpdateChartResponse> {
    // 통계 존재 여부 확인
    const statistics = await getBaseDB()
      .selectFrom('statistics')
      .selectAll()
      .where('statistics_id', '=', statisticsId)
      .executeTakeFirst();

    if (!statistics) {
      throw new NotFoundException('Statistics not found.');
    }

    const chart = await getBaseDB()
      .selectFrom('statistics_chart')
      .selectAll()
      .where('chart_id', '=', chartId)
      .where('statistics_id', '=', statisticsId)
      .executeTakeFirst();

    if (!chart) {
      throw new NotFoundException('Chart not found.');
    }

    // 업데이트할 필드 구성
    const updateFields: Record<string, any> = {
      updated_at: moment().format('YYYY-MM-DD HH:mm:ss'),
    };

    // 현재 저장된 차트 데이터
    const currentDefinition: {
      groups: {
        name: string;
        definition: BarChartCohortDefinition | CohortDefinition;
      }[];
      countBy?: BoxPlotCountBy;
    } = JSON.parse(chart.definition || '{}');
    let definitionUpdated = false;
    let resultNeedsUpdate = false;

    // 이름과 설명 업데이트 (결과에 영향 없음)
    if (updateChartDto.name !== undefined) {
      updateFields.name = updateChartDto.name;
    }

    if (updateChartDto.description !== undefined) {
      updateFields.description = updateChartDto.description;
    }

    // 타입 변경 시 결과 재계산 필요
    if (updateChartDto.type !== undefined) {
      updateFields.type = updateChartDto.type;
      resultNeedsUpdate = true;
    }

    // 그룹 정보 업데이트 시 결과 재계산 필요
    if (updateChartDto.groups !== undefined) {
      currentDefinition.groups = updateChartDto.groups;
      definitionUpdated = true;
      resultNeedsUpdate = true;
    }

    // countBy 업데이트 시 결과 재계산 필요
    if (updateChartDto.countBy !== undefined) {
      updateFields.count_by = JSON.stringify(updateChartDto.countBy);
      resultNeedsUpdate = true;
    }

    if (definitionUpdated) {
      updateFields.definition = JSON.stringify(currentDefinition);
    }

    // 결과 데이터를 갱신해야 하는 경우
    if (resultNeedsUpdate) {
      // 통계 소스 정보 가져오기
      const cohortIds = statistics.cohort_ids?.split(',') || undefined;
      const personId = statistics.person_id || undefined;

      const type = updateChartDto.type || chart.type;
      const groups = currentDefinition.groups;
      const countBy = updateChartDto.countBy
        ? updateChartDto.countBy
        : currentDefinition.countBy;

      let result: any;
      switch (type) {
        case 'bar':
          result = await this.processBarChart({
            cohortIds,
            personId,
            chartCohortDefs: groups.map((e) => e.definition),
          });
          break;
        case 'boxplot':
          if (!countBy) {
            throw new BadRequestException(
              'countBy is required for boxplot type.',
            );
          }

          result = await this.processBoxPlotChart({
            cohortIds,
            personId,
            chartCohortDefs: groups.map((e) => e.definition),
            countBy,
          });
          break;
        default:
          throw new BadRequestException(
            'Invalid type. Only "bar" and "boxplot" are supported.',
          );
      }

      updateFields.result = JSON.stringify(result);
    }

    // 데이터베이스 업데이트
    await getBaseDB()
      .updateTable('statistics_chart')
      .set(updateFields)
      .where('chart_id', '=', chartId)
      .where('statistics_id', '=', statisticsId)
      .execute();

    return {
      message: 'Chart updated successfully',
    };
  }

  async deleteChart(
    statisticsId: string,
    chartId: string,
  ): Promise<DeleteChartResponse> {
    // 통계 존재 여부 확인
    const statistics = await getBaseDB()
      .selectFrom('statistics')
      .selectAll()
      .where('statistics_id', '=', statisticsId)
      .executeTakeFirst();

    if (!statistics) {
      throw new NotFoundException('Statistics not found.');
    }

    const chart = await getBaseDB()
      .selectFrom('statistics_chart')
      .selectAll()
      .where('chart_id', '=', chartId)
      .where('statistics_id', '=', statisticsId)
      .executeTakeFirst();

    if (!chart) {
      throw new NotFoundException('Chart not found.');
    }

    await getBaseDB()
      .deleteFrom('statistics_chart')
      .where('chart_id', '=', chartId)
      .where('statistics_id', '=', statisticsId)
      .execute();

    return {
      message: 'Chart deleted successfully',
    };
  }
}
