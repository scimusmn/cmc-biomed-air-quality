import 'dotenv/config';
import { getObservations } from './airnow.js';
import { createOverlay, drawMap } from './map.js';
import { isOk } from './result.js';

const e = process.env;

function envError(key: string) {
  throw new Error(`.env: please ensure ${key} is present in your environment`);
}

if (typeof e.AWS_PREFIX !== 'string') {
  envError('AWS_PREFIX');
} else if (typeof e.DB_FOLDER !== 'string') {
  envError('DB_FOLDER');
} else if (typeof e.LATITUDE !== 'string') {
  envError('LATITUDE');
} else if (typeof e.LONGITUDE !== 'string') {
  envError('LONGITUDE');
} else if (typeof e.RANGE !== 'string') {
  envError('RANGE');
} else if (typeof e.REFRESH_HOURS !== 'string') {
  envError('REFRESH_HOURS');
} else {
  const main = async () => {
    const center: [number, number] = [Number(e.LONGITUDE), Number(e.LATITUDE)];
    const observations = await getObservations(e.AWS_PREFIX as string, new Date('2024-01-01T12:00:00Z'));
    if (!isOk(observations)) { return; }
    const overlay = await createOverlay(
      './gis/roads.geojson',
      './gis/places.geojson',
      center,
      1920,
      1080,
    );
    await drawMap(
      'map.png',
      observations.value,
      overlay,
      center,
      1920,
      1080,
    );
  };
  main().then(() => console.log('done!'));
}
