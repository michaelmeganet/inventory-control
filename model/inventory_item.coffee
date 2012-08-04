_ = (require "underscore")._

Entity = (require "./entity").Entity

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
		
class x.WarrantyInfo
	
	constructor: (init_state) ->
		init_state = init_state ? {}
		@description = null
		@start_date = null
		@end_date = null
		_.extend(@, init_state)

class x.InventoryItem extends Entity
	
	required_fields: ->
		[ "serial_no", "make", "model", "owner", 
		  "date_added", "date_received", "disposition",
		  "issuability", "allow_self_issue", "type", 
		  "condition", "estimated_value" ]
	
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
		@condition = null
		@issuability = "no-issue"
		@allow_self_issue = false
		@borrow_time = "1w"
		_.extend(@, init_state)
		loc_state = init_state.location ? {}
		@location = new x.InventoryLocation(loc_state)
		warranty_info = init_state.warranty_info ? {}
		@warranty_info = new x.WarrantyInfo(warranty_info)
	
	
	