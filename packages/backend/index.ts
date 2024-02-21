require('dotenv').config();
const https = require('node:https');
const http = require('node:http');
const url = require('node:url');
const { parse } = require('csv-parse');

function getSites(): Promise<[typeof http.ClientRequest, string[][]]> {
  return new Promise((resolve) => {
    const u = new url.URL('https://s3-us-west-1.amazonaws.com//files.airnowtech.org/airnow/today/Monitoring_Site_Locations_V2.dat');
    https.get(u, (res: typeof http.ClientRequest) => {
      const records: string[][] = [];
      const parser = parse({ delimiter: '|' });
      res.pipe(parser);
      parser.on('readable', () => {
        let record: string[] = parser.read();
        while (record !== null) {
          records.push(record);
          record = parser.read();
        }
      });
      parser.on('error', (err: Error) => {
        console.error(err.message);
      });
      parser.on('end', () => {
        resolve([res, records]);
      });
    });
  });
}

interface Observation {
  DateObserved: string;
  HourObserved: number;
  LocalTimeZone: string;
  ReportingArea: string;
  StateCode: string;
  Latitude: number;
  Longitude: number;
  ParameterName: string;
  AQI: number;
  Category: { Number: number; Name: string };
}

function getLatLong(
  token: string,
  latitude: number,
  longitude: number,
): Promise<[typeof http.ClientRequest, [Observation]]> {
  return new Promise((resolve) => {
    const u = new url.URL('https://www.airnowapi.org/aq/observation/latLong/current/');
    u.searchParams.append('latitude', latitude);
    u.searchParams.append('longitude', longitude);
    u.searchParams.append('distance', 150);
    u.searchParams.append('format', 'application/json');
    u.searchParams.append('API_KEY', token);
    https.get(u, (res: typeof http.ClientRequest) => {
      let body = '';
      res.on('data', (chunk: string) => {
        body += chunk;
      });

      res.on('end', () => {
        const obj = JSON.parse(body);
        resolve([res, obj]);
      });
    });
  });
}

getLatLong(process.env.API_KEY as string, 45, -90).then(([_, obj]) => {
  obj.forEach((x) => console.log(x.ParameterName, x.Latitude, x.Longitude));
});
// getSites().then(([_, records]) => console.log(records[0]));
