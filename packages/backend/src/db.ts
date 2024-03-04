import * as fs from 'node:fs/promises';
import Bottleneck from 'bottleneck';
import {
  Result,
  Ok,
  Failure,
  ResultType,
  Observation,
  isObservation,
  getObservations,
  distanceFilter,
} from './airnow.js';

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// db stuff
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// a db entry, consisting of observations for a particular lat/long/range and time
interface DbEntry {
  latitude: number;
  longitude: number;
  range: number;
  date: Date;
  observations: Observation[];
}

// type guard helper for arrays
function isArrayType<T>(o: any[], isT: (o1: any) => o1 is T): o is T[] {
  return o.reduce((acc, x) => acc && isT(x), true);
}

// db entry type guard
function isDbEntry(o: any): o is DbEntry {
  if (typeof o.latitude !== 'number') { return false; }
  if (typeof o.longitude !== 'number') { return false; }
  if (typeof o.range !== 'number') { return false; }
  if (!(o.date instanceof Date)) { return false; }
  if (!isArrayType(o.observations, isObservation)) { return false; }
  return true;
}

// read the database from disk
async function readDb(dbFilename: string): Promise<DbEntry[]> {
  const data = await fs.readFile(dbFilename);
  const o = JSON.parse(data.toString(), (k, v) => {
    if (k === 'date') {
      const d = new Date(v);
      // we only care about YYYY-MM-DD:HH, so set the rest to 0
      d.setMinutes(0);
      d.setSeconds(0);
      d.setMilliseconds(0);
      return d;
    }
    return v;
  });
  if (isArrayType(o, isDbEntry)) {
    return o;
  }
  throw new Error(`failed to parse database from ${dbFilename}`);
}

// get the dates of entries that need to be refreshed
// whether because they have a mismatched lat/long/range
// or because they are newer than refreshHours old (and so may still be updating
// as new data comes in)
function getStaleDates(
  db: DbEntry[],
  latitude: number,
  longitude: number,
  range: number,
  refreshHours: number,
): Date[] {
  const refreshCutoff = new Date();
  refreshCutoff.setHours(refreshCutoff.getHours() - refreshHours);
  const staleEntries = db
    .filter((entry) => {
      if (
        entry.latitude !== latitude
        || entry.longitude !== longitude
        || entry.range !== range
        || entry.date >= refreshCutoff
      ) {
        // mismatch and/or too new; stale!
        return true;
      }
      return false;
    });
  return staleEntries.map((entry) => entry.date);
}

// get the dates that are missing from the database
function getMissingDates(db: DbEntry[]): Date[] {
  const dbDates = new Set(db.map((entry) => entry.date.toISOString()));
  const yearHours = [...Array(365 * 24).keys()];
  const allDates = yearHours.map((hour) => {
    const d = new Date();
    d.setHours(d.getHours() - hour);
    d.setMinutes(0);
    d.setSeconds(0);
    d.setMilliseconds(0);
    return d;
  });
  return allDates.filter((d) => !dbDates.has(d.toISOString()));
}

// HTTPS GET a db entry for the observations associated with a particular date
async function getDbEntry(
  awsPrefix: string,
  date: Date,
  latitude: number,
  longitude: number,
  range: number,
): Promise<Result<DbEntry, Failure>> {
  console.log(`downloading data for ${date}...`);
  const result = await getObservations(awsPrefix, date);
  if (result.type === ResultType.Fail) {
    console.error(`failed to fetch data for ${date}: ${result.value}`);
    return result;
  }
  console.log(`fetched data for ${date}`);
  return Ok({
    latitude,
    longitude,
    range,
    date,
    observations: result.value
      .filter(distanceFilter(latitude, longitude, range))
      .filter((o) => o.Status === 'Active'),
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
  if (result.type === ResultType.Fail && retries > 0) {
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

// synchronize the existing db file with the AirNow file service
export default async function synchronize(
  awsPrefix: string,
  dbFilename: string,
  latitude: number,
  longitude: number,
  range: number,
  refreshHours: number,
) {
  const db = await readDb(dbFilename);

  // determine which dates need updating (staleDates) and which need to be inserted (missingDates)
  const staleDates = getStaleDates(db, latitude, longitude, range, refreshHours);
  const missingDates = getMissingDates(db);

  // rate limiter so we don't do something awful like try to fetch 8600 data files simultaneously
  const limiter = new Bottleneck({ maxConcurrent: 20 });
  const MAX_RETRIES = 3;

  // helper to wrap limiter-managed requests
  const fetchResults = (dates: Date[]) => Promise.all(dates.map(
    (date) => limiter.schedule(
      () => recursiveGetDbEntry(
        awsPrefix,
        date,
        latitude,
        longitude,
        range,
        MAX_RETRIES,
      ),
    ),
  ));

  // perform our GET requests
  const [staleResults, missingResults] = await Promise.all([
    fetchResults(staleDates),
    fetchResults(missingDates),
  ]);

  // check for failures
  const failures = [...staleResults, ...missingResults]
    .filter((r) => r.type === ResultType.Fail);
  const requestFailure = failures
    .reduce((acc, r) => acc || r.value === Failure.HttpsRequest, false);
  if (requestFailure) {
    console.error('possible API outage or internet connection issue detected!');
  }

  // update stale values
  const staleUpdates: Record<string, DbEntry> = staleResults
    .map<[string, Result<DbEntry, Failure>]>(
    (result, idx) => [(staleDates[idx] as Date).toISOString(), result],
  )
    .filter<[string, Ok<DbEntry>]>(
    (pair): pair is [string, Ok<DbEntry>] => pair[1].type === ResultType.Ok,
  )
    .reduce<Record<string, DbEntry>>(
    (acc: Record<string, DbEntry>, [date, result]) => {
      acc[date] = result.value;
      return acc;
    },
    {},
  );
  const newDb = db.map((entry) => staleUpdates[entry.date.toISOString()] || entry);

  // insert missing values
  const missingEntries = missingResults
    .filter((result): result is Ok<DbEntry> => result.type === ResultType.Ok)
    .map((result) => result.value);
  const newNewDb = [...newDb, ...missingEntries].sort((a, b) => {
    if (a.date < b.date) {
      return -1;
    } if (a.date === b.date) {
      return 0;
    }
    return 1;
  });

  // write to disk
  await fs.writeFile(dbFilename, JSON.stringify(newNewDb));
}
