import { check } from '../circe';
type Warning = check.Warning;

export class CohortValidationResponse {
  Message: string = '';
  Warnings?: Warning[];
}

export default CohortValidationResponse;