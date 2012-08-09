(function() {
  var CouchDbInventoryRepository, CouchDbLogRepository, CouchDbRepository, CouchDbUserRepository, ErrorTranslater, InventoryItem, ItemLog, LogEntry, User, UserInfoProvider, dir, nano, restler, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  nano = require("nano");

  _ = (require("underscore"))._;

  User = (require("../model/user.js")).User;

  LogEntry = (require("../model/logentry.js")).LogEntry;

  ItemLog = (require("../model/logentry.js")).ItemLog;

  InventoryItem = (require("../model/inventory_item.js")).InventoryItem;

  restler = require("restler");

  ErrorTranslater = (function() {

    function ErrorTranslater() {}

    ErrorTranslater.get_reason = function(error, context) {
      switch (error.status_code) {
        case 404:
          if (error.error === "not_found") {
            return "No document was found for " + context;
          } else {
            return "Couch says '" + error.error + "' was the reason for failure for '" + context + "'";
          }
          break;
        default:
          return "Couch says '" + error.error + "' was the reason for failure for '" + context + "'";
      }
    };

    ErrorTranslater.prototype.log = function(error, context) {
      var reason;
      reason = ErrorTranslater.get_reason(error);
      return console.log(reason);
    };

    return ErrorTranslater;

  })();

  CouchDbRepository = (function() {

    function CouchDbRepository(options) {
      this.paging_view = __bind(this.paging_view, this);
      var _ref, _ref2, _ref3;
      if ((options != null ? options.couchdb_url : void 0) == null) {
        throw "Must provide CouchDB URL: 'options.couchdb_url'";
      }
      if ((options != null ? options.database : void 0) == null) {
        throw "Must provide database name: 'options.database'";
      }
      this.couchdb_url = options.couchdb_url;
      this.database_name = options.database;
      this.connection = nano(options.couchdb_url);
      this.db = this.connection.db.use(options.database);
      this.model_adaptor = (_ref = options.model_adaptor) != null ? _ref : function(body) {
        return body;
      };
      this.array_of_model_adaptor = (_ref2 = options.array_of_model_adaptor) != null ? _ref2 : function(body) {
        return body.rows;
      };
      this.id_adaptor = (_ref3 = options.id_adaptor) != null ? _ref3 : null;
      this.error_translater = new ErrorTranslater();
    }

    CouchDbRepository.prototype.paging_view = function(callback, startkey, options) {
      var ERRLOG, params, _ref;
      ERRLOG = this.error_translater;
      options.limit = (_ref = options.limit) != null ? _ref : 10;
      options.array_of_model_adaptor = this.array_of_model_adaptor;
      params = {};
      if (startkey != null) params.startkey = startkey;
      params.limit = options.limit + 1;
      return this.db.view(options.view_doc, options.view, params, function(error, body) {
        var last_model, models, results;
        if (error) {
          ERRLOG.log(error, "[paging-view," + startkey + "," + options.view_name + "]");
        }
        models = options.array_of_model_adaptor(body);
        results = {};
        if (models.length === (options.limit + 1)) {
          last_model = _.last(models);
          results.next_startkey = options.key_factory(last_model);
        }
        results.models = _.first(models, options.limit);
        results.startkey = options.key_factory(models[0]);
        return callback.apply(this, [results]);
      });
    };

    CouchDbRepository.prototype.view = function(callback, key, options) {
      var ERRLOG, params;
      ERRLOG = this.error_translater;
      options.array_of_model_adaptor = this.array_of_model_adaptor;
      params = {};
      if (key != null) params.key = key;
      if ((options != null ? options.limit : void 0) != null) {
        params.limit = options.limit;
      }
      return this.db.view(options.view_doc, options.view, params, function(error, body) {
        var results;
        if (error) {
          ERRLOG.log(error, "[view:" + key + "," + options.view_name + "]");
        }
        results = {};
        results.models = options.array_of_model_adaptor(body);
        return callback.apply(this, [results]);
      });
    };

    CouchDbRepository.adapt_to_couch = function(model) {
      if (model._id == null) model._id = model.id;
      return model;
    };

    CouchDbRepository.prototype.add = function(model, key, callback, error_callback) {
      var ERRLOG, couch_model;
      if (error_callback == null) {
        error_callback = function(error) {
          return null;
        };
      }
      ERRLOG = this.error_translater;
      delete model._rev;
      couch_model = CouchDbRepository.adapt_to_couch(model);
      return this.db.insert(couch_model, key, function(error, body) {
        if (error) {
          ERRLOG.log(error, "[add:" + key + "]");
          return error_callback(error);
        } else {
          if (callback != null) return callback(error, body);
        }
      });
    };

    CouchDbRepository.prototype.get = function(key, callback, error_callback) {
      var ERRLOG, model_adaptor;
      if (error_callback == null) {
        error_callback = function(error) {
          return null;
        };
      }
      ERRLOG = this.error_translater;
      model_adaptor = this.model_adaptor;
      return this.db.get(key, function(error, body) {
        if (error) {
          ERRLOG.log(error, "[get:" + key + "]");
          return error_callback(error);
        } else {
          return callback(model_adaptor(body));
        }
      });
    };

    CouchDbRepository.prototype.update = function(model, callback, error_callback) {
      var ERRLOG, couch_model;
      if (error_callback == null) {
        error_callback = function(error) {
          return null;
        };
      }
      console.dir(model);
      ERRLOG = this.error_translater;
      couch_model = CouchDbRepository.adapt_to_couch(model);
      if (this.id_adaptor != null) couch_model._id = this.id_adaptor(model);
      return this.db.insert(model, model._id, function(error, body) {
        if (error) {
          ERRLOG.log(error, "[update:" + model._id + "]");
          return error_callback(error);
        } else {
          if (callback != null) return callback(error, body);
        }
      });
    };

    CouchDbRepository.prototype.partial_update = function(id, partial, update_doc, partial_handler, callback, suppress_error) {
      var ERRLOG;
      ERRLOG = this.error_translater;
      return this.db.atomic(update_doc, partial_handler, id, partial, function(error, body) {
        if (error && !(suppress_error != null)) {
          ERRLOG.log(error, "[pupdate:" + id + "," + partial + "]");
        }
        if (callback != null) return callback(error, body);
      });
    };

    CouchDbRepository.prototype.remove = function(model, callback, error_callback) {
      var ERRLOG;
      if (error_callback == null) {
        error_callback = function(error) {
          return null;
        };
      }
      ERRLOG = this.error_translater;
      return this.db.destroy(model._id, model._rev, function(error, body) {
        if (error) {
          ERRLOG.log(error, "[remove:" + model._id + "]");
          return error_callback(error);
        } else {
          if (callback != null) return callback(error, body);
        }
      });
    };

    CouchDbRepository.prototype.search = function(qstring, options, callback, error_callback) {
      var error_wrapper, model_adaptor, request_url, result_handler;
      if (error_callback == null) {
        error_callback = function(error) {
          return null;
        };
      }
      if ((options != null ? options.design_doc : void 0) == null) {
        throw "Must provide the design document name: 'options.design_doc'";
      }
      if ((options != null ? options.index : void 0) == null) {
        throw "Must provide index name: 'options.index'";
      }
      model_adaptor = this.model_adaptor;
      request_url = "" + this.couchdb_url + "_fti/local/" + this.database_name + "/_design/" + options.design_doc + "/" + options.index + "?q=" + qstring;
      result_handler = function(result) {
        var matches, row, user, user_raw, _i, _len, _ref;
        result = JSON.parse(result);
        matches = {};
        _ref = result.rows;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          row = _ref[_i];
          user_raw = JSON.parse(row.fields.user);
          user = model_adaptor(user_raw);
          matches[row.fields.name] = user;
        }
        return callback(matches);
      };
      error_wrapper = function(error) {
        return error_callback(error);
      };
      return (restler.get(request_url)).on("complete", result_handler).on("error", error_wrapper);
    };

    return CouchDbRepository;

  })();

  CouchDbUserRepository = (function(_super) {

    __extends(CouchDbUserRepository, _super);

    function CouchDbUserRepository(options) {
      options.database = "inventory_users";
      options.model_adaptor = CouchDbUserRepository.adapt_to_user;
      options.array_of_model_adaptor = CouchDbUserRepository.adapt_to_user_array;
      CouchDbUserRepository.__super__.constructor.call(this, options);
    }

    CouchDbUserRepository.prototype.list = function(callback, startkey) {
      var options;
      options = {};
      options.view_doc = "users";
      options.view = "by_lastname";
      options.key_factory = function(user) {
        return "" + user.last_name + "," + user.first_name;
      };
      options.limit = 10;
      return this.paging_view(callback, startkey, options);
    };

    CouchDbUserRepository.prototype.get_by_email = function(callback, startkey) {
      var options;
      options = {};
      options.view_doc = "users";
      options.view = "all";
      options.key_factory = function(user) {
        return user.email;
      };
      options.limit = 10;
      return this.paging_view(callback, startkey, options);
    };

    CouchDbUserRepository.prototype.get_by_role = function(callback, key) {
      var options;
      options = {};
      key = key != null ? key : "user";
      options.view_doc = "users";
      options.view = "by_roles";
      return this.view(callback, key, options);
    };

    CouchDbUserRepository.prototype.get_by_name = function(callback, query) {
      return this.search("name:" + query + "*", {
        design_doc: "users",
        index: "by_first_and_last_name"
      }, callback);
    };

    CouchDbUserRepository.adapt_to_user = function(body) {
      var user;
      user = new User(body);
      if (user._id != null) user.id = user._id;
      return user;
    };

    CouchDbUserRepository.adapt_to_user_array = function(body) {
      var user, users, _i, _len, _ref;
      users = [];
      _ref = body.rows;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        user = _ref[_i];
        users.push(CouchDbUserRepository.adapt_to_user(user.value));
      }
      return users;
    };

    return CouchDbUserRepository;

  })(CouchDbRepository);

  module.exports.CouchDbUserRepository = CouchDbUserRepository;

  UserInfoProvider = (function() {

    function UserInfoProvider(couchdb_user_repository) {
      this.couchdb_user_repository = couchdb_user_repository;
      if (this.couchdb_user_repository == null) {
        throw "CouchDbUserRepository must not be null";
      }
    }

    UserInfoProvider.prototype.get_user_info = function(subject, handler) {
      return this.couchdb_user_repository.get(subject.emailAddress, handler);
    };

    return UserInfoProvider;

  })();

  module.exports.UserInfoProvider = UserInfoProvider;

  CouchDbLogRepository = (function(_super) {

    __extends(CouchDbLogRepository, _super);

    function CouchDbLogRepository(options) {
      this.add_logentry = __bind(this.add_logentry, this);      options.database = "inventory_log";
      options.model_adaptor = CouchDbLogRepository.adapt_to_logentry;
      options.array_of_model_adaptor = CouchDbLogRepository.adapt_to_logentry_array;
      CouchDbLogRepository.__super__.constructor.call(this, options);
    }

    CouchDbLogRepository.prototype.add_logentry = function(logentry, callback) {
      var that, update_handler;
      that = this;
      update_handler = function(error, body) {
        var logentry_doc, logentry_id;
        if ((error != null ? error.status_code : void 0) === 500 && error.reason.indexOf('new TypeError("doc is null", "")' === !-1)) {
          logentry_id = "" + logentry.datetime + "~" + logentry.user.logon_name;
          logentry_doc = {};
          logentry_doc["_id"] = logentry.item_id;
          logentry_doc[logentry_id] = logentry;
          return that.add(logentry_doc, logentry.item_id, callback);
        } else {
          if (callback != null) return callback(error, body);
        }
      };
      return this.partial_update(logentry.item_id, logentry, "inventory_log", "add_logentry", update_handler, true);
    };

    CouchDbLogRepository.adapt_to_itemlog = function(body) {
      var itemlog;
      itemlog = new ItemLog(body);
      if (itemlog._id != null) itemlog.id = itemlog._id;
      return itemlog;
    };

    CouchDbLogRepository.adapt_to_itemlog_array = function(body) {
      var entries, itemlog, _i, _len, _ref;
      entries = [];
      _ref = body.rows;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        itemlog = _ref[_i];
        entries.push(CouchDbLogRepository.adapt_to_itemlog(itemlog.value));
      }
      return entries;
    };

    return CouchDbLogRepository;

  })(CouchDbRepository);

  module.exports.CouchDbLogRepository = CouchDbLogRepository;

  CouchDbInventoryRepository = (function(_super) {

    __extends(CouchDbInventoryRepository, _super);

    function CouchDbInventoryRepository(options) {
      options.database = "inventory";
      options.model_adaptor = CouchDbInventoryRepository.adapt_to_inventory_item;
      options.array_of_model_adaptor = CouchDbInventoryRepository.adapt_to_inventory_item_array;
      CouchDbInventoryRepository.__super__.constructor.call(this, options);
    }

    CouchDbInventoryRepository.prototype.get_selected_inventory = function(callback, view, key) {
      var options;
      options = {};
      options.view_doc = "inventory";
      options.view = view;
      options.key_factory = function(item) {
        return item.serial_no;
      };
      options.limit = 25;
      return this.view(callback, key, options);
    };

    CouchDbInventoryRepository.prototype.get_by_serial_no = function(callback, key) {
      return this.get_selected_inventory(callback, "all", key);
    };

    CouchDbInventoryRepository.prototype.get_by_disposition = function(callback, key) {
      return this.get_selected_inventory(callback, "by_disposition", key);
    };

    CouchDbInventoryRepository.prototype.get_by_location = function(callback, key) {
      return this.get_selected_inventory(callback, "by_location", key);
    };

    CouchDbInventoryRepository.prototype.get_by_type = function(callback, startkey) {
      return this.get_selected_inventory(callback, "by_type", key);
    };

    CouchDbInventoryRepository.prototype.get_by_date_received = function(callback, key) {
      return this.get_selected_inventory(callback, "by_date_received", key);
    };

    CouchDbInventoryRepository.prototype.get_by_make_model_no = function(callback, key) {
      return this.get_selected_inventory(callback, "by_make_model_no", key);
    };

    CouchDbInventoryRepository.prototype.get_by_user = function(callback, key) {
      return this.get_selected_inventory(callback, "by_user", key);
    };

    CouchDbInventoryRepository.prototype.list_inventory = function(callback, view, startkey) {
      var options;
      options = {};
      options.view_doc = "inventory";
      options.view = view;
      options.key_factory = function(item) {
        return item.serial_no;
      };
      options.limit = 25;
      return this.paging_view(callback, startkey, options);
    };

    CouchDbInventoryRepository.prototype.list = function(callback, startkey) {
      return this.list_inventory(callback, "all", startkey);
    };

    CouchDbInventoryRepository.prototype.list_by_serial_no = function(callback, startkey) {
      return this.list_inventory(callback, "all", startkey);
    };

    CouchDbInventoryRepository.prototype.list_by_disposition = function(callback, startkey) {
      return this.list_inventory(callback, "by_disposition", startkey);
    };

    CouchDbInventoryRepository.prototype.list_by_location = function(callback, startkey) {
      return this.list_inventory(callback, "by_location", startkey);
    };

    CouchDbInventoryRepository.prototype.list_by_type = function(callback, startkey) {
      return this.list_inventory(callback, "by_type", startkey);
    };

    CouchDbInventoryRepository.prototype.list_by_date_received = function(callback, startkey) {
      return this.list_inventory(callback, "by_date_received", startkey);
    };

    CouchDbInventoryRepository.prototype.list_by_make_model_no = function(callback, startkey) {
      return this.list_inventory(callback, "by_make_model_no", startkey);
    };

    CouchDbInventoryRepository.prototype.list_by_user = function(callback, startkey) {
      return this.list_inventory(callback, "by_user", startkey);
    };

    CouchDbInventoryRepository.prototype.update_core = function(model, callback) {
      var id, _ref, _ref2;
      id = (_ref = (_ref2 = model.id) != null ? _ref2 : model._id) != null ? _ref : model.serial_no;
      delete model.id;
      delete model._id;
      delete model._rev;
      return this.partial_update(id, model, "inventory", "merge", callback);
    };

    CouchDbInventoryRepository.adapt_to_inventory_item = function(body) {
      var item;
      item = new InventoryItem(body);
      if (item._id != null) item.id = item._id;
      return item;
    };

    CouchDbInventoryRepository.adapt_to_inventory_item_array = function(body) {
      var item, items, _i, _len, _ref;
      items = [];
      _ref = body.rows;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        items.push(CouchDbInventoryRepository.adapt_to_inventory_item(item.value));
      }
      return items;
    };

    return CouchDbInventoryRepository;

  })(CouchDbRepository);

  module.exports.CouchDbInventoryRepository = CouchDbInventoryRepository;

  dir = function(err, items) {
    return console.dir(items);
  };

  /*
  repo = new CouchDbLogRepository({ couchdb_url: "http://192.168.192.143:5984/"})
  
  comment = 
  	item_id: "12345"
  	text: "This shit's awesome"
  	user: { first_name: "Richard", last_name: "Clayton", logon_name: "rclayton@bericotechnologies.com" }
  	datetime: new Date().getTime()
  
  repo.add_logentry comment, dir
  */

}).call(this);
