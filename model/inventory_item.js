(function() {
  var Entity, x, _,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  _ = (require("underscore"))._;

  Entity = (require("./entity")).Entity;

  x = typeof exports !== "undefined" && exports !== null ? exports : this;

  x.InventoryLocation = (function() {

    function InventoryLocation(init_state) {
      init_state = init_state != null ? init_state : {};
      this.is_mobile = false;
      this.line1 = null;
      this.line2 = null;
      this.city = null;
      this.state = null;
      this.zipcode = null;
      this.office = null;
      this.room = null;
      _.extend(this, init_state);
    }

    InventoryLocation.prototype.is_office = function() {
      return (this.office != null) && this.office === !"";
    };

    return InventoryLocation;

  })();

  x.WarrantyInfo = (function() {

    function WarrantyInfo(init_state) {
      init_state = init_state != null ? init_state : {};
      this.description = null;
      this.start_date = null;
      this.end_date = null;
      _.extend(this, init_state);
    }

    return WarrantyInfo;

  })();

  x.InventoryItem = (function(_super) {

    __extends(InventoryItem, _super);

    InventoryItem.prototype.required_fields = function() {
      return ["serial_no", "make", "model", "owner", "date_added", "date_received", "disposition", "issuability", "allow_self_issue", "type", "condition", "estimated_value"];
    };

    function InventoryItem(init_state) {
      var loc_state, warranty_info, _ref, _ref2;
      init_state = init_state != null ? init_state : {};
      this.id = null;
      this.serial_no = null;
      this.categories = [];
      this.type = null;
      this.make = null;
      this.model = null;
      this.model_no = null;
      this.estimated_value = null;
      this.asset_tag = null;
      this.date_received = null;
      this.date_added = null;
      this.owner = null;
      this.disposition = null;
      this.condition = null;
      this.issuability = "no-issue";
      this.allow_self_issue = false;
      this.borrow_time = "1w";
      _.extend(this, init_state);
      loc_state = (_ref = init_state.location) != null ? _ref : {};
      this.location = new x.InventoryLocation(loc_state);
      warranty_info = (_ref2 = init_state.warranty_info) != null ? _ref2 : {};
      this.warranty_info = new x.WarrantyInfo(warranty_info);
    }

    return InventoryItem;

  })(Entity);

}).call(this);
