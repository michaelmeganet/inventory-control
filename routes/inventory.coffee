_ = (require "underscore")._

CouchDbInventoryRepository = (require "../middleware/couchdb_repository.js").CouchDbInventoryRepository

inv_repo = new CouchDbInventoryRepository({ couchdb_url: "http://192.168.192.143:5984/" })

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

module.exports.create = (req, res) ->
	item = normalize_post_values req.body.inv
	unless item is null
		results_handler = new ResultsHandler(res, "/inv/#{item.serial_no}", "/500.html")
		inv_repo.add item, item.serial_no, results_handler.handle_results
	else
		res.redirect("/500.html")
	
	
module.exports.create_form = (req, res) ->
	state = build_state req, "Add to Inventory", "Add a new or existing item to the Berico Inventory Control System"
	res.render("inventory_create", state)
	
module.exports.update = (req, res) ->
	item = normalize_post_values req.body.inv
	unless item is null
		results_handler = new ResultsHandler(res, "/inv/#{item.serial_no}", "/500.html")
		inv_repo.update item, results_handler.handle_results
	else
		res.redirect("/500.html")
	
module.exports.update_form = (req, res) ->
	item = inv_repo.get req.params.id, (item) ->
		state = build_state req, "Update Item", "#{item.make}-#{item.model}, [#{item.serial_no}]"
		state.item = item
		res.render "inventory_update", state
	
module.exports.list = (req, res) ->
	handler = new ListHandler(req, res, "Inventory Items", "", "inventory_by_serial_no")
	if req.params.startkey?
		inv_repo.list handler.handle_results, req.params.startkey
	else
		inv_repo.list handler.handle_results

module.exports.remove = (req, res) ->	
	inv_repo.get req.params.id, (item) ->
		inv_repo.remove item
		res.redirect("/inv/items")

module.exports.remove_form = (req, res) ->
	inv_repo.get req.params.id, (item) ->	
		state = 
			title: "Remove Inventory Item?"
			description: "#{item.serial_no} - #{item.make} #{item.model} #{item.model_no}"
			user: req.user
			item: item
		res.render "inventory_remove", state	
	