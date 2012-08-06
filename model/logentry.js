(function() {
  var Entity, x, _,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  _ = (require("underscore"))._;

  Entity = (require("./entity")).Entity;

  x = typeof exports !== "undefined" && exports !== null ? exports : this;

  x.ItemLog = (function(_super) {

    __extends(ItemLog, _super);

    ItemLog.prototype.required_fields = function() {
      return [];
    };

    function ItemLog(init_state) {
      var k, v;
      for (k in init_state) {
        v = init_state[k];
        if (k.indexOf("_") !== 0) this[k] = new LogEntry(v);
      }
    }

    return ItemLog;

  })(Entity);

  x.LogEntry = (function(_super) {

    __extends(LogEntry, _super);

    LogEntry.prototype.required_fields = function() {
      return ["item_id", "category", "text", "user", "datetime"];
    };

    function LogEntry(init_state) {
      this.item_id = null;
      this.text = null;
      this.user = null;
      this.category = null;
      this.datetime = null;
      _.extend(this, init_state);
    }

    return LogEntry;

  })(Entity);

}).call(this);
