User = (require "../model/user.js").User
nano = require "nano"

class CouchDbUserRepository
	
	constructor: (options) ->
		unless options?.couchdb_url? then throw "Must provide CouchDB URL"
		@connection = nano(options.couchdb_url)
		@usersdb = @connection.db.use("inventory_users")
		
	add: (user) ->
		@usersdb.insert(user, user.email, (err, body)->
				unless err then console.log body)
	
	update: (user) ->
		user._id = user.email
		console.dir user
		@usersdb.insert(user, user.email, (err, body)->
				unless err then console.log body)
	
	get: (email, callback) ->
		@usersdb.get email, (error, body) ->
			console.log "Problem retrieving user: #{error}" if error
			user = CouchDbUserRepository.adapt_to_user(body)
			callback.apply(@, [user])
	
	get_by_role: (role, callback) ->
		@usersdb.view "users", "by_roles", { key: role }, (error, body) ->
			console.log "Problem retrieving users by role '#{error}'" if error
			users = CouchDbUserRepository.adapt_to_user_array(body)
			callback(users)
	
	get_by_last_name: (last_name, callback) ->
		@usersdb.view "users", "by_lastname", { key: last_name }, (error, body) ->
			console.log "Problem retrieving users by last name '#{error}'" if error
			users = CouchDbUserRepository.adapt_to_user_array(body)
			callback(users)
	
	@adapt_to_user: (body) ->
		user = new User(body)
		user.id = user._id if user._id?
		user
	
	@adapt_to_user_array: (body) ->
		users = []
		for user in body.rows
			users.push CouchDbUserRepository.adapt_to_user(user.value)
		users
	
	@adapt_to_couch: (user) ->
		user._id = user.id if user._id?
		user


class UserInfoProvider
	
	constructor: (@couchdb_user_repository) ->
		throw "CouchDbUserRepository must not be null" unless @couchdb_user_repository?
		
	get_user_info: (subject, handler) ->
		@couchdb_user_repository.get(subject.emailAddress, handler)

module.exports.CouchDbUserRepository = CouchDbUserRepository 
module.exports.UserInfoProvider = UserInfoProvider

#repo = new CouchDbUserRepository({ couchdb_url: "http://192.168.192.143:5984/" })
#repo.get_by_role("admin", (users) -> console.dir(users))
#repo.get_by_last_name("Clayton", (users) -> console.dir(users))
#repo.get("rclayton@bericotechnologies.com", (user) -> console.log(user))
#uip = new UserInfoProvider(repo)
#uip.get_user_info({ emailAddress: "rclayton@bericotechnologies.com" }, (user) -> console.log(user))