import 'dotenv/config';
import { getObservations, distanceFilter } from './files.js';

// cincinnati latitude & longitude
const CINCI_LAT = 39.1;
const CINCI_LONG = -84.5125;

(async () => {
  const observations = await getObservations(new Date('2024-02-22'));
  console.log(observations.filter(distanceFilter(CINCI_LAT, CINCI_LONG, 20)));
})().then(() => {});
