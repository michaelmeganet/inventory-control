var updates = {

	"merge": function(doc, req){
		var updates = JSON.parse(req.body);
		log(updates);
		for(var field in updates){
			doc[field] = updates[field];
		}
		var msg = 'Updated successfully';
		return [doc, msg];
	}



};