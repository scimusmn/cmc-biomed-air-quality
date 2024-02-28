import * as nodeUrl from 'node:url';
import * as http from 'node:http';
import * as https from 'node:https';
import * as stream from 'node:stream/promises';
import { parse } from 'csv-parse';

export enum ResultType {
  Ok = 'resulttype-ok',
  Fail = 'resulttype-fail',
}

export interface Ok<T> {
  type: typeof ResultType.Ok;
  value: T;
}
const Ok = <T> (value: T): Ok<T> => ({ type: ResultType.Ok, value });

interface Fail<T> {
  type: typeof ResultType.Fail;
  value: T;
}
const Fail = <T> (value: T): Fail<T> => ({ type: ResultType.Fail, value });

type Result<L, R> = Ok<L> | Fail<R>

enum Failure {
  HttpsRequest,
  ParsePipeline,
}

// helper function for asynchronous HTTPS GET
export function getStream(url: nodeUrl.URL): Promise<Result<http.IncomingMessage, Failure>> {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => resolve(Ok(res)));
    req.on('error', () => resolve(Fail(Failure.HttpsRequest)));
  });
}


interface Observation {
  AQSID: string;
  SiteName: string;
  Status: string;
  EPARegion: string;
  Latitude: string;
  Longitude: string;
  Elevation: string;
  GMTOffset: string;
  CountryCode: string;
  StateName: string;
  ValidDate: string;
  ValidTime: string;
  DataSource: string;
  ReportingArea_PipeDelimited: string;
  OZONE_AQI: string;
  PM10_AQI: string;
  PM25_AQI: string;
  NO2_AQI: string;
  OZONE_Measured: string;
  PM10_Measured: string;
  PM25_Measured: string;
  NO2_Measured: string;
  PM25: string;
  PM25_Unit: string;
  OZONE: string;
  OZONE_Unit: string;
  NO2: string;
  NO2_Unit: string;
  CO: string;
  CO_Unit: string;
  SO2: string;
  SO2_Unit: string;
  PM10: string;
  PM10_Unit : string;
}

// shift a date's time offset to be UTC
function toUtc(date: Date): Date {
  const utcDate = new Date(date);
  utcDate.setMinutes(utcDate.getMinutes() + date.getTimezoneOffset());
  return utcDate;
}

// get observations from a specific date & time
export async function getObservations(date: Date): Promise<Result<Observation[], Failure>> {
  // construct appropriate URL
  const d = toUtc(date);
  const z = (x: number) => String(x).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  const mm = z(d.getMonth() + 1);
  const dd = z(d.getDate());
  const HH = z(d.getHours());
  const dateStr = `${yyyy}${mm}${dd}`;
  const url = new nodeUrl.URL(
    `https://s3-us-west-.amazonaws.com//files.airnowtech.org/airnow/${yyyy}/${dateStr}/HourlyAQObs_${dateStr}${HH}.dat`,
  );

  // build CSV parsing pipeline
  const csv = parse({
    delimiter: ',',
  });
  const records: string[][] = [];
  csv.on('readable', () => {
    for (let r = csv.read(); r !== null; r = csv.read()) {
      records.push(r);
    }
  });
  const msg = await getStream(url);
  if (msg.type === ResultType.Fail) {
    return msg;
  }
  msg.value.pipe(csv);
  try {
    await stream.finished(csv);
  } catch (err) {
    console.log(err);
    return Fail(Failure.ParsePipeline);
  }

  // map each parsed record to Observation
  const keys: Record<string, number> = {};
  (records[0]||[]).forEach((k, i) => keys[k] = i);
  const k = (r: string[], key: string) => r[keys[key] || r.length] || '';
  return Ok(records.slice(1).map((r) => ({
    AQSID: k(r, 'AQSID'),
    SiteName: k(r, 'SiteName'),
    Status: k(r, 'Status'),
    EPARegion: k(r, 'EPARegion'),
    Latitude: k(r, 'Latitude'),
    Longitude: k(r, 'Longitude'),
    Elevation: k(r, 'Elevation'),
    GMTOffset: k(r, 'GMTOffset'),
    CountryCode: k(r, 'CountryCode'),
    StateName: k(r, 'StateName'),
    ValidDate: k(r, 'ValidDate'),
    ValidTime: k(r, 'ValidTime'),
    DataSource: k(r, 'DataSource'),
    ReportingArea_PipeDelimited: k(r, 'ReportingArea_PipeDelimited'),
    OZONE_AQI: k(r, 'OZONE_AQI'),
    PM10_AQI: k(r, 'PM10_AQI'),
    PM25_AQI: k(r, 'PM25_AQI'),
    NO2_AQI: k(r, 'NO2_AQI'),
    OZONE_Measured: k(r, 'OZONE_Measured'),
    PM10_Measured: k(r, 'PM10_Measured'),
    PM25_Measured: k(r, 'PM25_Measured'),
    NO2_Measured: k(r, 'NO2_Measured'),
    PM25: k(r, 'PM25'),
    PM25_Unit: k(r, 'PM25_Unit'),
    OZONE: k(r, 'OZONE'),
    OZONE_Unit: k(r, 'OZONE_Unit'),
    NO2: k(r, 'NO2'),
    NO2_Unit: k(r, 'NO2_Unit'),
    CO: k(r, 'CO'),
    CO_Unit: k(r, 'CO_Unit'),
    SO2: k(r, 'SO2'),
    SO2_Unit: k(r, 'SO2_Unit'),
    PM10: k(r, 'PM10'),
    PM10_Unit: k(r, 'PM10_Unit'),
  })));
}

// get the most recent observations
async function recursiveGetCurrent(depth: number, maxDepth: number): Promise<Result<Observation[], Failure>> {
  const d = new Date();
  d.setHours(d.getHours() - depth);
  console.log(`pass ${depth}, ${d}`);
  const result = await getObservations(d);
  if (result.type === ResultType.Ok) {
    // everything is fine c:
    return result;
  } else if (depth > maxDepth) {
    // failure, but depth has been exceeded :c
    return result;
  } else {
    // go one level deeper!
    return await recursiveGetCurrent(depth+1, maxDepth);
  }
}
export async function getCurrentObservations(): Promise<Result<Observation[], Failure>> {
  return await recursiveGetCurrent(0, 10);
}

// convert degrees to radians
function toRadians(degrees: number): number {
  return Math.PI * (degrees / 180);
}

// compute the great-circle distance between two lat/long points on a sphere
function greatCircleDist(
  radius: number,
  lat1: number,
  long1: number,
  lat2: number,
  long2: number,
): number {
  return radius * Math.acos(
    (Math.sin(toRadians(lat1)) * Math.sin(toRadians(lat2)))
    + (
      Math.cos(toRadians(lat1))
      * Math.cos(toRadians(lat2))
      * Math.cos(toRadians(Math.abs(long1 - long2)))
    ),
  );
}

const EARTH_RADIUS = 6378.137; // kilometers

// create a filter function so that only observations within range pass the test
export function distanceFilter(latitude: number, longitude: number, maxDistance: number): (o: Observation) => boolean {
  return (o: Observation) => {
		const distance = greatCircleDist(EARTH_RADIUS, Number(o.Latitude), Number(o.Longitude), latitude, longitude);
		return distance <= maxDistance;
	};
}
