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



var inventory_comments = {
   "_id": "_design/inventory_comments",
   "_rev": "11-e2e142c8b39fc2424230d7cc097e62a5",
   "language": "javascript",
   "views": {
       "all": {
           "map": "function(doc) {\n  emit(doc._id, doc);\n}"
       },
       "categories": {
           "map": "function(doc) {\n  for(var cat in doc.categories){\n    emit(doc.categories[cat], doc);\n  }\n}"
       }
   },
   "updates": {
       "add_comment": "function(doc, req){ var comment = JSON.parse(req.body); log(comment); doc[comment.datetime + '~' + comment.user.logon_name] = comment; return [doc, 'Comment added to item: ' + doc._id]; }"
   }
};


//Add a comment to a document.
function(doc, req){
	var comment = JSON.parse(req.body);
	log(comment);
	doc[comment.datetime + "~" + comment.user.logon_name] = comment;
	return [doc, "Comment added to item: " + doc._id];
}

// model_make_no
function(doc){ 
	log.info('Indexing: ' + doc._id); 
	var ret = new Document(); 
	ret.add(doc.make + ' ' + doc.model + ' ' + doc.model_no, { 'field': 'name', 'store': 'yes' }); 
	ret.add(JSON.stringify(doc), { 'store': 'yes', 'index': 'not_analyzed', 'field': 'user' }); 
	return ret; 
}


function(doc) {
	function isset(obj){ return typeof(obj) != "undefined" && obj != null && obj != ""; }
	if(doc.disposition == 'Available'){
		var key = doc.make;
		if (isset(doc.model)){ 
			key += " " + doc.model;
		}
		if (isset(doc.model_no)){ 
			key += " " + doc.model_no;
		}
		emit(key, doc);
	}
}








