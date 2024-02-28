import 'dotenv/config';
import { getObservations } from './files.js';

(async () => {
  const observations = await getObservations(new Date('2024-02-22'));
  console.log(observations.slice(0, 5));
})().then(() => {});
