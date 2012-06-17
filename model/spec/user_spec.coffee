User = (require "../user.js").User

buster.spec.expose()

describe "User Model:", ()->
	
	richard = 
		id: 12
		first_name: "Richard"
		last_name: "Clayton"
		logon_name: "rclayton"
		email: "rclayton@bericotechnologies"
		roles: [ "user", "admin" ]
	
	it "initialize with null properties if not set", ->
		user = new User()
		
		expect(user.id).toBeNull()
		expect(user.first_name).toBeNull()
		expect(user.last_name).toBeNull()
		expect(user.logon_name).toBeNull()
		expect(user.email).toBeNull()
		expect(user.roles).toEqual( [] )
	
	it "initializes with provided state", ->
		user = new User(richard)
		
		expect(user.id).toEqual(richard.id)
		expect(user.first_name).toEqual(richard.first_name)
		expect(user.last_name).toEqual(richard.last_name)
		expect(user.logon_name).toEqual(richard.logon_name)
		expect(user.email).toEqual(richard.email)
		expect(user.roles).toEqual(richard.roles)

		
	it "agrees that it has a role if it's in its role array", ->
		user = new User(richard)
		
		expect(user.is_in_role("admin")).toBe(true)
		expect(user.is_in_role("user")).toBe(true)

	it "denies having a role that it does not", ->
		user = new User(richard)
		
		expect(user.is_in_role("dictator")).toBe(false)
		
		
		