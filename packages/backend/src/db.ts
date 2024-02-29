import * as fs from 'node:fs/promises';
import { Observation, isObservation } from './airnow.js';

interface DbEntry {
  latitude: number;
  longitude: number;
  range: number;
  date: Date;
  observations: Observation[];
}

function isArrayType<T>(o: any[], isT: (o1: any) => o1 is T): o is T[] {
  return o.reduce((acc, x) => {
    return acc && isT(x)
  }, true);
}

function isDbEntry(o: any): o is DbEntry {
  if (typeof o.latitude !== 'number') { return false; }
  if (typeof o.longitude !== 'number') { return false; }
  if (typeof o.range !== 'number') { return false; }
  if (!(o.date instanceof Date)) { return false; }
  if (!isArrayType(o.observations, isObservation)) { return false; }
  return true;
}

async function readDb(dbFilename: string): Promise<DbEntry[]> {
  const data = await fs.readFile(dbFilename);
  const o = JSON.parse(data.toString(), (k, v) => {
    if (k == 'date') {
      return new Date(v);
    } else {
      return v;
    }
  });
  if (isArrayType(o, isDbEntry)) {
    return o;
  } else {
    throw new Error(`failed to parse database from ${dbFilename}`);
  }
}

export async function synchronize(
  awsPrefix: string,
  dbFilename: string,
  latitude: number,
  longitude: number,
  range: number,
  refreshHours: number
) {
  const db = await readDb(dbFilename);
  console.log(db);
  console.log(awsPrefix, latitude, longitude, range, refreshHours);
}
