_ = (require "underscore")._
user_repo_module = require("../middleware/couchdb_user_repository.js");
CouchDbUserRepository = user_repo_module.CouchDbUserRepository;
user_repo = new CouchDbUserRepository({ couchdb_url: "http://192.168.192.143:5984/" });

validate_user_state = (user) ->
	valid = true
	unless user.first_name? then valid = false
	unless user.last_name? then valid = false
	unless user.logon_name? then valid = false
	valid

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
		res.json user

module.exports.remove = (req, res) ->	
	console.log("Deleting: #{req.params.id}")
	user_repo.get req.params.id, (user) ->
		user_repo.remove user
		res.redirect("/users/")

module.exports.remove_form = (req, res) ->
	user_repo.get req.params.id, (user) ->	
		res.render("users_remove", { title: "Remove User?", user: req.user, target_user: user })
	
module.exports.update = (req, res) ->
	user = normalize_post_values req.body.user, req.body.roles
	unless user is null
		user_repo.update user
		req.session.user = user if user.id is req.session.user.id	
	res.redirect("/users/")
	
module.exports.update_form = (req, res) ->
	user_repo.get req.params.id, (user) ->
		roles = role_membership(user.roles)
		res.render("users_update", { title: "Update User", user: req.user, target_user: user, roles: roles })

module.exports.list = (req, res) ->
	user_repo.list (results) ->
		res.render("users_by_last_name", { title: "Inventory Users", user: req.user, users: results.users })

module.exports.by_role = (req, res) ->
	role = req.params.role ? req.body.role ? "admin"
	user_repo.get_by_role role, (users) ->
		res.render("users_by_role", { title: "Users by Role", description: role, user: req.user, users: users })

module.exports.by_last_name = (req, res) ->
	res.redirect("/users/")