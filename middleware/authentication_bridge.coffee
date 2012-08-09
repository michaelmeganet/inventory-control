User = (require "../model/user.coffee").User
moment = (require "moment")

class CertificateUserInfoProvider
	# Default, and not very good way to create users
	# or manage roles in a system, but useable for testing
	get_user_info: (subject, handle_user) ->
		client = 
			id: subject.CN
			first_name: subject.CN
			last_name: subject.CN
			logon_name: subject.CN
			email: subject.emailAddress
			roles: [ "user" ]
			
		switch subject.CN
			when "rclayton", "sdistefano" then client.roles.push "admin"
			
		handle_user new User(client)
			
	
# This is the actual middleware
authentication_bridge = (options) ->
	options = options ? {}
	options.user_info_provider = options.user_info_provider ? new CertificateUserInfoProvider()
	(req, res, next)->
		handle_user = (user) ->
				# It's possible that the client has a valid certificate but the
				# user is not in the system.  In this event, go to the 403 error page.
				unless user?
					subject = req.connection.getPeerCertificate().subject
					res.redirect("403", { title: "Not Authorized", subject: subject })
				# This is a double variable set (pretty cool, huh?)
				req.user = req.session.user = user
				console.log("AUTH:    #{moment().format('YY-MM-DDTHH:mm:ss.SSS')} " +
						"#{req.method} url:#{req.url} user:#{req.user.logon_name}")
				# Next middleware
				next()
		
		if req.client.authorized
			# Go to the session cache instead of making a call
			# to the user_info_provider (if in cache)
			if req.session.user?
				req.user = new User(req.session.user)
				console.log("AUTH:    #{moment().format('YY-MM-DDTHH:mm:ss.SSS')} " +
							"#{req.method} url:#{req.url} user:#{req.user.logon_name}")
							# Next middleware
				next()
			# Otherwise, call the user_info_provider
			else
				options.user_info_provider.get_user_info(
					req.connection.getPeerCertificate().subject, handle_user)
		else
			next()
			
	
module.exports = authentication_bridge