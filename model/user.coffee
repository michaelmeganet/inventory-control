_ = (require "underscore")._
Entity = (require "./entity").Entity

x = exports ? this

class x.User extends Entity
	
	required_fields: ->
		[ "first_name", "last_name", "logon_name" ]
	
	constructor: (init_state) ->
		@id = null
		@first_name = null
		@last_name = null
		@logon_name = null
		@email = null
		@roles = []
		_.extend(@, init_state)
		
	is_in_role: (role) ->
		_.include(@roles, role)
