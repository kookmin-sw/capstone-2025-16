import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AutocohortService } from './autocohort.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  AutocohortTextRequest,
  AutocohortPDFResponse,
} from './dto/autocohort.dto';
import { Express } from 'express';
import { CohortDefinition } from 'src/types/type';

@ApiTags('Autocohort')
@Controller('/api/autocohort')
export class AutocohortController {
  constructor(private readonly autocohortService: AutocohortService) {}

  @ApiOperation({ summary: 'Generate cohort from text' })
  @ApiBody({ type: AutocohortTextRequest })
  @ApiResponse({
    status: 200,
    description: 'Extracted implementable and non-implementable text',
    type: Object,
  })
  @Post('/text')
  @HttpCode(HttpStatus.OK)
  async processText(
    @Body() { text }: AutocohortTextRequest,
  ): Promise<CohortDefinition> {
    return await this.autocohortService.processText(text);
  }

  @ApiOperation({ summary: 'Summarize text from PDF' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        pdf: {
          type: 'string',
          format: 'binary',
          description: 'PDF file containing cohort criteria',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Summarized text from PDF',
    type: AutocohortPDFResponse,
  })
  @Post('/pdf')
  @UseInterceptors(FileInterceptor('pdf'))
  @HttpCode(HttpStatus.OK)
  async processPdf(
    @UploadedFile() pdf: Express.Multer.File,
  ): Promise<AutocohortPDFResponse> {
    return await this.autocohortService.processPdf(pdf);
  }
}
