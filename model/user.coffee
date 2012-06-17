_ = (require "underscore")._

x = exports ? this

class x.User
	
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
