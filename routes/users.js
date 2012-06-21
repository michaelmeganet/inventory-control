(function() {
  var CouchDbUserRepository, user_repo, user_repo_module;

  user_repo_module = require("../middleware/couchdb_user_repository.js");

  CouchDbUserRepository = user_repo_module.CouchDbUserRepository;

  user_repo = new CouchDbUserRepository({
    couchdb_url: "http://192.168.192.143:5984/"
  });

  module.exports.create = function(req, res) {
    user_repo.add(req.body.user);
    return res.json({
      status: "ok"
    });
  };

  module.exports.create_form = function(req, res) {
    return res.render("users_create", {
      title: "Add New User"
    });
  };

  module.exports.get = function(req, res) {
    return user_repo.get(req.params.id, function(user) {
      return res.json(user);
    });
  };

  module.exports.remove = function(req, res) {};

  module.exports.update = function(req, res) {};

  module.exports.by_role = function(req, res) {
    return user_repo.get_by_role(req.params.role, function(users) {
      return res.json(users);
    });
  };

  module.exports.by_last_name = function(req, res) {
    return user_repo.get_by_last_name(req.params.last_name, function(users) {
      return res.json(users);
    });
  };

}).call(this);
