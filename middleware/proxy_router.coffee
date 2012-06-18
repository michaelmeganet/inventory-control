_ = (require "underscore")._
moment = (require "moment")

proxy_router = (options)->
	(req, res, next) ->
		
		should_proxy = _.find(options.routes, (route) -> route.test(req.url))
		is_root_exception = (req.headers.accept == 'application/json' && req.url == '/')
		
		if should_proxy? or is_root_exception
			console.log("REROUTE: #{moment().format('YY-MM-DDTHH:mm:ss.SSS')} " + 
						"#{req.method} url:#{req.url} to:"    +
						"#{options.conf.host}:#{options.conf.port} ")
			
			options.proxy.proxyRequest(req, res, options.conf)
		else
			next()

module.exports = proxy_router