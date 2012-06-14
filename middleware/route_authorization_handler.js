module.exports = function(options){
	options = options || {};
	unauth_template = options.unauth_template || "unauthorized";
	return function unauthorized_user_handler(req, res, next){
		if(!req.client.authorized){
			res.render(unauth_template, { title: "Unauthorized!" });
			next("401");
		}
		else {
			next();
		}
	}
}