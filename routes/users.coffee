user_repo_module = require("../middleware/couchdb_user_repository.js");
CouchDbUserRepository = user_repo_module.CouchDbUserRepository;
user_repo = new CouchDbUserRepository({ couchdb_url: "http://192.168.192.143:5984/" });

module.exports.create = (req, res) ->
	user_repo.add req.body.user
	res.json({ status: "ok" })

module.exports.create_form = (req, res) ->
	res.render("users_create", { title: "Add New User" })

module.exports.get = (req, res) ->
	user_repo.get req.params.id, (user) ->
		res.json user

module.exports.remove = (req, res) ->	
	
	
module.exports.update = (req, res) ->
	
	
module.exports.by_role = (req, res) ->	
	user_repo.get_by_role req.params.role, (users) ->
		res.json users


module.exports.by_last_name = (req, res) ->
	user_repo.get_by_last_name req.params.last_name, (users) ->
		res.json users