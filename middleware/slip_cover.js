var _ = require('underscore')._;

function AccessConstraint(options){
	options = options || {};
	_.extend({
		method: ["GET", "POST", "PUT", "DELETE"],
		route: /.*/,
		users: /.*/,
		roles: /.*/,
		allow: false,
		default: false;
		}, options);
	
	this.isAllowed = function(method, route, user){
		if(options.route.test(route)){
			var is_match = false;
			if(options.users.test(user.username)){
				is_match = true;
			}
			else {
				for(r in user.roles){
					if(options.roles.test(user.roles[r])){
						is_match = true;
					}
				}
			}
			if(is_match){
				return options.allow;
			}
		}
		return options.default;
	}
	
	return this;
}


modules.export = function(){
	return function slip_cover(req, res, next){
		
	}
};