import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  Res,
  Header,
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
import { Express, Response } from 'express';

@ApiTags('Autocohort')
@Controller('/api/autocohort')
export class AutocohortController {
  constructor(private readonly autocohortService: AutocohortService) {}

  async handleKeepAlive<T>(res: Response, data: Promise<T>) {
    const interval = setInterval(() => {
      res.write(' ', () => {});
    }, 150 * 1000);
    try {
      let d = await data;
      res.write(JSON.stringify(d));
    } catch (err) {
      res.write(JSON.stringify(err));
    } finally {
      clearInterval(interval);
      res.end();
    }
  }

  @ApiOperation({ summary: 'Generate cohort from text' })
  @ApiBody({ type: AutocohortTextRequest })
  @ApiResponse({
    status: 200,
    description: 'Extracted implementable and non-implementable text',
    type: Object,
  })
  @Post('/text')
  @Header('Content-Type', 'application/json; charset=utf-8')
  @Header('Transfer-Encoding', 'chunked')
  @HttpCode(HttpStatus.OK)
  async processText(
    @Body() { text }: AutocohortTextRequest,
    @Res() res: Response,
  ): Promise<void> {
    await this.handleKeepAlive(res, this.autocohortService.processText(text));
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
  @Header('Content-Type', 'application/json; charset=utf-8')
  @Header('Transfer-Encoding', 'chunked')
  @HttpCode(HttpStatus.OK)
  async processPdf(
    @UploadedFile() pdf: Express.Multer.File,
    @Res() res: Response,
  ): Promise<void> {
    await this.handleKeepAlive(res, this.autocohortService.processPdf(pdf));
  }
}
