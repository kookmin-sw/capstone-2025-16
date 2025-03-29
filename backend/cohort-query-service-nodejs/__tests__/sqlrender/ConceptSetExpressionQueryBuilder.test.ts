// Import the ConceptSetExpressionQueryBuilder class
const { ConceptSetExpressionQueryBuilder } = require('../../src/circe/vocabulary/ConceptSetExpressionQueryBuilder');
const { ConceptSetExpression, ConceptSetItem } = require('../../src/circe/vocabulary/ConceptSetExpression');
const { Concept } = require('../../src/circe/vocabulary/Concept');

describe('ConceptSetExpressionQueryBuilder', () => {
  describe('buildDescendantQuery', () => {
    test('should generate SQL for descendants', () => {
      const conceptIds = [123, 456];
      
      const result = ConceptSetExpressionQueryBuilder.buildDescendantQuery(conceptIds);
      
      expect(result).toContain('ca.ancestor_concept_id in (123,456)');
    });
    
    test('should throw error for empty conceptIds', () => {
      expect(() => {
        ConceptSetExpressionQueryBuilder.buildDescendantQuery([]);
      }).toThrow("Must specify at least one concept");
    });
  });
});