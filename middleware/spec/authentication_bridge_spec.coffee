auth_provider_module = require "../authentication_bridge.js"
User = (require "../../model/user.js").User

buster.spec.expose()

describe "Authentication Bridge:", ()->

	expected_user_state = 
		id: "rclayton"
		first_name: "rclayton"
		last_name: "rclayton"
		logon_name: "rclayton"
		email: "rclayton@bericotechnologies.com"
		roles: [ "user", "admin" ]

	subject = 
		CN: "rclayton"
		emailAddress: "rclayton@bericotechnologies.com"

	get_options = (spy) ->
		options =
			user_info_provider: spy

	get_authorization_provider = (options) ->
		authentication_provider = 
			auth_provider_module(options)
	
	get_request = (is_authorized, session_user) ->
		req = {}
		req.client = {}
		req.client.authorized = is_authorized
		req.connection = {}
		req.connection.getPeerCertificate = () -> { subject: subject }
		req.session = {}
		req.session.user = session_user
		req
		
	
	it "does nothing if the client is not authorized", ->
		
		options = get_options(@spy())
		authentication_provider = get_authorization_provider(options)
		
		req = get_request(false)
		res = @spy()
		next = @spy()
		
		authentication_provider(req, res, next)
		
		refute.called(options.user_info_provider)
		refute.called(res)
		assert.called(next)
		
		refute.defined(req.user)
		refute.defined(req.session.user)
	
	it "calls the user_info_provider when authorized", ->
		
		options = get_options(@spy())
		authentication_provider = get_authorization_provider(options)
		
		req = get_request(true)
		res = @spy()
		next = @spy()
		
		authentication_provider(req, res, next)
		
		assert.called(options.user_info_provider)
		refute.called(res)
		assert.called(next)
		
		
	it "calls the default user_info_provider when not submitted with options", ->
		
		authentication_provider = get_authorization_provider()
		
		req = get_request(true)
		res = @spy()
		next = @spy()
		
		authentication_provider(req, res, next)
		
		refute.called(res)
		assert.called(next)
		
		expect(req.user.logon_name).toEqual(subject.CN)
		expect(req.user.email).toEqual(subject.emailAddress)
		expect(req.session.user.logon_name).toEqual(subject.CN)
		expect(req.session.user.email).toEqual(subject.emailAddress)
		expect(req.user).toEqual(req.session.user)
		
	it "does not call user_info_provider when the user is in the session", ->
		
		options = get_options(@spy())
		authentication_provider = get_authorization_provider(options)
		
		req = get_request(true, new User(expected_user_state))
		res = @spy()
		next = @spy()
		
		authentication_provider(req, res, next)
		
		refute.called(options.user_info_provider)
		refute.called(res)
		assert.called(next)
		
		expect(req.user.logon_name).toEqual(subject.CN)
		expect(req.user.email).toEqual(subject.emailAddress)
		expect(req.session.user.logon_name).toEqual(subject.CN)
		expect(req.session.user.email).toEqual(subject.emailAddress)
		expect(req.user).toEqual(req.session.user)
		
		