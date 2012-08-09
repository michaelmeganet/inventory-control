route_auth_module = require "../route_authorization_handler.coffee"
AccessControl = route_auth_module.AccessControl
User = (require "../../model/user.coffee").User

buster.spec.expose()

describe "Route Authorization Handler:", ()->

	describe "AccessControl:", () ->
	
		ac_state =
			methods: ["GET", "HEAD"]
			route:	 ///inventory$|inventory[/].*///
			roles:	 ["admin", "user"]
			allow:	 true
	
		it "initializes with defaults when no state is provided", ->
			ac = new AccessControl()
			
			expect(ac.methods).toEqual(["GET", "POST", "PUT", "DELETE"])
			expect(ac.route).toEqual(///.*///)
			expect(ac.users).toEqual([])
			expect(ac.roles).toEqual([])
			expect(ac.allow).toEqual(false)
		
		it "initializes with the state provided to the constructor", ->
			ac = new AccessControl(ac_state)
			
			expect(ac.methods).toEqual(ac_state.methods)
			expect(ac.route).toEqual(ac_state.route)
			expect(ac.users).toEqual([])
			expect(ac.roles).toEqual(ac_state.roles)
			expect(ac.allow).toEqual(ac_state.allow)
		
		it "identifies matching routes", ->
			ac = new AccessControl(ac_state)
			
			expect(ac.is_route_match "inventory").toBe(true)
			expect(ac.is_route_match "inventory/1234").toBe(true)
			expect(ac.is_route_match "inventory_of_doom/").toBe(false)
			expect(ac.is_route_match "/").toBe(false)
	
		it "identifies matching methods", ->
			ac = new AccessControl(ac_state)
			
			expect(ac.is_method_match "GET").toBe(true)
			expect(ac.is_method_match "HEAD").toBe(true)
			expect(ac.is_method_match "PUT").toBe(false)
			expect(ac.is_method_match "POST").toBe(false)
			expect(ac.is_method_match "DELETE").toBe(false)

		it "identifies matching roles", ->
			ac = new AccessControl(ac_state)

			expect(ac.is_role_match "user").toBe(true)
			expect(ac.is_role_match "admin").toBe(true)
			expect(ac.is_role_match ["user", "admin"]).toBe(true)
			expect(ac.is_role_match ["user", "dictator"]).toBe(true)
			expect(ac.is_role_match ["dictator", "admin"]).toBe(true)
			expect(ac.is_role_match "dictator").toBe(false)
			expect(ac.is_role_match ["serf", "dictator"]).toBe(false)
			
		it "identifies matching users", ->
			ac = new AccessControl()
			ac.users = ["rclayton", "jruiz"]
			
			expect(ac.is_user_match "rclayton").toBe(true)
			expect(ac.is_user_match "jruiz").toBe(true)
			expect(ac.is_user_match "jsmith").toBe(false)
			
		it "identifies matching contexts (method & route)", ->
			ac = new AccessControl(ac_state)
			
			expect(ac.is_context_match "inventory", "GET").toBe(true)
			expect(ac.is_context_match "inventory", "POST").toBe(false)
			expect(ac.is_context_match "inventory_of_doom", "GET").toBe(false)
			
		it "identifies user objects matching constraints", ->
			ac = new AccessControl(ac_state)
			ac.users.push("jruiz")
			
			richard = new User( { logon_name: "rclayton", roles: ["user", "admin"] } )
			john = new User( { logon_name: "jruiz", roles: ["dictator"] } )
			bill = new User( { logon_name: "bwebster", roles: ["jackass"] } )
			
			expect(ac.is_allowed richard).toBe(true)
			expect(ac.is_allowed john).toBe(true)
			expect(ac.is_allowed bill).toBe(false)

