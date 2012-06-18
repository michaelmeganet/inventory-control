var express = require('express')
  , routes = require('./routes')
  , httpProxy = require('http-proxy')
  , proxy_conf = require('./proxy_config.js')
  , server_conf = require('./server_config.js')
  , proxy_router = require('./middleware/proxy_router.js')
  , unauthorized_user_handler = require('./middleware/unauthorized_user_handler.js')
  , authentication_bridge = require('./middleware/authentication_bridge.js')
  , route_authorization_handler = require('./middleware/route_authorization_handler.js')
  
var app = module.exports = express.createServer(server_conf);

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  
  app.use(unauthorized_user_handler()); 

  app.use(express.cookieParser());
  app.use(express.session({ secret: "too many secrets 12345" }));

  app.use(authentication_bridge());
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
app.get('/', function(req, res){
	routes.index(req, res);
});

app.listen(8443);
console.log("Express server listening on port %d in %s mode", 
  8443, app.settings.env);
