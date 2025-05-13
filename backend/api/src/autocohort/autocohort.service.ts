import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { AutocohortPDFResponse } from './dto/autocohort.dto';
import { CohortDefinition } from '../types/type';

@Injectable()
export class AutocohortService {
  constructor() {}

  async processText(text: string): Promise<CohortDefinition> {
    try {
      const response = await fetch(
        `http://${process.env.AUTO_COHORT_API}/text`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        },
      );

      if (!response.ok) {
        throw new HttpException(
          `Failed to process text: ${response.statusText}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const cohortDefinition = (await response.json()) as CohortDefinition;
      return cohortDefinition;
    } catch (err) {
      console.log(err);
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        `Error processing text: ${err.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async processPdf(file: Express.Multer.File): Promise<AutocohortPDFResponse> {
    try {
      if (!file) {
        throw new HttpException('No PDF file uploaded', HttpStatus.BAD_REQUEST);
      }

      const formData = new FormData();
      formData.append('pdf', new Blob([file.buffer]), file.originalname);

      const response = await fetch(
        `http://${process.env.AUTO_COHORT_API}/pdf`,
        {
          method: 'POST',
          body: formData,
        },
      );

      if (!response.ok) {
        throw new HttpException(
          `Failed to process PDF: ${response.statusText}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const data = await response.json();
      return {
        implementable_text: data.implementable_text,
        non_implementable_text: data.non_implementable_text,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        `Error processing PDF: ${err.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
