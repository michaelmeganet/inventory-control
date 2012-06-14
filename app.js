var express = require('express')
  , routes = require('./routes')
  , fs = require('fs')
  , roles_provider = require('./middleware/roles_provider.js')
  , unauthenticated_user_handler = require('./middleware/unauthenticated_user_handler.js')

var opts = {
	key: fs.readFileSync('ssl/server/keys/inventory@bericotechnologies.com.key'),
	cert: fs.readFileSync('ssl/server/certificates/inventory@bericotechnologies.com.crt'),
	ca: fs.readFileSync('ssl/ca/ca.crt'),
	requestCert: true,
	rejectUnauthorized: false,
	passphrase: "apple123"
};

var app = module.exports = express.createServer(opts);

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(unauthenticated_user_handler());
  app.use(roles_provider());
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

app.listen(8443);
console.log("Express server listening on port %d in %s mode", 
  8443, app.settings.env);
