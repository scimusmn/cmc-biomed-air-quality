import 'dotenv/config';
import { getCurrentObservations, distanceFilter } from './files.js';

// cincinnati latitude & longitude
const CINCI_LAT = 39.1;
const CINCI_LONG = -84.5125;

(async () => {
  const [_, observations] = await getCurrentObservations();
  console.log(observations.filter(distanceFilter(CINCI_LAT, CINCI_LONG, 20)));
})().then(() => {});
