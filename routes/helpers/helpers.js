(function() {
  var ListHandler, MandatoryFieldChecker, ResultsHandler,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  ListHandler = (function() {

    function ListHandler(req, res, title, desc, template) {
      this.req = req;
      this.res = res;
      this.title = title;
      this.desc = desc;
      this.template = template;
      this.handle_results = __bind(this.handle_results, this);
      this.state = {};
      if (this.req.params.prev_key != null) {
        this.state.prev_key = this.req.params.prev_key;
      }
      if (this.req.params.startkey != null) {
        this.state.startkey = this.req.params.startkey;
      }
      this.state.title = this.title;
      this.state.description = this.desc;
      this.state.user = this.req.user;
    }

    ListHandler.prototype.handle_results = function(results) {
      this.state.models = results.models;
      if (results.next_startkey != null) {
        this.state.next_key = results.next_startkey;
      }
      this.state.cur_key = results.startkey;
      return this.res.render(this.template, this.state);
    };

    return ListHandler;

  })();

  module.exports.ListHandler = ListHandler;

  ResultsHandler = (function() {

    function ResultsHandler(res, success_url, fail_url) {
      this.res = res;
      this.success_url = success_url;
      this.fail_url = fail_url;
      this.handle_results = __bind(this.handle_results, this);
    }

    ResultsHandler.prototype.handle_results = function(error, body) {
      if (!error) {
        return this.res.redirect(this.success_url);
      } else {
        return this.res.redirect(this.fail_url);
      }
    };

    return ResultsHandler;

  })();

  module.exports.ResultsHandler = ResultsHandler;

  MandatoryFieldChecker = (function() {

    function MandatoryFieldChecker(required_fields) {
      this.required_fields = required_fields;
    }

    MandatoryFieldChecker.prototype.mandatory_fields_are_set = function(obj) {
      var field, valid, _i, _len, _ref;
      valid = true;
      _ref = this.required_fields;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        field = _ref[_i];
        if (obj[field] == null) valid = false;
      }
      return valid;
    };

    return MandatoryFieldChecker;

  })();

  module.exports.MandatoryFieldChecker = MandatoryFieldChecker;

}).call(this);
