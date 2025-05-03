import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PersonResponse,
  PersonStatisticsResponse,
  VisitOccurrenceClass,
} from './dto/person.dto';
import { getBaseDB } from 'src/query-builder/base';

@Injectable()
export class PersonService {
  async getPerson(personId: string): Promise<PersonResponse> {
    let info = await getBaseDB()
      .selectFrom('person')
      .selectAll()
      .where('person_id', '=', ({ eb }) =>
        eb.fn<any>('_to_int64', [eb.val(personId)]),
      )
      .executeTakeFirst();
    if (!info) {
      throw new NotFoundException('Person not found');
    }

    let death = await getBaseDB()
      .selectFrom('death')
      .selectAll()
      .where('person_id', '=', ({ eb }) =>
        eb.fn<any>('_to_int64', [eb.val(personId)]),
      )
      .executeTakeFirst();

    return {
      info,
      death,
    };
  }

  async getPersonVisits(personId: string): Promise<VisitOccurrenceClass[]> {
    if (
      !(await getBaseDB()
        .selectFrom('person')
        .select('person_id')
        .where('person_id', '=', ({ eb }) =>
          eb.fn<any>('_to_int64', [eb.val(personId)]),
        )
        .executeTakeFirst())
    ) {
      throw new NotFoundException('Person not found');
    }

    let visits = await getBaseDB()
      .selectFrom('visit_occurrence')
      .selectAll()
      .where('person_id', '=', ({ eb }) =>
        eb.fn<any>('_to_int64', [eb.val(personId)]),
      )
      .execute();

    return visits;
  }

  async getPersonStatistics(
    personId: string,
  ): Promise<PersonStatisticsResponse> {
    if (
      !(await getBaseDB()
        .selectFrom('person')
        .select('person_id')
        .where('person_id', '=', ({ eb }) =>
          eb.fn<any>('_to_int64', [eb.val(personId)]),
        )
        .executeTakeFirst())
    ) {
      throw new NotFoundException('Person not found');
    }

    const [
      visitTypes,
      topTenDrugs,
      topTenConditions,
      topTenProcedures,
      topTenMeasurements,
    ] = await Promise.all([
      getBaseDB()
        .selectFrom('visit_occurrence')
        .where('person_id', '=', ({ eb }) =>
          eb.fn<any>('_to_int64', [eb.val(personId)]),
        )
        .leftJoin('concept', 'visit_concept_id', 'concept_id')
        .groupBy('concept_name')
        .select(({ fn }) => [
          'concept_name',
          fn.count('concept_name').as('count'),
        ])
        .execute(),
      getBaseDB()
        .selectFrom('drug_exposure')
        .where('person_id', '=', ({ eb }) =>
          eb.fn<any>('_to_int64', [eb.val(personId)]),
        )
        .leftJoin('concept', 'drug_concept_id', 'concept_id')
        .groupBy('concept_name')
        .select(({ fn }) => [
          'concept_name',
          fn.count('concept_name').as('count'),
        ])
        .orderBy(({ fn }) => fn.count('concept_name'), 'desc')
        .limit(10)
        .execute(),
      getBaseDB()
        .selectFrom('condition_occurrence')
        .where('person_id', '=', ({ eb }) =>
          eb.fn<any>('_to_int64', [eb.val(personId)]),
        )
        .leftJoin('concept', 'condition_concept_id', 'concept_id')
        .groupBy('concept_name')
        .select(({ fn }) => [
          'concept_name',
          fn.count('concept_name').as('count'),
        ])
        .orderBy(({ fn }) => fn.count('concept_name'), 'desc')
        .limit(10)
        .execute(),
      getBaseDB()
        .selectFrom('procedure_occurrence')
        .where('person_id', '=', ({ eb }) =>
          eb.fn<any>('_to_int64', [eb.val(personId)]),
        )
        .leftJoin('concept', 'procedure_concept_id', 'concept_id')
        .groupBy('concept_name')
        .select(({ fn }) => [
          'concept_name',
          fn.count('concept_name').as('count'),
        ])
        .orderBy(({ fn }) => fn.count('concept_name'), 'desc')
        .limit(10)
        .execute(),
      getBaseDB()
        .selectFrom('measurement')
        .where('person_id', '=', ({ eb }) =>
          eb.fn<any>('_to_int64', [eb.val(personId)]),
        )
        .leftJoin('concept', 'measurement_concept_id', 'concept_id')
        .groupBy('concept_name')
        .select(({ fn }) => [
          'concept_name',
          fn.count('concept_name').as('count'),
        ])
        .orderBy(({ fn }) => fn.count('concept_name'), 'desc')
        .limit(10)
        .execute(),
    ]);

    const visitType: { [concept_name: string]: number } = {};
    for (const { concept_name, count } of visitTypes) {
      visitType[concept_name ?? 'Unknown Visit Type'] = Number(count);
    }
    const topTenDrug: { [concept_name: string]: number } = {};
    for (const { concept_name, count } of topTenDrugs) {
      topTenDrug[concept_name ?? 'Unknown Drug'] = Number(count);
    }
    const topTenCondition: { [concept_name: string]: number } = {};
    for (const { concept_name, count } of topTenConditions) {
      topTenCondition[concept_name ?? 'Unknown Condition'] = Number(count);
    }
    const topTenProcedure: { [concept_name: string]: number } = {};
    for (const { concept_name, count } of topTenProcedures) {
      topTenProcedure[concept_name ?? 'Unknown Procedure'] = Number(count);
    }
    const topTenMeasurement: { [concept_name: string]: number } = {};
    for (const { concept_name, count } of topTenMeasurements) {
      topTenMeasurement[concept_name ?? 'Unknown Measurement'] = Number(count);
    }

    return {
      visitType,
      topTenDrug,
      topTenCondition,
      topTenProcedure,
      topTenMeasurement,
    };
  }
}
