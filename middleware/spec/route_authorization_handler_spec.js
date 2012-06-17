(function() {
  var AccessControl, User, route_auth_module;

  route_auth_module = require("../route_authorization_handler.js");

  AccessControl = route_auth_module.AccessControl;

  User = (require("../../model/user.js")).User;

  buster.spec.expose();

  describe("Route Authorization Handler:", function() {
    return describe("AccessControl:", function() {
      var ac_state;
      ac_state = {
        methods: ["GET", "HEAD"],
        route: /inventory$|inventory[\/].*/,
        roles: ["admin", "user"],
        allow: true
      };
      it("initializes with defaults when no state is provided", function() {
        var ac;
        ac = new AccessControl();
        expect(ac.methods).toEqual(["GET", "POST", "PUT", "DELETE"]);
        expect(ac.route).toEqual(/.*/);
        expect(ac.users).toEqual([]);
        expect(ac.roles).toEqual([]);
        return expect(ac.allow).toEqual(false);
      });
      it("initializes with the state provided to the constructor", function() {
        var ac;
        ac = new AccessControl(ac_state);
        expect(ac.methods).toEqual(ac_state.methods);
        expect(ac.route).toEqual(ac_state.route);
        expect(ac.users).toEqual([]);
        expect(ac.roles).toEqual(ac_state.roles);
        return expect(ac.allow).toEqual(ac_state.allow);
      });
      it("identifies matching routes", function() {
        var ac;
        ac = new AccessControl(ac_state);
        expect(ac.is_route_match("inventory")).toBe(true);
        expect(ac.is_route_match("inventory/1234")).toBe(true);
        expect(ac.is_route_match("inventory_of_doom/")).toBe(false);
        return expect(ac.is_route_match("/")).toBe(false);
      });
      it("identifies matching methods", function() {
        var ac;
        ac = new AccessControl(ac_state);
        expect(ac.is_method_match("GET")).toBe(true);
        expect(ac.is_method_match("HEAD")).toBe(true);
        expect(ac.is_method_match("PUT")).toBe(false);
        expect(ac.is_method_match("POST")).toBe(false);
        return expect(ac.is_method_match("DELETE")).toBe(false);
      });
      it("identifies matching roles", function() {
        var ac;
        ac = new AccessControl(ac_state);
        expect(ac.is_role_match("user")).toBe(true);
        expect(ac.is_role_match("admin")).toBe(true);
        expect(ac.is_role_match(["user", "admin"])).toBe(true);
        expect(ac.is_role_match(["user", "dictator"])).toBe(true);
        expect(ac.is_role_match(["dictator", "admin"])).toBe(true);
        expect(ac.is_role_match("dictator")).toBe(false);
        return expect(ac.is_role_match(["serf", "dictator"])).toBe(false);
      });
      it("identifies matching users", function() {
        var ac;
        ac = new AccessControl();
        ac.users = ["rclayton", "jruiz"];
        expect(ac.is_user_match("rclayton")).toBe(true);
        expect(ac.is_user_match("jruiz")).toBe(true);
        return expect(ac.is_user_match("jsmith")).toBe(false);
      });
      it("identifies matching contexts (method & route)", function() {
        var ac;
        ac = new AccessControl(ac_state);
        expect(ac.is_context_match("inventory", "GET")).toBe(true);
        expect(ac.is_context_match("inventory", "POST")).toBe(false);
        return expect(ac.is_context_match("inventory_of_doom", "GET")).toBe(false);
      });
      return it("identifies user objects matching constraints", function() {
        var ac, bill, john, richard;
        ac = new AccessControl(ac_state);
        ac.users.push("jruiz");
        richard = new User({
          logon_name: "rclayton",
          roles: ["user", "admin"]
        });
        john = new User({
          logon_name: "jruiz",
          roles: ["dictator"]
        });
        bill = new User({
          logon_name: "bwebster",
          roles: ["jackass"]
        });
        expect(ac.is_allowed(richard)).toBe(true);
        expect(ac.is_allowed(john)).toBe(true);
        return expect(ac.is_allowed(bill)).toBe(false);
      });
    });
  });

}).call(this);
