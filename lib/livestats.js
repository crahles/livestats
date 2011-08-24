var http = require('http'),
    sys  = require('sys'),
    static = require('node-static/lib/node-static'),
    faye = require('Faye 0.6.4/faye-node'),
    url = require('url'),
    streamLogger = require('streamlogger'),
    logger = new streamLogger.StreamLogger('server.log');
    //Defaults to info, debug messages will not be logged at info
    logger.level = logger.levels.debug;

function LiveStats(options) {
  if (! (this instanceof arguments.callee)) {
    return new arguments.callee(arguments);
  }

  var self = this;

  self.settings = {
    port: options.port,
    geoipServer: {
        hostname: options.geoipServer.hostname
      , port:     options.geoipServer.port || 80
    }
  };

  self.init();
};

LiveStats.prototype.init = function() {
  var self = this;

  self.bayeux = self.createBayeuxServer();
  self.httpServer = self.createHTTPServer();

  self.bayeux.attach(self.httpServer);
  self.httpServer.listen(self.settings.port);
  logger.info('Server started on PORT ' + self.settings.port);
};

LiveStats.prototype.createBayeuxServer = function() {
  var self = this;

  var bayeux = new faye.NodeAdapter({
    mount: '/ws',
    timeout: 45
  });

  return bayeux;
};

LiveStats.prototype.createHTTPServer = function() {
  var self = this;

  var server = http.createServer(function(request, response) {
    var file = new static.Server(self.settings.publicDir, {
      cache: false
    });

    request.addListener('end', function() {
      logger.debug('--- REQUEST ---');
      logger.debug(request);
      logger.debug('--- END REQUEST ---');
      var location = url.parse(request.url, true),
          params = (location.query || request.headers);

      if (location.pathname == '/config.json' && request.method == "GET") {
        response.writeHead(200, {
          'Content-Type': 'application/x-javascript'
        });
        var jsonString = JSON.stringify({
          port: self.settings.port
        });
        response.end(jsonString);
      } else if (location.pathname == '/stat' && request.method == 'GET') {
        try {
          self.ipToPosition(params.ip, function(latitude, longitude, city) {
            self.bayeux.getClient().publish('/stat', {
                title: params.title
              , latitude: latitude
              , longitude: longitude
              , city: city
              , ip: params.ip
            });
          });

          response.writeHead(200, {
            'Content-Type': 'text/plain'
          });
          response.end("OK");
        } catch (e) { console.log(e)}
      } else {
        file.serve(request, response);
      }
    });
  });

  return server;
};

LiveStats.prototype.ipToPosition = function (ip, callback) {
  var self = this;

  var client = http.createClient(self.settings.geoipServer.port,
                                 self.settings.geoipServer.hostname);
  var request = client.request('GET', '/geoip/api/locate.json?ip=' + ip, {
    'host': self.settings.geoipServer.hostname
  });

  request.addListener('response', function (response) {
    response.setEncoding('utf8');

    var body = '';
    response.addListener('data', function (chunk) {
      body += chunk;
    });
    response.addListener('end', function () {
      var json = JSON.parse(body);

      if (json.latitude && json.longitude) {
        callback(json.latitude, json.longitude, json.city);
      }
    });
  });

  request.end();
};

module.exports = LiveStats;
