(function() {
  var x, _;

  _ = (require("underscore"))._;

  x = typeof exports !== "undefined" && exports !== null ? exports : this;

  x.InventoryItem = (function() {

    function InventoryItem(init_state) {
      this.id = null;
      this.serial_no = null;
      this.categories = [];
      this.type = null;
      this.make = null;
      this.model = null;
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
    }

    return InventoryItem;

  })();

}).call(this);
