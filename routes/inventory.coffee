_ = (require "underscore")._
config = require ("../conf/app_config.js")
helpers = (require "./helpers/helpers.js")
inv_models = (require "../model/inventory_item.js")
repos = (require "../middleware/couchdb_repository.js")

ListHandler = helpers.ListHandler
ResultsHandler = helpers.ResultsHandler
InventoryLocation = inv_models.InventoryLocation
WarrantyInfo = inv_models.WarrantyInfo

inv_repo = new repos.CouchDbInventoryRepository({ couchdb_url: config.couch_base_url })

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
	
	new_item


# ROUTE DEFINITIONS AND HANDLERS
module.exports = (app) ->
	
	app.post '/inv/new', (req, res) ->
		item = normalize_post_values req.body.inv
		unless item is null
			results_handler = new ResultsHandler(res, "/inv/item/#{item.serial_no}", "/500.html")
			inv_repo.add item, item.serial_no, results_handler.handle_results
		else
			res.redirect("/500.html")
	
	app.get '/inv/new', (req, res) ->
		state = build_state req, "Add to Inventory", "Add a new or existing item to the Berico Inventory Control System"
		res.render("inventory_create", state)
	
	handle_inventory_list = (req, res, view, template) ->
		handler = new ListHandler(req, res, "Inventory Items", "", template)
		if req.params.startkey?
			inv_repo[view] handler.handle_results, req.params.startkey
		else
			inv_repo[view] handler.handle_results
	
	app.get '/inv/items', (req, res) -> handle_inventory_list req, res, "by_serial_no", "inventory_by_serial_no"
	app.get '/inv/items/by/serial_no', (req, res) -> handle_inventory_list req, res, "by_serial_no", "inventory_by_serial_no"
	app.get '/inv/items/by/disposition', (req, res) -> handle_inventory_list req, res, "by_disposition", "inventory_by_disposition"
	app.get '/inv/items/by/location', (req, res) -> handle_inventory_list req, res, "by_location", "inventory_by_location"
	app.get '/inv/items/by/type', (req, res) -> handle_inventory_list req, res, "by_type", "inventory_by_type"
	app.get '/inv/items/by/date_received', (req, res) -> handle_inventory_list req, res, "by_date_received", "inventory_by_date_received"
	app.get '/inv/items/by/make_model_no', (req, res) -> handle_inventory_list req, res, "by_make_model_no", "inventory_by_make_model_no"
	
	app.get '/inv/item/:id', (req, res) ->
		unless req.params.id is null
			inv_repo.get req.params.id, (target_item) ->
				state = build_state req, "Inventory Item", "#{target_item.make}-#{target_item.model}, [#{target_item.serial_no}]"
				state.item = target_item
				res.render "inventory_item_view", state
		else
			# No ID
			res.redirect("/500.html")
	
	app.post '/inv/item/:id', (req, res) ->
		item = normalize_post_values req.body.inv
		unless item is null
			results_handler = new ResultsHandler(res, "/inv/item/#{item.serial_no}", "/500.html")
			inv_repo.update_core item, results_handler.handle_results
		else
			res.redirect("/500.html")
	
	app.get '/inv/item/:id/update', (req, res) ->
		on_success = (item_to_update) ->
			state = build_state req, "Update Item", "#{item_to_update.make}-#{item_to_update.model}, [#{item_to_update.serial_no}]"
			state.item = item_to_update
			res.render "inventory_update", state

		on_fail = (error) ->
			res.redirect("/500.html")

		inv_repo.get req.params.id, on_success, on_fail
	
	app.post '/inv/item/:id/remove', (req, res) ->	
		inv_repo.get req.params.id, (item) ->
		inv_repo.remove item
		res.redirect("/inv/items")
	
	app.get '/inv/item/:id/remove', (req, res) ->
		inv_repo.get req.params.id, (item) ->
			state = build_state req, "Remove Inventory Item?", "#{item.serial_no} - #{item.make} #{item.model} #{item.model_no}"	
			state.item = item
			res.render "inventory_remove", state

	app.get '/inv/item/:id/checkin', (req, res) ->
		inv_repo.get req.params.id, (item) ->
			state = build_state req, "Check-in Inventory Item", "#{item.serial_no} - #{item.make} #{item.model} #{item.model_no}"	
			state.item = item
			res.render "inventory_checkin", state
	
	app.post '/inv/item/:id/checkin', (req, res) ->
		
		
	app.get '/inv/item/:id/return', (req, res) ->
		inv_repo.get req.params.id, (item) ->
			state = build_state req, "Return Inventory Item", "#{item.serial_no} - #{item.make} #{item.model} #{item.model_no}"	
			state.item = item
			res.render "inventory_return", state
	
	app.post '/inv/item/:id/return', (req, res) ->
		
		
	app.get '/inv/item/:id/extend', (req, res) ->
		inv_repo.get req.params.id, (item) ->
			state = build_state req, "Extend Borrow Time", "#{item.serial_no} - #{item.make} #{item.model} #{item.model_no}"	
			state.item = item
			res.render "inventory_extend", state
	
	app.post '/inv/item/:id/extend', (req, res) ->	
		
		
	app.get '/inv/item/:id/verify', (req, res) ->
		inv_repo.get req.params.id, (item) ->
			state = build_state req, "Verify Check-in", "#{item.serial_no} - #{item.make} #{item.model} #{item.model_no}"	
			state.item = item
			res.render "inventory_verify", state
	
	app.post '/inv/item/:id/verify', (req, res) ->	
