(function() {
  var User;

  User = (require("../user.js")).User;

  buster.spec.expose();

  describe("User Model:", function() {
    var richard;
    richard = {
      id: 12,
      first_name: "Richard",
      last_name: "Clayton",
      logon_name: "rclayton",
      email: "rclayton@bericotechnologies",
      roles: ["user", "admin"]
    };
    it("initialize with null properties if not set", function() {
      var user;
      user = new User();
      expect(user.id).toBeNull();
      expect(user.first_name).toBeNull();
      expect(user.last_name).toBeNull();
      expect(user.logon_name).toBeNull();
      expect(user.email).toBeNull();
      return expect(user.roles).toEqual([]);
    });
    it("initializes with provided state", function() {
      var user;
      user = new User(richard);
      expect(user.id).toEqual(richard.id);
      expect(user.first_name).toEqual(richard.first_name);
      expect(user.last_name).toEqual(richard.last_name);
      expect(user.logon_name).toEqual(richard.logon_name);
      expect(user.email).toEqual(richard.email);
      return expect(user.roles).toEqual(richard.roles);
    });
    it("agrees that it has a role if it's in its role array", function() {
      var user;
      user = new User(richard);
      expect(user.is_in_role("admin")).toBe(true);
      return expect(user.is_in_role("user")).toBe(true);
    });
    return it("denies having a role that it does not", function() {
      var user;
      user = new User(richard);
      return expect(user.is_in_role("dictator")).toBe(false);
    });
  });

}).call(this);
