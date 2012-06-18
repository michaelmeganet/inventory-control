(function() {
  var moment, proxy_router, _;

  _ = (require("underscore"))._;

  moment = require("moment");

  proxy_router = function(options) {
    return function(req, res, next) {
      var is_root_exception, should_proxy;
      should_proxy = _.find(options.routes, function(route) {
        return route.test(req.url);
      });
      is_root_exception = req.headers.accept === 'application/json' && req.url === '/';
      if ((should_proxy != null) || is_root_exception) {
        console.log(("REROUTE: " + (moment().format('YY-MM-DDTHH:mm:ss.SSS')) + " ") + ("" + req.method + " url:" + req.url + " to:") + ("" + options.conf.host + ":" + options.conf.port + " "));
        return options.proxy.proxyRequest(req, res, options.conf);
      } else {
        return next();
      }
    };
  };

  module.exports = proxy_router;

}).call(this);
