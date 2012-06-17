(function() {
  var User, authentication_bridge, create_user_from_cert;

  User = (require("../model/user.js")).User;

  create_user_from_cert = function(subject) {
    var client;
    client = {
      id: subject.CN,
      first_name: subject.CN,
      last_name: subject.CN,
      logon_name: subject.CN,
      email: subject.emailAddress,
      roles: ["user"]
    };
    switch (subject.CN) {
      case "rclayton":
      case "sdistefano":
        client.roles.push("admin");
    }
    return new User(client);
  };

  authentication_bridge = function(options) {
    var _ref;
    options = options != null ? options : {};
    options.user_info_provider = (_ref = options.user_info_provider) != null ? _ref : create_user_from_cert;
    return function(req, res, next) {
      if (req.client.authorized) {
        if (req.session.user != null) {
          req.user = req.session.user;
        } else {
          req.user = req.session.user = options.user_info_provider(req.connection.getPeerCertificate().subject);
        }
      }
      return next();
    };
  };

  module.exports = authentication_bridge;

}).call(this);
