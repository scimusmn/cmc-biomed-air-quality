import * as fs from 'node:fs/promises';
import { Canvas, createCanvas, registerFont } from 'canvas';
import * as d3 from 'd3';
import * as turf from '@turf/turf';

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

  // load fonts
  registerFont('fonts/Avenir-Next-Condensed-Demi-Bold.ttf', { family: 'Avenir' });

  // create canvas
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');  

  // load roads + cities geoJSON
  const [roads, cities] = <[d3.ExtendedFeature[], d3.ExtendedFeature[]]>await Promise.all(
    [roadsFilename, citiesFilename].map(async (filename) => {
      const buffer = await fs.readFile(filename);
      const object = JSON.parse(buffer.toString());
      return object.features;
    }),
  );

  // prep d3
  const projection = createProjection(center, width, height, 10000);
  const path = d3.geoPath(projection, context);

  // render roads
  roads.forEach((road) => {
    context.lineWidth = 1 / (road.properties ? road.properties.scalerank : 10);
    const lineGray = Math.floor((128 * context.lineWidth));
    context.strokeStyle = `rgb(${lineGray}, ${lineGray}, ${lineGray})`;
    context.beginPath();
    path(road);
    context.stroke();
  });

  // render city labels
  const majorCities = ["Cincinnati", "Louisville", "Indianapolis", "Columbus"];
  
  cities.forEach((city) => {
    // draw map label
    const { NAME_EN, SCALERANK } = city.properties as any;
    let cityLabel = NAME_EN;
    if (majorCities.includes(NAME_EN)) {
      // major city labels
      context.font = '24px "Avenir"';
      context.fillStyle = '#00415C';
      context.strokeStyle = '#00415C';
      context.lineWidth = 0;
      cityLabel = cityLabel.toUpperCase();
      // context.letterSpacing = "10px"; // missing feature: https://github.com/Automattic/node-canvas/issues/1014
      const hairSpace = '\u200A';
      cityLabel = cityLabel.split('').join(hairSpace); // Add hair spaces to simulate letter-spacing
    } else {
      // minor city labels
      context.fillStyle = '#000000';
      context.strokeStyle = '#ffffff';
      context.lineWidth = 2;
      context.font = `${70 / (SCALERANK + 1)}px sans-serif`;
    }
    const metrics = context.measureText(NAME_EN);
    const position = projection(
      city.geometry ? (city.geometry as any).coordinates as [number, number] : [0, 0],
    );
    const [x, y] = position || [0, 0];
    context.strokeText(cityLabel, x - (metrics.width / 2), y);
    context.fillText(cityLabel, x - (metrics.width / 2), y);
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

  // Legend colors
  const legend = {
    good: '#E5E5E5', // gray
    moderate: '#FFF200', // yellow
    unhealthySensitive: '#FE5F1A', // orange
    unhealthy: '#BE1E2D', // red
    veryUnhealthy: '#823660', // purple
    hazardous: '#262262', // dark purple
  };
  
  const aqiLevels = {
    0: legend.good,
    50: legend.moderate,
    100: legend.unhealthySensitive,
    150: legend.unhealthy,
    200: legend.veryUnhealthy,
    300: legend.hazardous,
    500: 'black',
  };

  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');

  context.fillStyle = aqiLevels[0];
  context.fillRect(0, 0, width, height);

  const projection = createProjection(center, width, height, 10000);

  // generate grid
  const aqiPoints = turf.featureCollection(
    observations
      .filter((observation) => observation.PM25_Measured === '1')
      .map((observation) => turf.point([Number(observation.Longitude), Number(observation.Latitude)], { aqi: Number(observation.PM25_AQI) })),
  );
  const aqiGrid = turf.interpolate(aqiPoints, 5, { property: 'aqi', gridType: 'point', weight: 5 });

  // prep d3
  const path = d3.geoPath(projection, context);

  // compute contours
  const contourBands = turf.isobands(aqiGrid, Object.keys(aqiLevels).map(Number), { zProperty: 'aqi' });

  const aqiLevelRanges = Object.fromEntries(Object.entries(aqiLevels).map(([level, color], index, array) => {
    return [`${level}-${array[index + 1]?.[0]}`, color]
  }));

  contourBands.features.forEach((shape: any) => {
    context.beginPath();
    context.fillStyle = aqiLevelRanges[shape.properties?.aqi] || '';
    path(shape);
    context.fill();
  });

  context.drawImage(overlay, 0, 0);

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
    console.error('failed to fetch data for:', date.toISOString());
    return false;
  }
  await drawMap(
    filename,
    observations.value.filter(distanceFilter(center, range)),
    overlay,
    center,
    overlay.width,
    overlay.height,
  );
  return true;
}
