(function() {
  var users_module;

  module.exports.index = function(req, res) {
    return res.render('index', {
      title: 'Welcome',
      description: '',
      user: req.user
    });
  };

  module.exports.new_laptop = function(req, res) {
    return res.render('', {
      title: 'BT Inventory Control',
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

}).call(this);
