(function() {
  var Entity, x, _,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  _ = (require("underscore"))._;

  Entity = (require("./entity")).Entity;

  x = typeof exports !== "undefined" && exports !== null ? exports : this;

  x.User = (function(_super) {

    __extends(User, _super);

    User.prototype.required_fields = function() {
      return ["first_name", "last_name", "logon_name"];
    };

    function User(init_state) {
      this.id = null;
      this.first_name = null;
      this.last_name = null;
      this.logon_name = null;
      this.email = null;
      this.roles = [];
      _.extend(this, init_state);
    }

    User.prototype.is_in_role = function(role) {
      return _.include(this.roles, role);
    };

    return User;

  })(Entity);

}).call(this);
