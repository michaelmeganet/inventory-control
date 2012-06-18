_ = (require "underscore")._

class AccessControl
	
	constructor: (options) ->
		@methods = ["GET", "POST", "PUT", "DELETE"]
		@route = ///.*///
		@users = []
		@roles = []
		@allow = false
		_.extend(@, options)
		
	is_route_match: (route) ->
		@route.test route
	
	is_user_match: (user) ->
		_.include(@users, user)
	
	is_role_match: (user_roles) ->
		# If this is not an array
		unless user_roles.push?
			# Make it an array!
			user_roles = [ user_roles ]
		is_match = false
		for user_role in user_roles
			if _.include(@roles, user_role)
				is_match = true
		is_match
	
	is_method_match: (method) ->
		_.include(@methods, method)
	
	is_context_match: (route, method) ->
		@is_route_match(route) and @is_method_match(method)
	
	is_allowed: (user) ->
		if @is_user_match user.logon_name 
			@allow
		else if @is_role_match user.roles
			@allow
		else
			not @allow
			


is_context_match = (access_controls, req) ->
	_.find(access_controls, (ac) -> ac.is_context_match(req.url, req.method))


route_authorization_handler = (options)->
	options = options ?  {}
	restrictions = options.restrictions ? []
	unless restrictions.push?
		restrictions = [ restrictions ]
	
	access_controls = []
	access_controls.push(new AccessControl(restriction)) for restriction in restrictions

	
	# Returning the Middleware Function
	(req, res, next) ->
		# Determine if the URL/Method matches an Access Control
		context_matches = is_context_match access_controls, req
		# If the route and method match (determine by whether
		# context_match (an AccessControl) is not null)
		if context_matches?
			unless context_matches.is_allowed req.user
				next("401")
			else
				next()
		else
			next()
		
module.exports = route_authorization_handler
module.exports.AccessControl = AccessControl	
	