# cmc-biomed-air-quality/packages/backend

This program fetches current and historical AirNow data and stores it in a local json file, which can then be
used for mapping AQI over time.

## running

This code was written using Node.js v20.11.1.

Using this code requires a `.env` file containing some configuration
parameters.

The `.env` file should contain the following parameters:

| Parameter | Meaning | Default |
| --- | --- | --- |
| `AWS_PREFIX` | The prefix (including trailing slash) to use for building AirNow requests.<br>If this needs to change, it can be found by examining the files [found here](https://files.airnowtech.org/?prefix=airnow/today/) | https://s3-us-west-1.amazonaws.com//files.airnowtech.org/airnow/ |
| `LATITUDE` | The latitude to center observations around. | 39.1 |
| `LONGITUDE` | The longitude to center observations around. | -84.5125 |
| `RANGE` | The maximum distance from the central lat/long in Kilometers; observations further away will not be included. | 700 |
| `WIDTH` | The width of the video in pixels. | 1561 |
| `HEIGHT` | The height of the video in pixels. | 854 |
| `BITRATE` | The [bitrate](https://ffmpeg.org/ffmpeg-codecs.html#Options-36) of the video in kilobits per second. | 20480k |
| `FPS` | The [frame rate](https://trac.ffmpeg.org/wiki/ChangingFrameRate) of the video in frames per second. | 60 |

Default versions of this file has been provided in the repo; you can simply copy them over and remove the `.default` suffix.

To build the code:

```
yarn build
```

You can then run the compiled code with

```
yarn start:compiled
```

## files

- `src/airnow.ts`: exports various types and functions for downloading and manipulating AirNow data.
- `src/index.ts`: validates `.env` parameters and generates the video loops.
- `src/map.ts`: generates images containing a map of the area and the AQI data overlayed using D3.
- `src/result.ts`: functional-programming style Result types for handling AirNow data.
- `src/video.ts`: generates the video loops (which are concatenated map images) using FFmpeg.
- `gis/places.geojson`: GeoJSON file containing places that are used to build the map.
- `gis/roads.geojson`: GeoJSON file containing roads that are used to build the map.
- `img/status-icon-empty.png`: a 1x1 icon used to indicate that the most recently downloaded AirNow data is current (within a threshold).
- `img/status-icon.png`: a "failed" status icon used to indicate that the most recently downloaded AirNow data is stale (outside the threshold).
