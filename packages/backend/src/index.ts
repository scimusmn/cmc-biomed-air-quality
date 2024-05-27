import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { createOverlay, drawDate } from './map.js';
import { createVideoFromImages } from './video.js';

const environment = process.env;

function envError(key: string) {
  throw new Error(`.env: please ensure ${key} is present in your environment`);
}

if (typeof environment.AWS_PREFIX !== 'string') {
  envError('AWS_PREFIX');
} else if (typeof environment.IMAGES_FOLDER !== 'string') {
  envError('IMAGES_FOLDER');
} else if (typeof environment.LATITUDE !== 'string') {
  envError('LATITUDE');
} else if (typeof environment.LONGITUDE !== 'string') {
  envError('LONGITUDE');
} else if (typeof environment.RANGE !== 'string') {
  envError('RANGE');
} else if (typeof environment.WIDTH !== 'string') {
  envError('WIDTH');
} else if (typeof environment.HEIGHT !== 'string') {
  envError('LENGTH');
} else if (typeof environment.BITRATE !== 'string') {
  envError('BITRATE');
} else if (typeof environment.FPS !== 'string') {
  envError('FPS');
} else {
  const main = async () => {
    const width = Number(environment.WIDTH);
    const height = Number(environment.HEIGHT);;

    const center: [number, number] = [Number(environment.LONGITUDE), Number(environment.LATITUDE)];
    const overlay = await createOverlay(
      './gis/roads.geojson',
      './gis/places.geojson',
      center,
      width,
      height,
    );

    const staticMapAssets = '../frontend/public/map-assets';

    const videos = [
      {
        name: `${staticMapAssets}/one-day-loop.mp4`,
        durationInDays: 1,
        intervalInHours: 1,
        lengthInSeconds: 5,
      },
      {
        name: `${staticMapAssets}/ten-day-loop.mp4`,
        durationInDays: 10,
        intervalInHours: 1,
        lengthInSeconds: 30,
      },
      {
        name: `${staticMapAssets}/one-year-loop.mp4`,
        durationInDays: 365,
        intervalInHours: 1,
        lengthInSeconds: 60,
      },
    ];

    const currentImage = `${staticMapAssets}/current.png`;

    const statusIcon = `${staticMapAssets}/status-icon.png`;
    const failedStatusIcon = `./img/status-icon.png`;
    const emptyStatusIcon = `./img/status-icon-empty.png`;

    const staleDataThresholdDays = 1;

    const recentDataChangeWindowHours = 4;

    const recently = new Date(new Date().setHours(new Date().getHours() - recentDataChangeWindowHours));

    const imagesFolder = `${environment.IMAGES_FOLDER}/`;
    fs.existsSync(imagesFolder) || fs.mkdirSync(imagesFolder);

    for (const video of videos) {
      const daysAgo = new Date(new Date().setDate(new Date().getDate() - video.durationInDays));

      const images = [];
      const date = new Date();
      date.setHours(date.getHours() - 1, 0, 0, 0); // Newest data available is from one hour ago

      do {
        const imageFile = `${imagesFolder}${date.getTime()}.png`;

        const fileIsVeryNew = date >= recently;
        const fileExists = fs.existsSync(imageFile);

        let isFileValid = true;

        if (fileIsVeryNew || !fileExists) {
          console.log('drawing date:', date);
          isFileValid = await drawDate(
            environment.AWS_PREFIX as string,
            center,
            Number(environment.RANGE),
            date,
            overlay,
            imageFile,
          );
        }

        if (isFileValid) {
          images.push(imageFile);
        }

        // Use of setHours(getHours()-1) is foiled by Daylight Saving Time
        // so use milliseconds instead
        date.setTime(date.getTime() - 1000 * 60 * 60 * video.intervalInHours);

      } while (date >= daysAgo);

      createVideoFromImages(
        images.toReversed(),
        video.name,
        video.lengthInSeconds,
        environment.BITRATE as string,
        `${width}x${height}`,
        Number(environment.FPS)
      );

      fs.copyFileSync(`./${images[0]}`, currentImage);

      const currentImageDate = new Date(Number(path.parse(images[0] as string).name));
      const staleDataThreshold = new Date(new Date().setDate(new Date().getDate() - staleDataThresholdDays));

      fs.copyFileSync(currentImageDate > staleDataThreshold
        ? emptyStatusIcon
        : failedStatusIcon,
        statusIcon);
    }

    const longAgo = new Date(new Date().setDate(new Date().getDate() - 400));

    // Clean up by deleting old image files
    fs.readdirSync(imagesFolder).forEach(filename => {
      const fileNameDate = new Date(Number(path.parse(filename).name));
      if (fileNameDate < longAgo) {
        console.log('deleting:', filename);
        fs.unlinkSync(`${imagesFolder}${filename}`);
      }
    });
  };
  main().then(() => console.log('done!'));
}
