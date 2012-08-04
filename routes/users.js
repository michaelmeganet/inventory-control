(function() {
  var CouchDbUserRepository, ListHandler, ResultsHandler, build_state, config, flatten_roles, helpers, normalize_post_values, role_membership, user_repo, _;

  _ = (require("underscore"))._;

  config = require("../conf/app_config.js");

  CouchDbUserRepository = (require("../middleware/couchdb_repository.js")).CouchDbUserRepository;

  user_repo = new CouchDbUserRepository({
    couchdb_url: "http://192.168.192.143:5984/"
  });

  helpers = require("./helpers/helpers.js");

  ListHandler = helpers.ListHandler;

  ResultsHandler = helpers.ResultsHandler;

  normalize_post_values = function(user, roles) {
    var new_user, role, v;
    new_user = {};
    _.extend(new_user, user);
    new_user.roles = [];
    new_user.roles.push("user");
    for (role in roles) {
      v = roles[role];
      new_user.roles.push(role);
    }
    new_user.email = "" + new_user.logon_name + "@bericotechnologies.com";
    new_user.id = new_user.email;
    return new_user;
  };

  flatten_roles = function(roles) {
    var membership, role, _i, _len;
    membership = {};
    for (_i = 0, _len = roles.length; _i < _len; _i++) {
      role = roles[_i];
      membership[role] = true;
    }
    return membership;
  };

  role_membership = function(roles) {
    var default_memberships, memberships;
    memberships = flatten_roles(roles);
    default_memberships = {
      admin: false,
      view_inventory: false,
      view_reports: false,
      add_inventory: false,
      remove_inventory: false,
      assign_inventory: false,
      check_in_inventory: false
    };
    _.extend(default_memberships, memberships);
    return default_memberships;
  };

  build_state = function(req, title, desc) {
    var state;
    state = {};
    state.title = title;
    state.description = desc;
    state.user = req.user;
    state.config = config;
    return state;
  };

  module.exports = function(app) {
    var by_role, list;
    app.post('/user/new', function(req, res) {
      var user;
      user = normalize_post_values(req.body.user, req.body.roles);
      if (user !== null) user_repo.add(user);
      return res.redirect("/users/");
    });
    app.get('/user/new', function(req, res) {
      return res.render("users_create", {
        title: "Add New User",
        user: req.user
      });
    });
    app.post('/user/:id', function(req, res) {
      var user;
      user = normalize_post_values(req.body.user, req.body.roles);
      if (user !== null) {
        user_repo.update(user);
        if (user.id === req.session.user.id) req.session.user = user;
      }
      return res.redirect("/users/");
    });
    app.get('/user/:id', function(req, res) {
      return user_repo.get(req.params.id, function(user) {
        var state;
        state = build_state(req, "User Information", "" + user.last_name + ", " + user.first_name);
        state.target_user = user;
        return res.render("users_view", state);
      });
    });
    app.get('/user/:id/update', function(req, res) {
      return user_repo.get(req.params.id, function(user) {
        var roles, state;
        roles = role_membership(user.roles);
        state = build_state(req, "Update User", null);
        state.target_user = user;
        state.roles = roles;
        return res.render("users_update", state);
      });
    });
    app.post('/user/:id/remove', function(req, res) {
      return user_repo.get(req.params.id, function(user) {
        user_repo.remove(user);
        return res.redirect("/users/");
      });
    });
    app.get('/user/:id/remove', function(req, res) {
      return user_repo.get(req.params.id, function(user) {
        var state;
        state = build_state(req, "Remove User?", null);
        state.target_user = user;
        return res.render("users_remove", state);
      });
    });
    list = function(req, res) {
      var handler;
      handler = new ListHandler(req, res, "Inventory Users", "", "users_by_last_name");
      if (req.params.startkey != null) {
        return user_repo.list(handler.handle_results, req.params.startkey);
      } else {
        return user_repo.list(handler.handle_results);
      }
    };
    app.get('/users/', list);
    app.get('/users/s/:startkey', list);
    app.get('/users/s/:startkey/p/:prev_key', list);
    by_role = function(req, res) {
      var handler, role, state, _ref, _ref2;
      state = build_state(req, "Users by Role", role);
      state.role = role = (_ref = (_ref2 = req.params.role) != null ? _ref2 : req.body.role) != null ? _ref : "admin";
      if (req.params.prev_key != null) state.prev_key = req.params.prev_key;
      if (req.params.startkey != null) state.startkey = req.params.startkey;
      handler = function(users) {
        state.models = users;
        return res.render("users_by_role", state);
      };
      return user_repo.get_by_role(handler, role);
    };
    app.get('/users/by_role/', by_role);
    app.get('/users/by_role/s/:startkey', by_role);
    app.get('/users/by_role/s/:startkey/p/:prev_key', by_role);
    app.post('/users/by_role/', by_role);
    app.get('/users/by_role/:role', by_role);
    app.get('/users/by_last_name/:last_name', function(req, res) {
      return res.redirect("/users/");
    });
    return app.get('/users/refresh_info', function(req, res) {
      delete req.session.user;
      return res.redirect(req.header('Referer'));
    });
  };

}).call(this);
