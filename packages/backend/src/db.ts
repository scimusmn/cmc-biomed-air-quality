import * as fs from 'node:fs/promises';
import * as path from 'node:path';
// import Bottleneck from 'bottleneck';
import {
  Result,
  Ok,
  Fail,
  isOk,
} from './result.js';
import {
  Failure,
  //   Observation,
  getObservations,
  distanceFilter,
} from './airnow.js';


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// db stuff
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


// type guard helper for arrays
function isArrayType<T>(o: any[], isT: (o1: any) => o1 is T): o is T[] {
  return o.reduce((acc, x) => acc && isT(x), true);
}


function zeroDate(date: Date): Date {
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
}

function compactDate(date: Date): string {
  const z = (x: number) => String(x).padStart(2, '0');
  const yyyy = String(date.getFullYear());
  const mm = z(date.getMonth() + 1);
  const dd = z(date.getDate());
  return `${yyyy}${mm}${dd}`;
}


// an individual (sub)observation
type LatLong = [number, number];
type Aqi = number | null;
type DbObservation = [
  LatLong,
  [Aqi, Aqi],
];

function isDbObservation(o: any): o is DbObservation {
  if (!Array.isArray(o)) { return false; }
  if (o.length !== 2) { return false; }
  const [latlong, aqis] = o;
  const isNumber = (x: any): x is number => typeof x === 'number';
  const isNumberOrNull = (x: any): x is number | null => isNumber(x) || x === null;
  if (!isArrayType(latlong, isNumber) || latlong.length !== 2) { return false; }
  if (!isArrayType(aqis, isNumberOrNull)
    || latlong.length !== 2) {
    return false;
  }
  return true;
}


// database entry
interface DbEntry {
  latitude: number;
  longitude: number;
  range: number;
  date: Date;
  observations: DbObservation[];
}

function isDbEntry(o: any): o is DbEntry {
  if (typeof o.latitude !== 'number') { return false; }
  if (typeof o.longitude !== 'number') { return false; }
  if (typeof o.range !== 'number') { return false; }
  if (!(o.date instanceof Date)) { return false; }
  if (!isArrayType(o.observations, isDbObservation)) { return false; }
  return true;
}


// check if a file exists
export async function fileExists(filename: string): Promise<Result<boolean, Error>> {
  return fs.stat(filename)
    .then(() => Ok(true))
    .catch((err) => {
      if (err.code === 'ENOENT') {
        return Ok(false);
      }
      return Fail(err);
    });
}


export async function readJsonFile(filename: string, reviver?: (k: any, v: any) => any): Promise<Result<any, Error>> {
  try {
    const buf = await fs.readFile(filename);
    const obj = JSON.parse(buf.toString(), reviver);
    return Ok(obj);
  } catch (err) {
    return Fail(err);
  }
}


export async function readDbStart(dbPath: string): Promise<Result<Date, null>> {
  const filename = path.join(dbPath, 'start.json');
  const result = await readJsonFile(filename);
  if (isOk(result)) {
    if (!Array.isArray(result.value) || result.value.length === 0) {
      console.error(`malformed start value in ${filename}`);
      return Fail(null);
    }
    return Ok(zeroDate(new Date(result.value[0] as string)));
  } else {
    console.error(`failed to parse ${filename}: ${result.value}`);
    return Fail(null);
  }
}


// load a specific db entry from disk
export async function readDbEntry(dbPath: string, date: Date): Promise<Result<DbEntry, null>> {
  const filename = path.join(dbPath, `${compactDate(date)}.json`);
  const result = await readJsonFile(filename, (k, v) => {
    if (k === 'date') {
      return zeroDate(new Date(v));
    }
    return v;
  });

  if (isOk(result)) {
    if (isDbEntry(result.value)) {
      return Ok(result.value);
    }
    console.error(`malformed DbEntry in ${filename}`);
    return Fail(null);
  }
  console.error(`failed to parse ${filename}: ${result.value}`);
  return Fail(null);
}



// get the dates of entries that need to be refreshed
// whether because they have a mismatched lat/long/range
// or because they are newer than refreshHours old (and so may still be updating
// as new data comes in)
// function getStaleDates(
//   db: DbEntry[],
//   latitude: number,
//   longitude: number,
//   range: number,
//   refreshHours: number,
// ): Date[] {
//   const refreshCutoff = new Date();
//   refreshCutoff.setHours(refreshCutoff.getHours() - refreshHours);
//   const staleEntries = db
//     .filter((entry) => {
//       if (
//         entry.latitude !== latitude
//         || entry.longitude !== longitude
//         || entry.range !== range
//         || entry.date >= refreshCutoff
//       ) {
//         // mismatch and/or too new; stale!
//         return true;
//       }
//       return false;
//     });
//   return staleEntries.map((entry) => entry.date);
// }
//
//
// // get the dates that are missing from the database
// function getMissingDates(db: DbEntry[]): Date[] {
//   const dbDates = new Set(db.map((entry) => entry.date.toISOString()));
//   const yearHours = [...Array(365 * 24).keys()];
//   const allDates = yearHours.map((hour) => {
//     const d = new Date();
//     d.setHours(d.getHours() - hour);
//     d.setMinutes(0);
//     d.setSeconds(0);
//     d.setMilliseconds(0);
//     return d;
//   });
//   return allDates.filter((d) => !dbDates.has(d.toISOString()));
// }


// HTTPS GET a db entry for the observations associated with a particular date
async function getDbEntry(
  awsPrefix: string,
  date: Date,
  latitude: number,
  longitude: number,
  range: number,
): Promise<Result<DbEntry, Failure>> {
  console.log(`downloading data for ${date.toISOString()}...`);
  const result = await getObservations(awsPrefix, date);
  if (!isOk(result)) {
    console.error(`failed to fetch data for ${date.toISOString()}: ${result.value}`);
    return result;
  }
  console.log(`fetched data for ${date.toISOString()}`);
  const maybeNumber = (x: string) => (x.length === 0 ? null : Number(x));
  return Ok({
    latitude,
    longitude,
    range,
    date,
    observations: result.value
      .filter(distanceFilter(latitude, longitude, range))
      .filter((o) => o.Status === 'Active')
      .map((o) => [
        [Number(o.Latitude), Number(o.Longitude)],
        [maybeNumber(o.PM25_AQI), maybeNumber(o.OZONE_AQI)],
      ] as DbObservation),
  });
}


// recursive helper to re-try failed HTTPS GET requests N times
// returns Ok if any retry succeeds; otherwise returns Fail
async function recursiveGetDbEntry(
  awsPrefix: string,
  date: Date,
  latitude: number,
  longitude: number,
  range: number,
  retries: number,
) {
  const result = await getDbEntry(
    awsPrefix,
    date,
    latitude,
    longitude,
    range,
  );
  if (!isOk(result) && retries > 0) {
    return recursiveGetDbEntry(
      awsPrefix,
      date,
      latitude,
      longitude,
      range,
      retries - 1,
    );
  }
  return result;
}


async function refreshDate(
	awsPrefix: string,
	dbPrefix: string,
	date: Date,
	latitude: number,
	longitude: number,
	range: number,
	retries: number,
) {
	const result = await recursiveGetDbEntry(
		awsPrefix, date, latitude, longitude, range, 3,
	);
	if (!isOk(result)) {
		console.error(`!!! CANNOT DOWNLOAD DATA FOR ${date.toISOString()} !!!`);
		return;
	}

	await fs.writeFile(
	  path.join(dbPrefix, `${compactDate(date)}.json`),
	  JSON.stringify(result.value),
	)
	console.log(`wrote data for ${date.toISOString()}`);
}


// get the most recent available observation
// an Ok result contains the most recent available date, and a
// Fail result indicates that we are likely offline
async function mostRecentDate(awsPrefix: string): Promise<Result<Date, null>> {
  const now = zeroDate(new Date());

  // all times over the past 24 hours
  const recentTimes = [...Array(24).keys()].map((x) => {
    const d = new Date(now);
    d.setHours(d.getHours() - x);
    return d;
  });
  const serverResponses = await Promise.all(
    recentTimes.map((time) => recursiveGetDbEntry(awsPrefix, time, 0, 0, 0, 10)),
  );

  const validResponses = serverResponses.filter((x) => isOk(x));
  if (validResponses.length === 0) {
    return Fail(null);
  }
  return Ok((validResponses[0] as Ok<DbEntry>).value.date);
}


// synchronize the existing db file with the AirNow file service
export default async function synchronize(
  awsPrefix: string,
  dbPath: string,
  latitude: number,
  longitude: number,
  range: number,
  refreshHours: number,
) {
	console.log(latitude, longitude, range, refreshHours);
  // determine most recent available datum
  const remoteStartDateResult = await mostRecentDate(awsPrefix);
  if (!isOk(remoteStartDateResult)) {
    console.error('network communications appear to be disrupted!');
    return;
  }
  const remoteStartDate = remoteStartDateResult.value as Date;
  const cutoffDate = new Date(remoteStartDate);
  cutoffDate.setHours(cutoffDate.getHours() - (365 * 24));

  // get the current db state
  const dbStartDateResult = await readDbStart(dbPath);
  const dbStartDate = isOk(dbStartDateResult) ? zeroDate(dbStartDateResult.value) : remoteStartDate;
  const dbDates = [...Array(365 * 24).keys()].map((x) => {
    const d = new Date(dbStartDate);
		d.setHours(d.getHours() - x);
		zeroDate(d);
    return d;
  });
  const currentState = await Promise.all(dbDates.map(
    (date) => readDbEntry(dbPath, date)
      .then((result) => {
        if (isOk(result)) {
          const {
            latitude, longitude, range, date,
          } = result.value;
          return {
            latitude, longitude, range, date,
          };
        }
        return null;
      }),
  ));

	// refresh stale times
	const dbRefreshCutoff = new Date(dbStartDate);
	dbRefreshCutoff.setHours(dbRefreshCutoff.getHours() - refreshHours);
	
	

  console.log(currentState);
}
