(function() {
  var CouchDbInventoryRepository, InventoryLocation, ListHandler, MandatoryFieldChecker, ResultsHandler, build_state, comma_sep_categories_to_array, config, expand_location, helpers, inv_repo, inventory_checker, mando_fields, normalize_post_values, prune_locations, validate_item_state, _;

  _ = (require("underscore"))._;

  config = require("../conf/app_config.js");

  CouchDbInventoryRepository = (require("../middleware/couchdb_repository.js")).CouchDbInventoryRepository;

  inv_repo = new CouchDbInventoryRepository({
    couchdb_url: config.couch_base_url
  });

  helpers = require("./helpers/helpers.js");

  ListHandler = helpers.ListHandler;

  ResultsHandler = helpers.ResultsHandler;

  MandatoryFieldChecker = helpers.MandatoryFieldChecker;

  InventoryLocation = (require("../model/inventory_item.js")).InventoryLocation;

  mando_fields = ["serial_no", "make", "model", "owner", "date_added", "date_received", "disposition", "issuability", "allow_self_issue", "type", "estimated_value"];

  inventory_checker = new MandatoryFieldChecker(mando_fields);

  build_state = function(req, title, desc) {
    var state;
    state = {};
    state.title = title;
    state.description = desc;
    state.user = req.user;
    state.config = config;
    return state;
  };

  validate_item_state = function(item) {
    return inventory_checker.mandatory_fields_are_set(item);
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

  prune_locations = function(item) {
    var k, v;
    for (k in item) {
      v = item[k];
      if (k.substring(0, 4) === "loc_") delete item[k];
    }
    console.dir(item);
    return item;
  };

  normalize_post_values = function(item) {
    var new_item, pruned;
    if (item.date_added == null) item.date_added = new Date().toISOString();
    if (item.disposition == null) item.disposition = "Available";
    if (validate_item_state(item)) {
      new_item = {};
      new_item.location = expand_location(item);
      pruned = prune_locations(item);
      _.extend(new_item, pruned);
      new_item.categories = comma_sep_categories_to_array(item.categories);
      new_item.id = item.serial_no;
      new_item.estimated_value = parseFloat(item.estimated_value);
      new_item.allow_self_issue = Boolean(item.allow_self_issue);
      return new_item;
    } else {
      return null;
    }
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
    app.get('/inv/items', function(req, res) {
      var handler;
      handler = new ListHandler(req, res, "Inventory Items", "", "inventory_by_serial_no");
      if (req.params.startkey != null) {
        return inv_repo.list(handler.handle_results, req.params.startkey);
      } else {
        return inv_repo.list(handler.handle_results);
      }
    });
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
    return app.get('/inv/item/:id/remove', function(req, res) {
      return inv_repo.get(req.params.id, function(item) {
        var state;
        state = build_state(req, "Remove Inventory Item?", "" + item.serial_no + " - " + item.make + " " + item.model + " " + item.model_no);
        state.item = item;
        return res.render("inventory_remove", state);
      });
    });
  };

}).call(this);
