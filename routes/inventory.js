(function() {
  var build_state;

  build_state = function(req, title, desc) {
    var state;
    state = {};
    state.title = title;
    state.description = desc;
    state.user = req.user;
    return state;
  };

  module.exports.create = function(req, res) {
    return res.json({});
  };

  module.exports.create_form = function(req, res) {
    var state;
    state = build_state(req, "Add to Inventory", "Add a new or existing item to the Berico Inventory Control System");
    return res.render("inventory_create", state);
  };

}).call(this);
