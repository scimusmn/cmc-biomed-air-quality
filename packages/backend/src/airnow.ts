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
    const request = https.get(url, (res) => resolve(Ok(res)));
    request.on('error', () => resolve(Fail(Failure.HttpsRequest)));
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
  PM10_Unit: string;
}

// Observation type guard
export function isObservation(observation: any): observation is Observation {
  for (const property in observation) {
    if (typeof observation[property] !== 'string') {
      return false;
    }
  }
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
  const utcDate = toUtc(date);
  const zeroPad = (x: number) => String(x).padStart(2, '0');
  const yyyy = String(utcDate.getFullYear());
  const mm = zeroPad(utcDate.getMonth() + 1);
  const dd = zeroPad(utcDate.getDate());
  const HH = zeroPad(utcDate.getHours());
  const dateStr = `${yyyy}${mm}${dd}`;
  const url = new nodeUrl.URL(
    `${aws}${yyyy}/${dateStr}/HourlyAQObs_${dateStr}${HH}.dat`,
  );

  // build CSV parsing pipeline
  const csv = parse({
    columns: true,
  });
  const records: string[][] = [];
  csv.on('readable', () => {
    // consume records as long as they are available
    let record;
    while ((record = csv.read()) !== null) {
      records.push(record);
    }
  });

  // perform the actual GET and pipe thru CSV parser
  const message = await getStream(url);
  if (message.type === ResultType.Fail) {
    return message;
  }
  message.value.pipe(csv);
  try {
    await stream.finished(csv);
  } catch (error) {
    // nicer Result error handling c:
    if (message.value.statusCode !== 200) {
      return Fail(Failure.HttpsResponse);
    } if (error instanceof CsvError) {
      return Fail(Failure.ParsePipeline);
    }
    return Fail(Failure.Unknown);
  }

  const observations: Observation[] = records.map((record) => {
    if (isObservation(record)) {
      return record;
    }
    throw new Error(`invalid record: ${record}`);
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
  center: [number, number],
  maxDistance: number,
): (o: Observation) => boolean {
  const [longitude, latitude] = center;
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
