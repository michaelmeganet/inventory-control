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
			
			



module.exports.AccessControl = AccessControl		