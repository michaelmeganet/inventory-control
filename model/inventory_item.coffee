_ = (require "underscore")._

x = exports ? this

class x.InventoryItem 
	constructor: (init_state) ->
		@id = null
		@serial_no = null
		@categories = []
		@type = null
		@make = null
		@model = null
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