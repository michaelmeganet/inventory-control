_ = (require "underscore")._

config = require "../conf/app_config.js"

CouchDbUserRepository = (require "../middleware/couchdb_repository.coffee").CouchDbUserRepository

user_repo = new CouchDbUserRepository({ couchdb_url: "http://192.168.192.143:5984" })

helpers = require "./helpers/helpers.coffee"
ListHandler = helpers.ListHandler
ResultsHandler = helpers.ResultsHandler
SearchHandler = helpers.SearchHandler


normalize_post_values = (user, roles) ->
	new_user = {}
	_.extend(new_user, user)
	new_user.roles = []
	new_user.roles.push "user"
	for role, v of roles
		new_user.roles.push role
	new_user.email = "#{new_user.logon_name}@bericotechnologies.com"
	new_user.id = new_user.email
	new_user

flatten_roles = (roles) ->
	membership = {}
	for role in roles
		membership[role] = true
	membership

role_membership = (roles) ->
	memberships = flatten_roles roles
	default_memberships = 
		admin: false
		view_inventory: false
		view_reports: false
		add_inventory: false
		remove_inventory: false
		assign_inventory: false
		check_in_inventory: false
	_.extend(default_memberships, memberships)
	default_memberships

build_state = (req, title, desc) ->
	state = {}
	state.title = title
	state.description = desc
	state.user = req.user
	# Imported from ../conf/app_config.js
	state.config = config
	state

module.exports = (app, user_cache) ->
	
	# HANDLE NEW USER
	app.post '/user/new', (req, res) ->
		user = normalize_post_values req.body.user, req.body.roles
		unless user is null
			user_repo.add user
		res.redirect("/users/")
		
	# NEW USER FORM
	app.get '/user/new', (req, res) ->
		res.render("users_create", { title: "Add New User", user: req.user })
	
	# HANDLE UPDATE USER
	app.post '/user/:id', 	(req, res) ->
		user = normalize_post_values req.body.user, req.body.roles
		unless user is null
			delete user_cache[user.email]
			user_repo.update user
		res.redirect("/users/")
	
	# GET USER VIEW
	app.get '/user/:id', (req, res) ->
		user_repo.get req.params.id, (user) ->
			state = build_state req, "User Information", "#{user.last_name}, #{user.first_name}" 
			state.target_user = user
			res.render "users_view", state
	
	# UPDATE USER FORM
	app.get '/user/:id/update', (req, res) ->
		user_repo.get req.params.id, (user) ->
			roles = role_membership(user.roles)
			state = build_state req, "Update User", null
			state.target_user = user
			state.roles = roles
			res.render "users_update", state
	
	# HANDLE REMOVE USER
	app.post '/user/:id/remove', (req, res) ->	
		user_repo.get req.params.id, (user) ->
			delete user_cache[user.email]
			user_repo.remove user
			res.redirect("/users/")
			
	# REMOVE USER FORM
	app.get '/user/:id/remove', (req, res) ->
		user_repo.get req.params.id, (user) ->	
			state = build_state req, "Remove User?", null
			state.target_user = user
			res.render "users_remove", state
	
	# GENERIC HANDLER FROM LIST USERS
	list = (req, res) ->
		handler = new ListHandler(req, res, "Inventory Users", "", "users_by_last_name")
		if req.params.startkey?
			user_repo.list(handler.handle_results, req.params.startkey)
		else
			user_repo.list handler.handle_results
	
	app.get '/users/', list
	app.get '/users/s/:startkey', list
	app.get '/users/s/:startkey/p/:prev_key', list
	
	# GENERIC HANDLER FOR LISTING USERS BY ROLE
	by_role = (req, res) ->
		state = build_state req, "Users by Role", role
		state.role = role = req.params.role ? req.body.role ? "admin"
		state.prev_key = req.params.prev_key if req.params.prev_key?
		state.startkey = req.params.startkey if req.params.startkey?
		handler = (users) ->
			state.models = users.models
			res.render("users_by_role", state)
		user_repo.get_by_role handler, role
	
	app.get '/users/by_role/', by_role
	app.get '/users/by_role/s/:startkey', by_role
	app.get '/users/by_role/s/:startkey/p/:prev_key', by_role
	app.post '/users/by_role/', by_role
	app.get '/users/by_role/:role', by_role
	
	app.get '/users/by_last_name/:last_name', (req, res) ->
		res.redirect("/users/")
	
	app.get '/search/users/:query', new SearchHandler(user_repo, "find_name").handle_query

