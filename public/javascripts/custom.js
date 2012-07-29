

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
	
});