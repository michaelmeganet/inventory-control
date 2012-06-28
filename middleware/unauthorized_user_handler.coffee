moment = (require "moment")

unauthorized_user_handler = (options) ->
	options = options ? {}
	unauth_template = options.unauth_template ? "unauthorized"
	# Returning the Middleware Function
	(req, res, next) ->
		if ////[0-9]+.html$///.test(req.url)
			next()
		else
			unless req.client.authorized
				console.log("UNAUTH:  #{moment().format('YY-MM-DDTHH:mm:ss.SSS')} " +
						"#{req.method} url:#{req.url}")
			
				res.redirect("/401.html")
			else
				next()

module.exports = unauthorized_user_handler