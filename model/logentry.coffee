_ = (require "underscore")._
Entity = (require "./entity").Entity

x = exports ? this

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

