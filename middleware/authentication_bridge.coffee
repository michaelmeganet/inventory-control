User = (require "../model/user.js").User

# Default, and not very good way to create users
# or manage roles in a system, but useable for testing
create_user_from_cert = (subject) ->
	client = 
		id: subject.CN
		first_name: subject.CN
		last_name: subject.CN
		logon_name: subject.CN
		email: subject.emailAddress
		roles: [ "user" ]
	
	switch subject.CN
		when "rclayton", "sdistefano" then client.roles.push "admin"
		
	new User(client)
	
	
# This is the actual middleware
authentication_bridge = (options) ->
	options = options ? {}
	options.user_info_provider = options.user_info_provider ? create_user_from_cert
	(req, res, next)->
		if req.client.authorized
			# Go to the session cache instead of making a call
			# to the user_info_provider (if in cache)
			if req.session.user?
				req.user = req.session.user
			# Otherwise, call the user_info_provider
			else
				# This is a double variable set (pretty cool, huh?)
				req.user = req.session.user = 
					options.user_info_provider(
						req.connection.getPeerCertificate().subject)
		# Next middleware
		next()
	
module.exports = authentication_bridge