(function() {
  var moment, unauthorized_user_handler;

  moment = require("moment");

  unauthorized_user_handler = function(options) {
    var unauth_template, _ref;
    options = options != null ? options : {};
    unauth_template = (_ref = options.unauth_template) != null ? _ref : "unauthorized";
    return function(req, res, next) {
      if (!req.client.authorized) {
        console.log(("UNAUTH:  " + (moment().format('YY-MM-DDTHH:mm:ss.SSS')) + " ") + ("" + req.method + " url:" + req.url));
        next("401");
      }
      return next();
    };
  };

  module.exports = unauthorized_user_handler;

}).call(this);
