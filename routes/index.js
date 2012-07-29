(function() {
  var inventory_module, users_module;

  module.exports.index = function(req, res) {
    return res.render('index', {
      title: 'Welcome',
      description: "" + req.user.first_name + " " + req.user.last_name,
      user: req.user
    });
  };

  users_module = require("./users.js");

  module.exports.users_create = users_module.create;

  module.exports.users_create_form = users_module.create_form;

  module.exports.users_get = users_module.get;

  module.exports.users_remove = users_module.remove;

  module.exports.users_remove_form = users_module.remove_form;

  module.exports.users_update = users_module.update;

  module.exports.users_update_form = users_module.update_form;

  module.exports.users_list = users_module.list;

  module.exports.users_by_role = users_module.by_role;

  module.exports.users_by_last_name = users_module.by_last_name;

  module.exports.users_refresh_info = users_module.refresh_info;

  inventory_module = require("./inventory.js");

  module.exports.inventory_create = inventory_module.create;

  module.exports.inventory_create_form = inventory_module.create_form;

  module.exports.inventory_get = inventory_module.get;

  module.exports.inventory_update = inventory_module.update;

  module.exports.inventory_update_form = inventory_module.update_form;

  module.exports.inventory_list = inventory_module.list;

  module.exports.inventory_remove = inventory_module.remove;

  module.exports.inventory_remove_form = inventory_module.remove_form;

}).call(this);
