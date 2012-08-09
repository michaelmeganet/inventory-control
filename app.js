require("coffee-script")

var express = require('express')
  , httpProxy = require('http-proxy')
  , proxy_conf = require('./conf/proxy_config.js')
  , server_conf = require('./conf/server_config.js')
  , auth_conf = require('./conf/auth_config.js')
  , proxy_router = require('./middleware/proxy_router.coffee')
  , unauthorized_user_handler = require('./middleware/unauthorized_user_handler.coffee')
  , authentication_bridge = require('./middleware/authentication_bridge.coffee')
  , route_authorization_handler = require('./middleware/route_authorization_handler.coffee')
  
var app = module.exports = express.createServer(server_conf);

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  
  app.use(unauthorized_user_handler()); 

  app.use(express.cookieParser());
  app.use(express.session({ secret: "too many secrets 12345" }));

  app.use(authentication_bridge(auth_conf));
  app.use(route_authorization_handler(proxy_conf))

  app.use(proxy_router(proxy_conf));

  app.use(express.bodyParser());
  app.use(express.methodOverride());

  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes
require("./routes/index.coffee")(app);
require("./routes/inventory.coffee")(app);
require("./routes/users.coffee")(app);
require("./routes/log.coffee")(app);

server_port = 8443

app.listen(server_port);
console.log("Express server listening on port %d in %s mode", server_port, app.settings.env);
