
proxy_buffer = (httpProxy) ->
	unless httpProxy? then throw "HTTP proxy must be supplied"
	
	(req, res, next) ->
		req.buffer = httpProxy.buffer(req)
		next()
	
module.exports = proxy_buffer
