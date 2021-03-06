var url = require('url');
var path = require('path');
var fs = require('fs');
var debug_name = path.basename(__filename, '.js');
if (debug_name == 'index') {
  debug_name = path.basename(__dirname);
}
(require.main === module) && (function() {
  process.env.DEBUG = '*';
})()
var debug = require('debug')(debug_name);

var domain = require('domain');

var ws = require('ws');
if (!process.EventEmitter) {
  process.EventEmitter = require('event').EventEmitter;
}
var LRWebSocketServer = require('livereload-server');
var _ = require('underscore');
var app = require('./app');
var server;

// id, name, version identifies your app;
// protocols specifies the versions of subprotocols you support
server = new LRWebSocketServer({
  id: "com.example.acme",
  name: "Acme",
  version: "1.0",
  protocols: {
    monitoring: 7,
    saving: 1
  }
});

server.on('connected', function(connection) {
  console.log("Client connected (%s)", connection.id);
});

server.on('disconnected', function(connection) {
  console.log("Client disconnected (%s)", connection.id);
});

server.on('command', function(connection, message) {
  console.log("Received command %s: %j", message.command, message);
});

server.on('error', function(err, connection) {
  console.log("Error (%s): %s", connection.id, err.message);
});

server.broadcast = function(obj) {
  _.map(server.connections, function(connection, id) {
    try {
      connection.send(obj);
    } catch (e) {
      debug(e);

      try {
        connection.close();
      } catch (e) {
        debug(e);
      }
      delete server.connections[id];
    }
  });
};

var static_file = fs.readFileSync(path.join(__dirname, './livereload.js'), 'utf8');

server.listen(function(err) {
  if (err) {
    console.error("Listening failed: %s", err.message);
    return;
  }
  // fix old websocket.io's connection bug
  server.httpServer.removeAllListeners('upgrade');

  server.httpServer.on('request', function(req, resp) {
    var url_info = url.parse(req.url, true);
    if (url_info.pathname == '/livereload.js') {
      resp.end(static_file);
    } else if (url_info.pathname == '/reload') {
      var info = {};

      for (var key in url_info.query) {
        info[key] = url_info.query[key];
      }

      if ('liveCSS' in info) {
        info.liveCSS = !!info.liveCSS;
      }

      server.broadcast(info);
      resp.end('{"error" : 0}');
      /**
       * so it will be
       *
       *
       * req.get('http://localhost:35729/reload', 
       * {
       *   qs:{
       *     command: 'reload',
       *     path: 'app.js' // or your filename,
       *     liveCSS: true
       *   }
       * })
       * 
       */
    } else {
      app(req, resp);
    }
  });

  server.wsserver = new ws.Server({
    server: server.httpServer
  });

  server.wsserver.on('connection', function(socket) {
    return server._createConnection(socket);
  });
  server.wsserver.on('error', function(err) {
    debug(err);
  });

  debug("livereload Listening on " + server.port);

});

module.exports = server;