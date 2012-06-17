(function() {
  var unauthorized_user_handler;

  unauthorized_user_handler = function(options) {
    var unauth_template, _ref;
    options = options != null ? options : {};
    unauth_template = (_ref = options.unauth_template) != null ? _ref : "unauthorized";
    return function(req, res, next) {
      if (!req.client.authorized) {
        res.render(unauth_template, {
          title: "Unauthorized"
        });
        next("401");
      }
      return next();
    };
  };

  module.exports = unauthorized_user_handler;

}).call(this);
