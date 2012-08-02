
index = (req, res) ->
	res.render('index', { title: 'Welcome', description:  "#{req.user.first_name} #{req.user.last_name}", user: req.user })
	
module.exports = (app) ->
	app.get '/', index