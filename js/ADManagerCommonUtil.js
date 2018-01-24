<!-- $Id: ADManagerCommonUtil.js baskar.govindan Exp$-->

var ADManagerCommonUtil = function(){
	var config_status = '';
}

ADManagerCommonUtil.getSettings = function()
{
	var client = ZAFClient.init();
	client.metadata().then(function(metadata) {
		return metadata.settings;
	});
}

ADManagerCommonUtil.updateSettings =  function(settings)
{
	var client = ZAFClient.init();
	
	client.metadata().then(function(metadata) {
		var updateSettings = {
			url: '/api/v2/apps/installations/' + metadata.installationId + '.json',
			type: 'PUT',
			dataType: 'json',
			contentType: 'application/json',
			data: JSON.stringify({
				settings: settings
			})
		}
		client.request(updateSettings).then(function(data) {
			return true;
		}).catch(function(error){
			return false;
		});
	});
}

ADManagerCommonUtil.loadFrame =  function(frameLocation, payload, toDiv){
	$.ajax(frameLocation).done(function(data) {
		var template = Handlebars.compile(data);
		if(payload != null)
			$(toDiv).empty().html(template(payload));
		else
			$(toDiv).empty().html(template(data));
	});
}
ADManagerCommonUtil.popup = function(title, message, callback){
	var html = '<div class="admp-popup" id="confirm" style="display:none;">';
	html += '<div class="admp-modal">';
	html += '<div class="admp-modal-content">';
	html += '<div class="admp-modal-header">';
	html += '<a class="admp-close"> <span>&times;</span> </a>';
	html += '<h4 class="admp-modal-title">'+title+'</h4>';
	html += '</div>';
	html += '<div class="admp-modal-body">';
	html += '<div id="loadingDiv" class="alertDiv" style="margin-top:0px;"><i class="alert_icon"></i><span>'+message+'</span></div>';
	html += '</div>';
	html += '<div class="admp-modal-footer">';
	if(callback) //Confirm alert
	{
		html += '<input type="button" value="Yes" class="btn-green" style="margin-right:10px;" id="confirm_ok">';
		html += '<input type="button" value="No" class="btn-gray" id="confirm_cancel">';
	}
	else //Alert
	{
		html += '<input type="button" value="OK" class="btn-green" style="margin-right:10px;" id="confirm_ok">';
		//html += '&lt; <br> &lt;';
	}
	html += '</div>';		
	html += '</div>';
	html += '</div>';
	html += '</div>';
	
	$("#admp-modal").html(html);
	
	$(".admp-popup").show();
	$("#confirm_ok").click(function(){
		$(".admp-popup").hide();
		if(callback)
			callback();
	});
	$("#confirm_cancel").click(function(){
		$(".admp-popup").hide();
		});
	$(".admp-close").click(function(){
		$(".admp-popup").toggle();	
	});
}
ADManagerCommonUtil.getParamValuesByName = function(querystring) {
  var qstring = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
  for (var i = 0; i < qstring.length; i++) {
    var urlparam = qstring[i].split('=');
    if (urlparam[0] == querystring) {
       return urlparam[1];
    }
  }
}