import 'dotenv/config';
import { ResultType, getCurrentObservations, distanceFilter } from './files.js';

// cincinnati latitude & longitude
const CINCI_LAT = 39.1;
const CINCI_LONG = -84.5125;

(async () => {
  const result = await getCurrentObservations();
  if (result.type === ResultType.Ok) {
    console.log(result.value.filter(distanceFilter(CINCI_LAT, CINCI_LONG, 20)));
  } else {
    console.log('something seems to be wrong!', result.value);
  }
})()
  .then(() => {})
