//ignorei18n_start

var admanagerServerURL = '';
var admanagerAuthToken = '';
var admanagerDomainList = '';
var domainVsTemplateList = '';

function getStorageData() {
    // console.log("admp-create-user.js");
    return new Promise((resolve,reject)=>{
        ADManagerPlusUtils.getSettings()
        .then((data)=> {
            var admpConfiguration = JSON.parse(data.admpConfiguration);
            var admpZendeskMapping = JSON.parse(data.admpZendeskMapping);
            var zendeskUserId = ADManagerPlusUtils.getParamValuesByName("zendeskUserId");
            admanagerServerURL = admpConfiguration.admpServerUrl;
            admanagerAuthToken = admpZendeskMapping[zendeskUserId].authToken;
            admanagerDomainList = JSON.parse(data.admpDomainList);
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
    $("#content").animate({top: '50px'}, 150, function() {
        // ADManagerPlusUtils.showCustomNotification("admp_mgmt_modal_status_message", "error", message);
        $(".popup-error.accord").fadeTo(150, 1);
        $(".popup-error.accord").find("p").empty().append('<span></span> ' + message);
    });
    $("#content").fadeTo(150, 0.5);
    $("#overlay").show();
    $("#overlay").animate({top: '50px'}, 150);
    $(".btn-green.admp-update-button").prop('disabled', true);
    $(".btn-green.admp-update-button").fadeTo(150, 0.5);
}

$(document).ready(function() {
    showLoadingDiv();
    getStorageData()
    .then(()=> {
        var postData = 'AuthToken=' + encodeURIComponent(admanagerAuthToken);
            postData += '&FILL_RESPONSE_WITH=' + encodeURIComponent("USER_CREATION_TEMPLATES");

        var getTemplates = {
            url: admanagerServerURL+'/RestAPI/GetAuthInfo?'+ postData,
            type: 'POST',
            cors: true,
        };
        client.request(getTemplates)
        .then(function(data) {
            data = ADManagerErrorHandler.handle(data);
            if(data.isSuccess) {
                var authObj = data.response.AdmpAuthObject;
                authObj = JSON.parse(authObj);
                domainVsTemplateList = authObj.USER_CREATION_TEMPLATES;
                
                if(admanagerDomainList != null) {
                    var html = '<ul>';
                    for(var i=0; i<admanagerDomainList.length; i++)
                    {
                        html += '<li><a onclick="updateDomain(this);">'+admanagerDomainList[i].DOMAIN_NAME+'</a></li>';
                    }
                    html += '</ul>';
                    $("#domainList").html(html);
                    var domainName =admanagerDomainList[0].DOMAIN_NAME;
                    $("#domainList").closest(".admp-dropdown-container").find("label").text(domainName);
                    updateTemplateList(domainName);
                }
                hideLoadingDiv();
            }
            else {
                hideLoadingDiv();
                hideStatusDiv();
                var topMargin = getTopMargin(data.response);
                $("#content").animate({top: topMargin}, 150, function() {
                    // ADManagerPlusUtils.showCustomNotification("admp_mgmt_modal_status_message", "error", data.response);
                    $(".popup-error.accord").fadeTo(150, 1);
                    $(".popup-error.accord").find("p").empty().append('<span></span> '+ data.response);							
                });
                $("#content").animate({scrollTop: 0}, 150);
            }
        })
        .catch(function() {
            hideLoadingDiv();
            cannotPerformAction("Cannot connect to ADManager Plus. Possible reasons could be no network connection or stopping ADManager Plus service.");
        });
    })
    .catch((error)=> {
        hideLoadingDiv();
        cannotPerformAction(error);
    });

    $("body").click(function(event) {
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

    $('#firstName, #lastName').focus(function(){$("#firstNameError").hide();});



});

function updateTemplateList(selectedDomain) {
    var templateList = domainVsTemplateList[selectedDomain];
    if(templateList != null)
    {
        var templateName = '';
        var html = '<ul>';
        for(var i=0; i<templateList.length;i++)
        {
            html += '<li><a onclick="updateTemplateName(this);">'+templateList[i].TEMPLATE_DISPLAY_NAME+'</a></li>';
            if(templateName == '')
                templateName = templateList[i].TEMPLATE_DISPLAY_NAME;
        }
        html += '</ul>';
        $("#templateList").html(html);
        $("#templateList").closest(".admp-dropdown-container").find("label").text(trimToLength(templateName, 38));
        $("#templateList").closest(".admp-dropdown-container").find("#selectedTemplate").val(templateName);
    }
}

function updateTemplateName(element) {
    $(element).closest(".admp-dropdown-container").find("label").text(trimToLength(element.text, 38));
    $(element).closest(".admp-dropdown-container").find("#selectedTemplate").val(element.text);				
}

function updateDomain(element) {
    $(element).closest(".admp-dropdown-container").find("label").text(element.text);
    updateTemplateList(element.text);
}

function createUser() {
    var selectedDomain = $("#domainList").closest(".admp-dropdown-container").find("label").text();
    var selectedTemplate = getSelectedTemplateName();
    var firstName = $("#firstName").val();
    var lastName = $("#lastName").val();
    var password = $("#password").val();
    var employeeId = $("#empId").val();
    var department = $("#department").val();
    var title = $("#title").val();
    var mobileNumber = $("#mobileNumber").val();
    var telephoneNumber = $("#telephoneNumber").val();
    
    if(!validateCreateUserInputFields(selectedDomain, selectedTemplate, firstName, lastName, password, employeeId, department, title, mobileNumber, telephoneNumber)) {
        return;
    }
    
    showLoadingDiv();
    hideStatusDiv();

    var inputDetails = [];
    var userDetail = {};
    userDetail.templateName = selectedTemplate;
    if(firstName != '') {
        userDetail.givenName = firstName;
    }
    if(lastName != '') {
        userDetail.sn = lastName;
    }
    if(password != '') {
        userDetail.password = password;
    }
    if(employeeId != '') {
        userDetail.employeeID = employeeId;
    }
    if(department != '') {
        userDetail.department = department;
    }
    if(title != '') {
        userDetail.title = title;
    }
    if(mobileNumber != '') {
        userDetail.mobile = mobileNumber;
    }
    if(telephoneNumber != '') {
        userDetail.telephoneNumber = telephoneNumber;
    }
    
    inputDetails.push(userDetail);

    var postData = 'inputFormat=' + encodeURIComponent(JSON.stringify(inputDetails));
        postData += '&AuthToken=' + encodeURIComponent(admanagerAuthToken);
        postData += '&domainName=' + encodeURIComponent(selectedDomain);
        postData += '&templateCategoryId=' + encodeURIComponent("5");
        postData += '&PRODUCT_NAME=' + encodeURIComponent("Zendesk");
        postData += '&additionalData=' + encodeURIComponent(constructAdditionalInput());

    var createUserPost = {
        url: admanagerServerURL+'/RestAPI/CreateUser?' + postData,
        type: 'POST',
        cors: true,
    };

    client.request(createUserPost)
    .then(function(data) {
        data = ADManagerErrorHandler.handle(data);
        if(data.isSuccess) {
            clearAllFields();
            $("#content").animate({top: '50px'}, 150, function() {
                // ADManagerPlusUtils.showCustomNotification("admp_mgmt_modal_status_message", "success", data.response[0].statusMessage.replace(/&amp;/g, "&")+'\n Logon Name : '+data.response[0].["SAM Account Name"]);
                $(".popup-success.accord").fadeTo(150, 1);
                $(".popup-success.accord").find("p").empty().append('<span></span> '+data.response[0].statusMessage.replace(/&amp;/g, "&")+'\n Logon Name : '+data.response[0]["SAM Account Name"]);							
            });
            $("#content").animate({scrollTop: 0}, 150);
        }
        else {
            var topMargin = getTopMargin(data.response);
            $("#content").animate({top: topMargin}, 150, function() {
                // ADManagerPlusUtils.showCustomNotification("admp_mgmt_modal_status_message", "error", data.response);
                $(".popup-error.accord").fadeTo(150, 1);
                $(".popup-error.accord").find("p").empty().append('<span></span> '+data.response);						
            });
            $("#content").animate({scrollTop: 0}, 150);
        }
        hideLoadingDiv();
    })
    .catch(function(error) {
        hideLoadingDiv();
        var topMargin = getTopMargin(data.response);
        $("#content").animate({top: topMargin}, 150, function() {
            // ADManagerPlusUtils.showCustomNotification("admp_mgmt_modal_status_message", "error", data.response);
            $(".popup-error.accord").fadeTo(150, 1);
            $(".popup-error.accord").find("p").empty().append('<span></span> '+ data.response);						
        });
        $("#content").animate({scrollTop: 0}, 150);
    });
}

function hideStatusDiv() {
    $(".popup-error.accord").fadeTo(150, 0);
    $(".popup-success.accord").fadeTo(150, 0);
    $("#content").animate({top: '20px'});
    $("#overlay").animate({top: '20px'});
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

function clearAllFields() {
    $("#firstName").val('');
    $("#lastName").val('');
    $("#password").val('');
    $("#empId").val('');
    $("#department").val('');
    $("#title").val('');
    $("#mobileNumber").val('');
    $("#telephoneNumber").val('');
}

function cancel() {
    client.invoke('destroy');
}

function getSelectedTemplateName() {
    var selectedDomain = $("#domainList").closest(".admp-dropdown-container").find("label").text();
    var selectedTemplate = $("#templateList").closest(".admp-dropdown-container").find("#selectedTemplate").val();
    var templateList = domainVsTemplateList[selectedDomain];
    if(templateList != null)
    {
        for(var i=0; i<templateList.length;i++)
        {
            if(templateList[i].TEMPLATE_DISPLAY_NAME == selectedTemplate)
                return templateList[i].TEMPLATE_NAME;
        }
    }
    return selectedTemplate;
}

function trimToLength(string, limit) {
    return (string.length > limit) ? (string.substring(0, limit-3) + '...' ) : string;
}

function getTopMargin(string) {
    if(string.length < 125)
        return '50px';
    if(string.length < 250)
        return '63px';
    else
        return '75px';
}

// function validateInput() {
//     var firstName = $("#firstName").val();
//     var lastName = $("#lastName").val();
//     var isValid = true;
//     if(firstName == '' && lastName == '')
//     {
//         $("#firstNameError").find('label').text('Username cannot be empty!');
//         isValid = false;
//     }
//     else if(firstName.length >250)
//     {
//         $("#firstNameError").find('label').text('Username field exceeds the maximum length!');
//         isValid = false;
//     }
//     else if(lastName.length >250)
//     {
//         $("#firstNameError").find('label').text('Username field exceeds the maximum length!');
//         isValid = false;
//     }
//     else if((firstName + lastName).length >200)
//     {
//         $("#firstNameError").find('label').text('Username field exceeds the maximum length!');
//         isValid = false;
//     }
    
//     if(!isValid)
//     {
//         var firstNameError = $('#firstNameError').offset().top;
//         $("#firstNameError").show();
//         $("#content").animate({scrollTop: firstNameError}, 150);
//     }
//     return isValid;
// }


function validateCreateUserInputFields(domainName, templateName, firstName, lastName, password, employeeID, department, title, mobileNumber, telephone) {
    if(domainName == null || domainName == "") {
        ADManagerPlusUtils.confirmBox("Alert", "<b>Domain Name</b> cannot be empty!");
		return false;
    } else if(templateName == null || templateName == "") {
        ADManagerPlusUtils.confirmBox("Alert", "<b>Template Name</b> cannot be empty!");
		return false;
	} else if(firstName == "" && lastName == "") {
        ADManagerPlusUtils.confirmBox("Alert", "<b>Username</b> cannot be empty!");
		return false;
	} else if((firstName.length+lastName.length) > 200) {
        ADManagerPlusUtils.confirmBox("Alert", "<b>Username</b> exceeds the maximum length!");
		return false;
	} else if(password !="" && password.length > 32) {
        ADManagerPlusUtils.confirmBox("Alert", "<b>Password</b> exceeds the maximum length!");
		return false;
	} else if(employeeID != "" && employeeID.length > 64) {
        ADManagerPlusUtils.confirmBox("Alert", "<b>Employee ID</b> exceeds the maximum length!");
		return false;
	} else if(department != "" && department.length > 128) {
        ADManagerPlusUtils.confirmBox("Alert", "<b>Department</b> exceeds the maximum length!");
		return false;
	} else if(title != "" && title.length > 128) {
        ADManagerPlusUtils.confirmBox("Alert", "<b>Title</b> exceeds the maximum length!");
		return false;
	} else if(mobileNumber != "" && mobileNumber.length > 64) {
        ADManagerPlusUtils.confirmBox("Alert", "<b>Mobile Number</b> exceeds the maximum length!");
		return false;
	} else if(telephone != "" && telephone.length > 64) {
        ADManagerPlusUtils.confirmBox("Alert", "<b>Telephone</b> exceeds the maximum length!");
		return false;
	}  else {
		return true;
	}
}

function constructAdditionalInput() {
    var ticket_id = ADManagerPlusUtils.getParamValuesByName('ticket_id');
    var addtionalData = {};
    addtionalData.reqId = ticket_id;
    return JSON.stringify(addtionalData);
}
//ignorei18n_end