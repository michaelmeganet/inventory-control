_ = (require "underscore")._
config = require ("../conf/app_config.js")
helpers = (require "./helpers/helpers.coffee")
repos = (require "../middleware/couchdb_repository.coffee")

log_repo = new repos.CouchDbLogRepository({ couchdb_url: config.couch_base_url })

get_reason_for_status_code = (status_code) ->
	switch status_code
		when 404 then "No entries."
		else "Problem accessing database"

generic_error_handler = (error, res) ->
	res.status(error.status_code).json({ success: false, status_code: error.status_code, reason: get_reason_for_status_code(error.status_code) })


# ROUTE DEFINITIONS AND HANDLERS
module.exports = (app) ->
	
	app.get '/log/:id', (req, res) ->	
		success_handler = (log_doc) ->
			res.json(log_doc)
		log_repo.get req.params.id, success_handler, (error) ->
			generic_error_handler error, res
			
	app.post '/log/:id', (req, res) ->
		logentry = req.body
		unless logentry is null
			log_repo.add_logentry logentry, (error, body) ->
				if error
					generic_error_handler(error, res)
				else
					success_handler = (log_doc) ->
						res.json(log_doc)
					log_repo.get logentry.item_id, success_handler, (error) ->
						generic_error_handler error, res
		else
			res.status(500).json({success: false, reason: "Log Entry was empty"})
