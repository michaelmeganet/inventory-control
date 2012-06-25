(function() {
  var CouchDbUserRepository, User, UserInfoProvider, nano, _;

  _ = (require("underscore"))._;

  User = (require("../model/user.js")).User;

  nano = require("nano");

  CouchDbUserRepository = (function() {

    function CouchDbUserRepository(options) {
      if ((options != null ? options.couchdb_url : void 0) == null) {
        throw "Must provide CouchDB URL";
      }
      this.connection = nano(options.couchdb_url);
      this.usersdb = this.connection.db.use("inventory_users");
    }

    CouchDbUserRepository.prototype.add = function(user) {
      delete user._rev;
      return this.usersdb.insert(user, user.email, function(err, body) {
        if (err) console.log(err);
        if (!err) return console.log(body);
      });
    };

    CouchDbUserRepository.prototype.update = function(user) {
      user._id = user.email;
      return this.usersdb.insert(user, user.email, function(err, body) {
        if (!err) return console.log(body);
      });
    };

    CouchDbUserRepository.prototype.remove = function(user) {
      return this.usersdb.destroy(user.email, user._rev, function(err, body) {
        if (err) return console.log(err);
      });
    };

    CouchDbUserRepository.prototype.get = function(email, callback) {
      return this.usersdb.get(email, function(error, body) {
        var user;
        if (error) console.log("Problem retrieving user: " + error);
        user = CouchDbUserRepository.adapt_to_user(body);
        return callback.apply(this, [user]);
      });
    };

    CouchDbUserRepository.l_comma_f_name_key_factory = function(user) {
      return "" + user.last_name + "," + user.first_name;
    };

    CouchDbUserRepository.prototype.list = function(callback, startkey, limit, view, key_factory) {
      var params;
      if (limit == null) limit = 10;
      if (view == null) view = "by_lastname";
      if (key_factory == null) {
        key_factory = CouchDbUserRepository.l_comma_f_name_key_factory;
      }
      params = {};
      if (startkey != null) params["startkey"] = startkey;
      params["limit"] = limit + 1;
      return this.usersdb.view("users", view, params, function(error, body) {
        var last_user, results, users;
        if (error) console.log("Problem retrieving user list: " + error);
        users = CouchDbUserRepository.adapt_to_user_array(body);
        results = {};
        if (users.length === (limit + 1)) {
          last_user = _.last(users);
          results.next_startkey = key_factory(last_user);
        }
        results.users = _.first(users, limit);
        results.startkey = key_factory(users[0]);
        return callback.apply(this, [results]);
      });
    };

    CouchDbUserRepository.prototype.get_by_role = function(role, callback) {
      var params;
      params = {};
      params["key"] = role;
      return this.usersdb.view("users", "by_roles", params, function(error, body) {
        var users;
        if (error) console.log("Problem retrieving users by role '" + error + "'");
        users = CouchDbUserRepository.adapt_to_user_array(body);
        return callback(users);
      });
    };

    CouchDbUserRepository.prototype.get_by_last_name = function(last_name, callback) {
      var params;
      params = {};
      if (last_name !== "all") params["key"] = last_name;
      return this.usersdb.view("users", "by_lastname", params, function(error, body) {
        var users;
        if (error) {
          console.log("Problem retrieving users by last name '" + error + "'");
        }
        users = CouchDbUserRepository.adapt_to_user_array(body);
        return callback(users);
      });
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

    CouchDbUserRepository.adapt_to_couch = function(user) {
      if (user._id != null) user._id = user.id;
      return user;
    };

    return CouchDbUserRepository;

  })();

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

  module.exports.CouchDbUserRepository = CouchDbUserRepository;

  module.exports.UserInfoProvider = UserInfoProvider;

}).call(this);
