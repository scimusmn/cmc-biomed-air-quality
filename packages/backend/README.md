# cmc-biomed-air-quality/packages/backend

This program fetches current and historical AirNow data and stores it in a local json file, which can then be
used for mapping AQI over time.

## running

This code was written using Node.js v20.11.1.

Using this code requires two files: a `.env` file containing some configuration
parameters, and a database file (by default `airnowdb.json`) to save the database
information in.

The `.env` file should contain the following parameters:

| Parameter       | Meaning                                                                                                  | Default |
|-----------------|----------------------------------------------------------------------------------------------------------|---------|
| `AWS_PREFIX`    | The prefix (including trailing slash) to use for building AirNow requests. If this needs to change, it can be found by examining the files [found here](https://files.airnowtech.org/?prefix=airnow/today/) | https://s3-us-west-1.amazonaws.com//files.airnowtech.org/airnow/
| `DB_FILE`       | The name of the file to save the JSON database in.                                                        | airnowdb.json |
| `LATITUDE`      | The latitude to center observations around.                                                               | 39.1 |
| `LONGITUDE`     | The longitude to center observations around.                                                              | -84.5125 |
| `RANGE`         | The maximum distance from the central lat/long in Kilometers; observations further away will not be included.           | 20 |
| `REFRESH_HOURS` | The number of most recent observation hours to consider "stale" and update (in case new data has come in) | 4 |

The database file should contain, before running for the first time just an empty array: `[]`.

Default versions of these files have been provided in the repo; you can simply copy them over and remove the `.default` suffix.

To build the code: 

```
yarn build
```

You can then run the compiled code with

```
yarn start:compiled
```


## files

 * `src/airnow.ts`: exports various types functions for downloading and manipulating AirNow data.
 * `src/db.ts`: exports a single function, `synchronize`, that updates the database file.
 * `src/index.ts`: validates `.env` parameters and calls `synchronize` from `db.ts`.
