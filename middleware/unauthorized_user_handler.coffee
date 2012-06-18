moment = (require "moment")

unauthorized_user_handler = (options) ->
	options = options ? {}
	unauth_template = options.unauth_template ? "unauthorized"
	# Returning the Middleware Function
	(req, res, next) ->
		unless req.client.authorized
			console.log("UNAUTH:  #{moment().format('YY-MM-DDTHH:mm:ss.SSS')} " +
						"#{req.method} url:#{req.url}")
						
			#res.render unauth_template, { title: "Unauthorized" }
			next "401"
		next()

module.exports = unauthorized_user_handler