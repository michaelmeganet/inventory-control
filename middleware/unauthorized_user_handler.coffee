
unauthorized_user_handler = (options) ->
	options = options ? {}
	unauth_template = options.unauth_template ? "unauthorized"
	(req, res, next) ->
		unless req.client.authorized
			res.render unauth_template, { title: "Unauthorized" }
			next "401"
		next()

module.exports = unauthorized_user_handler