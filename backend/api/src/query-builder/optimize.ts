import { getBaseDB } from './base';
import * as conditionEra from './filters/condition-era';
import * as conditionOccurrence from './filters/condition-occurrence';
import * as deviceExposure from './filters/device-exposure';
import * as doseEra from './filters/dose-era';
import * as drugEra from './filters/drug-era';
import * as drugExposure from './filters/drug-exposure';
import * as measurement from './filters/measurement';
import * as observation from './filters/observation';
import * as observationPeriod from './filters/observation-period';
import * as procedureOccurrence from './filters/procedure-occurrence';
import * as specimen from './filters/specimen';
import * as visitOccurrence from './filters/visit-occurrence';

const checkOptimizable = async () => {
  let cnt = 0;
  const map: { [key: string]: () => void } = {
    first_condition_era: conditionEra.optimizeFirst,
    first_condition_occurrence: conditionOccurrence.optimizeFirst,
    first_drug_era: drugEra.optimizeFirst,
    first_measurement: measurement.optimizeFirst,
    first_observation: observation.optimizeFirst,
    first_procedure_occurrence: procedureOccurrence.optimizeFirst,
    first_visit_occurrence: visitOccurrence.optimizeFirst,
    first_drug_exposure: drugExposure.optimizeFirst,
    first_device_exposure: deviceExposure.optimizeFirst,
    first_specimen: specimen.optimizeFirst,
    first_observation_period: observationPeriod.optimizeFirst,
    first_dose_era: doseEra.optimizeFirst,
  };
  const res = await getBaseDB().introspection.getTables();
  for (let table of res) {
    if (map[table.name]) {
      map[table.name]();
      cnt++;
    }
  }

  console.log(`${cnt} tables optimized`);
};
checkOptimizable();
