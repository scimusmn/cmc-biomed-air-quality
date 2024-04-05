import * as nodeUrl from 'node:url';
import * as http from 'node:http';
import * as https from 'node:https';
import * as stream from 'node:stream/promises';
import { CsvError, parse } from 'csv-parse';
import {
  Result, ResultType, Ok, Fail,
} from './result.js';

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// HTTPS promise helpers
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Failure enum to record the various ways we can fail
export enum Failure {
  HttpsRequest = 'Failure-Https-Request',
  HttpsResponse = 'Failure-Https-Response',
  ParsePipeline = 'Failure-Parse-Pipeline',
  Unknown = 'Failure-Unknown',
}

// helper function for asynchronous HTTPS GET
export function getStream(url: nodeUrl.URL): Promise<Result<http.IncomingMessage, Failure>> {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => resolve(Ok(res)));
    req.on('error', () => resolve(Fail(Failure.HttpsRequest)));
  });
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// airnow Observations
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

export interface Observation {
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

// Observation type guard
export function isObservation(o: any): o is Observation {
  if (typeof o.AQSID !== 'string') { return false; }
  if (typeof o.SiteName !== 'string') { return false; }
  if (typeof o.Status !== 'string') { return false; }
  if (typeof o.EPARegion !== 'string') { return false; }
  if (typeof o.Latitude !== 'string') { return false; }
  if (typeof o.Longitude !== 'string') { return false; }
  if (typeof o.Elevation !== 'string') { return false; }
  if (typeof o.GMTOffset !== 'string') { return false; }
  if (typeof o.CountryCode !== 'string') { return false; }
  if (typeof o.StateName !== 'string') { return false; }
  if (typeof o.ValidDate !== 'string') { return false; }
  if (typeof o.ValidTime !== 'string') { return false; }
  if (typeof o.DataSource !== 'string') { return false; }
  if (typeof o.ReportingArea_PipeDelimited !== 'string') { return false; }
  if (typeof o.OZONE_AQI !== 'string') { return false; }
  if (typeof o.PM10_AQI !== 'string') { return false; }
  if (typeof o.PM25_AQI !== 'string') { return false; }
  if (typeof o.NO2_AQI !== 'string') { return false; }
  if (typeof o.OZONE_Measured !== 'string') { return false; }
  if (typeof o.PM10_Measured !== 'string') { return false; }
  if (typeof o.PM25_Measured !== 'string') { return false; }
  if (typeof o.NO2_Measured !== 'string') { return false; }
  if (typeof o.PM25 !== 'string') { return false; }
  if (typeof o.PM25_Unit !== 'string') { return false; }
  if (typeof o.OZONE !== 'string') { return false; }
  if (typeof o.OZONE_Unit !== 'string') { return false; }
  if (typeof o.NO2 !== 'string') { return false; }
  if (typeof o.NO2_Unit !== 'string') { return false; }
  if (typeof o.CO !== 'string') { return false; }
  if (typeof o.CO_Unit !== 'string') { return false; }
  if (typeof o.SO2 !== 'string') { return false; }
  if (typeof o.SO2_Unit !== 'string') { return false; }
  if (typeof o.PM10 !== 'string') { return false; }
  if (typeof o.PM10_Unit !== 'string') { return false; }
  return true;
}

// shift a date's time offset to be UTC
function toUtc(date: Date): Date {
  const utcDate = new Date(date);
  utcDate.setMinutes(utcDate.getMinutes() + date.getTimezoneOffset());
  return utcDate;
}

// get observations from a specific date & time
export async function getObservations(
  aws: string,
  date: Date,
): Promise<Result<Observation[], Failure>> {
  // construct appropriate URL
  const d = toUtc(date);
  const z = (x: number) => String(x).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  const mm = z(d.getMonth() + 1);
  const dd = z(d.getDate());
  const HH = z(d.getHours());
  const dateStr = `${yyyy}${mm}${dd}`;
  const url = new nodeUrl.URL(
    `${aws}${yyyy}/${dateStr}/HourlyAQObs_${dateStr}${HH}.dat`,
  );

  // build CSV parsing pipeline
  const csv = parse({
    delimiter: ',',
  });
  const records: string[][] = [];
  csv.on('readable', () => {
    // consume records as long as they are available
    for (let r = csv.read(); r !== null; r = csv.read()) {
      records.push(r);
    }
  });

  // perform the actual GET and pipe thru CSV parser
  const msg = await getStream(url);
  if (msg.type === ResultType.Fail) {
    return msg;
  }
  msg.value.pipe(csv);
  try {
    await stream.finished(csv);
  } catch (err) {
    // nicer Result error handling c:
    if (msg.value.statusCode !== 200) {
      return Fail(Failure.HttpsResponse);
    } if (err instanceof CsvError) {
      return Fail(Failure.ParsePipeline);
    }
    return Fail(Failure.Unknown);
  }

  // map each parsed record to Observation
  const keys: Record<string, number> = {};
  (records[0] || []).forEach((k, i) => { keys[k] = i; });
  const k = (r: string[], key: string) => r[keys[key] || r.length] || '';
  const observations: Observation[] = records.slice(1).map((r) => {
    const o: any = {};
    Object.keys(keys).forEach((key) => {
      o[key] = k(r, key);
    });
    if (isObservation(o)) {
      return o;
    }
    throw new Error(`invalid record: ${r}`);
  });

  // done
  return Ok(observations);
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// spherical-metric distance calculations
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

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
export function distanceFilter(
  latitude: number,
  longitude: number,
  maxDistance: number,
): (o: Observation) => boolean {
  return (o: Observation) => {
    const distance = greatCircleDist(
      EARTH_RADIUS,
      Number(o.Latitude),
      Number(o.Longitude),
      latitude,
      longitude,
    );
    return distance <= maxDistance;
  };
}
