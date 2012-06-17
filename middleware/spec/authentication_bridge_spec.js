(function() {
  var User, auth_provider_module;

  auth_provider_module = require("../authentication_bridge.js");

  User = (require("../../model/user.js")).User;

  buster.spec.expose();

  describe("Authentication Bridge:", function() {
    var expected_user_state, get_authorization_provider, get_options, get_request, subject;
    expected_user_state = {
      id: "rclayton",
      first_name: "rclayton",
      last_name: "rclayton",
      logon_name: "rclayton",
      email: "rclayton@bericotechnologies.com",
      roles: ["user", "admin"]
    };
    subject = {
      CN: "rclayton",
      emailAddress: "rclayton@bericotechnologies.com"
    };
    get_options = function(spy) {
      var options;
      return options = {
        user_info_provider: spy
      };
    };
    get_authorization_provider = function(options) {
      var authentication_provider;
      return authentication_provider = auth_provider_module(options);
    };
    get_request = function(is_authorized, session_user) {
      var req;
      req = {};
      req.client = {};
      req.client.authorized = is_authorized;
      req.connection = {};
      req.connection.getPeerCertificate = function() {
        return {
          subject: subject
        };
      };
      req.session = {};
      req.session.user = session_user;
      return req;
    };
    it("does nothing if the client is not authorized", function() {
      var authentication_provider, next, options, req, res;
      options = get_options(this.spy());
      authentication_provider = get_authorization_provider(options);
      req = get_request(false);
      res = this.spy();
      next = this.spy();
      authentication_provider(req, res, next);
      refute.called(options.user_info_provider);
      refute.called(res);
      assert.called(next);
      refute.defined(req.user);
      return refute.defined(req.session.user);
    });
    it("calls the user_info_provider when authorized", function() {
      var authentication_provider, next, options, req, res;
      options = get_options(this.spy());
      authentication_provider = get_authorization_provider(options);
      req = get_request(true);
      res = this.spy();
      next = this.spy();
      authentication_provider(req, res, next);
      assert.called(options.user_info_provider);
      refute.called(res);
      return assert.called(next);
    });
    it("calls the default user_info_provider when not submitted with options", function() {
      var authentication_provider, next, req, res;
      authentication_provider = get_authorization_provider();
      req = get_request(true);
      res = this.spy();
      next = this.spy();
      authentication_provider(req, res, next);
      refute.called(res);
      assert.called(next);
      expect(req.user.logon_name).toEqual(subject.CN);
      expect(req.user.email).toEqual(subject.emailAddress);
      expect(req.session.user.logon_name).toEqual(subject.CN);
      expect(req.session.user.email).toEqual(subject.emailAddress);
      return expect(req.user).toEqual(req.session.user);
    });
    return it("does not call user_info_provider when the user is in the session", function() {
      var authentication_provider, next, options, req, res;
      options = get_options(this.spy());
      authentication_provider = get_authorization_provider(options);
      req = get_request(true, new User(expected_user_state));
      res = this.spy();
      next = this.spy();
      authentication_provider(req, res, next);
      refute.called(options.user_info_provider);
      refute.called(res);
      assert.called(next);
      expect(req.user.logon_name).toEqual(subject.CN);
      expect(req.user.email).toEqual(subject.emailAddress);
      expect(req.session.user.logon_name).toEqual(subject.CN);
      expect(req.session.user.email).toEqual(subject.emailAddress);
      return expect(req.user).toEqual(req.session.user);
    });
  });

}).call(this);
