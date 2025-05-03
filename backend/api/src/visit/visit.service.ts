import { Injectable, NotFoundException } from '@nestjs/common';
import { getBaseDB } from 'src/query-builder/base';
import { VisitDetailResponse } from './dto/visit.dto';

@Injectable()
export class VisitService {
  async getVisitDetail(visitId: string): Promise<VisitDetailResponse> {
    // 해당 visit_occurrence_id의 방문 정보를 가져옴
    const visitInfo = await getBaseDB()
      .selectFrom('visit_occurrence')
      .selectAll()
      .where('visit_occurrence_id', '=', ({ eb }) =>
        eb.fn<any>('_to_int64', [eb.val(visitId)]),
      )
      .executeTakeFirst();

    if (!visitInfo) {
      throw new NotFoundException('Visit not found');
    }

    let careSite = visitInfo.care_site_id
      ? await getBaseDB()
          .selectFrom('care_site')
          .selectAll()
          .where('care_site_id', '=', ({ eb }) =>
            eb.fn<any>('_to_int64', [eb.val(visitInfo.care_site_id)]),
          )
          .executeTakeFirst()
      : undefined;

    const [
      person,
      provider,
      location,
      conditions,
      conditionEras,
      drugs,
      procedures,
      measurements,
      observations,
      specimens,
      devices,
    ] = await Promise.all([
      // 방문한 환자 정보
      getBaseDB()
        .selectFrom('person')
        .selectAll()
        .where('person_id', '=', ({ eb }) =>
          eb.fn<any>('_to_int64', [eb.val(visitInfo.person_id)]),
        )
        .executeTakeFirst(),

      // 제공자(의사) 정보
      visitInfo.provider_id
        ? getBaseDB()
            .selectFrom('provider')
            .selectAll()
            .where('provider_id', '=', ({ eb }) =>
              eb.fn<any>('_to_int64', [eb.val(visitInfo.provider_id)]),
            )
            .executeTakeFirst()
        : undefined,

      // 위치 정보 (care_site를 통해 연결)
      careSite?.location_id
        ? getBaseDB()
            .selectFrom('location')
            .selectAll()
            .where('location_id', '=', ({ eb }) =>
              eb.fn<any>('_to_int64', [eb.val(careSite.location_id)]),
            )
            .executeTakeFirst()
        : undefined,

      // 해당 방문에서 진단된 상태/질환 정보
      getBaseDB()
        .selectFrom('condition_occurrence')
        .selectAll()
        .where('visit_occurrence_id', '=', ({ eb }) =>
          eb.fn<any>('_to_int64', [eb.val(visitId)]),
        )
        .execute(),

      // 해당 방문과 관련된 condition_era 정보 (person_id와 날짜 범위로 연결)
      getBaseDB()
        .selectFrom('condition_era')
        .selectAll()
        .where('person_id', '=', ({ eb }) =>
          eb.fn<any>('_to_int64', [eb.val(visitInfo.person_id)]),
        )
        .where('condition_era_start_date', '<=', ({ eb }) =>
          eb.fn<any>('_to_date', [eb.val(visitInfo.visit_end_date)]),
        )
        .where('condition_era_end_date', '>=', ({ eb }) =>
          eb.fn<any>('_to_date', [eb.val(visitInfo.visit_start_date)]),
        )
        .execute(),

      // 해당 방문에서 투약된 약물 정보
      getBaseDB()
        .selectFrom('drug_exposure')
        .selectAll()
        .where('visit_occurrence_id', '=', ({ eb }) =>
          eb.fn<any>('_to_int64', [eb.val(visitId)]),
        )
        .execute(),

      // 해당 방문에서 수행된 시술 정보
      getBaseDB()
        .selectFrom('procedure_occurrence')
        .selectAll()
        .where('visit_occurrence_id', '=', ({ eb }) =>
          eb.fn<any>('_to_int64', [eb.val(visitId)]),
        )
        .execute(),

      // 해당 방문에서 측정된 검사 결과 정보
      getBaseDB()
        .selectFrom('measurement')
        .selectAll()
        .where('visit_occurrence_id', '=', ({ eb }) =>
          eb.fn<any>('_to_int64', [eb.val(visitId)]),
        )
        .execute(),

      // 해당 방문에서의 관찰 정보
      getBaseDB()
        .selectFrom('observation')
        .selectAll()
        .where('visit_occurrence_id', '=', ({ eb }) =>
          eb.fn<any>('_to_int64', [eb.val(visitId)]),
        )
        .execute(),

      // 해당 방문에서 수집된 검체 정보
      getBaseDB()
        .selectFrom('specimen')
        .selectAll()
        .where('person_id', '=', ({ eb }) =>
          eb.fn<any>('_to_int64', [eb.val(visitInfo.person_id)]),
        )
        .where((eb) =>
          eb.and([
            eb('specimen_date', '>=', ({ eb }) =>
              eb.fn<any>('_to_date', [eb.val(visitInfo.visit_start_date)]),
            ),
            eb('specimen_date', '<=', ({ eb }) =>
              eb.fn<any>('_to_date', [eb.val(visitInfo.visit_end_date)]),
            ),
          ]),
        )
        .execute(),

      // 해당 방문에서의 기기 노출 정보
      getBaseDB()
        .selectFrom('device_exposure')
        .selectAll()
        .where('visit_occurrence_id', '=', ({ eb }) =>
          eb.fn<any>('_to_int64', [eb.val(visitId)]),
        )
        .execute(),
    ]);

    // 결과 반환
    return {
      visitInfo,
      person,
      careSite,
      provider,
      location,
      conditions,
      conditionEras,
      drugs,
      procedures,
      measurements,
      observations,
      specimens,
      devices,
    };
  }
}
