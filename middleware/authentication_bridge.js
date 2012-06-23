(function() {
  var CertificateUserInfoProvider, User, authentication_bridge, moment;

  User = (require("../model/user.js")).User;

  moment = require("moment");

  CertificateUserInfoProvider = (function() {

    function CertificateUserInfoProvider() {}

    CertificateUserInfoProvider.prototype.get_user_info = function(subject, handle_user) {
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
      return handle_user(new User(client));
    };

    return CertificateUserInfoProvider;

  })();

  authentication_bridge = function(options) {
    var _ref;
    options = options != null ? options : {};
    options.user_info_provider = (_ref = options.user_info_provider) != null ? _ref : new CertificateUserInfoProvider();
    return function(req, res, next) {
      var handle_user;
      handle_user = function(user) {
        req.user = req.session.user = user;
        console.log(("AUTH:    " + (moment().format('YY-MM-DDTHH:mm:ss.SSS')) + " ") + ("" + req.method + " url:" + req.url + " user:" + req.user.logon_name));
        return next();
      };
      if (req.client.authorized) {
        if (req.session.user != null) {
          req.user = new User(req.session.user);
          console.log(("AUTH:    " + (moment().format('YY-MM-DDTHH:mm:ss.SSS')) + " ") + ("" + req.method + " url:" + req.url + " user:" + req.user.logon_name));
          return next();
        } else {
          return options.user_info_provider.get_user_info(req.connection.getPeerCertificate().subject, handle_user);
        }
      } else {
        return next();
      }
    };
  };

  module.exports = authentication_bridge;

}).call(this);
