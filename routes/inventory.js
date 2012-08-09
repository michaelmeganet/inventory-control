(function() {
  var InventoryLocation, ListHandler, ResultsHandler, WarrantyInfo, build_state, comma_sep_categories_to_array, config, expand_location, expand_warranty_info, handle_inventory_list, helpers, inv_models, inv_repo, normalize_post_values, prune_prefixed_fields, register_list_handlers, repos, _;

  _ = (require("underscore"))._;

  config = require("../conf/app_config.js");

  helpers = require("./helpers/helpers.js");

  inv_models = require("../model/inventory_item.js");

  repos = require("../middleware/couchdb_repository.js");

  ListHandler = helpers.ListHandler;

  ResultsHandler = helpers.ResultsHandler;

  InventoryLocation = inv_models.InventoryLocation;

  WarrantyInfo = inv_models.WarrantyInfo;

  inv_repo = new repos.CouchDbInventoryRepository({
    couchdb_url: config.couch_base_url
  });

  build_state = function(req, title, desc) {
    var state;
    state = {};
    state.title = title;
    state.description = desc;
    state.user = req.user;
    state.config = config;
    return state;
  };

  comma_sep_categories_to_array = function(categories) {
    var cat, cat_array, cats, _i, _len;
    cat_array = [];
    if (categories != null) {
      cats = categories.split(',');
      for (_i = 0, _len = cats.length; _i < _len; _i++) {
        cat = cats[_i];
        cat_array.push(cat.replace(" ", ""));
      }
    }
    return cat_array;
  };

  expand_location = function(item) {
    var loc;
    loc = {
      is_mobile: item.loc_is_mobile,
      line1: item.loc_line1,
      line2: item.loc_line2,
      city: item.loc_city,
      state: item.loc_state,
      zipcode: item.loc_zipcode,
      office: item.loc_office,
      room: item.loc_room
    };
    return new InventoryLocation(loc);
  };

  expand_warranty_info = function(item) {
    var warranty_info;
    warranty_info = {
      start_date: item.war_start_date,
      end_date: item.war_end_date,
      description: item.war_description
    };
    return new WarrantyInfo(warranty_info);
  };

  prune_prefixed_fields = function(item, prefix) {
    var k, v;
    for (k in item) {
      v = item[k];
      if (k.indexOf(prefix) === 0) delete item[k];
    }
    return item;
  };

  normalize_post_values = function(item) {
    var new_item, pruned;
    if (item.date_added == null) item.date_added = new Date().toISOString();
    if (item.disposition == null) item.disposition = "Available";
    new_item = {};
    new_item.location = expand_location(item);
    new_item.warranty = expand_warranty_info(item);
    pruned = prune_prefixed_fields(item, "loc_");
    pruned = prune_prefixed_fields(pruned, "war_");
    _.extend(new_item, pruned);
    new_item.software = JSON.parse(item.software);
    new_item.accessories = JSON.parse(item.accessories);
    new_item.categories = comma_sep_categories_to_array(item.categories);
    new_item.id = item.serial_no;
    new_item.estimated_value = parseFloat(item.estimated_value);
    new_item.allow_self_issue = Boolean(item.allow_self_issue);
    return new_item;
  };

  handle_inventory_list = function(req, res, filter, template) {
    var handler;
    handler = new ListHandler(req, res, "Inventory Items", "", template);
    if (req.params.startkey != null) {
      return inv_repo["list_" + filter](handler.handle_results, req.params.startkey);
    } else if (req.params.key != null) {
      return inv_repo["get_" + filter](handler.handle_results, req.params.key);
    } else {
      return inv_repo["list_" + filter](handler.handle_results);
    }
  };

  register_list_handlers = function(app, filter, is_default) {
    var handler;
    if (is_default == null) is_default = false;
    handler = function(req, res) {
      return handle_inventory_list(req, res, "by_" + filter, "inventory_by_" + filter);
    };
    if (is_default) app.get("/inv/items", handler);
    app.get("/inv/items/by/" + filter, handler);
    app.get("/inv/items/by/" + filter + "/:key", handler);
    app.get("/inv/items/by/" + filter + "/s/:startkey", handler);
    return app.get("/inv/items/by/" + filter + "/s/:startkey/p/:prev_key", handler);
  };

  module.exports = function(app) {
    app.post('/inv/new', function(req, res) {
      var item, results_handler;
      item = normalize_post_values(req.body.inv);
      if (item !== null) {
        results_handler = new ResultsHandler(res, "/inv/item/" + item.serial_no, "/500.html");
        return inv_repo.add(item, item.serial_no, results_handler.handle_results);
      } else {
        return res.redirect("/500.html");
      }
    });
    app.get('/inv/new', function(req, res) {
      var state;
      state = build_state(req, "Add to Inventory", "Add a new or existing item to the Berico Inventory Control System");
      return res.render("inventory_create", state);
    });
    register_list_handlers(app, "serial_no", true);
    register_list_handlers(app, "disposition");
    register_list_handlers(app, "location");
    register_list_handlers(app, "type");
    register_list_handlers(app, "date_received");
    register_list_handlers(app, "make_model_no");
    register_list_handlers(app, "user");
    register_list_handlers(app, "available");
    register_list_handlers(app, "verification");
    app.get('/inv/item/:id', function(req, res) {
      if (req.params.id !== null) {
        return inv_repo.get(req.params.id, function(target_item) {
          var state;
          state = build_state(req, "Inventory Item", "" + target_item.make + "-" + target_item.model + ", [" + target_item.serial_no + "]");
          state.item = target_item;
          return res.render("inventory_item_view", state);
        });
      } else {
        return res.redirect("/500.html");
      }
    });
    app.post('/inv/item/:id', function(req, res) {
      var item, results_handler;
      item = normalize_post_values(req.body.inv);
      if (item !== null) {
        results_handler = new ResultsHandler(res, "/inv/item/" + item.serial_no, "/500.html");
        return inv_repo.update_core(item, results_handler.handle_results);
      } else {
        return res.redirect("/500.html");
      }
    });
    app.get('/inv/item/:id/update', function(req, res) {
      var on_fail, on_success;
      on_success = function(item_to_update) {
        var state;
        state = build_state(req, "Update Item", "" + item_to_update.make + "-" + item_to_update.model + ", [" + item_to_update.serial_no + "]");
        state.item = item_to_update;
        return res.render("inventory_update", state);
      };
      on_fail = function(error) {
        return res.redirect("/500.html");
      };
      return inv_repo.get(req.params.id, on_success, on_fail);
    });
    app.post('/inv/item/:id/remove', function(req, res) {
      inv_repo.get(req.params.id, function(item) {});
      inv_repo.remove(item);
      return res.redirect("/inv/items");
    });
    app.get('/inv/item/:id/remove', function(req, res) {
      return inv_repo.get(req.params.id, function(item) {
        var state;
        state = build_state(req, "Remove Inventory Item?", "" + item.serial_no + " - " + item.make + " " + item.model + " " + item.model_no);
        state.item = item;
        return res.render("inventory_remove", state);
      });
    });
    app.get('/inv/item/:id/checkin', function(req, res) {
      return inv_repo.get(req.params.id, function(item) {
        var state;
        state = build_state(req, "Check-in Inventory Item", "" + item.serial_no + " - " + item.make + " " + item.model + " " + item.model_no);
        state.item = item;
        return res.render("inventory_checkin", state);
      });
    });
    app.post('/inv/item/:id/checkin', function(req, res) {});
    app.get('/inv/item/:id/return', function(req, res) {
      return inv_repo.get(req.params.id, function(item) {
        var state;
        state = build_state(req, "Return Inventory Item", "" + item.serial_no + " - " + item.make + " " + item.model + " " + item.model_no);
        state.item = item;
        return res.render("inventory_return", state);
      });
    });
    app.post('/inv/item/:id/return', function(req, res) {});
    app.get('/inv/item/:id/extend', function(req, res) {
      return inv_repo.get(req.params.id, function(item) {
        var state;
        state = build_state(req, "Extend Borrow Time", "" + item.serial_no + " - " + item.make + " " + item.model + " " + item.model_no);
        state.item = item;
        return res.render("inventory_extend", state);
      });
    });
    app.post('/inv/item/:id/extend', function(req, res) {});
    app.get('/inv/item/:id/verify', function(req, res) {
      return inv_repo.get(req.params.id, function(item) {
        var state;
        state = build_state(req, "Verify Check-in", "" + item.serial_no + " - " + item.make + " " + item.model + " " + item.model_no);
        state.item = item;
        return res.render("inventory_verify", state);
      });
    });
    return app.post('/inv/item/:id/verify', function(req, res) {});
  };

}).call(this);
