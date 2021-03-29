// <!-- $Id: ADManagerConfiguration.js baskar.govindan Exp$-->
//ignorei18n_start
///////////////////////////-------------ADManager Server Setup Page----------------/////////////////////////////////////////
function downloadADManager()
{
	var newUrl = "https://www.manageengine.com/products/ad-manager/download.html?utm_source=zendesk&utm_medium=product&utm_campaign=zendesk_admanager&utm_content=zendesk_admanager";
	window.open(newUrl, "_blank");
}

function openSupportPage()
{
	var newUrl = "https://www.manageengine.com/products/ad-manager/support.html?utm_source=zendesk&utm_medium=product&utm_campaign=zendesk_admanager&utm_content=zendesk_admanager";
	window.open(newUrl, "_blank");
}

function updateDomainName(element)
{
	$(element).closest(".admp-dropdown-container").find("label").text(element.text);
}

function showNext()
{
	var currentLevel = $("#currentLevel");
	switch(parseInt(currentLevel.text()))
	{
		case 1:
				$("#setup_download").toggle("slide", {direction: "left"}, 500);
				$("#setup_server_url").toggle("slide", {direction: "right"}, 500);
				currentLevel.text(2);
				$(".admp-steps").show();
				$("#admanagerServerUrl").closest(".admp-input-box").removeClass('errorTextbox');
				$(".errorMsg").hide();
				break;
		case 2:
				var serverUrl = $("#admanagerServerUrl").val();
				if(isValidURL(serverUrl))
				{
					$("#loadingDiv").show();
					$("#admanagerServerUrl").closest(".admp-input-box").hide();
					$(".errorMsg").hide();
					disableNavBar();
					var client = ZAFClient.init();
					var authConn = {
						url: serverUrl+'/MobileAPI/MobileLogin?methodToCall=domainList',
						type: 'POST',
						cors: true,
					};
					client.request(authConn).then(function(data) {		
						data = ADManagerErrorHandler.handle(data);
						if(data.isSuccess)
						{
							var settings = {
								"admanagerServerUrl" : serverUrl,
								"admanagerLoginDomainList" : JSON.stringify(data.response),
							}
							ADManagerCommonUtil.updateSettings(settings);
							$("#admanagerServerUrl").closest(".admp-input-box").removeClass('errorTextbox');
							$("#setup_server_url").toggle("slide", {direction: "left"}, 500);
							$("#setup_admin_credentials").toggle("slide", {direction: "right"}, 500);
							currentLevel.text(3);
							$(".btn-green").val("Finish");
							var domainName = '';
							var html = '<ul>';
							for(key in data.response)
							{
								html += '<li><a onclick="updateDomainName(this);">'+data.response[key]+'</a></li>';
								if(domainName == '')
									domainName = data.response[key];
							}
							html += '</ul>';
							$("#loginDomainList").html(html);
							$("#loginDomainList").closest(".admp-dropdown-container").find("label").text(domainName);
						}
						else
						{	
							$("#admanagerServerUrl").closest(".admp-input-box").addClass('errorTextbox');
							$("div.errorMsg").text(data.response);
							$(".errorMsg").show();
						}
						$("#loadingDiv").hide();
						$("#admanagerServerUrl").closest(".admp-input-box").show();
						enableNavBar();
					}).catch(function(error) {
						$("#loadingDiv").hide();
						$("#admanagerServerUrl").closest(".admp-input-box").show();
						$("#admanagerServerUrl").closest(".admp-input-box").addClass('errorTextbox');
						$("div.errorMsg").text('Cannot connect to ADManager Plus. Possible reasons could be no network connection, wrong server name or port number.');
						$(".errorMsg").show();
						enableNavBar();
					});
				}
				break;
		case 3:
				var userName = $("#admanagerUserName").val();
				var password = $("#admanagerPassword").val();
				var selectedDomain = $(".admp-dropdown-container").find("label").text();
				
				if(userName == '')
				{
					$(".admp-credentials-error#username").find("label").text('Username cannot be empty !');
					$(".admp-credentials-error#username").show();
				}
				else if(password == '')
				{
					$(".admp-credentials-error#password").find("label").text('Password cannot be empty !');
					$(".admp-credentials-error#password").show();
				}
				else
				{
					$("#setup_admin_credentials").fadeTo(300, 0.5);
					$("#credetial_loading").show();
					disableNavBar();
					serverUrl = $("#admanagerServerUrl").val();
					var client = ZAFClient.init();
					var authConn = {
						url: serverUrl+'/RestAPI/APIAuthToken?loginName='+userName+'&password='+password+'&domainName='+selectedDomain+'&PRODUCT_NAME=Zendesk',
						type: 'POST',
						cors: true,
					};
					$(".success.accord").hide();
					$(".error.accord").hide();
					client.request(authConn).then(function(data) {	
						data = ADManagerErrorHandler.handle(data);
						if(data.isSuccess)
						{
							var authObject = JSON.parse(data.response.AdmpAuthObject);
							var settings = {
								"admanagerUserName" : userName,
								"admanagerDomainName" : selectedDomain,
								"admanagerAuthToken" : data.response.AuthTicket,
								"admanagerDomainList" : JSON.stringify(authObject.domainNameList),
							}
							ADManagerCommonUtil.updateSettings(settings);
							$(".success.accord").find("p").empty().append('<span></span>   Login Successful.');
							$(".success.accord").slideDown();								
							$("#openADMPIframe").show();
							setTimeout(function(){
								$(".success.accord").slideUp();
								$("#setup_admin_credentials").toggle("slide", {direction: "left"}, 500);
								$.ajax('./serverDetails.hdbs').done(function(data) {
									var template = Handlebars.compile(data);
									$("#dashboard_view_container").empty().html(template(data));
									//setting values
									$("#userNameValue").html(userName);
									$("#serverUrlValue").html(serverUrl);
									$("#domainValue").html(selectedDomain);
									ADManagerCommonUtil.config_status = 'NEED_REFRESH';
								});
								enableNavBar();
							},2000); 
						}
						else
						{	
							$(".error.accord").find("p").empty().append('<span></span>'+data.response);
							$(".error.accord").slideDown();								
							setTimeout(function(){$(".error.accord").slideUp()},10000); 
							enableNavBar();
						}
						$("#credetial_loading").hide();
						$("#setup_admin_credentials").fadeTo(300, 1.0);
					}).catch(function(error) {
						$("#credetial_loading").hide();
						$("#setup_admin_credentials").fadeTo(300, 1.0);
						$(".error.accord").find("p").empty().append('<span></span> Cannot connect to ADManager Plus. Possible reasons could be no network connection, wrong server name or port number.');
						$(".error.accord").slideDown();								
						setTimeout(function(){$(".error.accord").slideUp()},10000); 
						enableNavBar();
					});
				}
				break;
	}
}

function showPrevious()
{
	var currentLevel = $("#currentLevel");
	switch(parseInt(currentLevel.text()))
	{
		case 1:
				break;
		case 2:
				$("#setup_server_url").toggle("slide", {direction: "right"}, 500);
				$("#setup_download").toggle("slide", {direction: "left"}, 500);
				currentLevel.text(1);
				$(".admp-steps").hide();
				break;
		case 3:
				$("#setup_admin_credentials").toggle("slide", {direction: "right"}, 500);
				$("#setup_server_url").toggle("slide", {direction: "left"}, 500);
				currentLevel.text(2);
				$(".btn-green").val("Next");
				break;
	}
}

function isValidURL(serverUrl) {
    if (serverUrl == "") {
        $("div.errorMsg").text('Server URL cannot be empty!');
		$(".errorMsg").show();
		return false;
    }
	else {
        var regex = new RegExp("^(http|https)\://([a-zA-Z0-9\.\-]+(\:[a-zA-Z0-9\.&amp;%\$\-]+)*@)*((25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9])\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[0-9])|([a-zA-Z0-9\-]+\.)*[a-zA-Z0-9\-])(\:[0-9]+)*(/($|[a-zA-Z0-9\.\,\?\'\\\+&amp;%\$#\=~_\-]+))*$");
        if (!regex.test(serverUrl)) {
            if(serverUrl.indexOf("http") == -1 && serverUrl.indexOf("https") == -1){
				$("div.errorMsg").text('Invalid Server URL. Specify complete server URL with the protocol. (Ex: https://admanagerplus:8080');
				$(".errorMsg").show();
            }
            else{
				$("div.errorMsg").text('Invalid Server URL');
				$(".errorMsg").show();
            }
			return false;
        } else if (serverUrl.indexOf("https") == -1) {
			$("div.errorMsg").text("Ensure that you provide HTTPS URL of ADManager Plus Server");
			$(".errorMsg").show();
			return false;
        } else if (serverUrl.toLowerCase().indexOf('localhost') != -1 || serverUrl.indexOf('127.0.0.1') != -1) {
			$("div.errorMsg").text('Specify DNS name or IP address');
			$(".errorMsg").show();
			return false;
        } else {
			return true;
        }
    }
}

function enableNavBar(){
	$("#btn-previous").prop('disabled', false);
	$("#btn-next").prop('disabled', false);
	$("#btn-previous").fadeTo(300, 1);
	$("#btn-next").fadeTo(300, 1);
}

function disableNavBar(){
	$("#btn-previous").prop('disabled', true);
	$("#btn-next").prop('disabled', true);
	$("#btn-previous").fadeTo(300, 0.5);
	$("#btn-next").fadeTo(300, 0.5)
}

function hideStatusMsg(obj){
	$(obj).parent().slideUp();
}
//ignorei18n_end