# Logger

The logger of the SkyeKiwi Protocol is powered by [pino.js](https://github.com/pinojs/pino). We thinnly wrapped `pino` in [Util/index.ts](https://github.com/skyekiwi/skyekiwi-protocol/blob/master/src/Util/index.ts)


## Levels of Logging

- `fatal` = `60`
- `error` = `50`
- `warn` = `40`
- `info` = `30`
- `debug` = `20`
- `trace` = `10`
- `silent` = `inf`

## Conventions

- For each module, it will spawn a `child` of the core logger as structured as `{module: ipfs.cat}` to shows which function is emitting the log. 
- The level of logging can either by defined in the `.env` file as `LOG_LEVEL = 'debug'`, or specified when defining the logger. Otherwise, it will be in default to `info`. 

## Usage

```javascript
// getLogger ( module name, (optional)logging level )
const logger = Util.getLogger('module_name.function', 'debug')
logger.info('hello')
```
