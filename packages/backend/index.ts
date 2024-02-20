require('dotenv').config();
const https = require('node:https');
const http = require('node:http');
const url = require('node:url');

function getLatLong(token: string, latitude: number, longitude: number) {
  console.log(token);
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

getLatLong(process.env.API_KEY as string, 45, -90).then(([_, obj]) => console.log(obj));
