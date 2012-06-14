var express = require('express')
  , routes = require('./routes')
  , fs = require('fs')

var opts = {
	key: fs.readFileSync('ssl/server/keys/inventory@bericotechnologies.com.key'),
	cert: fs.readFileSync('ssl/server/certificates/inventory@bericotechnologies.com.crt'),
	ca: fs.readFileSync('ssl/ca/ca.crt'),
	requestCert: true,
	rejectUnauthorized: false
};

var app = module.exports = express.createServer(opts);

// Configuration 

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
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

  // AUTHORIZED	
  if(req.client.authorized){

	var subject = req.connection
      .getPeerCertificate().subject;
    
    // Render the authorized template, providing
    // the user information found on the certificate
    res.render('authorized', 
      { title:        'Authorized!',
	    user:         subject.CN,
	    email:        subject.emailAddress,
	    organization: subject.O,
	    unit:         subject.OU,
	    location:     subject.L,
	    state:        subject.ST,
	    country:      subject.C
	  });	
	
  // NOT AUTHORIZED
  } else {
	
	// Render the unauthorized template.
    res.render('unauthorized', 
		{ title: 'Unauthorized!' });	
  }
});

app.listen(8443);

console.log("Express server listening on port %d in %s mode", 
   8443, app.settings.env);
