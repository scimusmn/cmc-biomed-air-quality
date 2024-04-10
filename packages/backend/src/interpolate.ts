import * as turf from '@turf/turf';


class SpaceGrid {
  bbox: turf.BBox;

  subdivisions: number;

  points: turf.Feature<turf.Point>[][][];

  constructor(bbox: turf.BBox, subdivisions: number) {
    this.bbox = bbox;
    this.subdivisions = subdivisions;
    this.points = [...Array(subdivisions)].map(
      () => [...Array(subdivisions)].map<turf.Feature<turf.Point>[]>(
        () => [] as turf.Feature<turf.Point>[],
      ),
    );
  }

  column(longIdx: number): turf.Feature<turf.Point>[][] {
    const col = this.points[longIdx];
    if (col !== undefined) {
      return col;
    }
    throw new Error(`longitude index ${longIdx} is out of range`);
  }

  cell(longIdx: number, latIdx: number): turf.Feature<turf.Point>[] {
    const c = this.column(longIdx)[latIdx];
    if (c !== undefined) {
      return c;
    }
    throw new Error(`latitude index ${latIdx} is out of range`);
  }

  getGridIdx(point: turf.Feature<turf.Point>): [ number, number ] {
    const [long0, lat0, long1, lat1] = this.bbox;
    const [long, lat] = point.geometry.coordinates as [number, number];
    const longLerp = (long - long0) / (long1 - long0);
    const latLerp = (lat - lat0) / (lat1 - lat0);
    const longIdx = Math.floor(longLerp * this.subdivisions);
    const latIdx = Math.floor(latLerp * this.subdivisions);
    return [longIdx, latIdx];
  }

  insert(point: turf.Feature<turf.Point>) {
    const [longIdx, latIdx] = this.getGridIdx(point);
    const column = this.column(longIdx);
    column[latIdx] = [...this.cell(longIdx, latIdx), point];
    return this;
  }

  getRegion(longIdx: number, latIdx: number, idxDist: number): turf.Feature<turf.Point>[] {
    const steps = [...Array(idxDist).keys()].map((x) => [-x, x]).flat();
    return steps.reduce(
      (acc, x) => [...acc, steps.reduce(
        (ac, y) => {
          const long = longIdx + y;
          const lat = latIdx + x;
          if (long >= 0 && lat >= 0) {
            return [...ac, this.cell(long, lat)];
          }
          return ac;
        },
        [],
      )].flat(),
      [],
    ).flat();
  }

  recursiveGetNClosest(
    point: turf.Feature<turf.Point>,
    longIdx: number,
    latIdx: number,
    n: number,
    idxDist: number,
  ): turf.Feature<turf.Point>[] {
    const points = this.getRegion(longIdx, latIdx, idxDist);
    const atMaxDist = n >= this.subdivisions;
    if (points.length >= n || atMaxDist) {
      return points.sort(
        (a, b) => turf.distance(a, point) - turf.distance(b, point),
      ).slice(0, n);
    }
    return this.recursiveGetNClosest(point, longIdx, latIdx, n, idxDist + 1);
  }

  getNClosest(point: turf.Feature<turf.Point>, n: number): turf.Feature<turf.Point>[] {
    const [longIdx, latIdx] = this.getGridIdx(point);
    return this.recursiveGetNClosest(point, longIdx, latIdx, n, 1);
  }
}


export default function interpolate(
  points: turf.Feature<turf.Point>[],
  bbox: turf.BBox,
  property: string,
  subdivisions: number,
  cellSize: number,
  power: number,
  n: number,
): turf.FeatureCollection<turf.Point> {
  const space = new SpaceGrid(bbox, subdivisions);
  points.forEach((p) => space.insert(p));
  const grid = turf.pointGrid(bbox, cellSize, {});
  const results = turf.featureReduce(
    grid,
    (acc: turf.Feature<turf.Point>[], gridPoint) => {
      const neighbors = space.getNClosest(gridPoint, n);
      const value = neighbors.reduce(
        (accu, sample) => accu
          + ((sample.properties as any)[property] as number / (turf.distance(sample, gridPoint) ** power)),
        0,
      );
      const newPoint = turf.clone(gridPoint);
      newPoint.properties[property] = value;
      return [...acc, newPoint];
    },
    [],
  );
  return turf.featureCollection(results);
}
