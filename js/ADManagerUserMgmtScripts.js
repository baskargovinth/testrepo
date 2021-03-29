// <!-- $Id: ADManagerUserMgmtScripts.js baskar.govindan Exp$-->
//ignorei18n_start
/*
 * These are the common scripts used all over the mgmt actions ---
 * Enable User
 * Disable User
 * Delete User
 * Unlock User
 * Reset Password
 */
	var client = ZAFClient.init();
	var admanagerServerURL = '';
	var admanagerAuthToken = '';
	var admanagerDomainList = '';
	var searchText = '';
	var user = '';
	var actionId = 0;
	$(document).ready(function() {
		client.metadata().then(function(metadata) {
			admanagerServerURL = metadata.settings.admanagerServerUrl;
			admanagerAuthToken = metadata.settings.admanagerAuthToken;
			admanagerDomainList = metadata.settings.admanagerDomainList;
		
			if(!admanagerServerURL)
			{
				$("#content").animate({scrollTop: 0}, 150);
				$("#content").animate({top: '60px'}, 150, function(){
					$(".popup-error.accord").fadeTo(150, 1);
					$(".popup-error.accord").find("p").empty().append('<span></span> ADManager Plus is not configured. Please contact Zendesk Administrator.');
				});
				$("#content").fadeTo(150, 0.5);
				$("#overlay").show();
				$(".btn-green.admp-update-button").prop('disabled', true);
				$(".btn-green.admp-update-button").fadeTo(150, 0.5);
				return;
			}
			
			if(admanagerDomainList != null)
			{	
				admanagerDomainList = JSON.parse(admanagerDomainList);
				var html = '<ul>';
				for(var i=0; i<admanagerDomainList.length; i++)
				{
					html += '<li><a onclick="updateDomain(this);">'+admanagerDomainList[i].DOMAIN_NAME+'</a></li>';
				}
				html += '</ul>';
				$("#domainList").html(html);
				$("#domainList").closest(".admp-dropdown-container").find("label").text(admanagerDomainList[0].DOMAIN_NAME);
			}
			
			$("body").click(function(event){
				var $target = $(event.target);
				if($target.parent().is(".admp-inputgroup-addon") || $target.is(".admp-inputgroup-addon") || $target.parent().is(".admp-dropdown-container") || $target.is(".admp-dropdown-container")){//NO I18N
					var visibility = $target.closest('.admp-dropdown-container').find(".admp-dropdown-box").css('display');
					$(".admp-dropdown-box").hide();
					if(visibility == "none")
						$target.closest('.admp-dropdown-container').find(".admp-dropdown-box").show();
					else
						$target.closest('.admp-dropdown-container').find(".admp-dropdown-box").hide();
				}
				else
					$(".admp-dropdown-box").hide();
			});
			$("#userName").on('keyup', function (e) {
				if (e.keyCode == 13) {
					if(this.value != '')
					{
						$('#popup_input_box').val(this.value);
						$("#userName").prop("disabled", true);
						searchUser(1, 10);
					}
					else
					{
						ADManagerCommonUtil.popup('Delete User', 'Please enter a username');
					}
				}
			});
			$("#plusIcon").click(function() {
				if($("#userName").val() != '')
				{
					if($('#usersList').css('display') == 'none')
					{
						$('#popup_input_box').val($("#userName").val());
						$("#userName").prop("disabled", true);
						searchUser(1, 10);;
					}
				}
				else 
				{
					ADManagerCommonUtil.popup('Delete User', 'Please enter a username');
				}
			});
			
			$("#popup_input_box").on('keyup', function (e) {
				if (e.keyCode == 13) {
					searchUser(1, 10);
				}
			});
			$(".admp-table-close").click(function(){
				$("#usersList").hide();
				$("#userName").prop("disabled", false);
				var selectedUser = $("input:radio[name=user_radio]:checked").attr('id');
				if(selectedUser)
					$("#userName").val(decodeURI(selectedUser));
				$('#resetPwd').hide();
			});
			
			

			$(".comm-icon.comm-icon-next").click(function() {
				var startIndex = parseInt($('#startIndex').text());
				var count = parseInt($('#count').text());
				var range = 10;
				
				if(count>startIndex+range)
					searchUser(startIndex+range, range);					
			});
			
			$(".comm-icon.comm-icon-prev").click(function() {
				var startIndex = parseInt($('#startIndex').text());
				var range = 10;
				if(startIndex-range>=1)
					searchUser(startIndex-range, range);					
			});
			
			$("#password").focus(function(){$("#conf_pass_error").hide()});
			$("#password").blur(function(){validatePassword()});
			$("#conf_password").focus(function(){$("#conf_pass_error").hide()});
			$("#conf_password").blur(function(){validatePassword()});
			$("#mustChangePass").hover(function(){$(this).addClass("checkbox-focus-icon")}, function() {$(this).removeClass("checkbox-focus-icon")});
			$("#mustChangePass").click(function(){
				if($(this).hasClass("checkbox-selected-icon"))
					$(this).removeClass("checkbox-selected-icon");	
				else
					$(this).addClass("checkbox-selected-icon");
			});
				
		});
	});	

	function validatePassword(){
		if($("#actionId").val() == '5') // Reset Password Window
		{
			var pass = $("#password").val();
			var confirm_pass = $("#conf_password").val();
			if(confirm_pass == pass)
			{
				$("#conf_pass_error").hide();
			}
			else
			{
				$("#conf_pass_error").find('label').text('Confirmation must match');	
				$("#conf_pass_error").show();
				return false;
			}
		}
		return true;
	}

	function updateDomain(element)
	{
		if($('#usersList').css('display') == 'block')
		{
			var callback = function(){
				searchText = '';
				$('#usersList').hide();
				$(element).closest(".admp-dropdown-container").find("label").text(element.text);
				$("#userName").prop("disabled", false);
				$("#resetPwd").hide();
				$("#password").val("");
				$("#conf_password").val("");
			}
			ADManagerCommonUtil.popup('Delete User', 'Changing domain will also change the settings of domain-specific fields. Do you wish to continue?', callback);					
		}
		else
		{
			searchText = '';
			$("input:radio").prop('checked', false);
			$(element).closest(".admp-dropdown-container").find("label").text(element.text);
		}
	}
	function searchUser(startIndex, range)
	{
		if(searchText == $("#popup_input_box").val() && startIndex ==  parseInt($('#startIndex').text()))
		{
			$('#usersList').show();
			if($("#actionId").val() == '5' && user != '') // Reset Password Window
				$('#resetPwd').show();
			return;
		}
		showLoadingDiv();
		hideStatusDiv();
		
		searchText = $("#popup_input_box").val();
		searchText = searchText.replace(/\\/g, '\\\\');
		
		var selectedDomain = $("#domainList").closest(".admp-dropdown-container").find("label").text();

		var searchUserPost = {
			url: admanagerServerURL+'/RestAPI/SearchUser?AuthToken='+admanagerAuthToken+'&domainName='+selectedDomain+'&searchText='+encodeURIComponent(searchText)+'&startIndex='+startIndex+'&range='+range+'&PRODUCT_NAME=Zendesk',					
			type: 'POST',
			cors: true,
		};
		client.request(searchUserPost).then(function(data) {
			data = ADManagerErrorHandler.handle(data);
			if(data.isSuccess)
			{
				var userList = data.response.UsersList;
				var count = data.response.count;				
				var userHtml = '';
				if(userList.length > 0)
				{
					for(var i=0;i<userList.length;i++)
					{
						var checked ='';
						if(user == userList[i].SAM_ACCOUNT_NAME)
							checked="checked=checked";
						userHtml += '<tr><td><input type="radio" name="user_radio" id="'+(userList[i].SAM_ACCOUNT_NAME?encodeURI(userList[i].SAM_ACCOUNT_NAME):"-")+'" onclick="selectUser(this);" '+checked+'></td>';
						userHtml += '<td>'+(userList[i].DISPLAY_NAME?encode(userList[i].DISPLAY_NAME):"-")+'</td>';
						userHtml += '<td>'+(userList[i].SAM_ACCOUNT_NAME?encode(userList[i].SAM_ACCOUNT_NAME):"-")+'</td>';
						userHtml += '<td>'+(userList[i].LOGON_NAME?encode(userList[i].LOGON_NAME):"-")+'</td></tr>';
					}
				}
				else
				{
						userHtml = '<tr><td style="padding: 30px;" colspan="4"><span style="display:block; text-align:center; margin:0 auto;">There is no matching data for your input!</span></td></tr>';
						startIndex = 0;
						count = 0;
				}
				$('#startIndex').text(startIndex);
				$('#endIndex').text(startIndex+range<count?startIndex+range-1:count);
				$('#count').text(count);
				$(".admp-table").find("tbody").html(userHtml);
				$('#usersList').show();
				if($("#actionId").val() == '5' && user != '') // Reset Password Window
					$('#resetPwd').show();
			}
			else
			{
				$("#userName").prop("disabled", false);
			}
			hideLoadingDiv();
			$(".admp-pagination").show();
		}).catch(function(error) {
			$("#content").animate({scrollTop: 0}, 150);
			$("#content").animate({top: '60px'}, 150, function(){
				$(".popup-error.accord").fadeTo(150, 1);
				$(".popup-error.accord").find("p").empty().append('<span></span> Cannot connect to ADManager Plus. Possible reasons could be no network connection, wrong server name or port number.');
			});
			hideLoadingDiv();
			$("#userName").prop("disabled", false);
		});
	}	
	function encode(string)
	{
		return string.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
	}
	function showLoadingDiv()
	{
		$("#popup_loading").show();
		$(".btn-green.admp-update-button").fadeTo(150, 0.5);	
		$(".btn-gray.admp-update-button").fadeTo(150, 0.5);
		$("#content").fadeTo(150, 0.5);
		$("#overlay").show();
		$(".btn-green.admp-update-button").prop('disabled', true);
	}
	function hideLoadingDiv()
	{
		$("#popup_loading").hide();
		$(".btn-green.admp-update-button").fadeTo(150, 1);	
		$(".btn-gray.admp-update-button").fadeTo(150, 1);
		$("#content").fadeTo(150, 1);
		$("#overlay").hide();
		$(".btn-green.admp-update-button").prop('disabled', false);
	}
	function selectUser(element)
	{
		var selectedRow = $(element).closest('tr');
		$("#content").fadeTo(150, 0.5);
		$("input:radio").prop('checked', false);
		$(element).prop('checked', true);
		$(element).closest('tbody').html(selectedRow);
		$("#content").fadeTo(150, 1);
		
		var sAMAccountName = decodeURI(element.id);
		$('#popup_input_box').val(sAMAccountName);
		user = sAMAccountName;
		searchText = sAMAccountName;
		$("#userName").val(sAMAccountName);
		$('#startIndex').text(1);
		$('#endIndex').text(1);
		$('#count').text(1);
		if($("#actionId").val() == '5') // Reset Password Window
			$('#resetPwd').show();
	}
	function cancel()
	{
		client.invoke('destroy');
	}
	function validateAndPost()
	{
		var actionId = $("#actionId").val();
		var selectedUser  = $("input:radio[name=user_radio]:checked").attr('id');
		if(selectedUser == undefined)
		{
			ADManagerCommonUtil.popup(getActionName(parseInt(actionId)), 'Please select a user');
			return;
		}
		else if(!validatePassword())
		{
			return;
		}
		doPost(actionId);
	}
	function doPost(actionId)
	{
		var callback = function()
		{
			showLoadingDiv();
			hideStatusDiv();
			var URL = getURL(parseInt(actionId));
			var deletePost = {
				url: URL,
				type: 'POST',
				cors: true,
			};
			client.request(deletePost).then(function(data) {
				data = ADManagerErrorHandler.handle(data);
				$("#content").animate({top: '60px'}, 150);
				$("#content").animate({scrollTop: 0}, 150);
				if(data.isSuccess)
				{
					var response = data.response;
					if(response[0].status != '0')
					{
						clearAllFields();
						$(".popup-success.accord").fadeTo(150, 1);
						$(".popup-success.accord").find("p").empty().append('<span></span>'+data.response[0].statusMessage);
					}
					else
					{
						$(".popup-error.accord").fadeTo(150, 1);
						$(".popup-error.accord").find("p").empty().append('<span></span>'+data.response[0].statusMessage);
					}
				}
				else
				{
					$(".popup-error.accord").fadeTo(150, 1);
					$(".popup-error.accord").find("p").empty().append('<span></span>'+data.response);
				}
				hideLoadingDiv();
			}).catch(function(error) {
				hideLoadingDiv();
				$("#content").animate({top: '60px'}, 150);
				$("#content").animate({scrollTop: 0}, 150);
				$(".popup-error.accord").fadeTo(150, 1);
				$(".popup-error.accord").find("p").empty().append('<span></span> Cannot connect to ADManager Plus. Possible reasons could be no network connection, wrong server name or port number.');
			});
		}
		
		if(actionId == '2') // Reset Password Window
		{
			ADManagerCommonUtil.popup(getActionName(parseInt(actionId)), 'Are you sure that you want to delete the selected user?', callback);
		}
		else
		{
			callback();
		}
	}
	function getActionName(actionId)
	{
		switch (actionId)
		{
			case 1:
				break;
			case 2:
				return 'Delete User';
			case 3:
				return 'Disable User';
			case 4:
				return 'Enable User';
			case 5:
				return 'Reset Password';
			case 6:
				return 'Unlock User';
		}
	}
	function getURL(actionId)
	{
		var selectedUser  = $("input:radio[name=user_radio]:checked").attr('id');
		var selectedDomain = $("#domainList").closest(".admp-dropdown-container").find("label").text();
		var inputData = [];
		var userData = {};
		userData.sAMAccountName = decodeURI(selectedUser);
		inputData.push(userData);
		var password = $("#password").val();
		var mustChangePassword = 'false';
		if($("#mustChangePass").hasClass("checkbox-selected-icon"))
			mustChangePassword = 'true';
		
		switch (actionId)
		{
			case 1:
				break;
			case 2:
				return admanagerServerURL+'/RestAPI/DeleteUser?AuthToken='+admanagerAuthToken+'&inputFormat='+encodeURIComponent(JSON.stringify(inputData))+'&domainName='+selectedDomain+'&PRODUCT_NAME=Zendesk&additionalData='+constructAdditionalInput();
			case 3:
				return admanagerServerURL+'/RestAPI/DisableUser?AuthToken='+admanagerAuthToken+'&inputFormat='+encodeURIComponent(JSON.stringify(inputData))+'&domainName='+selectedDomain+'&PRODUCT_NAME=Zendesk&additionalData='+constructAdditionalInput();
			case 4:
				return admanagerServerURL+'/RestAPI/EnableUser?AuthToken='+admanagerAuthToken+'&inputFormat='+encodeURIComponent(JSON.stringify(inputData))+'&domainName='+selectedDomain+'&PRODUCT_NAME=Zendesk&additionalData='+constructAdditionalInput();
			case 5:
				return admanagerServerURL+'/RestAPI/ResetPwd?AuthToken='+admanagerAuthToken+'&inputFormat='+encodeURIComponent(JSON.stringify(inputData))+'&pwd='+encodeURIComponent(password)+'&domainName='+selectedDomain+'&mustChangePassword='+mustChangePassword+''+'&PRODUCT_NAME=Zendesk&additionalData='+constructAdditionalInput();
			case 6:
				return admanagerServerURL+'/RestAPI/UnlockUser?AuthToken='+admanagerAuthToken+'&inputFormat='+encodeURIComponent(JSON.stringify(inputData))+'&domainName='+selectedDomain+'&PRODUCT_NAME=Zendesk&additionalData='+constructAdditionalInput();
		}
		return '';
	}
	function clearAllFields()
	{
		$("#usersList").hide();
		$("#resetPwd").hide();
		$("#userName").val("");
		$("#password").val("");
		$("#conf_password").val("");
		$("#userName").prop("disabled", false);
		searchText = '';
		$("input:radio").prop('checked', false);
	}
	function hideStatusDiv()
	{
		$(".popup-success.accord").fadeTo(150, 0);
		$(".popup-error.accord").fadeTo(150, 0);
		$("#content").animate({top: '20px'}); // No I18N
	}
	function constructAdditionalInput()
	{
		var ticket_id = ADManagerCommonUtil.getParamValuesByName('ticket_id');
		var addtionalData = {};
		addtionalData.reqId = ticket_id;
		return JSON.stringify(addtionalData);
	}
//ignorei18n_end