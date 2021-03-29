//ignorei18n_start
$(document).ready(function() {
    $("body").click(function(event) {
        var $target = $(event.target);
        if($target.parent().is(".admp-inputgroup-addon") || $target.is(".admp-inputgroup-addon") || $target.parent().is(".admp-dropdown-container") || $target.is(".admp-dropdown-container")) {
            var visibility = $target.closest('.admp-dropdown-container').find(".admp-dropdown-box").css('display');
            $(".admp-dropdown-box").hide();
            if(visibility == "none") {
                $target.closest('.admp-dropdown-container').find(".admp-dropdown-box").show();
            } else {
                $target.closest('.admp-dropdown-container').find(".admp-dropdown-box").hide();
            }
        }
        else {
            $(".admp-dropdown-box").hide();
        } 
    });

    isAdmpZendeskConfigured();
});

function isAdmpZendeskConfigured() {
    ADManagerPlusUtils.freezeWindow(true);
    ADManagerPlusUtils.getSettings()
    .then((data)=> {
        if(data.admpConfiguration == null && data.admpDomainList == null && data.admpZendeskMapping == null) {
            ADManagerPlusUtils.freezeWindow(false);
            showLandingPage();
        } else {
            ADManagerPlusUtils.getLoggedInZendeskUser()
            .then((zendeskUser)=> {
                var zendeskUserId = (zendeskUser.user.id).toString();
                var admpZendeskMapping = JSON.parse(data.admpZendeskMapping);
                if(admpZendeskMapping.hasOwnProperty(zendeskUserId)) {
                    ADManagerPlusUtils.freezeWindow(false);
                    showAdmpConfigurationPage();
                } else {
                    ADManagerPlusUtils.freezeWindow(false);
                    showAdmpNotAuthorizedPage();
                }  
            })
            .catch(()=> {
                ADManagerPlusUtils.freezeWindow(false);
                showAdmpNotAuthorizedPage();
            }); 
        }
    })
    .catch(()=> {
        ADManagerPlusUtils.freezeWindow(false);
        showLandingPage();
    });
}

var globalIndexData = {
    admpServerUrl: null,
    admpDomainList: null,
}

function showLandingPage() {
    $('#landing_page').show();
	$('#server_settings_page').hide();
	$('#admp_admin_credentials_page').hide();
	$('#admp_configuration_page').hide();
}

function showAdmpNotAuthorizedPage() {
	$("#admp_not_authorized").show();
}

function mapAction(action) {
    if(action === 'downloadAdmp') {
        var url = "https://www.manageengine.com/products/ad-manager/download.html?utm_source=zendesk";
        window.open(url, "_blank");
    } else if(action === 'showLandingPage') {
        $('#server_settings_page').hide();
        $('#landing_page').show();
    }  else if(action === 'showServerSettingsPage') {
        $('#admp_admin_credentials_page').hide();
        $('#server_settings_page').show();
    	$('#server_settings_url').val("");
        $('#server_settings_url').focus();
    }
}

function showServerSettingsPage(e) {
    if(e.target.id == "integrate_now") {
        $('#landing_page').hide();
        $('#server_settings_page').show();
        $('#server_settings_url').val("");
        $('#server_settings_url').focus();
    }
}

function enterKeyEventListeners(event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        var inputFieldId = event.target.id;
        if(inputFieldId == "server_settings_url") {
            connectToAdmpUrl();
        } else if(inputFieldId == "admp_admin_credentials_username" || inputFieldId == "admp_admin_credentials_password") {
            getAdmpAdminAuthtoken();
        }
    }
}

function connectToAdmpUrl() {
	var admpServerUrl = $("#server_settings_url").val().trim();
	if(admpServerUrl == "") {
		ADManagerPlusUtils.showCustomNotification("admp_landing_page_status_message", "warning", "Enter ADManager Plus URL.", 5000);
	} else if((admpServerUrl.toLowerCase()).startsWith("https")) {
		ADManagerPlusUtils.freezeWindow(true);
        var connection = {
            url: admpServerUrl + '/MobileAPI/MobileLogin?methodToCall=domainList',
            type: 'GET',
            cors: true,
        };
        ADManagerPlusUtils.fetchDataFromAdmp(connection)
		.then((data)=>{
			ADManagerPlusUtils.freezeWindow(false);
			$('#server_settings_page').hide();
			$('#admp_admin_credentials_page').show();
			$('#admp_admin_credentials_username').focus();
			$('#admp_admin_credentials_username').val("");
			$('#admp_admin_credentials_password').val("");
			var selectDiv = $("#admp_admin_credentials_domain");
			selectDiv.empty();
			var domainList = data;
			for (var domain in domainList) {
				selectDiv.append(new Option(domainList[domain], domainList[domain]));
			}
			ADManagerPlusUtils.customDropdown("admp-admin-credentials-domain");
            ADManagerPlusUtils.showCustomNotification("admp_landing_page_status_message", "success", "Successfully connected.", 5000);
            globalIndexData.admpServerUrl = admpServerUrl;
            globalIndexData.admpDomainList = domainList;
		})
		.catch((error)=>{
			ADManagerPlusUtils.freezeWindow(false);
            ADManagerPlusUtils.showCustomNotification("admp_landing_page_status_message", "error", "<b>Sorry, unable to complete the configuration. It might be due to,</b><p>1. The server name or the port number entered being incorrect</p><p>2. ADManager Plus server not being operational</p>", 5000);
		});
	} else {
        ADManagerPlusUtils.showCustomNotification("admp_landing_page_status_message", "warning", "Please enable SSL(HTTPS) in ADManager Plus service.", 5000);
	}
}

function getAdmpAdminAuthtoken() {
    var userName = $("#admp_admin_credentials_username").val();
    var password = $("#admp_admin_credentials_password").val();
    var domainName = $("#admp_admin_credentials_domain").val();
    var productName = "Zendesk";
    if(validateAdmpAdminCredentials(userName, password, domainName)) {
        ADManagerPlusUtils.freezeWindow(true);
        var postData = 'loginName=' + encodeURIComponent(userName);
            postData += '&password=' + encodeURIComponent(password);
            postData += '&domainName=' + encodeURIComponent(domainName);
            postData += '&PRODUCT_NAME=' + encodeURIComponent(productName);
        var connection = {
            url: (globalIndexData.admpServerUrl) + "/RestAPI/APIAuthToken?" + postData,
            type: 'GET',
            cors: true,
        };
        ADManagerPlusUtils.fetchDataFromAdmp(connection)
        .then((data)=>{
            ADManagerPlusUtils.freezeWindow(false);
            if(data.LoginStatusMessage == "Success") {
                var authToken = data.AuthTicket;
                var admpConfiguration = {"admpServerUrl": (globalIndexData.admpServerUrl), "userName": data.LoginName, "domainFlatName": domainName, "authToken": authToken};
                var admpDomainList = globalIndexData.admpDomainList;
                getAllAdmpTechnicianDetails(admpConfiguration, admpDomainList);
            } else {
                ADManagerPlusUtils.showCustomNotification("admp_landing_page_status_message", "error", data.STATUS_MESSAGE, 5000);
            }
        })
        .catch(()=>{
            ADManagerPlusUtils.freezeWindow(false);
            ADManagerPlusUtils.showCustomNotification("admp_landing_page_status_message", "error", "Cannot connect. Possible reasons could be no network connection or stopping ADManager Plus service.", 5000);
        });
    }
}

function getAllAdmpTechnicianDetails(admpConfiguration, admpDomainList) {

    ADManagerPlusUtils.freezeWindow(true);
	var admpServerUrl = admpConfiguration.admpServerUrl;
	var authToken = admpConfiguration.authToken;
	var postData = "AuthToken=" + encodeURIComponent(authToken);
    var connection = {
        url: admpServerUrl + "/RestAPI/GetAllTechnicianDetails?" + postData,
        type: 'GET',
        cors: true,
    };
    ADManagerPlusUtils.fetchDataFromAdmp(connection)
    .then((data)=>{
        if(data.hasOwnProperty("SEVERITY") && data.SEVERITY == "SEVERE") {
            ADManagerPlusUtils.freezeWindow(false);
            ADManagerPlusUtils.showCustomNotification("admp_landing_page_status_message", "error", "ADManager Plus version is incompatible to perform integration. Update to the latest version of ADMP.");
        } else {
            var settings = {
                "admpConfiguration": JSON.stringify(admpConfiguration),
                "admpDomainList": JSON.stringify(admpDomainList),
            };
            var dataObj = {};
            ADManagerPlusUtils.updateSettings(settings)
            .then(function() {
                dataObj.admpConfiguration = admpConfiguration;
                dataObj.allAdmpTechnicianDetails = data;
                return defaultMapping(dataObj);
            })
            .then(()=>{
                ADManagerPlusUtils.freezeWindow(false);
                showAdmpConfigurationPage();
            })
            .catch(function() {
                ADManagerPlusUtils.freezeWindow(false);
            });   
        }
    })
    .catch(()=>{
        ADManagerPlusUtils.freezeWindow(false);
        ADManagerPlusUtils.showCustomNotification("admp_landing_page_status_message", "error", "Cannot connect to ADMP. Possible reasons could be no network connection or stopping ADManager Plus service.");
    });
}

function defaultMapping(dataObj) {
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

function showAdmpConfigurationPage() {
	$('#landing_page').hide();
	$('#server_settings_page').hide();
	$('#admp_admin_credentials_page').hide();
	$('#admp_configuration_page').show();

	addAdmpNavbarClickEvents();	
}

function addAdmpNavbarClickEvents() {
	$("#admp_configuration_tab").off("click");
	$("#admp_configuration_tab").on("click", loadAdmpConfigurationPage);

	$("#admp_associate_users_tab").off("click");
	$("#admp_associate_users_tab").on("click", loadAdmpAssociateUsersPage);

	$("#admp_support_tab").off("click");
	$("#admp_support_tab").on("click", loadAdmpSupportPage);
	
	$("#admp_configuration_tab").trigger('click');
}

function loadAdmpConfigurationPage() {
	$("#admp_load_container").load("admp-configuration.html");
	$("ul li[id]").removeClass("active");
	$(this).addClass("active");
}

function loadAdmpAssociateUsersPage() {
	$("#admp_load_container").load("admp-associate-users.html");
	$("ul li[id]").removeClass("active");
	$(this).addClass("active");
}

function loadAdmpSupportPage() {
	$("#admp_load_container").load("admp-support.html");
	$("ul li[id]").removeClass("active");
	$(this).addClass("active");
}

function validateAdmpAdminCredentials(userName, password, domainName) {
	if(userName == "") {
        ADManagerPlusUtils.showCustomNotification("admp_landing_page_status_message", "warning", "Username cannot be empty!", 5000);
		return false;
	} else if( password == "") {
        ADManagerPlusUtils.showCustomNotification("admp_landing_page_status_message", "warning", "Password cannot be empty!", 5000);
		return false;
	} else if(domainName == "" || domainName == null) {
        ADManagerPlusUtils.showCustomNotification("admp_landing_page_status_message", "warning", "Domain cannot be empty!", 5000);
		return false;
	} else {
		return true;
	}
}

function resetZendeskStorage() {
    var settings = {
        "admpConfiguration": null,
        "admpDomainList": null,
        "admpZendeskMapping": null,
    };
    ADManagerPlusUtils.updateSettings(settings)
    .then(()=> {
        // do nothing
    })
    .catch(()=> {
        // do nothing
    });
}
//ignorei18n_end