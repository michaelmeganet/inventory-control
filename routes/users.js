(function() {
  var CouchDbUserRepository, ListHandler, flatten_roles, normalize_post_values, role_membership, user_repo, user_repo_module, validate_user_state, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

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
      return res.render("users_view", {
        title: "User Information",
        description: "" + user.last_name + ", " + user.first_name,
        target_user: user,
        user: req.user
      });
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

  ListHandler = (function() {

    function ListHandler(req, res, title, desc, template) {
      this.req = req;
      this.res = res;
      this.title = title;
      this.desc = desc;
      this.template = template;
      this.handle_results = __bind(this.handle_results, this);
      this.state = {};
      if (this.req.params.prev_key != null) {
        this.state.prev_key = this.req.params.prev_key;
      }
      if (this.req.params.startkey != null) {
        this.state.startkey = this.req.params.startkey;
      }
      this.state.title = this.title;
      this.state.description = this.desc;
      this.state.user = this.req.user;
    }

    ListHandler.prototype.handle_results = function(results) {
      this.state.users = results.users;
      if (results.next_startkey != null) {
        this.state.next_key = results.next_startkey;
      }
      this.state.cur_key = results.startkey;
      return this.res.render(this.template, this.state);
    };

    return ListHandler;

  })();

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
    var role, state, _ref, _ref2;
    state = {};
    state.role = role = (_ref = (_ref2 = req.params.role) != null ? _ref2 : req.body.role) != null ? _ref : "admin";
    if (req.params.prev_key != null) state.prev_key = req.params.prev_key;
    if (req.params.startkey != null) state.startkey = req.params.startkey;
    state.title = "Users by Role";
    state.description = role;
    state.user = req.user;
    return user_repo.get_by_role(role, function(users) {
      state.users = users;
      return res.render("users_by_role", state);
    });
  };

  module.exports.by_last_name = function(req, res) {
    return res.redirect("/users/");
  };

}).call(this);
