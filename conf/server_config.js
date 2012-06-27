var fs = require('fs')

module.exports = {
	key: fs.readFileSync('./ssl/server/keys/inventory@bericotechnologies.com.key'),
	cert: fs.readFileSync('./ssl/server/certificates/inventory@bericotechnologies.com.crt'),
	ca: fs.readFileSync('./ssl/ca/ca.crt'),
	requestCert: true,
	rejectUnauthorized: false,
	passphrase: "apple123"
};