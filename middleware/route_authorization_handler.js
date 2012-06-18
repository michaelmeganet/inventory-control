(function() {
  var AccessControl, is_context_match, route_authorization_handler, _;

  _ = (require("underscore"))._;

  AccessControl = (function() {

    function AccessControl(options) {
      this.methods = ["GET", "POST", "PUT", "DELETE"];
      this.route = /.*/;
      this.users = [];
      this.roles = [];
      this.allow = false;
      _.extend(this, options);
    }

    AccessControl.prototype.is_route_match = function(route) {
      return this.route.test(route);
    };

    AccessControl.prototype.is_user_match = function(user) {
      return _.include(this.users, user);
    };

    AccessControl.prototype.is_role_match = function(user_roles) {
      var is_match, user_role, _i, _len;
      if (user_roles.push == null) user_roles = [user_roles];
      is_match = false;
      for (_i = 0, _len = user_roles.length; _i < _len; _i++) {
        user_role = user_roles[_i];
        if (_.include(this.roles, user_role)) is_match = true;
      }
      return is_match;
    };

    AccessControl.prototype.is_method_match = function(method) {
      return _.include(this.methods, method);
    };

    AccessControl.prototype.is_context_match = function(route, method) {
      return this.is_route_match(route) && this.is_method_match(method);
    };

    AccessControl.prototype.is_allowed = function(user) {
      if (this.is_user_match(user.logon_name)) {
        return this.allow;
      } else if (this.is_role_match(user.roles)) {
        return this.allow;
      } else {
        return !this.allow;
      }
    };

    return AccessControl;

  })();

  is_context_match = function(access_controls, req) {
    return _.find(access_controls, function(ac) {
      return ac.is_context_match(req.url, req.method);
    });
  };

  route_authorization_handler = function(options) {
    var access_controls, restriction, restrictions, _i, _len, _ref;
    options = options != null ? options : {};
    restrictions = (_ref = options.restrictions) != null ? _ref : [];
    if (restrictions.push == null) restrictions = [restrictions];
    access_controls = [];
    for (_i = 0, _len = restrictions.length; _i < _len; _i++) {
      restriction = restrictions[_i];
      access_controls.push(new AccessControl(restriction));
    }
    return function(req, res, next) {
      var context_matches;
      context_matches = is_context_match(access_controls, req);
      if (context_matches != null) {
        if (!context_matches.is_allowed(req.user)) {
          return next("401");
        } else {
          return next();
        }
      } else {
        return next();
      }
    };
  };

  module.exports = route_authorization_handler;

  module.exports.AccessControl = AccessControl;

}).call(this);
