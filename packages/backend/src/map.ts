import * as fs from 'node:fs/promises';
import { Canvas, createCanvas } from 'canvas';
import * as d3 from 'd3';

import { Observation } from './airnow.js';
// import { Result, Ok, isOk } from './result.js';


function createProjection(
  latitude: number,
  longitude: number,
  width: number,
  height: number,
  zoom: number,
) {
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
  const [lat, long] = center;
  const projection = createProjection(lat, long, width, height, 10000);
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
  width: number,
  height: number,
) {
  console.log(observations);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ff0000';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(overlay, 0, 0);

  await fs.writeFile(filename, canvas.toBuffer('image/png'));
}
