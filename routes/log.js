(function() {
  var config, generic_error_handler, get_reason_for_status_code, helpers, log_repo, repos, _;

  _ = (require("underscore"))._;

  config = require("../conf/app_config.js");

  helpers = require("./helpers/helpers.js");

  repos = require("../middleware/couchdb_repository.js");

  log_repo = new repos.CouchDbLogRepository({
    couchdb_url: config.couch_base_url
  });

  get_reason_for_status_code = function(status_code) {
    switch (status_code) {
      case 404:
        return "No entries.";
      default:
        return "Problem accessing database";
    }
  };

  generic_error_handler = function(error, res) {
    return res.status(error.status_code).json({
      success: false,
      status_code: error.status_code,
      reason: get_reason_for_status_code(error.status_code)
    });
  };

  module.exports = function(app) {
    app.get('/log/:id', function(req, res) {
      var success_handler;
      success_handler = function(log_doc) {
        return res.json(log_doc);
      };
      return log_repo.get(req.params.id, success_handler, function(error) {
        return generic_error_handler(error, res);
      });
    });
    return app.post('/log/:id', function(req, res) {
      var logentry;
      logentry = req.body;
      if (logentry !== null) {
        return log_repo.add_logentry(logentry, function(error, body) {
          var success_handler;
          if (error) {
            return generic_error_handler(error, res);
          } else {
            success_handler = function(log_doc) {
              return res.json(log_doc);
            };
            return log_repo.get(logentry.item_id, success_handler, function(error) {
              return generic_error_handler(error, res);
            });
          }
        });
      } else {
        return res.status(500).json({
          success: false,
          reason: "Log Entry was empty"
        });
      }
    });
  };

}).call(this);
