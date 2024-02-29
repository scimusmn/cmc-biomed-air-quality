import 'dotenv/config';
import { ResultType, getObservations, distanceFilter } from './airnow.js';

// cincinnati latitude & longitude
const CINCI_LAT = 39.1;
const CINCI_LONG = -84.5125;

if (typeof process.env.AWS_PREFIX !== 'string') {
  console.error('.env: AWS_PREFIX is not set! Please set it appropriately and try again');
}

console.log(process.env.AWS_PREFIX);

(async () => {
  const result = await getObservations(process.env.AWS_PREFIX as string, new Date('2024-02-01'));
  if (result.type === ResultType.Ok) {
    console.log(result.value.filter(distanceFilter(CINCI_LAT, CINCI_LONG, 20)));
  } else {
    console.log('something seems to be wrong!', result.value);
  }
})()
  .then(() => {})
