(function() {
  var CouchDbUserRepository, User, UserInfoProvider, nano;

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
      return this.usersdb.insert(user, user.email, function(err, body) {
        if (!err) return console.log(body);
      });
    };

    CouchDbUserRepository.prototype.get = function(email, callback) {
      return this.usersdb.get(email, function(error, body) {
        var user;
        if (error) throw "Problem retrieving user";
        user = CouchDbUserRepository.adapt_to_user(body);
        return callback.apply(this, [user]);
      });
    };

    CouchDbUserRepository.prototype.get_by_role = function(role, callback) {
      return this.usersdb.view("users", "by_roles", {
        key: role
      }, function(error, body) {
        var users;
        if (error) throw "Problem retrieving users by role '" + role + "'";
        users = CouchDbUserRepository.adapt_to_user_array(body);
        return callback(users);
      });
    };

    CouchDbUserRepository.prototype.get_by_last_name = function(last_name, callback) {
      return this.usersdb.view("users", "by_lastname", {
        key: last_name
      }, function(error, body) {
        var users;
        if (error) {
          throw "Problem retrieving users by last name '" + last_name + "'";
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
