import { ProcedureOccurrenceFilter } from '../../types/type';
import {
  handleAgeWithNumberOperator,
  handleDateWithOperator,
  handleNumberWithOperator,
  handleIdentifierWithOperator,
  handleRowNumber,
  handleConceptSet,
} from '../base';
import { expressionBuilder, Kysely } from 'kysely';
import { Database } from '../../db/types';

let _optimizeFirst = false;
export const optimizeFirst = () => {
  _optimizeFirst = true;
};

export const getQuery = (
  db: Kysely<Database>,
  a: ProcedureOccurrenceFilter,
) => {
  const eb = expressionBuilder<Database, any>();

  let query = db
    .selectFrom(
      _optimizeFirst && a.first
        ? eb.ref('first_procedure_occurrence').as('procedure_occurrence')
        : 'procedure_occurrence',
    )
    .select(({ fn }) => [
      'procedure_occurrence.person_id as person_id',
      ...handleRowNumber(
        a.first && !_optimizeFirst,
        fn,
        'procedure_occurrence.person_id',
        'procedure_occurrence.procedure_date',
      ),
    ]);
  if (!a.first || _optimizeFirst) {
    query = query.distinct();
  }

  if (a.conceptset) {
    query = handleConceptSet(
      db,
      query,
      'procedure_occurrence.procedure_concept_id',
      a.conceptset,
    );
  }

  if (a.age || a.gender) {
    let joinedQuery = query.leftJoin(
      'person',
      'procedure_occurrence.person_id',
      'person.person_id',
    );

    if (a.age) {
      joinedQuery = handleAgeWithNumberOperator(
        joinedQuery,
        'procedure_occurrence.procedure_date',
        'person.year_of_birth',
        a.age,
      );
    }

    if (a.gender) {
      joinedQuery = handleIdentifierWithOperator(
        joinedQuery,
        'person.gender_concept_id',
        a.gender,
      );
    }

    // @ts-ignore
    query = joinedQuery;
  }

  if (a.startDate) {
    query = handleDateWithOperator(
      query,
      'procedure_occurrence.procedure_date',
      a.startDate,
    );
  }

  if (a.procedureType) {
    query = handleIdentifierWithOperator(
      query,
      'procedure_occurrence.procedure_type_concept_id',
      a.procedureType,
    );
  }

  if (a.visitType) {
    let joinedQuery = query.leftJoin(
      'visit_occurrence',
      'procedure_occurrence.visit_occurrence_id',
      'visit_occurrence.visit_occurrence_id',
    );

    joinedQuery = handleIdentifierWithOperator(
      joinedQuery,
      'visit_occurrence.visit_concept_id',
      a.visitType,
    );

    // @ts-ignore
    query = joinedQuery;
  }

  if (a.modifierType) {
    query = handleIdentifierWithOperator(
      query,
      'procedure_occurrence.modifier_concept_id',
      a.modifierType,
    );
  }

  if (a.quantity) {
    query = handleNumberWithOperator(
      query,
      'procedure_occurrence.quantity',
      a.quantity,
    );
  }

  if (a.source) {
    query = handleConceptSet(
      db,
      query,
      'procedure_occurrence.procedure_source_concept_id',
      a.source,
    );
  }

  if (a.providerSpecialty) {
    let joinedQuery = query.leftJoin(
      'provider',
      'procedure_occurrence.provider_id',
      'provider.provider_id',
    );

    joinedQuery = handleIdentifierWithOperator(
      joinedQuery,
      'provider.specialty_concept_id',
      a.providerSpecialty,
    );

    // @ts-ignore
    query = joinedQuery;
  }

  if (a.first && !_optimizeFirst) {
    return db
      .selectFrom(query.as('filtered_procedure_occurrence'))
      .where('ordinal', '=', 1)
      .select('person_id')
      .distinct();
  }

  return query;
};
