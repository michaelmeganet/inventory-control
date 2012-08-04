

$(function(){
	$("div.infopanel").livequery(
		function(){
			$("i", this).click(function(){
				$i = $(this);
				$table = $("table", $i.parent());
				if($i.attr("class") == "icon-chevron-up"){
					$table.fadeOut();
					$i.removeClass("icon-chevron-up");
					$i.addClass("icon-chevron-down");
				} else {
					$table.fadeIn();
					$i.removeClass("icon-chevron-down");
					$i.addClass("icon-chevron-up");
				}
			});
		}, 
		function(){});
	
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
	
	$("input[autocomplete]").livequery(
		function(){
			var $el = $(this);
			if($el.attr("data-load") == "one-time"){
				single_data_load_autocomplete($el);
			}
		},
		function(){}
	);
	
	
});