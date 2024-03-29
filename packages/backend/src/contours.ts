import * as fs from 'node:fs/promises';
import * as turf from '@turf/turf';
import {
  Observation,
} from './airnow.js';
import {
  // DbEntry,
  readDb,
} from './db.js';


function computePm25Contour(observations: Observation[]) {
  const points = turf.featureCollection(observations
    .filter((x) => Number(x.PM25_Measured) !== 0)
    .map((x) => turf.point(
      [Number(x.Latitude), Number(x.Longitude)], 
      { pm25Aqi: Number(x.PM25_AQI) }
    ))
  );

  const grid = turf.interpolate(points, 1, { gridType: 'point', property: 'pm25Aqi' });
  return grid;
  // console.log(points.features.length, grid.features.length);
  // const breaks: [number, object][] = [
  //   [ 50,  { aqiLevel: 0 } ], // good
  //   [ 100, { aqiLevel: 1 } ], // moderate
  //   [ 150, { aqiLevel: 2 } ], // unhealthy for sensitive groups
  //   [ 200, { aqiLevel: 3 } ], // unhealthy
  //   [ 300, { aqiLevel: 4 } ], // very unhealthy
  //   [ 500, { aqiLevel: 5 } ], // hazardous
  // ];
  // const contours = turf.isobands(
  //   grid, 
  //   breaks.map<number>((x) => x[0]), 
  //   {
  //     zProperty: 'pm25Aqi',
  //     breaksProperties: breaks.map((x) => x[1]),
  //   }
  // );

  // console.log(contours);

  // return contours;
}


async function convertDb(dbFilename: string) {
  const db = await readDb(dbFilename);

  const dbContours = db.map((entry) => computePm25Contour(entry.observations));
  await fs.writeFile('contours.json', JSON.stringify(dbContours));
  console.log(dbContours);
}


convertDb('airnowdb.json').then(() => {});
