(function() {
  var index;

  index = function(req, res) {
    return res.render('index', {
      title: 'Welcome',
      description: "" + req.user.first_name + " " + req.user.last_name,
      user: req.user
    });
  };

  module.exports = function(app) {
    return app.get('/', index);
  };

}).call(this);
