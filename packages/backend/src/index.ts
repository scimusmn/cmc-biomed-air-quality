import 'dotenv/config';
import { synchronize } from './db.js';

const e = process.env;

function envError(key: string) {
  throw new Error(`.env: please ensure ${key} is present in your environment`);
}


if (typeof e.AWS_PREFIX !== 'string') {
  envError('AWS_PREFIX');
} else if (typeof e.DB_FILE !== 'string') {
  envError('DB_FILE');
} else if (typeof e.LATITUDE !== 'string') {
  envError('LATITUDE');
} else if (typeof e.LONGITUDE !== 'string') {
  envError('LONGITUDE');
} else if (typeof e.RANGE !== 'string') {
  envError('RANGE');
} else if (typeof e.REFRESH_HOURS !== 'string') {
  envError('REFRESH_HOURS');
} else {
  synchronize(
    e.AWS_PREFIX, 
    e.DB_FILE,
    Number(e.LATITUDE),
    Number(e.LONGITUDE),
    Number(e.RANGE),
    Number(e.REFRESH_HOURS),
  ).then(() => console.log('done!'));
}
