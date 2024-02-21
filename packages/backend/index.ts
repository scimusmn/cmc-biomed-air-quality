require('dotenv').config();
const https = require('node:https');
const http = require('node:http');
const url = require('node:url');
const { parse } = require('csv-parse');

interface MonitoringSite {
  StationID: string;
  AQSID: string;
  FullAQSID: string;
  MonitorType: string;
  Parameter: string;
  SiteCode: string;
  SiteName: string;
  Status: string;
  AgencyID: string;
  AgencyName: string;
  EPARegion: string;
  Latitude: string;
  Longitude: string;
  Elevation: string;
  GMTOffset: string;
  CountryFIPS: string;
  CBSA_ID: string;
  CBSA_Name: string;
  StateAQSCode: string;
  StateAbbreviation: string;
  CountyAQSCode: string;
  CountyName: string;
}

/** get the full list of sites from AirNow */
function getSites()
  : Promise<[typeof http.ClientRequest, MonitoringSite[]]> {
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
        const keys: any = Object.fromEntries(
          (records[0] || []).map((x, i) => [x, i])
        );
        const getKey = (arr: string[], key: string) => {
          const value = arr[keys[key]];
          if (value !== null && value !== undefined) { 
            return value;
          } else {
            throw new Error(`could not find key ${key} in array ${arr}`);
          }
        };
        const result = records.slice(1).map((values) => {
          const obj: MonitoringSite = {
            StationID: getKey(values, 'StationID'),
            AQSID: getKey(values, 'AQSID'),
            FullAQSID: getKey(values, 'FullAQSID'),
            MonitorType: getKey(values, 'MonitorType'),
            Parameter: getKey(values, 'Parameter'),
            SiteCode: getKey(values, 'SiteCode'),
            SiteName: getKey(values, 'SiteName'),
            Status: getKey(values, 'Status'),
            AgencyID: getKey(values, 'AgencyID'),
            AgencyName: getKey(values, 'AgencyName'),
            EPARegion: getKey(values, 'EPARegion'),
            Latitude: getKey(values, 'Latitude'),
            Longitude: getKey(values, 'Longitude'),
            Elevation: getKey(values, 'Elevation'),
            GMTOffset: getKey(values, 'GMTOffset'),
            CountryFIPS: getKey(values, 'CountryFIPS'),
            CBSA_ID: getKey(values, 'CBSA_ID'),
            CBSA_Name: getKey(values, 'CBSA_Name'),
            StateAQSCode: getKey(values, 'StateAQSCode'),
            StateAbbreviation: getKey(values, 'StateAbbreviation'),
            CountyAQSCode: getKey(values, 'CountyAQSCode'),
            CountyName: getKey(values, 'CountyName'),
          };
          return obj;
        });
        resolve([res, result]);
      });
    });
  });
}


function toRadians(degrees: number): number {
  return Math.PI * (degrees/180);
}
function greatCircleDist(
  radius: number,
  lat1: number,
  long1: number,
  lat2: number,
  long2: number
): number {
  return radius * Math.acos(
    (Math.sin(toRadians(lat1)) * Math.sin(toRadians(lat2))) +
    (Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(toRadians(Math.abs(long1 - long2))))
  );
}


const EARTH_RADIUS = 6378.137; // kilometers
async function getNearbyActiveSites(
  latitude: number,
  longitude: number,
  maxDist: number
): Promise<[typeof http.ClientRequest, MonitoringSite[]]> {
  const [res, sites] = await getSites();
  const filteredSites = sites
    .filter((site) => site.Status === 'Active')
    .filter(
      (site) => maxDist >= greatCircleDist(
        EARTH_RADIUS,
        Number(site.Latitude), Number(site.Longitude),
        latitude, longitude
      )
    );
  return [res, filteredSites];
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

/* getLatLong(process.env.API_KEY as string, 45, -90).then(([_, obj]) => {
  obj.forEach((x) => console.log(x.ParameterName, x.Latitude, x.Longitude));
}); //*/
(async () => {
  const [_, sites] = await getNearbyActiveSites(45, -90, 100);
  sites.forEach((site) => {
    console.log(site, greatCircleDist(
      EARTH_RADIUS,
      Number(site.Latitude), Number(site.Longitude),
      45, -90
    ));
  });
})();
