(function() {
  var x, _;

  _ = (require("underscore"))._;

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

  x.InventoryItem = (function() {

    function InventoryItem(init_state) {
      var loc_state, _ref;
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
      this.issuability = "no-issue";
      this.allow_self_issue = false;
      this.borrow_time = "1w";
      _.extend(this, init_state);
      loc_state = (_ref = init_state.location) != null ? _ref : {};
      this.location = new x.InventoryLocation(loc_state);
    }

    return InventoryItem;

  })();

}).call(this);
