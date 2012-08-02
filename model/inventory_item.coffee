_ = (require "underscore")._

x = exports ? this

class x.InventoryLocation
	
	constructor: (init_state) ->
		init_state = init_state ? {}
		@is_mobile = false
		@line1 = null
		@line2 = null
		@city = null
		@state = null
		@zipcode = null
		@office = null
		@room = null
		_.extend(@, init_state)
	
	is_office: () ->
		@office? and @office is not ""

class x.InventoryItem 
	
	constructor: (init_state) ->
		init_state = init_state ? {}
		@id = null
		@serial_no = null
		@categories = []
		@type = null
		@make = null
		@model = null
		@model_no = null
		@estimated_value = null
		@asset_tag = null
		@date_received = null
		@date_added = null
		@owner = null
		@disposition = null
		@issuability = "no-issue"
		@allow_self_issue = false
		@borrow_time = "1w"
		_.extend(@, init_state)
		loc_state = init_state.location ? {}
		@location = new x.InventoryLocation(loc_state)
		