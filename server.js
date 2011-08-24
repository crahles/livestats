require.paths.unshift(__dirname + "/vendor");
require.paths.unshift(__dirname + "/vendor/node-streamlogger/lib");

var
  streamLogger = require('streamlogger'),
  logger = new streamLogger.StreamLogger('server.log');
  //Defaults to info, debug messages will not be logged at info
  logger.level = logger.levels.debug;

process.addListener('uncaughtException', function (err, stack) {
  logger.debug('------------------------');
  logger.debug('Exception: ' + err);
  logger.debug(err.stack);
  logger.debug('------------------------');
});

var LiveStats = require('./lib/livestats');

new LiveStats({
  port: 8000,
  publicDir: './public',
  geoipServer: {
      hostname: 'localhost'
    , port: 3000
  }
});
