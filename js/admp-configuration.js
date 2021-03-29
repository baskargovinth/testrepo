//ignorei18n_start

var admanagerServerURL = '';
var userName = '';
var domainName = '';
var authtoken = '';	
var loginDomainList = '';
var oldServerURL = '';
var oldLoginDomainList = '';
var isServerUrlChanged = false;
var loggedInZendeskUserData = '';

$(document).ready(function() {
    // console.log("admp-configuration.js");
    init();
});

function init() {
    $("#server_url").show();
    $("#admin_credentials").show();
    $("#server_url_config").hide();
    $("#admin_credentials_config").hide();

    getConfigurationData()
    .then(()=> {
        $("#serverUrlValue").html(admanagerServerURL);
        $("#userNameValue").html(userName);
        $("#domainValue").html(domainName);
        updateAdmpDomainDropdown();
        checkServerConnection();

        $("#serverURL").focus(function() {
            $(".errorMsg").hide();
            $("#server-form-group").find(".admp-input-box").removeClass('errorTextbox');
        });
    
        $('#admanagerPassword, #admanagerUserName').focus(function() {
            $(".admp-credentials-error").hide();
        });
    })
    .catch(()=> {
        // do nothing
    });
}

function getConfigurationData() {
    return new Promise((resolve,reject)=>{
        ADManagerPlusUtils.getSettings()
        .then((data)=> {
            var admpConfiguration = JSON.parse(data.admpConfiguration);
            admanagerServerURL = admpConfiguration.admpServerUrl;
            userName = admpConfiguration.userName;
            domainName = admpConfiguration.domainFlatName;
            authtoken = admpConfiguration.authToken;
            loginDomainList = JSON.parse(data.admpDomainList);
            return ADManagerPlusUtils.getLoggedInZendeskUser();
        })
        .then((data)=>{
            loggedInZendeskUserData = data.user;
            resolve();
        })
        .catch(()=>{
            reject();
        });
    });
}

function updateAdmpDomainDropdown() {
    var domainName = '';
    var html = '<ul>';
    for(key in loginDomainList) {
        html += '<li><a onclick="updateDomainName(this);">'+loginDomainList[key]+'</a></li>';
        if(domainName == '') {
            domainName = loginDomainList[key];
        } 
    }
    html += '</ul>';
    $("#domainList").html(html);
    $("#domainList").closest(".admp-dropdown-container").find("label").text(domainName);
}

// To check the server status
function checkServerConnection() {
    $("#serverStatDiv").hide();
    $("#serverStat_loading").show();
    $(".overlay-config").show();
    var serverConn = {
        url: admanagerServerURL+'/MobileAPI/MobileLogin?methodToCall=domainList',
        type: 'POST',
        cors: true,
    };
    client.request(serverConn)
    .then(function(data) {
        data = ADManagerErrorHandler.handle(data);
        if(data.isSuccess) {
            loginDomainList = data.response;
            updateAdmpDomainDropdown();
            $("#serverStatus").text("Connection Established");
            $("#serverStatus").prev().addClass('green-tick-icon');
            $("#serverStatus").prev().removeClass('red-cross-icon');
            checkAuth();
        } else {
            $("#serverStatus").text("Unable to connect");
            $("#serverStatus").prev().addClass('red-cross-icon');
            $("#serverStatus").prev().removeClass('green-tick-icon');
            $("#admin_credentials").fadeTo(300, 0.5);
            $("#loginStatus").text("Invalid Credentials");
            $("#loginStatus").prev().addClass('red-cross-icon');
            $("#loginStatus").prev().removeClass('green-tick-icon');
        }
        $("#serverStatDiv").show();
        $("#serverStat_loading").hide();
        $(".overlay-config").hide();
    })
    .catch(function() {
        $("#serverStatus").text("Unable to connect");
        $("#serverStatus").prev().addClass('red-cross-icon');
        $("#serverStatus").prev().removeClass('green-tick-icon');
        $("#serverStatDiv").show();
        $("#serverStat_loading").hide();
        $(".overlay-config").hide();
        $("#admin_credentials").fadeTo(300, 0.5);
        $("#loginStatus").text("Invalid Credentials");
        $("#loginStatus").prev().addClass('red-cross-icon');
        $("#loginStatus").prev().removeClass('green-tick-icon');
    });

    $(".server-details-subdiv#server_url").hover(
        function() {
            $(this).find(".admp-server-details-value#edit").show();
        }, 
        function() {
            $(this).find(".admp-server-details-value#edit").hide();
        }
    );
}

// To check the authtoken validity
function checkAuth() {
    $("#authStatDiv").hide();
    $("#authStat_loading").show();
    $(".overlay-config").show();

    var postData = 'AuthToken=' + encodeURIComponent(authtoken);
    var authConnection = {
        url: admanagerServerURL+'/RestAPI/GetAuthInfo?' + postData,
        type: 'POST',
        cors: true,
    };
    client.request(authConnection).then(function(data) {
        data = ADManagerErrorHandler.handle(data);
        if(data.isSuccess) {
            $("#loginStatus").text("Valid Credentials");
            $("#loginStatus").prev().addClass('green-tick-icon');
            $("#loginStatus").prev().removeClass('red-cross-icon');
        }
        else {
            $("#loginStatus").text("Invalid Credentials");
            $("#loginStatus").prev().addClass('red-cross-icon');
            $("#loginStatus").prev().removeClass('green-tick-icon');
        }
        $("#authStatDiv").show();
        $("#authStat_loading").hide();
        $(".overlay-config").hide();
    })
    .catch(function() {
        $("#loginStatus").text("Invalid Credentials");
        $("#loginStatus").prev().addClass('red-cross-icon');
        $("#loginStatus").prev().removeClass('green-tick-icon');
        $("#authStatDiv").show();
        $("#authStat_loading").hide();
        $(".overlay-config").hide();
    });

    $(".server-details-subdiv#admin_credentials").hover(
        function() {
            $(this).find(".admp-server-details-value#edit").show();
        },
        function() {
            $(this).find(".admp-server-details-value#edit").hide();
        }
    );
}

function updateConfigurationFields() {
    if(isServerUrlChanged == true) {
        isServerUrlChanged = false;
        admanagerServerURL = oldServerURL;
        loginDomainList = oldLoginDomainList;
        oldServerURL = "";
        oldLoginDomainList = "";
    }
    $("#serverUrlValue").html(admanagerServerURL);
    $("#userNameValue").html(userName);
    $("#domainValue").html(domainName);
    updateAdmpDomainDropdown();
    checkServerConnection();
}

// Show server url modification section
function modifyServerDetails() {
    $("#server_url").hide();
    $("#server_url_config").show();
    $("#admin_credentials").show();
    $("#admin_credentials_config").hide();
    $("#loadingDiv").hide();
    $(".overlay-config").hide();
    $(".errorMsg").hide();
    $("#server-form-group").show();
    $("#server-form-group").find(".admp-input-box").removeClass('errorTextbox');
    $(".admp-credentials-error").hide();
    enableMgmtBtns();
    $("#serverURL").val(admanagerServerURL);
}

// Show Login section
function modifyAdminCredentials() {
    $("#server_url").show();
    $("#server_url_config").hide();
    $("#admin_credentials").hide();
    $("#admin_credentials_config").show();
    $("#loadingDiv").hide();
    $(".overlay-config").hide();
    $(".errorMsg").hide();
    $("#server-form-group").show();
    $("#server-form-group").find(".admp-input-box").removeClass('errorTextbox');
    $(".admp-credentials-error").hide();
    enableMgmtBtns();
    $("#admanagerUserName").val(userName);
    $("#admanagerPassword").val("");
}

function modifyServerCancel() {
    $("#server_url").show();
    $("#admin_credentials").show();
    $("#server_url_config").hide();
    $("#admin_credentials_config").hide();
    $("#loadingDiv").hide();
    $(".overlay-config").hide();
    $(".errorMsg").hide();
    $("#server-form-group").show();
    $("#server-form-group").find(".admp-input-box").removeClass('errorTextbox');
    $(".admp-credentials-error").hide();
    enableMgmtBtns();
    $("#serverURL").val("");
    updateConfigurationFields();
}

function modifyAdminCredCancel() {
    $("#server_url").show();
    $("#admin_credentials").show();
    $("#server_url_config").hide();
    $("#admin_credentials_config").hide();
    $("#loadingDiv").hide();
    $(".overlay-config").hide();
    $(".errorMsg").hide();
    $("#server-form-group").show();
    $("#server-form-group").find(".admp-input-box").removeClass('errorTextbox');
    $(".admp-credentials-error").hide();
    enableMgmtBtns();
    $("#admanagerUserName").val("");
    $("#admanagerPassword").val("");
    updateConfigurationFields();
}

// ADManager API call to check the entered URL
function updateServerURL() {
    var serverUrl = $("#serverURL").val();
    if(isValidURL(serverUrl)) {
        var callback = function() {
            $("#loadingDiv").show();
            $(".overlay-config").show();
            $("#server-form-group").hide();
            $("#admin_credentials").fadeTo(300, 0.5);
            disableMgmtBtns();
            var serverConn = {
                url: serverUrl+'/MobileAPI/MobileLogin?methodToCall=domainList',
                type: 'POST',
                cors: true,
            };
            client.request(serverConn)
            .then(function(data) {
                data = ADManagerErrorHandler.handle(data);
                if(data.isSuccess) {
                    isServerUrlChanged = true;
                    oldServerURL = admanagerServerURL;
                    oldLoginDomainList = loginDomainList;
                    admanagerServerURL = serverUrl;
                    loginDomainList = data.response;
                    
                    $("#serverUrlValue").html(admanagerServerURL);
                    updateAdmpDomainDropdown();
                    $("#serverStatus").text("Connection Established");
                    $("#serverStatus").prev().removeClass('red-cross-icon');
                    $("#serverStatus").prev().addClass('green-tick-icon');
                    $("#server-form-group").find(".admp-input-box").removeClass('errorTextbox');              			
                    
                    $("#server_url").show();
                    $("#server_url_config").hide();
                    $("#admin_credentials").fadeTo(300, 1);
                    $("#admin_credentials").hide();
                    $("#admin_credentials_config").show();
                    $("#admanagerUserName").val("");
                    $("#admanagerPassword").val("");
                    ADManagerPlusUtils.showCustomNotification("admp_configuration_status_message", "success", "Successfully connected.", 5000);
                } else {
                    $("#server-form-group").find(".admp-input-box").addClass('errorTextbox');
                    $("div.errorMsg").text(data.response);
                    $(".errorMsg").show();
                    $("#admin_credentials").fadeTo(300, 1);
                }
                $("#loadingDiv").hide();
                $(".overlay-config").hide();
                $("#server-form-group").show();
                enableMgmtBtns();
            })
            .catch(function() {
                $("#loadingDiv").hide();
                $(".overlay-config").hide();
                $("#server-form-group").show();
                $("#server-form-group").find(".admp-input-box").addClass('errorTextbox');
                $("div.errorMsg").text('Cannot connect to ADManager Plus. Possible reasons could be no network connection, wrong server name or port number.');
                $(".errorMsg").show();
                $("#admin_credentials").fadeTo(300, 1);
                enableMgmtBtns();
            });			
        }
        ADManagerPlusUtils.confirmBox('Alert', 'Changing server URL will also change the settings of admin credentials. Do you wish to continue?', callback);
    }
}

function updateAdminCredentials() {
    var newUserName = $("#admanagerUserName").val();
    var password = $("#admanagerPassword").val();
    var selectedDomain = $(".admp-dropdown-container").find("label").text();
        
    if(newUserName == '') {
        $(".admp-credentials-error#username").find("label").text('Username cannot be empty!');
        $(".admp-credentials-error#username").show();
    } else if(password == '') {
        $(".admp-credentials-error#password").find("label").text('Password cannot be empty!');
        $(".admp-credentials-error#password").show();
    } else {
        ADManagerPlusUtils.getSettings()
        .then((settings)=> {
            var admpZendeskMapping = JSON.parse(settings.admpZendeskMapping);
            var admpTechnicianWithDomain = selectedDomain + "\\" + newUserName;

            if(isAdmpTechnicianAlreadyMapped(admpZendeskMapping, admpTechnicianWithDomain)) {
                ADManagerPlusUtils.showCustomNotification("admp_configuration_status_message", "error", "<b>"+ admpTechnicianWithDomain + "</b> is already mapped with another Zendesk user. Please remove the user association and try again.", 5000);
            } else {
                $("#credentials").fadeTo(300, 0.5);
                $("#server_url").fadeTo(300, 0.5);
                $("#credetial_loading").show();
                $(".overlay-config").show();
                disableMgmtBtns();
                var postData = 'loginName=' + encodeURIComponent(newUserName);
                    postData += '&password=' + encodeURIComponent(password);
                    postData += '&domainName=' + encodeURIComponent(selectedDomain);
                    postData += '&PRODUCT_NAME=' + encodeURIComponent("Zendesk");
                var adminConn = {
                    url: admanagerServerURL + '/RestAPI/APIAuthToken?' + postData,
                    type: 'POST',
                    cors: true,
                };
                client.request(adminConn)
                .then(function(data) {
                    data = ADManagerErrorHandler.handle(data);
                    if(data.isSuccess) {
                        if(isAdmpTechnicianAlreadyMapped(admpZendeskMapping, selectedDomain + "\\" + (data.response.LoginName))) {
                            ADManagerPlusUtils.showCustomNotification("admp_configuration_status_message", "error", "<b>"+ selectedDomain + "\\" + (data.response.LoginName) + "</b> is already mapped with another Zendesk user. Please remove the user association and try again.", 5000);
                        } else {
                            var admpConfiguration = {"admpServerUrl": admanagerServerURL, "userName": data.response.LoginName, "domainFlatName": selectedDomain, "authToken": data.response.AuthTicket};
                            var admpDomainList = loginDomainList;

                            var settings = {
                                "admpConfiguration": JSON.stringify(admpConfiguration),
                                "admpDomainList": JSON.stringify(admpDomainList),
                            };
                            
                            ADManagerPlusUtils.updateSettings(settings)
                            .then(()=> {
                                if(isServerUrlChanged == true) {
                                    isServerUrlChanged = false;
                                    var dataObj = {};
                                    dataObj.admpConfiguration = admpConfiguration;
                                    ADManagerPlusUtils.freezeWindow(true);
                                    ADManagerPlusUtils.getAllTechnicianDetails()
                                    .then((allAdmpTechnicianDetails)=> {
                                        dataObj.allAdmpTechnicianDetails = allAdmpTechnicianDetails;
                                        return defaultMappingConfig(dataObj);
                                    }).then(()=>{
                                        ADManagerPlusUtils.freezeWindow(false);
                                        ADManagerPlusUtils.showCustomNotification("admp_configuration_status_message", "success", "Successfully configured.", 5000);
                                        init();
                                    })
                                    .catch(()=> {
                                        ADManagerPlusUtils.freezeWindow(false);
                                        // do nothing
                                    });
                                } else {
                                    userName = data.response.LoginName;
                                    domainName = selectedDomain;
                                    authtoken = data.response.AuthTicket;

                                    $("#server_url").show();
                                    $("#admin_credentials").show();
                                    $("#server_url_config").hide();
                                    $("#admin_credentials_config").hide();
                                    $("#loginStatus").text("Valid Credentials");
                                    $("#loginStatus").prev().removeClass('red-cross-icon');
                                    $("#loginStatus").prev().addClass('green-tick-icon');
                                    
                                    $("#userNameValue").html(userName);
                                    $("#domainValue").html(selectedDomain);

                                    var dataObj = {};
                                    dataObj.admpConfiguration = admpConfiguration;
                                    dataObj.admpZendeskMapping = admpZendeskMapping;
                                    ADManagerPlusUtils.freezeWindow(true);
                                    ADManagerPlusUtils.getAllTechnicianDetails()
                                    .then((data)=> {
                                        dataObj.allAdmpTechnicianDetails = data;
                                        return defaultMappingConfig(dataObj);
                                    }).then(()=>{
                                        ADManagerPlusUtils.freezeWindow(false);
                                        ADManagerPlusUtils.showCustomNotification("admp_configuration_status_message", "success", "Successfully configured.", 5000);
                                    })
                                    .catch(()=>{
                                        ADManagerPlusUtils.freezeWindow(false);
                                    });
                                }
                            })
                            .catch(function() {
                                // do nothing
                            });
                        }
                    } else {
                        ADManagerPlusUtils.showCustomNotification("admp_configuration_status_message", "error", data.response, 5000);
                    }

                    $("#credentials").fadeTo(300, 1);
                    $("#server_url").fadeTo(300, 1);
                    $("#credetial_loading").hide();
                    $(".overlay-config").hide();
                    enableMgmtBtns();
                })
                .catch(function() {
                    ADManagerPlusUtils.showCustomNotification("admp_configuration_status_message", "error", "Cannot connect to ADMP. Possible reasons could be no network connection or stopping ADManager Plus service.", 5000);
                    $("#credentials").fadeTo(300, 1);
                    $("#server_url").fadeTo(300, 1);
                    $("#credetial_loading").hide();
                    $(".overlay-config").hide();
                    enableMgmtBtns();
                });			
            }
        })
        .catch(()=>{
            // do nothing
        });
    }
}

function defaultMappingConfig(dataObj) {
    return new Promise((resolve,reject)=>{
        ADManagerPlusUtils.getLoggedInZendeskUser()
        .then((data)=> {
            var admpTechnicianWithDomain = (dataObj.admpConfiguration.domainFlatName) + "\\" + (dataObj.admpConfiguration.userName);
            var admpTechnicianRole = (ADManagerPlusUtils.getAdmpTechnicianObj(dataObj.allAdmpTechnicianDetails, admpTechnicianWithDomain)).ADMP_ROLE_NAME.valueStr;
            var zendeskUserId = (data.user.id).toString();
            var zendeskUserName = data.user.name;
            var zendeskUserEmail = data.user.email;
            var authToken = dataObj.admpConfiguration.authToken;

            var admpZendeskMapping = {};
            if(dataObj.hasOwnProperty("admpZendeskMapping")) {
                admpZendeskMapping = dataObj.admpZendeskMapping;
            }
            admpZendeskMapping[zendeskUserId] =  {
                "admpTechnician": admpTechnicianWithDomain,
                "admpTechnicianRole": admpTechnicianRole,
                "zendeskUserId": zendeskUserId,
                "zendeskUserName": zendeskUserName,
                "zendeskUserEmail": zendeskUserEmail,
                "authToken": authToken,
            };
            
            var settings = {
                "admpZendeskMapping": JSON.stringify(admpZendeskMapping),
            };

            return ADManagerPlusUtils.updateSettings(settings);
        })
        .then(()=> {
            // console.log("Default Mapping Successful.");
            resolve();
        })
        .catch(()=> {
            // console.log("Default Mapping Failed.");
            reject();
        })
    });
}

function disableMgmtBtns(){
    $(".btn-gray").prop('disabled', true);
    $(".btn-green").prop('disabled', true);
    $(".btn-gray").fadeTo(300, 0.5);
    $(".btn-green").fadeTo(300, 0.5);
}

function enableMgmtBtns(){
    $(".btn-gray").prop('disabled', false);
    $(".btn-green").prop('disabled', false);
    $(".btn-gray").fadeTo(300, 1);
    $(".btn-green").fadeTo(300, 1);
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
            if(serverUrl.indexOf("http") == -1 && serverUrl.indexOf("https") == -1) {
				$("div.errorMsg").text('Invalid Server URL. Specify complete server URL with the protocol. (Ex: https://admanagerplus:8080');
				$(".errorMsg").show();
            }
            else {
				$("div.errorMsg").text('Invalid Server URL');
				$(".errorMsg").show();
            }
			return false;
        } else if (serverUrl.indexOf("https") == -1) {
			$("div.errorMsg").text("Please enable SSL(HTTPS) in ADManager Plus service");
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

function updateDomainName(element) {
	$(element).closest(".admp-dropdown-container").find("label").text(element.text);
}

function isAdmpTechnicianAlreadyMapped(admpZendeskMapping, admpTechnicianWithDomain) {
    var zendeskUserId = (loggedInZendeskUserData.id).toString();
    if(isServerUrlChanged) {
        return false;
    } else if(admpZendeskMapping.hasOwnProperty(zendeskUserId) && (admpZendeskMapping[zendeskUserId].admpTechnician == admpTechnicianWithDomain)) {
        return false;
    } else {
        var admpTechniciansMappedList = ADManagerPlusUtils.getAdmpTechniciansMappedList(admpZendeskMapping);
        return admpTechniciansMappedList.includes(admpTechnicianWithDomain);
    }
}

function enterKeyEventListenersConfig(event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        var inputFieldId = event.target.id;
        if(inputFieldId == "serverURL") {
            updateServerURL();
        } else if(inputFieldId == "admanagerUserName" || inputFieldId == "admanagerPassword") {
            updateAdminCredentials();
        }
    }
}
//ignorei18n_end
