x = exports ? this

class x.Entity
	
	required_fields: ->
		[]
	
	mandatory_fields_are_set: =>
		valid = true
		for field in @required_fields()
			valid = false unless @[field]?	
		valid
	
	is_valid: =>
		mandatory_fields_are_set()
	