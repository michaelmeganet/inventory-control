var express = require('express')
  , routes = require('./routes')
  , httpProxy = require('http-proxy')
  , fs = require('fs')
  , unauthorized_user_handler = require('./middleware/unauthorized_user_handler.js')
  , authentication_bridge = require('./middleware/authentication_bridge.js')
  

var opts = {
	key: fs.readFileSync('ssl/server/keys/inventory@bericotechnologies.com.key'),
	cert: fs.readFileSync('ssl/server/certificates/inventory@bericotechnologies.com.crt'),
	ca: fs.readFileSync('ssl/ca/ca.crt'),
	requestCert: true,
	rejectUnauthorized: false,
	passphrase: "apple123"
};

var couchdb_proxy = new httpProxy.HttpProxy(
	{ 
		target: {
			host: "192.168.192.143",
			port: 5984
		}
	});

var app = module.exports = express.createServer(opts);

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: "too many secrets 12345" }));
  app.use(unauthorized_user_handler());  
  app.use(authentication_bridge());
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

app.all('/inventory/*', function(req, res){
	console.log("Request for CouchDB");
	// Forward the Request to CouchDB
	couchdb_proxy.proxyRequest(req, res);
});

app.listen(8443);
console.log("Express server listening on port %d in %s mode", 
  8443, app.settings.env);
