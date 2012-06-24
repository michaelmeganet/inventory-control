(function() {
  var CouchDbUserRepository, flatten_roles, normalize_post_values, role_membership, user_repo, user_repo_module, validate_user_state, _;

  _ = (require("underscore"))._;

  user_repo_module = require("../middleware/couchdb_user_repository.js");

  CouchDbUserRepository = user_repo_module.CouchDbUserRepository;

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
      return res.json(user);
    });
  };

  module.exports.remove = function(req, res) {
    console.log("Deleting: " + req.params.id);
    return user_repo.get(req.params.id, function(user) {
      user_repo.remove(user);
      return res.redirect("/users/");
    });
  };

  module.exports.remove_form = function(req, res) {
    return user_repo.get(req.params.id, function(user) {
      return res.render("users_remove", {
        title: "Remove User?",
        user: req.user,
        target_user: user
      });
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
      var roles;
      roles = role_membership(user.roles);
      return res.render("users_update", {
        title: "Update User",
        user: req.user,
        target_user: user,
        roles: roles
      });
    });
  };

  module.exports.list = function(req, res) {
    return user_repo.list(function(results) {
      return res.render("users_by_last_name", {
        title: "Inventory Users",
        user: req.user,
        users: results.users
      });
    });
  };

  module.exports.by_role = function(req, res) {
    var role, _ref, _ref2;
    role = (_ref = (_ref2 = req.params.role) != null ? _ref2 : req.body.role) != null ? _ref : "admin";
    return user_repo.get_by_role(role, function(users) {
      return res.render("users_by_role", {
        title: "Users by Role",
        description: role,
        user: req.user,
        users: users
      });
    });
  };

  module.exports.by_last_name = function(req, res) {
    return res.redirect("/users/");
  };

}).call(this);
