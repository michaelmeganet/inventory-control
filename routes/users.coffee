_ = (require "underscore")._

CouchDbUserRepository = (require "../middleware/couchdb_repository.js").CouchDbUserRepository

user_repo = new CouchDbUserRepository({ couchdb_url: "http://192.168.192.143:5984/" })

helpers = require "./helpers/helpers.js"
ListHandler = helpers.ListHandler
ResultsHandler = helpers.ResultsHandler
MandatoryFieldChecker = helpers.MandatoryFieldChecker

mando_fields = [ "first_name", "last_name", "logon_name" ]

user_checker = new MandatoryFieldChecker(mando_fields)

validate_user_state = (user) ->
	user_checker.mandatory_fields_are_set(user)

normalize_post_values = (user, roles) ->
	if validate_user_state user
		new_user = {}
		_.extend(new_user, user)
		new_user.roles = []
		new_user.roles.push "user"
		for role, v of roles
			new_user.roles.push role
		new_user.email = "#{new_user.logon_name}@bericotechnologies.com"
		new_user.id = new_user.email
		new_user
	else
		null

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

module.exports.create = (req, res) ->
	user = normalize_post_values req.body.user, req.body.roles
	unless user is null
		user_repo.add user
	res.redirect("/users/")

module.exports.create_form = (req, res) ->
	res.render("users_create", { title: "Add New User", user: req.user })

module.exports.get = (req, res) ->
	user_repo.get req.params.id, (user) ->
		state = 
			title: "User Information"
			description: "#{user.last_name}, #{user.first_name}" 
			target_user: user
			user: req.user
		res.render "users_view", state

module.exports.remove = (req, res) ->	
	user_repo.get req.params.id, (user) ->
		user_repo.remove user
		res.redirect("/users/")

module.exports.remove_form = (req, res) ->
	user_repo.get req.params.id, (user) ->	
		state = 
			title: "Remove User?"
			user: req.user
			target_user: user
		res.render "users_remove", state
	
module.exports.update = (req, res) ->
	user = normalize_post_values req.body.user, req.body.roles
	unless user is null
		user_repo.update user
		req.session.user = user if user.id is req.session.user.id	
	res.redirect("/users/")
	
module.exports.update_form = (req, res) ->
	user_repo.get req.params.id, (user) ->
		roles = role_membership(user.roles)
		state = 
			title: "Update User"
			user: req.user
			target_user: user
			roles: roles
		res.render "users_update", state

module.exports.list = (req, res) ->
	handler = new ListHandler(req, res, "Inventory Users", "", "users_by_last_name")
	if req.params.startkey?
		user_repo.list(handler.handle_results, req.params.startkey)
	else
		user_repo.list handler.handle_results

module.exports.by_role = (req, res) ->
	state = {}
	state.role = role = req.params.role ? req.body.role ? "admin"
	state.prev_key = req.params.prev_key if req.params.prev_key?
	state.startkey = req.params.startkey if req.params.startkey?
	state.title = "Users by Role"
	state.description = role
	state.user = req.user
	handler = (users) ->
		state.models = users
		res.render("users_by_role", state)
	user_repo.get_by_role handler, role
		
module.exports.by_last_name = (req, res) ->
	res.redirect("/users/")
	
module.exports.refresh_info = (req, res) ->
	# Kill the user variable in the session,
	# on next authentication we will force a 
	# new user lookup
	delete req.session.user
	res.redirect(req.header('Referer'))