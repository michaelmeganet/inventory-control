nano = require "nano"
_ = (require "underscore")._
User = (require "../model/user.js").User
InventoryItem = (require "../model/inventory_item.js").InventoryItem

class CouchDbRepository
	
	constructor: (options) ->
		unless options?.couchdb_url? then throw "Must provide CouchDB URL"
		unless options?.database? then throw "Must provide database name"
		@connection = nano(options.couchdb_url)
		@db = @connection.db.use(options.database)
		@model_adaptor = options.model_adaptor ? (body) -> body
		@array_of_model_adaptor = options.array_of_model_adaptor ? (body) -> body.rows
		@id_adaptor = options.id_adaptor ? null
	
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
		options.limit = options.limit ? 10
		options.array_of_model_adaptor = @array_of_model_adaptor
		params = {}
		if startkey?
			params.startkey = startkey
		params.limit = options.limit + 1
		@db.view options.view_doc, options.view, params, (error, body) ->
			console.log "Problem accessing view #{error}" if error
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
	
	view: (callback, key, options) ->
		options.array_of_model_adaptor = @array_of_model_adaptor
		params = {}
		params.key = key if key?
		params.limit = options.limit if options?.limit?	
		@db.view options.view_doc, options.view, params, (error, body) ->
			models = options.array_of_model_adaptor(body)
			callback.apply(@, [models])
	
	@adapt_to_couch: (model) ->
		model._id = model.id unless model._id?
		model

	add: (model, key, callback) ->
		# This is a sanity check;
		# Sometimes a UI may leave a null revision.
		delete model._rev
		couch_model = CouchDbRepository.adapt_to_couch(model)
		@db.insert couch_model, key, (error, body) ->
			console.log error if error
			callback(error, body) if callback?

	get: (key, callback) ->
		model_adaptor = @model_adaptor
		@db.get key, (error, body) ->
			console.log error if error
			callback(model_adaptor(body))
			
	update: (model, callback) ->
		couch_model = CouchDbRepository.adapt_to_couch(model)
		couch_model._id = @id_adaptor(model) if @id_adaptor?
		@db.insert model, model._id, (error, body) ->
			console.log error if error
			callback(error, body) if callback?
	
	remove: (model, callback) ->
		@db.destroy model._id, model._rev, (error, body) ->
			console.log error if error
			callback(error, body) if callback? 


class CouchDbUserRepository extends CouchDbRepository

	constructor: (options) ->
		options.database = "inventory_users"
		super options

	get_by_role: (callback, key) ->
		options = {}
		options.view_doc = "users"
		options.view = "by_roles"
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
		options.limit = 3
		@paging_view callback, startkey, options
		
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

repo = new CouchDbInventoryRepository({ couchdb_url: "http://192.168.192.143:5984/"})
dir = (items) -> console.dir items
#repo.list dir, "45678"
#repo.get "45678", (item) ->
#	item.hello = "world"
#	repo.update item

urepo = new CouchDbUserRepository({ couchdb_url: "http://192.168.192.143:5984/"})
urepo.get_by_role dir, "admin"