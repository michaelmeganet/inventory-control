(function() {
  var x,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  x = typeof exports !== "undefined" && exports !== null ? exports : this;

  x.Entity = (function() {

    function Entity() {
      this.is_valid = __bind(this.is_valid, this);
      this.mandatory_fields_are_set = __bind(this.mandatory_fields_are_set, this);
    }

    Entity.prototype.required_fields = function() {
      return [];
    };

    Entity.prototype.mandatory_fields_are_set = function() {
      var field, valid, _i, _len, _ref;
      valid = true;
      _ref = this.required_fields();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        field = _ref[_i];
        if (this[field] == null) valid = false;
      }
      return valid;
    };

    Entity.prototype.is_valid = function() {
      return mandatory_fields_are_set();
    };

    return Entity;

  })();

}).call(this);
