Date.prototype.setISO8601 = function (string) {
    var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
        "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
        "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
    var d = string.match(new RegExp(regexp));

    var offset = 0;
    var date = new Date(d[1], 0, 1);

    if (d[3]) { date.setMonth(d[3] - 1); }
    if (d[5]) { date.setDate(d[5]); }
    if (d[7]) { date.setHours(d[7]); }
    if (d[8]) { date.setMinutes(d[8]); }
    if (d[10]) { date.setSeconds(d[10]); }
    if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
    if (d[14]) {
        offset = (Number(d[16]) * 60) + Number(d[17]);
        offset *= ((d[15] == '-') ? 1 : -1);
    }

    offset -= date.getTimezoneOffset();
    time = (Number(date) + (offset * 60 * 1000));
    this.setTime(Number(time));
};


$(function(){
	
	function single_data_load_autocomplete($el){
		var collection = $el.attr("source");
		var hidden_elem = $el.attr("sync-value-with");
		$.getJSON("/inventory_enums/" + collection, function(data){
			var items = [];
			for(var k in data){
				if(k.indexOf("_") != 0){
					items.push({ label: k, value: k, data: data[k] });
				}
			}
			
			var options = {};
			options.source = items;
			if(typeof(hidden_elem) != "undefined" && hidden_elem != null && hidden_elem != ""){
				options.select = function(event, ui){
					$el.val(ui.item.label);
					$(hidden_elem).val(JSON.stringify(ui.item.data));
					$(hidden_elem).trigger("change");
				};
			}
			
			$el.autocomplete(options);
		});
	}
	
	var continuous_search_handlers = {
		"users": { 
			data_adaptor: function(key, user){
				return { label: key, value: user.email };
			},
		}
	};
	
	function continuous_data_load_autocomplete($el){
		var collection = $el.attr("source");
		var hidden_elem = $el.attr("sync-value-with");
		
		var options = {};
		if(typeof(hidden_elem) != "undefined" && hidden_elem != null && hidden_elem != ""){
			options.select = function(event, ui){
				$el.val(ui.item.label);
				$(hidden_elem).val(JSON.stringify(ui.item.data));
				$(hidden_elem).trigger("change");
			};
		}
		
		options.source = function(req, res){
			var q = req.term;
			var url = "/search/" + collection + "/" + q;
			$.getJSON(url, function(data, status, xhr){
				var items = [];
				for(var i in data){
					items.push(continuous_search_handlers[collection].data_adaptor(i, data[i]));
				}
				res(items);
			});
		};
		
		$el.autocomplete(options);
	}
	
	$("input[autocomplete]").livequery(
		function(){
			var $el = $(this);
			if($el.attr("data-load") == "one-time"){
				single_data_load_autocomplete($el);
			}
			else {
				continuous_data_load_autocomplete($el);
			}
		},
		function(){}
	);
	
	
});