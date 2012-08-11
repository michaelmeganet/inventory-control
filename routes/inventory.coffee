_ = (require "underscore")._
config = require ("../conf/app_config.js")
helpers = (require "./helpers/helpers.coffee")
inv_models = (require "../model/inventory_item.coffee")
repos = (require "../middleware/couchdb_repository.coffee")

ListHandler = helpers.ListHandler
ResultsHandler = helpers.ResultsHandler
SearchHandler = helpers.SearchHandler
GetModelThenView = helpers.GetModelThenView
InventoryLocation = inv_models.InventoryLocation
WarrantyInfo = inv_models.WarrantyInfo

inv_repo = new repos.CouchDbInventoryRepository({ couchdb_url: config.couch_base_url })


# ------------------------------------------------------------------------------------------	
#   UTILITIES
# ------------------------------------------------------------------------------------------

# Very simple function to consistently build the state 
# supplied to the template engine
# @param req Request Object
# @param title Page Title
# @param desc Page Description
build_state = (req, title, desc) ->
	state = {}
	state.title = title
	state.description = desc
	state.user = req.user
	# Imported from ../conf/app_config.js
	state.config = config
	state

# Turn a CSV category list to an array of categories.
comma_sep_categories_to_array = (categories) ->
	cat_array = []
	if categories?
		cats = categories.split(',')
		for cat in cats
			cat_array.push cat.replace(" ", "")
	cat_array

# Expand the flatten form fields for location into
# a location object.
expand_location = (item) ->
	loc = 
		is_mobile: item.loc_is_mobile
		line1: item.loc_line1
		line2: item.loc_line2
		city: item.loc_city
		state: item.loc_state
		zipcode: item.loc_zipcode
		office: item.loc_office
		room: item.loc_room
	new InventoryLocation(loc)

# Expand the flatten form fields for warranty info into
# a location object.
expand_warranty_info = (item) ->
	warranty_info = 
		start_date: item.war_start_date
		end_date: item.war_end_date
		description: item.war_description
	new WarrantyInfo(warranty_info)

# When we extend the model object with the state from the form,
# we don't want extraneous fields (particularly subobjects) from
# polluting the core model.  Since I have taken the convention of 
# prefixing the fields of submodels, we can prune those properties
# from the form state 
prune_prefixed_fields = (item, prefix) ->
	for k, v of item
		if k.indexOf(prefix) is 0
			delete item[k]
	item

# Normalize the flattened model returned to use in a POST.
normalize_post_values = (item) ->
	item.date_added = new Date().toISOString() unless item.date_added?
	item.disposition = "Available" unless item.disposition?
	new_item = {}
	new_item.location = expand_location item
	new_item.warranty = expand_warranty_info item
	pruned = prune_prefixed_fields item, "loc_"
	pruned = prune_prefixed_fields pruned, "war_"
	_.extend(new_item, pruned)
	new_item.software = JSON.parse(item.software)
	new_item.accessories = JSON.parse(item.accessories)
	new_item.categories = comma_sep_categories_to_array item.categories
	new_item.id = item.serial_no
	new_item.estimated_value = parseFloat(item.estimated_value)
	new_item.allow_self_issue = Boolean(item.allow_self_issue)
	if new_item.checked_out_to is ""
		delete new_item.checked_out_to
		delete new_item.checked_out_by
	new_item

# ------------------------------------------------------------------------------------------	
#   ROUTE DEFINITIONS AND HANDLERS
# ------------------------------------------------------------------------------------------
module.exports = (app) ->
	
	app.get '/inv/new', (req, res) ->
		state = build_state req, "Add to Inventory", "Add a new or existing item to the Inventory Control System"
		res.render("inventory_create", state)
	
	# ------------------------------------------------------------------------------------------	
	#   DATA SERVICES
	# ------------------------------------------------------------------------------------------
	
	# The search route is reserved for full text search of model concepts, delegated to 
	# CouchDB Lucene.  This is typically used for Autocompletes.
	app.get '/search/make_model_no/:query', new SearchHandler(inv_repo, "find_make_model_no").handle_query
	
	# ------------------------------------------------------------------------------------------	
	#   TEMPLATE RENDERING ROUTES
	# ------------------------------------------------------------------------------------------
	
	base_get_and_view_options =
		repo: inv_repo
		config: config
		description: (item) -> "#{item.make} #{item.model} #{item.model_no}, [#{item.serial_no}]"

	extend_base_options = (extensions) ->
		options = _.clone base_get_and_view_options
		_.extend options, extensions
		options
	
	get_model_then_view = (route, template, title) ->
		app.get route, new GetModelThenView(
			extend_base_options { template: template, title: title })
				.handle_request
	
	get_model_then_view '/inv/item/:id', "inventory_view", "Inventory Item"
	get_model_then_view '/inv/item/:id/update', "inventory_update", "Update Inventory Item"
	get_model_then_view '/inv/item/:id/remove', "inventory_remove", "Remove Inventory Item?"
	get_model_then_view '/inv/item/:id/assign', "inventory_assign", "Assign Inventory Item"
	get_model_then_view '/inv/item/:id/checkin', "inventory_checkin", "Check-in Inventory Item"
	get_model_then_view '/inv/item/:id/return', "inventory_return", "Return Inventory Item"
	get_model_then_view '/inv/item/:id/extend', "inventory_extend", "Extend Borrow Time"
	get_model_then_view '/inv/item/:id/verify', "inventory_verify", "Verify Check-in"
			
	# ------------------------------------------------------------------------------------------	
	#   INVENTORY COLLECTION VIEWS
	# ------------------------------------------------------------------------------------------
	
	# Generic handler for views, which will properly handle paging and filtering by key
	get_list_then_view = (req, res, filter, template) ->
		handler = new ListHandler(req, res, "Inventory Items", "", template)
		if req.params.startkey?
			inv_repo["list_#{filter}"](handler.handle_results, req.params.startkey)
		else if req.params.key?
			inv_repo["get_#{filter}"](handler.handle_results, req.params.key)
		else
			inv_repo["list_#{filter}"](handler.handle_results)

	# Register a category (or filter) for inventory items.  This will typically register
	# 4 routes (patterns in method), and optionally a fifth (the default) if specified.
	view_inventory_items_by = (filter, is_default = false) ->
		handler = (req, res) -> get_list_then_view req, res, "by_#{filter}", "inventory_by_#{filter}"
		app.get "/inv/items", handler if is_default
		app.get "/inv/items/by/#{filter}", handler
		app.get "/inv/items/by/#{filter}/:key", handler
		app.get "/inv/items/by/#{filter}/s/:startkey", handler
		app.get "/inv/items/by/#{filter}/s/:startkey/p/:prev_key", handler		
	
	# All of the categories of filters.  The category prefixed with "by_" is a direct
	# mapping to a view in CouchDB in the "inventory" design document.
	inventory_list_categories = [ 
		[ "serial_no", true ], "disposition", "location", "type", 
		"date_received", "make_model_no", "user", "availability", 
		"needs_verification", "checked_out"
	]
	
	# Instead of calling the method 800 times for each list, this loop will iterate over the
	# list of categories (above) registering the category
	for category in inventory_list_categories
		cat = if category.push? then category else [ category ]
		view_inventory_items_by.apply(this, cat)
	
			
	# ------------------------------------------------------------------------------------------	
	#   MODEL-ACTIONS ROUTES
	# ------------------------------------------------------------------------------------------
	
	app.post '/inv/new', (req, res) ->
		item = normalize_post_values req.body.inv
		unless item is null
			results_handler = new ResultsHandler(res, "/inv/item/#{item.serial_no}", "/500.html")
			inv_repo.add item, item.serial_no, results_handler.handle_results
		else
			res.redirect("/500.html")
	
	app.post '/inv/item/:id', (req, res) ->
		item = normalize_post_values req.body.inv
		unless item is null
			results_handler = new ResultsHandler(res, "/inv/item/#{item.serial_no}", "/500.html")
			inv_repo.update_core item, results_handler.handle_results
		else
			res.redirect("/500.html")

	app.post '/inv/item/:id/remove', (req, res) ->	
		inv_repo.get req.params.id, (item) ->
			inv_repo.remove item
			res.redirect("/inv/items")

	app.post '/inv/item/:id/assign', (req, res) ->
		context = 
			id: req.params.id
			method: "issue"
			checked_out_by: req.user.email
			checked_out_to: req.body.ctx.user
		inv_repo.checkout context, () ->
			res.redirect("/inv/item/#{req.params.id}")

	app.post '/inv/item/:id/checkin', (req, res) ->
	
	app.post '/inv/item/:id/checkin', (req, res) ->
		
	app.post '/inv/item/:id/return', (req, res) ->
		
	app.post '/inv/item/:id/extend', (req, res) ->		
	
	app.post '/inv/item/:id/verify', (req, res) ->	
