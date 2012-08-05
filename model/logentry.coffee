_ = (require "underscore")._
Entity = (require "./entity").Entity

x = exports ? this

class x.ItemLog extends Entity
	
	required_fields: -> [ ]

	constructor: (init_state) ->
		for k, v of init_state
			unless k.indexOf("_") is 0
			@[k] = new LogEntry(v)
		

class x.LogEntry extends Entity
	
	required_fields: ->
		[ "item_id", "category", "text", "user", "datetime" ]
	
	constructor: (init_state) ->
		@item_id = null
		@text = null
		@user = null
		@category = null
		@datetime = null
		_.extend(@, init_state)

