(function() {
  var ListHandler,
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

}).call(this);
