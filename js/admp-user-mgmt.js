//ignorei18n_start
// These are the common scripts used all over the mgmt actions:
// Delete User
// Disable User
// Enable User
// Unlock User
// Reset Password

var admanagerServerURL = '';
var admanagerAuthToken = '';
var admanagerDomainList = '';
var searchText = '';
var user = '';
var actionId = 0;

function getStorageData() {
    return new Promise((resolve,reject)=>{
        ADManagerPlusUtils.getSettings()
        .then((data)=> {
            var admpConfiguration = JSON.parse(data.admpConfiguration);
            var admpZendeskMapping = JSON.parse(data.admpZendeskMapping);
            var zendeskUserId = ADManagerPlusUtils.getParamValuesByName("zendeskUserId");
            admanagerServerURL = admpConfiguration.admpServerUrl;
            admanagerAuthToken = admpZendeskMapping[zendeskUserId].authToken;
            admanagerDomainList = JSON.parse(data.admpDomainList);
            actionId = $("#actionId").val();
            var apiData = 'AuthToken=' +encodeURIComponent(admanagerAuthToken);
            var connection = {
                url: admanagerServerURL + "/RestAPI/GetAuthInfo?"+ apiData,
                type: 'GET',
                cors: true,
            };
            return ADManagerPlusUtils.fetchDataFromAdmp(connection);
        })
        .then((data)=>{
            if(data.hasOwnProperty("SEVERITY") && data.SEVERITY == "SEVERE") {
                reject(data.STATUS_MESSAGE);
            } else {
                admanagerDomainList = (JSON.parse(data.AdmpAuthObject)).domainNameList;
                resolve();
            }
        })
        .catch(()=>{
            reject("Cannot connect to ADManager Plus. Possible reasons could be no network connection or stopping ADManager Plus service.");
        });
    });
}

function cannotPerformAction(message) {
    hideStatusDiv();
    $("#content").animate({scrollTop: 0}, 150);
    $("#content").animate({top: '60px'}, 150, function(){
        $(".popup-error.accord").fadeTo(150, 1);
        $(".popup-error.accord").find("p").empty().append('<span></span> ' + message);
    });
    $("#content").fadeTo(150, 0.5);
    $("#overlay").show();
    $(".btn-green.admp-update-button").prop('disabled', true);
    $(".btn-green.admp-update-button").fadeTo(150, 0.5);
}

$(document).ready(function() {
    // console.log("admp-user-mgmt.js");
    showLoadingDiv();
    getStorageData().then(function() {
        hideLoadingDiv();
        if(admanagerDomainList != null) {
            var html = '<ul>';
            for(var i=0; i<admanagerDomainList.length; i++) {
                html += '<li><a onclick="updateDomain(this);">'+admanagerDomainList[i].DOMAIN_NAME+'</a></li>';
            }
            html += '</ul>';
            $("#domainList").html(html);
            $("#domainList").closest(".admp-dropdown-container").find("label").text(admanagerDomainList[0].DOMAIN_NAME);
        }
        
        $("body").click(function(event) {
            var $target = $(event.target);
            if($target.parent().is(".admp-inputgroup-addon") || $target.is(".admp-inputgroup-addon") || $target.parent().is(".admp-dropdown-container") || $target.is(".admp-dropdown-container")) {
                var visibility = $target.closest('.admp-dropdown-container').find(".admp-dropdown-box").css('display');
                $(".admp-dropdown-box").hide();
                if(visibility == "none") {
                    $target.closest('.admp-dropdown-container').find(".admp-dropdown-box").show();
                }  
                else {
                    $target.closest('.admp-dropdown-container').find(".admp-dropdown-box").hide();
                }  
            }
            else {
                $(".admp-dropdown-box").hide();
            }    
        });

        $("#userName").on('keyup', function(e) {
            if (e.keyCode == 13) {
                if(this.value != '') {
                    $('#popup_input_box').val(this.value);
                    $("#userName").prop("disabled", true);
                    searchUser(1, 10);
                }
                else {
                    ADManagerPlusUtils.confirmBox(getActionName(parseInt(actionId)), "Please enter some search text.");
                }
            }
        });

        $("#plusIcon").off("click");
        $("#plusIcon").on("click", function() {
            if($("#userName").val() != '') {
                if($('#usersList').css('display') == 'none') {
                    $('#popup_input_box').val($("#userName").val());
                    $("#userName").prop("disabled", true);
                    searchUser(1, 10);;
                }
            }
            else {
                ADManagerPlusUtils.confirmBox(getActionName(parseInt(actionId)), "Please enter some search text.");
            }
        });
        
        $("#popup_input_box").on('keyup', function(e) {
            if (e.keyCode == 13) {
                searchUser(1, 10);
            }
        });

        $(".admp-table-close").off("click");
        $(".admp-table-close").on("click", function() {
            $("#usersList").hide();
            $("#userName").prop("disabled", false);
            var selectedUser = $("input:radio[name=user_radio]:checked").attr('id');
            if(selectedUser) {
                $("#userName").val(decodeURI(selectedUser));
            }
            $('#resetPwd').hide();
        });
        
        
        $(".comm-icon.comm-icon-next").off("click");
        $(".comm-icon.comm-icon-next").on("click", function() {
            var startIndex = parseInt($('#startIndex').text());
            var count = parseInt($('#count').text());
            var range = 10;
            if(count>startIndex+range) {
                searchUser(startIndex+range, range);
            }  					
        });
        
        $(".comm-icon.comm-icon-prev").off("click");
        $(".comm-icon.comm-icon-prev").on("click", function() {
            var startIndex = parseInt($('#startIndex').text());
            var range = 10;
            if(startIndex-range>=1) {
                searchUser(startIndex-range, range);
            }    					
        });
        
        $("#password").focus(function(){$("#conf_pass_error").hide()});

        $("#password").blur(function(){validatePassword()});

        $("#conf_password").focus(function(){$("#conf_pass_error").hide()});

        $("#conf_password").blur(function(){validatePassword()});

        $("#mustChangePass").hover(
            function() {
                $(this).addClass("checkbox-focus-icon")
            },
            function() {
                $(this).removeClass("checkbox-focus-icon")
            }
        );

        $("#mustChangePass").click(function() {
            if($(this).hasClass("checkbox-selected-icon")) {
                $(this).removeClass("checkbox-selected-icon");	
            }
            else {
                $(this).addClass("checkbox-selected-icon");
            }
        });
    })
    .catch((error)=>{
        hideLoadingDiv();
        cannotPerformAction(error);
    });
});	

function validatePassword() {
    if($("#actionId").val() == '5') {   // Reset Password Window
        var pass = $("#password").val();
        var confirm_pass = $("#conf_password").val();
        if(confirm_pass == pass) {
            if(pass.length > 32) {
                $("#conf_pass_error").find('label').text('Password exceeds the maximum length!');
                $("#conf_pass_error").show();
                return false;
            } else {
                $("#conf_pass_error").hide();
                return true;
            }
        } else {
            $("#conf_pass_error").find('label').text('Passwords does not match.');	
            $("#conf_pass_error").show();
            return false;
        }
    }
}

function validatePasswordFields() {
    var pass = $("#password").val();
    var confirm_pass = $("#conf_password").val();
    if(pass!="" && confirm_pass!="") {
        return true;
    }
    ADManagerPlusUtils.confirmBox(getActionName(parseInt(actionId)), 'Password cannot be empty!');
    return false;
}

function updateDomain(element) {
    if($('#usersList').css('display') == 'block') {
        var callback = function() {
            searchText = '';
            $('#usersList').hide();
            $(element).closest(".admp-dropdown-container").find("label").text(element.text);
            $("#userName").prop("disabled", false);
            $("#resetPwd").hide();
            $("#password").val("");
            $("#conf_password").val("");
        }
        ADManagerPlusUtils.confirmBox(getActionName(parseInt(actionId)), 'Changing domain will also change the settings of domain-specific fields. Do you wish to continue?', callback);					
    }
    else {
        searchText = '';
        $("input:radio").prop('checked', false);
        $(element).closest(".admp-dropdown-container").find("label").text(element.text);
    }
}
function searchUser(startIndex, range) {
    if(searchText == $("#popup_input_box").val() && startIndex ==  parseInt($('#startIndex').text())) {
        $('#usersList').show();
        if($("#actionId").val() == '5' && user != '') { // Reset Password Window
            $('#resetPwd').show();
        }
        return;
    }

    showLoadingDiv();
    hideStatusDiv();
    
    searchText = $("#popup_input_box").val();
    searchText = searchText.replace(/\\/g, '\\\\');
    
    var selectedDomain = $("#domainList").closest(".admp-dropdown-container").find("label").text();
    var postData = 'AuthToken=' + encodeURIComponent(admanagerAuthToken);
        postData += '&domainName=' + encodeURIComponent(selectedDomain);
        postData += '&searchText=' + encodeURIComponent(searchText);
        postData += '&startIndex=' + encodeURIComponent(startIndex);
        postData += '&range=' + encodeURIComponent(range);
        postData += '&PRODUCT_NAME=' + encodeURIComponent("Zendesk");

    var searchUserPost = {
        url: admanagerServerURL+'/RestAPI/SearchUser?'+ postData,				
        type: 'POST',
        cors: true,
    };
    client.request(searchUserPost)
    .then(function(data) {
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
    })
    .catch(function() {
        $("#content").animate({scrollTop: 0}, 150);
        $("#content").animate({top: '60px'}, 150, function(){
            $(".popup-error.accord").fadeTo(150, 1);
            $(".popup-error.accord").find("p").empty().append('<span></span> Cannot connect to ADManager Plus. Possible reasons could be no network connection or stopping ADManager Plus service.');
        });
        hideLoadingDiv();
        $("#userName").prop("disabled", false);
    });
}

function encode(string) {
    return string.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function showLoadingDiv() {
    $("#popup_loading").show();
    $(".btn-green.admp-update-button").fadeTo(150, 0.5);	
    $(".btn-gray.admp-update-button").fadeTo(150, 0.5);
    $("#content").fadeTo(150, 0.5);
    $("#overlay").show();
    $(".btn-green.admp-update-button").prop('disabled', true);
}

function hideLoadingDiv() {
    $("#popup_loading").hide();
    $(".btn-green.admp-update-button").fadeTo(150, 1);	
    $(".btn-gray.admp-update-button").fadeTo(150, 1);
    $("#content").fadeTo(150, 1);
    $("#overlay").hide();
    $(".btn-green.admp-update-button").prop('disabled', false);
}

function selectUser(element) {
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
    if($("#actionId").val() == '5') { // Reset Password Window
        $('#resetPwd').show();
    }
}

function cancel() {
    client.invoke('destroy');
}

function validateAndPost() {
    var actionId = $("#actionId").val();
    var selectedUser  = $("input:radio[name=user_radio]:checked").attr('id');
    if(selectedUser == undefined) {
        ADManagerPlusUtils.confirmBox(getActionName(parseInt(actionId)), "You haven\'t selected any object.");
        return;
    }
    if(actionId == "5") {   //Reset Password Window
        if(!validatePasswordFields()) {
            return;
        }
        else if(!validatePassword()) {
            return;
        }
    }
    doPost(actionId);
}

function doPost(actionId) {
    var callback = function() {
        showLoadingDiv();
        hideStatusDiv();
        var URL = getURL(parseInt(actionId));
        var post = {
            url: URL,
            type: 'POST',
            cors: true,
        };
        client.request(post)
        .then(function(data) {
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
                    $(".popup-success.accord").find("p").empty().append('<span></span>'+data.response[0].statusMessage.replace(/&amp;/g, "&"));
                }
                else
                {
                    $(".popup-error.accord").fadeTo(150, 1);
                    $(".popup-error.accord").find("p").empty().append('<span></span>'+data.response[0].statusMessage.replace(/&amp;/g, "&"));
                }
            }
            else
            {
                $(".popup-error.accord").fadeTo(150, 1);
                $(".popup-error.accord").find("p").empty().append('<span></span>'+data.response);
            }
            hideLoadingDiv();
        })
        .catch(function(error) {
            hideLoadingDiv();
            $("#content").animate({top: '60px'}, 150);
            $("#content").animate({scrollTop: 0}, 150);
            $(".popup-error.accord").fadeTo(150, 1);
            $(".popup-error.accord").find("p").empty().append('<span></span> Cannot connect to ADManager Plus. Possible reasons could be no network connection or stopping ADManager Plus service.');
        });
    }
    
    if(actionId == '2') {   // Delete Window
        ADManagerPlusUtils.confirmBox(getActionName(parseInt(actionId)), 'Are you sure that you want to delete the selected user?', callback);
    }
    else {
        callback();
    }
}
function getActionName(actionId) {
    switch (actionId) {
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
function getURL(actionId) {
    var selectedUser  = $("input:radio[name=user_radio]:checked").attr('id');
    var selectedDomain = $("#domainList").closest(".admp-dropdown-container").find("label").text();
    var inputData = [];
    var userData = {};
    userData.sAMAccountName = decodeURI(selectedUser);
    inputData.push(userData);
    var password = $("#password").val();
    var mustChangePassword = 'false';

    if($("#mustChangePass").hasClass("checkbox-selected-icon")) {
        mustChangePassword = 'true';
    }

    var postData = 'AuthToken=' + encodeURIComponent(admanagerAuthToken);
        postData += '&domainName=' + encodeURIComponent(selectedDomain);
        postData += '&PRODUCT_NAME=' + encodeURIComponent("Zendesk");
        postData += '&additionalData=' + encodeURIComponent(constructAdditionalInput());

    switch (actionId) {
        case 2:
            postData += '&inputFormat=' + encodeURIComponent(JSON.stringify(inputData));
            return admanagerServerURL+'/RestAPI/DeleteUser?' + postData;
        case 3:
            postData += '&inputFormat=' + encodeURIComponent(JSON.stringify(inputData));
            return admanagerServerURL+'/RestAPI/DisableUser?' + postData;
        case 4:
            postData += '&inputFormat=' + encodeURIComponent(JSON.stringify(inputData));
            return admanagerServerURL+'/RestAPI/EnableUser?' + postData;
        case 5:
            postData += '&inputFormat=' + btoa(JSON.stringify(inputData));
            postData += '&pwd=' + btoa(password);
            postData += '&mustChangePassword=' + encodeURIComponent(mustChangePassword);
            postData += '&isEncoded=' + encodeURIComponent(true);
            return admanagerServerURL+'/RestAPI/ResetPwd?' + postData;
        case 6:
            postData += '&inputFormat=' + encodeURIComponent(JSON.stringify(inputData));
            return admanagerServerURL+'/RestAPI/UnlockUser?' + postData;
    }
    return '';
}

function clearAllFields() {
    $("#usersList").hide();
    $("#resetPwd").hide();
    $("#userName").val("");
    $("#password").val("");
    $("#conf_password").val("");
    $("#userName").prop("disabled", false);
    searchText = '';
    user = '';
    $("input:radio").prop('checked', false);
    if($("#mustChangePass").hasClass("checkbox-selected-icon")) {
        $("#mustChangePass").removeClass("checkbox-selected-icon");	
    }
}

function hideStatusDiv() {
    $(".popup-success.accord").fadeTo(150, 0);
    $(".popup-error.accord").fadeTo(150, 0);
    $("#content").animate({top: '20px'}); // No I18N
}

function constructAdditionalInput() {
    var ticket_id = ADManagerPlusUtils.getParamValuesByName('ticket_id');
    var addtionalData = {};
    addtionalData.reqId = ticket_id;
    return JSON.stringify(addtionalData);
}
//ignorei18n_end