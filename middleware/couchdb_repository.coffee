nano = require "nano"
_ = (require "underscore")._
User = (require "../model/user.js").User
LogEntry = (require "../model/logentry.js").LogEntry
InventoryItem = (require "../model/inventory_item.js").InventoryItem

class ErrorTranslater
	
	@get_reason: (error, context) ->
		switch error.status_code
			when 404 
				if error.error is "not_found"
					"No document was found for #{context}"
				else
					"Couch says #{error.error} was the reason for failure for #{context}"
			else
				"Couch says #{error.error} was the reason for failure for #{context}"
	
	log: (error, context) ->
		reason = ErrorTranslater.get_reason(error)
		console.log reason

# CouchDB Repository
#
# This is the Base Implementation for a CouchDB Repo.  Please extend this
# and add whatever functionality you need.
#
# Assumptions:  1.  One repository per model
#				2.  One instance per CouchDB database
#
# Options:  couchdb_url - base url of the CouchDB instance
#			database - the name of the CouchDB database to connect to
#			model_adaptor - a function to change a CouchDB Response to 
#							a single instance of your corresponding model object
#			array_of_model_adaptor - A function to change a CouchDB Response to an  
# 									array of your corresponding model objects
#			id_adaptor - A function that pulls the correct ID from your model 
# 						object to be used by CouchDB's "_id" construct.  
#						(This is admittedly not as completely implemented as I want it to be).
#
class CouchDbRepository
	
	constructor: (options) ->
		# Some state assertions
		unless options?.couchdb_url? then throw "Must provide CouchDB URL: 'options.couchdb_url'"
		unless options?.database? then throw "Must provide database name: 'options.database'"
		# Connect to CouchDB
		@connection = nano(options.couchdb_url)
		# Select the Database your Repo uses
		@db = @connection.db.use(options.database)
		# A function to change a CouchDB Response to a single instance
		# of your corresponding model object
		@model_adaptor = options.model_adaptor ? (body) -> body
		# A function to change a CouchDB Response to an array of 
		# your corresponding model objects
		@array_of_model_adaptor = options.array_of_model_adaptor ? (body) -> body.rows
		# A function that pulls the correct ID from your model object to be
		# used by CouchDB's "_id" construct.  (This is admittedly not as completely
		# implemented as I want it to be).
		@id_adaptor = options.id_adaptor ? null
		# Error translater; used to determine how errors are output to the console
		@error_translater = new ErrorTranslater()
	
	# This is a generic way to do paging against a view.
	# 
	# callback = The function to raise when the results come back
	# startkey = The key to begin the list
	# options.view_doc = Design Doc of the View
	# options.view_name = Name of the view function in the Design Doc
	# options.key_factory = The function that will provide the correct key
	# 						for the view given a model object
	# options.limit = The maximum number of docs to return.
	# options.array_of_model_adaptor = An adapter that will take a list of JSON state
	# 									and convert it to model objects
	#
	# returns:
	# 	results.startkey = the first key in the result set 
	#      (the actual startkey submitted may not actually map to a record)
	#   results.next_startkey = the id of the (limit + 1) record (not included
	#      in the resultset which will serve as the basis of the next page).
	#   results.models = the array of model objects returned from the paging.
	paging_view: (callback, startkey, options) =>
		ERRLOG = @error_translater
		options.limit = options.limit ? 10
		options.array_of_model_adaptor = @array_of_model_adaptor
		params = {}
		if startkey?
			params.startkey = startkey
		params.limit = options.limit + 1
		@db.view options.view_doc, options.view, params, (error, body) ->
			ERRLOG.log(error, "[paging-view,#{startkey},#{options.view_name}]") if error
			models = options.array_of_model_adaptor(body)
			results = {}
			if models.length is (options.limit + 1)
				last_model = _.last(models)
				results.next_startkey = options.key_factory(last_model)
			results.models = _.first(models, options.limit)
			# We access the first record in the model to get it's key
			# since we can't guarantee the provided value is actually
			# a key in the database
			results.startkey = options.key_factory(models[0])
			callback.apply(@, [results])
	
	# Generic function for calling a CouchDB View.  This implementation
	# does not do paging (since it allows a key-based filter)
	# 
	# callback = The function to raise when the results come back
	# key = A specific key (like search string) to filter on
	# options.view_doc = Design Doc of the View
	# options.view_name = Name of the view function in the Design Doc
	# options.limit = The maximum number of docs to return.
	# options.array_of_model_adaptor = An adapter that will take a list of JSON state
	# 									and convert it to model objects
	view: (callback, key, options) ->
		ERRLOG = @error_translater
		options.array_of_model_adaptor = @array_of_model_adaptor
		params = {}
		params.key = key if key?
		params.limit = options.limit if options?.limit?	
		@db.view options.view_doc, options.view, params, (error, body) ->
			ERRLOG.log(error, "[view:#{key},#{options.view_name}]") if error
			models = options.array_of_model_adaptor(body)
			callback.apply(@, [models])
	
	# Simple function to adapt a model to CouchDB's "_id" constraint
	@adapt_to_couch: (model) ->
		model._id = model.id unless model._id?
		model

	add: (model, key, callback, error_callback = (error) -> null) ->
		ERRLOG = @error_translater
		# This is a sanity check;
		# Sometimes a UI may leave a null revision.
		delete model._rev
		couch_model = CouchDbRepository.adapt_to_couch(model)
		@db.insert couch_model, key, (error, body) ->
			if error
				ERRLOG.log(error, "[add:#{key}]")
				error_callback(error)
			else
				callback(error, body) if callback?

	get: (key, callback, error_callback = (error) -> null) ->
		ERRLOG = @error_translater
		model_adaptor = @model_adaptor
		@db.get key, (error, body) ->
			if error
				ERRLOG.log(error, "[get:#{key}]")
				error_callback(error)
			else
				callback(model_adaptor(body))
			
	update: (model, callback, error_callback = (error) -> null) ->
		ERRLOG = @error_translater
		couch_model = CouchDbRepository.adapt_to_couch(model)
		couch_model._id = @id_adaptor(model) if @id_adaptor?
		@db.insert model, model._id, (error, body) ->
			if error
				ERRLOG.log(error, "[update:#{model._id}]")
				error_callback(error)
			else
				callback(error, body) if callback?
	
	partial_update: (id, partial, update_doc, partial_handler, callback, suppress_error) ->
		ERRLOG = @error_translater
		@db.atomic update_doc, partial_handler, id, partial, (error, body) ->
			ERRLOG.log(error, "[pupdate:#{id},#{partial}]") if error and not suppress_error?
			callback(error, body) if callback?
	
	remove: (model, callback, error_callback = (error) -> null) ->
		ERRLOG = @error_translater
		@db.destroy model._id, model._rev, (error, body) ->
			if error
				ERRLOG.log(error, "[remove:#{model._id}]")
				error_callback(error)
			else
				callback(error, body) if callback? 


class CouchDbUserRepository extends CouchDbRepository

	constructor: (options) ->
		options.database = "inventory_users"
		options.model_adaptor = CouchDbUserRepository.adapt_to_user
		options.array_of_model_adaptor = CouchDbUserRepository.adapt_to_user_array
		super options

	list: (callback, startkey) ->
		options = {}
		options.view_doc = "users"
		options.view = "by_lastname"
		options.key_factory = (user) -> "#{user.last_name},#{user.first_name}"
		options.limit = 10
		@paging_view callback, startkey, options

	get_by_email: (callback, startkey) ->
		options = {}
		options.view_doc = "users"
		options.view = "all"
		options.key_factory = (user) -> user.email
		options.limit = 10
		@paging_view callback, startkey, options

	get_by_role: (callback, key) ->
		options = {}
		key = key ? "user"
		options.view_doc = "users"
		options.view = "by_roles"
		console.dir options
		console.log key
		@view callback, key, options

	@adapt_to_user: (body) ->
		user = new User(body)
		user.id = user._id if user._id?
		user

	@adapt_to_user_array: (body) ->
		users = []
		for user in body.rows
			users.push CouchDbUserRepository.adapt_to_user(user.value)
		users

module.exports.CouchDbUserRepository = CouchDbUserRepository

class UserInfoProvider
	
	constructor: (@couchdb_user_repository) ->
		throw "CouchDbUserRepository must not be null" unless @couchdb_user_repository?
		
	get_user_info: (subject, handler) ->
		@couchdb_user_repository.get(subject.emailAddress, handler)

module.exports.UserInfoProvider = UserInfoProvider

class CouchDbLogRepository extends CouchDbRepository
	
	constructor: (options) ->
		options.database = "inventory_log"
		options.model_adaptor = CouchDbLogRepository.adapt_to_logentry
		options.array_of_model_adaptor = CouchDbLogRepository.adapt_to_logentry_array
		super options
	
	add_logentry: (logentry, callback) =>
		that = @
		# This is the function that will be called when the result comes back
		update_handler = (error, body) ->
			# Document may not exist, so let's create it.
			if error?.status_code is 500 and error.reason.indexOf 'new TypeError("doc is null", "")' is not -1
				# Create document
				logentry_id = "#{logentry.datetime}~#{logentry.user.logon_name}"
				logentry_doc = {}
				logentry_doc["_id"] = logentry.item_id
				logentry_doc[logentry_id] = logentry 
				that.add logentry_doc, logentry.item_id, callback
			else
				callback(error, body) if callback?
		@partial_update logentry.item_id, logentry, "inventory_log", "add_logentry", update_handler, true
	
	@adapt_to_logentry: (body) ->
		logentry = new LogEntry(body)
		logentry.id = logentry._id if logentry._id?
		logentry

	@adapt_to_logentry_array: (body) ->
		entries = []
		for logentry in body.rows
			entries.push CouchDbLogRepository.adapt_to_logentry(logentry.value)
		entries
	
module.exports.CouchDbLogRepository = CouchDbLogRepository

class CouchDbInventoryRepository extends CouchDbRepository

	constructor: (options) ->
		options.database = "inventory"
		options.model_adaptor = CouchDbInventoryRepository.adapt_to_inventory_item
		options.array_of_model_adaptor = CouchDbInventoryRepository.adapt_to_inventory_item_array
		super options
	
	list: (callback, startkey) ->
		options = {}
		options.view_doc = "inventory"
		options.view = "all"
		options.key_factory = (item) -> item.serial_no
		options.limit = 25
		@paging_view callback, startkey, options
		
	update_core: (model, callback) ->
		id = model.id ? model._id
		delete model.id
		delete model._id
		delete model._rev
		@partial_update id, model, "inventory", "merge", callback
	
	@adapt_to_inventory_item: (body) ->
		item = new InventoryItem(body)
		item.id = item._id if item._id?
		item
	
	@adapt_to_inventory_item_array: (body) ->
		items = []
		for item in body.rows
			items.push CouchDbInventoryRepository.adapt_to_inventory_item(item.value)
		items
			

module.exports.CouchDbInventoryRepository = CouchDbInventoryRepository

# A simple callback function for testing
dir = (err, items) -> console.dir items

#repo = new CouchDbInventoryRepository({ couchdb_url: "http://192.168.192.143:5984/"})

#repo.list dir, "R5920761"
#repo.get "R5920761", (item) -> console.log item
#repo.get "R5920761", (item) ->
#	repo.partial_update item.id, { borrow_time: "1y" }, "inventory", "merge", (msg) -> console.log msg

#urepo = new CouchDbUserRepository({ couchdb_url: "http://192.168.192.143:5984/"})
#urepo.list dir, "Clayton,Richard"
###
repo = new CouchDbLogRepository({ couchdb_url: "http://192.168.192.143:5984/"})

comment = 
	item_id: "12345"
	text: "This shit's awesome"
	user: { first_name: "Richard", last_name: "Clayton", logon_name: "rclayton@bericotechnologies.com" }
	datetime: new Date().getTime()

repo.add_logentry comment, dir
###