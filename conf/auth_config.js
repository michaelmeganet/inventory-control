user_repo_module = require("../middleware/couchdb_repository.coffee");
CouchDbUserRepository = user_repo_module.CouchDbUserRepository;
UserInfoProvider = user_repo_module.UserInfoProvider;

repo = new CouchDbUserRepository({ couchdb_url: "http://192.168.192.143:5984/" });

module.exports = {
	user_info_provider: new UserInfoProvider(repo),
	user_cache: []
};