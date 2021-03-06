_ = (require "underscore")._
User = (require "../model/user.js").User
nano = require "nano"

class CouchDbUserRepository
	
	constructor: (options) ->
		unless options?.couchdb_url? then throw "Must provide CouchDB URL"
		@connection = nano(options.couchdb_url)
		@usersdb = @connection.db.use("inventory_users")
		
	add: (user) ->
		delete user._rev
		@usersdb.insert(user, user.email, (err, body)->
				if err then console.log err
				unless err then console.log body)
	
	update: (user) ->
		user._id = user.email
		@usersdb.insert(user, user.email, (err, body)->
				unless err then console.log body)
	
	remove: (user) ->
		@usersdb.destroy(user.email, user._rev, (err, body) ->
				if err then console.log err)
	
	get: (email, callback) ->
		@usersdb.get email, (error, body) ->
			console.log "Problem retrieving user: #{error}" if error
			user = CouchDbUserRepository.adapt_to_user(body)
			callback.apply(@, [user])
	
	@l_comma_f_name_key_factory = (user) ->
		"#{user.last_name},#{user.first_name}"
	
	list: (callback, startkey, limit = 10, view = "by_lastname", key_factory = CouchDbUserRepository.l_comma_f_name_key_factory) ->
		params = {}
		if startkey?
			params["startkey"] = startkey
		params["limit"] = limit + 1	
		@usersdb.view "users", view, params, (error, body) ->
			console.log "Problem retrieving user list: #{error}" if error
			users = CouchDbUserRepository.adapt_to_user_array(body)
			results = {}
			if users.length is (limit + 1)
				last_user = _.last(users)
				results.next_startkey = key_factory last_user
			results.users = _.first(users, limit)
			results.startkey = key_factory users[0]
			callback.apply(@, [results])
			
	get_by_role: (role, callback) ->
		params = {}
		params["key"] = role
		@usersdb.view "users", "by_roles", params, (error, body) ->
			console.log "Problem retrieving users by role '#{error}'" if error
			users = CouchDbUserRepository.adapt_to_user_array(body)
			callback(users)
	
	get_by_last_name: (last_name, callback) ->
		params = {}
		unless last_name is "all"
			params["key"] = last_name
		@usersdb.view "users", "by_lastname", params, (error, body) ->
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
#print = (list) -> console.dir(list)
#repo.list(print, "swoolwine@bericotechnologies.com")
#repo.get_by_role("admin", (users) -> console.dir(users))
#repo.get_by_last_name("Clayton", (users) -> console.dir(users))
#repo.get("rclayton@bericotechnologies.com", (user) -> console.log(user))
#uip = new UserInfoProvider(repo)
#uip.get_user_info({ emailAddress: "rclayton@bericotechnologies.com" }, (user) -> console.log(user))