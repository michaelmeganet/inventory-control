var httpProxy = require('http-proxy')

module.exports = {
	proxy: new httpProxy.RoutingProxy(),
	conf: { host: "192.168.192.143", port: 5984 },
	routes: [
		/\/_.*/,
		/\/.js$/,
		/\/test_suite.*/,
		/\/inventory$|\/inventory\/.*/,
		/\/inventory_.*/
	],
	restrictions: [
		{ route: /\/_utils$|\/_utils\/.*/, roles: [ "admin" ], allow: true },
		{ route: /\/user\/new$/, roles: ["admin"], allow: true },
		{ route: /\/user\/\w+@bericotechnologies.com\/update.*/, roles: ["admin"], allow: true}
	]
};