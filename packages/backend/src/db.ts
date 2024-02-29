// import * as fs from 'node:fs/promises';
// import { ResultType, Observation, getObservations, distanceFilter } from './airnow.js';
// 
// interface DbEntry {
//   latitude: number;
//   longitude: number;
//   range: number;
//   date: Date;
//   observations: Observation[];
// }
// 
// async function readDb(dbFilename: string): Promise<DbEntry[]> {
//   const data = await fs.readFile(dbFilename);
//   return JSON.parse(data);
// }
// 
// export async function synchronize(dbFilename: string) {
//   const db = readDb(dbFilename);
// 
// }
