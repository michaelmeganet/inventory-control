
class ListHandler 
	
	constructor: (@req, @res, @title, @desc, @template) ->
		@state = {}
		@state.prev_key = @req.params.prev_key if @req.params.prev_key?
		@state.startkey = @req.params.startkey if @req.params.startkey?
		@state.title = @title
		@state.description = @desc
		@state.user = @req.user
		
	handle_results: (results) =>
		@state.models = results.models
		@state.next_key = results.next_startkey if results.next_startkey?
		@state.cur_key = results.startkey
		@res.render(@template, @state)
		
module.exports.ListHandler = ListHandler