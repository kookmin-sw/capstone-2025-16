/*
 *   Copyright 2017 Observational Health Data Sciences and Informatics
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 *   Authors: Sergey Suvorov
 *
 */

import { BaseCheckerFactory } from './BaseCheckerFactory';
import { WarningReporter } from './WarningReporter';
import { Constants } from '../Constants';
import { Operations } from '../operations/Operations';
import { 
  Criteria, 
  DemographicCriteria,
  ConditionEra,
  ConditionOccurrence,
  Death,
  DeviceExposure,
  DoseEra,
  DrugEra,
  DrugExposure,
  Measurement,
  Observation,
  ObservationPeriod,
  ProcedureOccurrence,
  Specimen,
  VisitOccurrence,
  PayerPlanPeriod,
  VisitDetail,
  LocationRegion
} from '../../cohortdefinition/CohortExpression';

// Type definition for a Concept-like object that might be a number or a Concept
type ConceptLike = number | { conceptId: number };

export class ConceptCheckerFactory extends BaseCheckerFactory {
  private static readonly WARNING_EMPTY_VALUE = "%s in the %s has empty %s value";

  private constructor(reporter: WarningReporter, groupName: string) {
    super(reporter, groupName);
  }

  public static getFactory(reporter: WarningReporter, groupName: string): ConceptCheckerFactory {
    return new ConceptCheckerFactory(reporter, groupName);
  }

  protected getCheck(criteria: Criteria): (criteria: Criteria) => void {
    if (criteria instanceof ConditionEra) {
      return (c: Criteria) => {
        const conditionEra = c as ConditionEra;
        this.checkConceptArray(conditionEra.Gender, Constants.Criteria.CONDITION_ERA, Constants.Attributes.GENDER_ATTR);
      };
    } else if (criteria instanceof ConditionOccurrence) {
      return (c: Criteria) => {
        const co = c as ConditionOccurrence;
        this.checkConceptArray(co.ConditionType, Constants.Criteria.CONDITION_OCCURRENCE, Constants.Attributes.CONDITION_TYPE_ATTR);
        this.checkConceptArray(co.Gender, Constants.Criteria.CONDITION_OCCURRENCE, Constants.Attributes.GENDER_ATTR);
        // Handle missing properties by checking if they exist first
        if ('providerSpecialty' in co) {
          this.checkConceptArray((co as any).providerSpecialty, Constants.Criteria.CONDITION_OCCURRENCE, Constants.Attributes.PROVIDER_SPECIALITY_ATTR);
        }
        this.checkConceptArray(co.VisitType, Constants.Criteria.CONDITION_OCCURRENCE, Constants.Attributes.VISIT_TYPE_ATTR);
      };
    } else if (criteria instanceof Death) {
      return (c: Criteria) => {
        const death = c as Death;
        this.checkConceptArray(death.DeathType, Constants.Criteria.DEATH, Constants.Attributes.DEATH_TYPE_ATTR);
        this.checkConceptArray(death.Gender, Constants.Criteria.DEATH, Constants.Attributes.GENDER_ATTR);
      };
    } else if (criteria instanceof DeviceExposure) {
      return (c: Criteria) => {
        const de = c as DeviceExposure;
        this.checkConceptArray(de.DeviceType, Constants.Criteria.DEVICE_EXPOSURE, Constants.Attributes.DEVICE_TYPE_ATTR);
        this.checkConceptArray(de.Gender, Constants.Criteria.DEVICE_EXPOSURE, Constants.Attributes.GENDER_ATTR);
        // Handle missing properties
        if ('providerSpecialty' in de) {
          this.checkConceptArray((de as any).providerSpecialty, Constants.Criteria.DEVICE_EXPOSURE, Constants.Attributes.PROVIDER_SPECIALITY_ATTR);
        }
        this.checkConceptArray(de.VisitType, Constants.Criteria.DEVICE_EXPOSURE, Constants.Attributes.VISIT_TYPE_ATTR);
      };
    } else if (criteria instanceof DoseEra) {
      return (c: Criteria) => {
        const doseEra = c as DoseEra;
        this.checkConceptArray(doseEra.Unit, Constants.Criteria.DOSE_ERA, Constants.Attributes.UNIT_ATTR);
        this.checkConceptArray(doseEra.Gender, Constants.Criteria.DOSE_ERA, Constants.Attributes.GENDER_ATTR);
      };
    } else if (criteria instanceof DrugEra) {
      return (c: Criteria) => {
        const drugEra = c as DrugEra;
        this.checkConceptArray(drugEra.Gender, Constants.Criteria.DRUG_ERA, Constants.Attributes.GENDER_ATTR);
      };
    } else if (criteria instanceof DrugExposure) {
      return (c: Criteria) => {
        const de = c as DrugExposure;
        this.checkConceptArray(de.DrugType, Constants.Criteria.DRUG_EXPOSURE, Constants.Attributes.DRUG_TYPE_ATTR);
        // Handle missing properties
        if ('route' in de) {
          this.checkConceptArray(de.Route, Constants.Criteria.DRUG_EXPOSURE, Constants.Attributes.ROUTE_CONCEPT_ATTR);
        }
        this.checkConceptArray(de.DoseUnit, Constants.Criteria.DRUG_EXPOSURE, Constants.Attributes.DOSE_UNIT_ATTR);
        this.checkConceptArray(de.Gender, Constants.Criteria.DRUG_EXPOSURE, Constants.Attributes.GENDER_ATTR);
        if ('providerSpecialty' in de) {
          this.checkConceptArray((de as any).providerSpecialty, Constants.Criteria.DRUG_EXPOSURE, Constants.Attributes.PROVIDER_SPECIALITY_ATTR);
        }
        this.checkConceptArray(de.VisitType, Constants.Criteria.DRUG_EXPOSURE, Constants.Attributes.VISIT_TYPE_ATTR);
      };
    } else if (criteria instanceof Measurement) {
      return (c: Criteria) => {
        const m = c as Measurement;
        this.checkConceptArray(m.MeasurementType, Constants.Criteria.MEASUREMENT, Constants.Attributes.MEASUREMENT_TYPE_ATTR);
        this.checkConceptArray(m.Operator, Constants.Criteria.MEASUREMENT, Constants.Attributes.OPERATOR_ATTR);
        this.checkConceptArray(m.ValueAsConcept, Constants.Criteria.MEASUREMENT, Constants.Attributes.VALUE_AS_CONCEPT_ATTR);
        this.checkConceptArray(m.Unit, Constants.Criteria.MEASUREMENT, Constants.Attributes.UNIT_ATTR);
        this.checkConceptArray(m.Gender, Constants.Criteria.MEASUREMENT, Constants.Attributes.GENDER_ATTR);
        if ('providerSpecialty' in m) {
          this.checkConceptArray((m as any).providerSpecialty, Constants.Criteria.MEASUREMENT, Constants.Attributes.PROVIDER_SPECIALITY_ATTR);
        }
        this.checkConceptArray(m.VisitType, Constants.Criteria.MEASUREMENT, Constants.Attributes.VISIT_TYPE_ATTR);
      };
    } else if (criteria instanceof Observation) {
      return (c: Criteria) => {
        const o = c as Observation;
        this.checkConceptArray(o.ObservationType, Constants.Criteria.OBSERVATION, Constants.Attributes.OBSERVATION_TYPE_ATTR);
        this.checkConceptArray(o.ValueAsConcept, Constants.Criteria.OBSERVATION, Constants.Attributes.VALUE_AS_CONCEPT_ATTR);
        // Handle TextFilter vs Concept[] difference - qualifier might not be an array
        if (o.Qualifier && Array.isArray(o.Qualifier)) {
          this.checkConceptArray(o.Qualifier, Constants.Criteria.OBSERVATION, Constants.Attributes.QUALIFIER_ATTR);
        }
        this.checkConceptArray(o.Unit, Constants.Criteria.OBSERVATION, Constants.Attributes.UNIT_ATTR);
        this.checkConceptArray(o.Gender, Constants.Criteria.OBSERVATION, Constants.Attributes.GENDER_ATTR);
        if ('providerSpecialty' in o) {
          this.checkConceptArray((o as any).providerSpecialty, Constants.Criteria.OBSERVATION, Constants.Attributes.PROVIDER_SPECIALITY_ATTR);
        }
        this.checkConceptArray(o.VisitType, Constants.Criteria.OBSERVATION, Constants.Attributes.VISIT_TYPE_ATTR);
      };
    } else if (criteria instanceof ObservationPeriod) {
      return (c: Criteria) => {
        const op = c as ObservationPeriod;
        this.checkConceptArray(op.PeriodType, Constants.Criteria.OBSERVATION_PERIOD, Constants.Attributes.PERIOD_TYPE_ATTR);
      };
    } else if (criteria instanceof ProcedureOccurrence) {
      return (c: Criteria) => {
        const po = c as ProcedureOccurrence;
        this.checkConceptArray(po.ProcedureType, Constants.Criteria.PROCEDURE_OCCURRENCE, Constants.Attributes.PROCEDURE_TYPE_ATTR);
        // Handle TextFilter vs Concept[] difference - modifier might not be an array
        if (po.Modifier && Array.isArray(po.Modifier)) {
          this.checkConceptArray(po.Modifier, Constants.Criteria.PROCEDURE_OCCURRENCE, Constants.Attributes.MODIFIER_ATTR);
        }
        this.checkConceptArray(po.Gender, Constants.Criteria.PROCEDURE_OCCURRENCE, Constants.Attributes.GENDER_ATTR);
        if ('providerSpecialty' in po) {
          this.checkConceptArray((po as any).providerSpecialty, Constants.Criteria.PROCEDURE_OCCURRENCE, Constants.Attributes.PROVIDER_SPECIALITY_ATTR);
        }
        this.checkConceptArray(po.VisitType, Constants.Criteria.PROCEDURE_OCCURRENCE, Constants.Attributes.VISIT_TYPE_ATTR);
      };
    } else if (criteria instanceof Specimen) {
      return (c: Criteria) => {
        const specimen = c as Specimen;
        this.checkConceptArray(specimen.SpecimenType, Constants.Criteria.SPECIMEN, Constants.Attributes.SPECIMEN_TYPE_ATTR);
        this.checkConceptArray(specimen.SpecimenUnit, Constants.Criteria.SPECIMEN, Constants.Attributes.UNIT_ATTR); // Using correct property name
        this.checkConceptArray(specimen.AnatomicSite, Constants.Criteria.SPECIMEN, Constants.Attributes.ANATOMIC_SITE_ATTR);
        this.checkConceptArray(specimen.DiseaseStatus, Constants.Criteria.SPECIMEN, Constants.Attributes.DISEASE_STATUS_ATTR);
        this.checkConceptArray(specimen.Gender, Constants.Criteria.SPECIMEN, Constants.Attributes.GENDER_ATTR);
      };
    } else if (criteria instanceof VisitOccurrence) {
      return (c: Criteria) => {
        const vo = c as VisitOccurrence;
        this.checkConceptArray(vo.VisitType, Constants.Criteria.VISIT_OCCURRENCE, Constants.Attributes.VISIT_TYPE_ATTR);
        this.checkConceptArray(vo.Gender, Constants.Criteria.VISIT_OCCURRENCE, Constants.Attributes.GENDER_ATTR);
        if ('providerSpecialty' in vo) {
          this.checkConceptArray((vo as any).providerSpecialty, Constants.Criteria.VISIT_OCCURRENCE, Constants.Attributes.PROVIDER_SPECIALITY_ATTR);
        }
        if ('placeOfService' in vo) {
          this.checkConceptArray((vo as any).placeOfService, Constants.Criteria.VISIT_OCCURRENCE, Constants.Attributes.PLACE_OF_SERVICE_ATTR);
        }
      };
    } else if (criteria instanceof VisitDetail) {
      return (c: Criteria) => {
        const vd = c as VisitDetail;
        if ('visitDetailType' in vd) {
          this.checkConceptArray((vd as any).visitDetailType, Constants.Criteria.VISIT_DETAIL, Constants.Attributes.VISIT_DETAIL_TYPE_ATTR);
        }
        this.checkConceptArray(vd.Gender, Constants.Criteria.VISIT_DETAIL, Constants.Attributes.GENDER_ATTR);
        if ('providerSpecialty' in vd) {
          this.checkConceptArray((vd as any).providerSpecialty, Constants.Criteria.VISIT_DETAIL, Constants.Attributes.PROVIDER_SPECIALITY_ATTR);
        }
        if ('placeOfService' in vd) {
          this.checkConceptArray((vd as any).placeOfService, Constants.Criteria.VISIT_DETAIL, Constants.Attributes.PLACE_OF_SERVICE_ATTR);
        }
      };
    } else if (criteria instanceof PayerPlanPeriod) {
      return (c: Criteria) => {
        const planPeriod = c as PayerPlanPeriod;
        this.checkConceptArray(planPeriod.Gender, Constants.Criteria.PAYER_PLAN_PERIOD, Constants.Attributes.GENDER_ATTR);
      };
    }
    
    return () => {}; // Default no-op function
  }

  protected getCheckDemographic(criteria: DemographicCriteria): (criteria: DemographicCriteria) => void {
    return (c: DemographicCriteria) => {
      this.checkConceptArray(c.Ethnicity, Constants.Criteria.DEMOGRAPHIC, Constants.Attributes.ETHNICITY_ATTR);
      this.checkConceptArray(c.Gender, Constants.Criteria.DEMOGRAPHIC, Constants.Attributes.GENDER_ATTR);
      this.checkConceptArray(c.Race, Constants.Criteria.DEMOGRAPHIC, Constants.Attributes.RACE_ATTR);
    };
  }

  /**
   * Helper method to check concepts
   * This works with both arrays of numbers (conceptIds) and arrays of objects with conceptId property
   */
  private checkConceptArray(concepts: any[] | undefined, criteriaName: string, attribute: string): void {
    // Skip checking if concepts is undefined or not an array
    if (!concepts || !Array.isArray(concepts)) return;
    
    const warning = (t: string) => this.reporter.add(t, this.groupName, criteriaName, attribute);
    
    // Check if the array is empty
    if (concepts.length === 0) {
      warning(ConceptCheckerFactory.WARNING_EMPTY_VALUE);
    }
  }
}