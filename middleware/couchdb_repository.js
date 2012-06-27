(function() {
  var CouchDbInventoryRepository, CouchDbRepository, CouchDbUserRepository, InventoryItem, User, UserInfoProvider, nano, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  nano = require("nano");

  _ = (require("underscore"))._;

  User = (require("../model/user.js")).User;

  InventoryItem = (require("../model/inventory_item.js")).InventoryItem;

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
      this.connection = nano(options.couchdb_url);
      this.db = this.connection.db.use(options.database);
      this.model_adaptor = (_ref = options.model_adaptor) != null ? _ref : function(body) {
        return body;
      };
      this.array_of_model_adaptor = (_ref2 = options.array_of_model_adaptor) != null ? _ref2 : function(body) {
        return body.rows;
      };
      this.id_adaptor = (_ref3 = options.id_adaptor) != null ? _ref3 : null;
    }

    CouchDbRepository.prototype.paging_view = function(callback, startkey, options) {
      var params, _ref;
      options.limit = (_ref = options.limit) != null ? _ref : 10;
      options.array_of_model_adaptor = this.array_of_model_adaptor;
      params = {};
      if (startkey != null) params.startkey = startkey;
      params.limit = options.limit + 1;
      return this.db.view(options.view_doc, options.view, params, function(error, body) {
        var last_model, models, results;
        if (error) console.log("Problem accessing view " + error);
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
      var params;
      options.array_of_model_adaptor = this.array_of_model_adaptor;
      params = {};
      if (key != null) params.key = key;
      if ((options != null ? options.limit : void 0) != null) {
        params.limit = options.limit;
      }
      return this.db.view(options.view_doc, options.view, params, function(error, body) {
        var models;
        models = options.array_of_model_adaptor(body);
        return callback.apply(this, [models]);
      });
    };

    CouchDbRepository.adapt_to_couch = function(model) {
      if (model._id == null) model._id = model.id;
      return model;
    };

    CouchDbRepository.prototype.add = function(model, key, callback) {
      var couch_model;
      delete model._rev;
      couch_model = CouchDbRepository.adapt_to_couch(model);
      return this.db.insert(couch_model, key, function(error, body) {
        if (error) console.log(error);
        if (callback != null) return callback(error, body);
      });
    };

    CouchDbRepository.prototype.get = function(key, callback) {
      var model_adaptor;
      model_adaptor = this.model_adaptor;
      return this.db.get(key, function(error, body) {
        if (error) console.log(error);
        return callback(model_adaptor(body));
      });
    };

    CouchDbRepository.prototype.update = function(model, callback) {
      var couch_model;
      couch_model = CouchDbRepository.adapt_to_couch(model);
      if (this.id_adaptor != null) couch_model._id = this.id_adaptor(model);
      return this.db.insert(model, model._id, function(error, body) {
        if (error) console.log(error);
        if (callback != null) return callback(error, body);
      });
    };

    CouchDbRepository.prototype.remove = function(model, callback) {
      return this.db.destroy(model._id, model._rev, function(error, body) {
        if (error) console.log(error);
        if (callback != null) return callback(error, body);
      });
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
      console.dir(options);
      console.log(key);
      return this.view(callback, key, options);
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

  CouchDbInventoryRepository = (function(_super) {

    __extends(CouchDbInventoryRepository, _super);

    function CouchDbInventoryRepository(options) {
      options.database = "inventory";
      options.model_adaptor = CouchDbInventoryRepository.adapt_to_inventory_item;
      options.array_of_model_adaptor = CouchDbInventoryRepository.adapt_to_inventory_item_array;
      CouchDbInventoryRepository.__super__.constructor.call(this, options);
    }

    CouchDbInventoryRepository.prototype.list = function(callback, startkey) {
      var options;
      options = {};
      options.view_doc = "inventory";
      options.view = "all";
      options.key_factory = function(item) {
        return item.serial_no;
      };
      options.limit = 25;
      return this.paging_view(callback, startkey, options);
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

}).call(this);
