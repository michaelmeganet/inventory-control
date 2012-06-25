
build_state = (req, title, desc) ->
	state = {}
	state.title = title
	state.description = desc
	state.user = req.user
	state

module.exports.create = (req, res) ->
	res.json({})
	
	
module.exports.create_form = (req, res) ->
	state = build_state req, "Add to Inventory", "Add a new or existing item to the Berico Inventory Control System"
	res.render("inventory_create", state)