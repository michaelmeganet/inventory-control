(function() {
  var CouchDbUserRepository, ListHandler, flatten_roles, normalize_post_values, role_membership, user_repo, validate_user_state, _;

  _ = (require("underscore"))._;

  CouchDbUserRepository = (require("../middleware/couchdb_repository.js")).CouchDbUserRepository;

  ListHandler = (require("./helpers/helpers.js")).ListHandler;

  user_repo = new CouchDbUserRepository({
    couchdb_url: "http://192.168.192.143:5984/"
  });

  validate_user_state = function(user) {
    var valid;
    valid = true;
    if (user.first_name == null) valid = false;
    if (user.last_name == null) valid = false;
    if (user.logon_name == null) valid = false;
    return valid;
  };

  normalize_post_values = function(user, roles) {
    var new_user, role, v;
    if (validate_user_state(user)) {
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
    } else {
      return null;
    }
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

  module.exports.create = function(req, res) {
    var user;
    user = normalize_post_values(req.body.user, req.body.roles);
    if (user !== null) user_repo.add(user);
    return res.redirect("/users/");
  };

  module.exports.create_form = function(req, res) {
    return res.render("users_create", {
      title: "Add New User",
      user: req.user
    });
  };

  module.exports.get = function(req, res) {
    return user_repo.get(req.params.id, function(user) {
      var state;
      state = {
        title: "User Information",
        description: "" + user.last_name + ", " + user.first_name,
        target_user: user,
        user: req.user
      };
      return res.render("users_view", state);
    });
  };

  module.exports.remove = function(req, res) {
    return user_repo.get(req.params.id, function(user) {
      user_repo.remove(user);
      return res.redirect("/users/");
    });
  };

  module.exports.remove_form = function(req, res) {
    return user_repo.get(req.params.id, function(user) {
      var state;
      state = {
        title: "Remove User?",
        user: req.user,
        target_user: user
      };
      return res.render("users_remove", state);
    });
  };

  module.exports.update = function(req, res) {
    var user;
    user = normalize_post_values(req.body.user, req.body.roles);
    if (user !== null) {
      user_repo.update(user);
      if (user.id === req.session.user.id) req.session.user = user;
    }
    return res.redirect("/users/");
  };

  module.exports.update_form = function(req, res) {
    return user_repo.get(req.params.id, function(user) {
      var roles, state;
      roles = role_membership(user.roles);
      state = {
        title: "Update User",
        user: req.user,
        target_user: user,
        roles: roles
      };
      return res.render("users_update", state);
    });
  };

  module.exports.list = function(req, res) {
    var handler;
    handler = new ListHandler(req, res, "Inventory Users", "", "users_by_last_name");
    if (req.params.startkey != null) {
      return user_repo.list(handler.handle_results, req.params.startkey);
    } else {
      return user_repo.list(handler.handle_results);
    }
  };

  module.exports.by_role = function(req, res) {
    var handler, role, state, _ref, _ref2;
    state = {};
    state.role = role = (_ref = (_ref2 = req.params.role) != null ? _ref2 : req.body.role) != null ? _ref : "admin";
    if (req.params.prev_key != null) state.prev_key = req.params.prev_key;
    if (req.params.startkey != null) state.startkey = req.params.startkey;
    state.title = "Users by Role";
    state.description = role;
    state.user = req.user;
    handler = function(users) {
      state.models = users;
      return res.render("users_by_role", state);
    };
    return user_repo.get_by_role(handler, role);
  };

  module.exports.by_last_name = function(req, res) {
    return res.redirect("/users/");
  };

}).call(this);
