var express = require('express')
  , routes = require('./routes')
  , httpProxy = require('http-proxy')
  , proxy_conf = require('./conf/proxy_config.js')
  , server_conf = require('./conf/server_config.js')
  , auth_conf = require('./conf/auth_config.js')
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
app.get('/', routes.index);
app.post('/user/new', routes.users_create);
app.get('/user/new', routes.users_create_form);
app.post('/user/:id', routes.users_update);
app.get('/user/:id', routes.users_get);
app.get('/user/:id/update', routes.users_update_form);
app.post('/user/:id/remove', routes.users_remove);
app.get('/user/:id/remove', routes.users_remove_form);
app.get('/users/', routes.users_list);
app.get('/users/s/:startkey', routes.users_list);
app.get('/users/s/:startkey/p/:prev_key', routes.users_list);
app.get('/users/by_role/', routes.users_by_role);
app.get('/users/by_role/s/:startkey', routes.users_by_role);
app.get('/users/by_role/s/:startkey/p/:prev_key', routes.users_by_role);
app.post('/users/by_role/', routes.users_by_role);
app.get('/users/by_role/:role', routes.users_by_role);
app.get('/users/by_last_name/:last_name', routes.users_by_last_name);
app.get('/users/refresh_info', routes.users_refresh_info);
app.post('/inv/new', routes.inventory_create);
app.get('/inv/new', routes.inventory_create_form);
app.get('/inv/items', routes.inventory_list);
app.post('/inv/:id', routes.inventory_update);
app.get('/inv/:id/update', routes.inventory_update_form);
app.post('/inv/:id/remove', routes.inventory_remove);
app.get('/inv/:id/remove', routes.inventory_remove_form);

server_port = 8443

app.listen(server_port);
console.log("Express server listening on port %d in %s mode", server_port, app.settings.env);
