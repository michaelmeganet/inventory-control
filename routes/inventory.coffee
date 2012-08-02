_ = (require "underscore")._
config = require "../conf/app_config.js"

CouchDbInventoryRepository = (require "../middleware/couchdb_repository.js").CouchDbInventoryRepository

inv_repo = new CouchDbInventoryRepository({ couchdb_url: config.couch_base_url })

helpers = require "./helpers/helpers.js"
ListHandler = helpers.ListHandler
ResultsHandler = helpers.ResultsHandler
MandatoryFieldChecker = helpers.MandatoryFieldChecker

InventoryLocation = (require "../model/inventory_item.js").InventoryLocation

mando_fields = ["serial_no", "make", "model", "owner", 
	"date_added", "date_received", "disposition",
	"issuability", "allow_self_issue", "type", 
	"estimated_value" ]
	
inventory_checker = new MandatoryFieldChecker(mando_fields)

build_state = (req, title, desc) ->
	state = {}
	state.title = title
	state.description = desc
	state.user = req.user
	# Imported from ../conf/app_config.js
	state.config = config
	state

validate_item_state = (item) ->
	inventory_checker.mandatory_fields_are_set(item)

comma_sep_categories_to_array = (categories) ->
	cat_array = []
	if categories?
		cats = categories.split(',')
		for cat in cats
			cat_array.push cat.replace(" ", "")
	cat_array

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
	
prune_locations = (item) ->
	for k, v of item
		if k.substring(0, 4) is "loc_"
			delete item[k]
	console.dir item
	item

normalize_post_values = (item) ->
	item.date_added = new Date().toISOString() unless item.date_added?
	item.disposition = "Available" unless item.disposition?
	if validate_item_state item
		new_item = {}
		new_item.location = expand_location item
		pruned = prune_locations item
		_.extend(new_item, pruned)
		new_item.categories = comma_sep_categories_to_array item.categories
		new_item.id = item.serial_no
		new_item.estimated_value = parseFloat(item.estimated_value)
		new_item.allow_self_issue = Boolean(item.allow_self_issue)
		new_item
	else
		null

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
	
	app.get '/inv/items', (req, res) ->
		handler = new ListHandler(req, res, "Inventory Items", "", "inventory_by_serial_no")
		if req.params.startkey?
			inv_repo.list handler.handle_results, req.params.startkey
		else
			inv_repo.list handler.handle_results
	
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
