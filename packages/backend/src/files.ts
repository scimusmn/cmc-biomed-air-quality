import * as nodeUrl from 'node:url';
import * as http from 'node:http';
import * as https from 'node:https';
import * as stream from 'node:stream/promises';
import { parse } from 'csv-parse';

export function getStream(url: nodeUrl.URL): Promise<http.IncomingMessage> {
  return new Promise((resolve) => {
    https.get(url, resolve);
  });
}

export async function getText(url: nodeUrl.URL): Promise<[http.IncomingMessage, string]> {
  const msg = await getStream(url);
  let text = '';
  msg.on('data', (chunk: string) => { text += chunk; });
  await stream.finished(msg);
  return [msg, text];
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

function toUtc(date: Date): Date {
  const utcDate = new Date(date);
  utcDate.setMinutes(utcDate.getMinutes() - date.getTimezoneOffset());
  return utcDate;
}

export async function getObservations(date: Date): Promise<Observation[]> {
  const d = toUtc(date);
  const z = (x: number) => String(x).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  const mm = z(d.getMonth() + 1);
  const dd = z(d.getDate());
  const HH = z(d.getHours());
  const dateStr = `${yyyy}${mm}${dd}`;
  const url = new nodeUrl.URL(
    `https://s3-us-west-1.amazonaws.com//files.airnowtech.org/airnow/${yyyy}/${dateStr}/HourlyAQObs_${dateStr}${HH}.dat`,
  );

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
  msg.pipe(csv);
  await stream.finished(csv);
  return records.map((r) => ({
    AQSID: r[0] || '',
    SiteName: r[1] || '',
    Status: r[2] || '',
    EPARegion: r[3] || '',
    Latitude: r[4] || '',
    Longitude: r[5] || '',
    Elevation: r[6] || '',
    GMTOffset: r[7] || '',
    CountryCode: r[8] || '',
    StateName: r[9] || '',
    ValidDate: r[10] || '',
    ValidTime: r[11] || '',
    DataSource: r[12] || '',
    ReportingArea_PipeDelimited: r[13] || '',
    OZONE_AQI: r[14] || '',
    PM10_AQI: r[15] || '',
    PM25_AQI: r[16] || '',
    NO2_AQI: r[17] || '',
    OZONE_Measured: r[18] || '',
    PM10_Measured: r[19] || '',
    PM25_Measured: r[20] || '',
    NO2_Measured: r[21] || '',
    PM25: r[22] || '',
    PM25_Unit: r[23] || '',
    OZONE: r[24] || '',
    OZONE_Unit: r[25] || '',
    NO2: r[26] || '',
    NO2_Unit: r[27] || '',
    CO: r[28] || '',
    CO_Unit: r[29] || '',
    SO2: r[30] || '',
    SO2_Unit: r[31] || '',
    PM10: r[32] || '',
    PM10_Unit: r[33] || '',
  }));
}
