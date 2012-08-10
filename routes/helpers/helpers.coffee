
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