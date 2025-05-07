import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { CohortDefinition } from '../../types/type';

export class AutocohortTextRequest {
  @ApiProperty({
    description: 'Text content for auto-cohort generation',
    example: 'Patients with sepsis-3 and ARDS who are at least 18 years old',
  })
  @IsString()
  text: string;
}

export class AutocohortPDFResponse {
  @ApiProperty({
    description: 'Implementable criteria extracted from the text',
    example: 'Patients diagnosed with sepsis-3 and ARDS',
  })
  implementable_text: string;

  @ApiProperty({
    description: 'Non-implementable criteria extracted from the text',
    example: 'Patients who are at least 18 years old',
  })
  non_implementable_text: string;
}
