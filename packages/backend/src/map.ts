import * as fs from 'node:fs/promises';
import { Canvas, createCanvas } from 'canvas';
import * as d3 from 'd3';
import * as turf from '@turf/turf';

// import interpolate from './interpolate.js';
import { 
  Observation,
  getObservations,
  distanceFilter 
} from './airnow.js';
import { isOk } from './result.js';


function createProjection(
  center: [number, number],
  width: number,
  height: number,
  zoom: number,
) {
  const [longitude, latitude] = center;
  return d3.geoOrthographic()
    .rotate([-longitude, -latitude])
    .fitExtent(
      [[-zoom, -zoom], [width + zoom, height + zoom]],
      d3.geoGraticule()(),
    );
}


export async function createOverlay(
  roadsFilename: string,
  citiesFilename: string,
  center: [number, number],
  width: number,
  height: number,
): Promise<Canvas> {
  // create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // load roads + cities geoJSON
  const [roads, cities] = <[d3.ExtendedFeature[], d3.ExtendedFeature[]]> await Promise.all(
    [roadsFilename, citiesFilename].map(async (filename) => {
      const buf = await fs.readFile(filename);
      const obj = JSON.parse(buf.toString());
      return obj.features;
    }),
  );

  // prep d3
  const projection = createProjection(center, width, height, 10000);
  const path = d3.geoPath(projection, ctx);

  // render roads
  roads.forEach((road) => {
    ctx.lineWidth = 1 / (road.properties ? road.properties.scalerank : 10);
    const lineGray = Math.floor((128 * ctx.lineWidth));
    ctx.strokeStyle = `rgb(${lineGray}, ${lineGray}, ${lineGray})`;
    ctx.beginPath();
    path(road);
    ctx.stroke();
  });

  // render city labels
  ctx.fillStyle = '#000000';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  cities.forEach((city) => {
    // draw map label
    const { NAME_EN, SCALERANK } = city.properties as any;
    ctx.font = `${70 / (SCALERANK + 1)}px sans-serif`;
    const metrics = ctx.measureText(NAME_EN);
    const pos = projection(
      city.geometry ? (city.geometry as any).coordinates as [number, number] : [0, 0],
    );
    const [x, y] = pos || [0, 0];
    ctx.strokeText(NAME_EN, x - (metrics.width / 2), y);
    ctx.fillText(NAME_EN, x - (metrics.width / 2), y);
  });

  return canvas;
}


export async function drawMap(
  filename: string,
  observations: Observation[],
  overlay: Canvas,
  center: [number, number],
  width: number,
  height: number,
) {
  console.log(observations);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#00ffff';
  ctx.fillRect(0, 0, width, height);

  const projection = createProjection(center, width, height, 10000);

  // generate grid
  console.log('create points feature');
  const aqiPoints = turf.featureCollection(
    observations.filter((o) => o.PM25_Measured === '1').map(
      (o) => turf.point([Number(o.Longitude), Number(o.Latitude)], { aqi: Number(o.PM25_AQI) }),
    ),
  );
  console.log('create grid');
  const aqiGrid = turf.interpolate(aqiPoints, 5, { property: 'aqi', gridType: 'point', weight: 5 });
  const path = d3.geoPath(projection, ctx);
  // compute contours
  console.log('compute contours');
  const contourBands = turf.isobands(aqiGrid, [0, 50, 100, 150, 200, 300, 500], { zProperty: 'aqi' });
  console.log('render contours');
  contourBands.features.forEach((shape) => {
    ctx.beginPath();
    console.log(shape);
    ctx.fillStyle = ((aqi) => {
      if (aqi === '300-500') { return 'maroon'; }
      if (aqi === '200-300') { return 'purple'; }
      if (aqi === '150-200') { return 'red'; }
      if (aqi === '100-150') { return 'orange'; }
      if (aqi === '50-100') { return 'yellow'; }
      return 'green';
    })(shape.properties ? shape.properties.aqi : null);
    path(shape);
    ctx.fill();
  });

  const aqiColor = (aqi: number) => {
    if (aqi > 300) { return 'maroon'; }
    if (aqi > 200) { return 'purple'; }
    if (aqi > 150) { return 'red'; }
    if (aqi > 100) { return 'orange'; }
    if (aqi > 50) { return 'yellow'; }
    return 'green';
  };

  // Comment out to hide small debug dots
  aqiGrid.features.forEach((shape) => {
    ctx.beginPath();
    ctx.fillStyle = aqiColor(shape.properties ? shape.properties.aqi : 500);
    path(shape);
    ctx.fill();
    ctx.stroke();
  });
  console.log('done with contours c:');


  ctx.drawImage(overlay, 0, 0);

  // Comment out to hide large debug dots
  observations.forEach((o) => {
    ctx.beginPath();
    ctx.fillStyle = aqiColor(Number(o.PM25_Measured) ? Number(o.PM25_AQI) : 0);
    const pos = projection([Number(o.Longitude), Number(o.Latitude)]);
    const [x, y] = pos || [0, 0];
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  });


  await fs.writeFile(filename, canvas.toBuffer('image/png'));
}


export async function drawDate(
  awsPrefix: string, 
  center: [number, number],
  range: number,
  date: Date,
  overlay: Canvas,
  filename: string,
) {
  const observations = await getObservations(awsPrefix, date);
  if (!isOk(observations)) {
    console.error(`failed to fetch data for ${date.toISOString()}`);
    return;
  }
  await drawMap(
    filename,
    observations.value.filter(distanceFilter(center, range)),
    overlay,
    center,
    1920,
    1080,
  );
}
