import { Injectable, NotFoundException } from '@nestjs/common';
import { getBaseDB } from '../query-builder/base';
import {
  ConceptResponseDto,
  ConceptSearchResponseDto,
  DomainType,
} from './dto/concept.dto';

@Injectable()
export class ConceptService {
  async searchConcepts(
    query?: string,
    page: number = 0,
    limit: number = 100,
    domain?: DomainType,
  ): Promise<ConceptSearchResponseDto> {
    const offset = page * limit;

    query = query?.trim() || '';

    let conceptQuery = getBaseDB().selectFrom('concept').selectAll();

    if (domain) {
      conceptQuery = conceptQuery.where('domain_id', '=', domain);
    }

    // 검색어가 있는 경우에만 검색 조건 추가
    if (query) {
      conceptQuery = conceptQuery.where(
        'concept_name',
        'ilike',
        `%${query.replaceAll('%', '%%')}%`,
      );
    }

    // 총 결과 수를 계산하기 위한 쿼리
    let countQuery = getBaseDB()
      .selectFrom('concept')
      .select(({ fn }) => [fn.count('concept_id').as('total')]);

    if (domain) {
      countQuery = countQuery.where('domain_id', '=', domain);
    }

    if (query) {
      countQuery = countQuery.where(
        'concept_name',
        'ilike',
        `%${query.replaceAll('%', '%%')}%`,
      );
    }

    // 두 쿼리를 병렬로 실행
    const [concepts, countResult] = await Promise.all([
      conceptQuery.limit(limit).offset(offset).orderBy('concept_id').execute(),
      countQuery.executeTakeFirst(),
    ]);

    return {
      concepts: concepts.map((concept) => ({
        concept_id: concept.concept_id,
        concept_name: concept.concept_name,
        concept_code: concept.concept_code,
        vocabulary_id: concept.vocabulary_id,
        domain_id: concept.domain_id,
      })),
      total: Number(countResult?.total || 0),
      page: page,
      limit: limit,
    };
  }

  async getConceptById(conceptId: string): Promise<ConceptResponseDto> {
    const concept = await getBaseDB()
      .selectFrom('concept')
      .selectAll()
      .where('concept_id', '=', conceptId)
      .executeTakeFirst();

    if (!concept) {
      throw new NotFoundException(`Concept with ID ${conceptId} not found`);
    }

    return concept;
  }
}
