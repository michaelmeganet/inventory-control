
function get_roles(username){
	var roles = ["user"];
	switch(username){
		case "rclayton": roles.push("admin"); break;
		case "bjohnson": roles.push("moderator"); break; 
		default: break;
	}
	return roles;
}

module.exports = function(){
	return function roles_provider(req, res, next){
		if(req.client.authorized){
			req.client.roles = 
				get_roles(
					req.connection.getPeerCertificate().subject.CN)
		} else {
			req.client.roles = ["anonymous"];
		}
		next();
	}
};