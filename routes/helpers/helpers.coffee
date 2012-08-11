
class ListHandler 
	
	constructor: (@req, @res, @title, @desc, @template) ->
		@state = {}
		@state.prev_key = @req.params.prev_key if @req.params.prev_key?
		@state.startkey = @req.params.startkey if @req.params.startkey?
		@state.key = @req.params.key if @req.params.key?
		@state.title = @title
		@state.description = @desc
		@state.user = @req.user
		
	handle_results: (results) =>
		@state.models = results.models
		@state.next_key = results.next_startkey if results.next_startkey?
		@state.cur_key = results.startkey if results.startkey?
		@state.key = results.key if results.key?
		@res.render(@template, @state)
		
module.exports.ListHandler = ListHandler

class SearchHandler
	
	constructor: (@repo, @query_fn) ->

	handle_query: (req, res) =>
		if req.params.query?
			json_response = (data) ->
				res.json data
			@repo[@query_fn] json_response, req.params.query
		else
			res.status(400).json({success: false, reason: "No query term in url." })

module.exports.SearchHandler = SearchHandler

class ResultsHandler
	
	constructor: (@res, @success_url, @fail_url) ->

	handle_results: (error, body) =>
		unless error
			@res.redirect(@success_url)
		else
			@res.redirect(@fail_url)

module.exports.ResultsHandler = ResultsHandler

###
inv_repo.get req.params.id, (item) ->
	state = build_state req, "Remove Inventory Item?", "#{item.serial_no} - #{item.make} #{item.model} #{item.model_no}"	
	state.item = item
	res.render "inventory_remove", state
###

class GetModelThenView
	
	constructor: (options) ->
		@repo = options.repo
		@method = options.method ? "get"
		@get_model_id = options.get_model_id ? (req) -> req.params.id
		@title = options.title
		@description = options.description
		@template = options.template
		@config = options.config
		
	handle_request: (req, res) =>
		model_id = @get_model_id req
		that = @
		
		build_state = (req, title, desc, model) =>
			state = {}
			state.title = title
			state.description = desc
			state.user = req.user
			state.item = model
			state.config = that.config
			state
		
		on_model_returned = (model) ->
			title = if (typeof(that.title) is "function") then that.title(model) else that.title
			description = if (typeof(that.description) is "function") then that.description(model) else that.description
			state = build_state req, title, description, model
			res.render that.template, state
	
		on_retrieval_error = (error) ->
			res.redirect "/500.html"
	
		if model_id is null
			res.redirect "/500.html"
		else
			@repo[@method] model_id, on_model_returned, on_retrieval_error


module.exports.GetModelThenView = GetModelThenView






