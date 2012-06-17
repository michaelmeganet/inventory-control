(function() {
  var x, _;

  _ = (require("underscore"))._;

  x = typeof exports !== "undefined" && exports !== null ? exports : this;

  x.User = (function() {

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

  })();

}).call(this);
