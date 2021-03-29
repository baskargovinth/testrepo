//ignorei18n_start
$(document).ready(function() {
    ADManagerPlusUtils.freezeWindow(true);
    $(".modal-content").hide();
    getAdmpZendeskDetails()
    .then(()=> {
        var action = ADManagerPlusUtils.getParamValuesByName("action");
        // console.log(action);
        if(action == "new-association") {
            globalAssociateModalData.admpTechniciansMappedList = ADManagerPlusUtils.getAdmpTechniciansMappedList(globalAssociateModalData.admpZendeskMapping);
            globalAssociateModalData.zendeskUsersMappedList = ADManagerPlusUtils.getZendeskUsersMappedList(globalAssociateModalData.admpZendeskMapping);

            populateAdmpTechnicianDropdown();
            populateZendeskUserDropdown();
            $("#admp_authtoken").val("");
            populateAdmpTechnicianRoles();
            ADManagerPlusUtils.freezeWindow(false);
            $(".modal-content").show();
        }
        else if(action =="edit-association") {
            var zendeskUserId = ADManagerPlusUtils.getParamValuesByName("zendeskUserId");
            var toEditMapping = globalAssociateModalData.admpZendeskMapping[zendeskUserId];
            globalAssociateModalData.admpTechniciansMappedList = arrayRemove(ADManagerPlusUtils.getAdmpTechniciansMappedList(globalAssociateModalData.admpZendeskMapping), toEditMapping.admpTechnician);
            globalAssociateModalData.zendeskUsersMappedList = arrayRemove(ADManagerPlusUtils.getZendeskUsersMappedList(globalAssociateModalData.admpZendeskMapping), toEditMapping.zendeskUserId);

            populateAdmpTechnicianDropdown(true, toEditMapping.admpTechnician);
            populateZendeskUserDropdown(true, toEditMapping.zendeskUserId);
            $("#admp_authtoken").val(toEditMapping.authToken);
            populateAdmpTechnicianRoles();
            ADManagerPlusUtils.freezeWindow(false);
            $(".modal-content").show();
        }
        admpAssociateUserAddEventListeners();
    })
    .catch(()=> {
        ADManagerPlusUtils.freezeWindow(false);
        $(".modal-content").show();
        ADManagerPlusUtils.showCustomNotification("admp_associate_modal_status_message", "error", "Some internal error occured.");
    });
});

function getAdmpZendeskDetails() {
    return new Promise((resolve, reject)=> {
        ADManagerPlusUtils.getAllTechnicianDetails()
        .then((data)=>{
            globalAssociateModalData.allAdmpTechnicianDetails = data;
            return ADManagerPlusUtils.getAllZendeskUsers()
        })
        .then((data)=> {
            globalAssociateModalData.allZendeskUserDetails = data;
            return ADManagerPlusUtils.getSettings()
        })
        .then((data)=> {
            var admpConfiguration = JSON.parse(data.admpConfiguration);
            globalAssociateModalData.admpServerUrl = admpConfiguration.admpServerUrl;
            globalAssociateModalData.admpZendeskMapping = JSON.parse(data.admpZendeskMapping);
            resolve();
        })
        .catch(()=> {
            reject();
        });
    });
}

function populateAdmpTechnicianDropdown(isAssociateEdit, toEditAdmpTechnician) {
    var selectDiv = $("#admp_technician");
    selectDiv.empty();
    var allAdmpTechnicianDetails = globalAssociateModalData.allAdmpTechnicianDetails;
    for (var i = 0 ;i < allAdmpTechnicianDetails.length ; i++) {
        if(allAdmpTechnicianDetails[i]["ClassType"] == "User") { //Groups need not be displayed in the HDT List
            var admpTechnicianName = allAdmpTechnicianDetails[i]["NAME"];
            var domainName = allAdmpTechnicianDetails[i]["DOMAINNAME"];
            var admpTechnicianWithDomain = domainName + "\\" + admpTechnicianName;
            var newOption = null;
            if(isAssociateEdit != null && isAssociateEdit == true) {
                if(toEditAdmpTechnician == admpTechnicianWithDomain) newOption = new Option((admpTechnicianWithDomain), (admpTechnicianWithDomain), true, true);
                else newOption = new Option((admpTechnicianWithDomain), (admpTechnicianWithDomain), false, false);
            } else {
                if(i == 0 ) newOption = new Option((admpTechnicianWithDomain), (admpTechnicianWithDomain), true, true);
                else newOption = new Option((admpTechnicianWithDomain), (admpTechnicianWithDomain), false, false);
            }
            // selectDiv.append(newOption).trigger('change');
            selectDiv.append(newOption);
        }
    }
    ADManagerPlusUtils.customDropdown("custom-admp-technician");
}

function populateZendeskUserDropdown(isAssociateEdit, toEditZendeskUserId) {
    var selectDiv = $("#zendesk_user");
    selectDiv.empty();
    var allZendeskUserDetails = globalAssociateModalData.allZendeskUserDetails;
    for (var i = 0; i < allZendeskUserDetails.users.length; i++) {
        var zendeskUserId = (allZendeskUserDetails.users[i]["id"]).toString();
        var zendeskUserName = allZendeskUserDetails.users[i]["name"];
        // var zendeskUserEmail = allZendeskUserDetails.users[i]["email"];
        var zendeskUserRole = allZendeskUserDetails.users[i]["role"]; // roles admin, agent, end-user
        // if(zendeskUserRole != "end-user") {
            var newOption = null;
            if(isAssociateEdit != null && isAssociateEdit == true) {
                if(toEditZendeskUserId == zendeskUserId) newOption = new Option(zendeskUserName, zendeskUserId, true, true);
                else newOption = new Option(zendeskUserName, zendeskUserId, false, false);
            } else {
                if(i == 0 ) newOption = new Option(zendeskUserName, zendeskUserId, true, true);
                else newOption = new Option(zendeskUserName, zendeskUserId, false, false);
            }
            // selectDiv.append(newOption).trigger('change');
            selectDiv.append(newOption);
        // }
    }
    ADManagerPlusUtils.customDropdown("custom-zendesk-user");
}

function populateAdmpTechnicianRoles() {
	var admpTechnician = $("#admp_technician").val();	
	var data = ADManagerPlusUtils.getAdmpTechnicianObj((globalAssociateModalData.allAdmpTechnicianDetails), admpTechnician);
	$("#admp_technician_role_name").text(" "+ data.ADMP_ROLE_NAME.valueStr + " ");
	var array = data.ADMP_ROLE_NAME.values;

	var text = "";
	for(var row=0; row<array.length; row++){
		text+="<tr>";
		text+="<td>"+ADManagerPlusUtils.escapeHtml(array[row].ADMP_ROLE_NAME)+"</td>";
		text+="<td>"+ADManagerPlusUtils.escapeHtml(array[row].ADMP_DOMAIN_NAME)+"</td>";
		text+="<tr>";
	}

	$("#admp_technician_roles a").off("click");
	$(".popup").off('toggle');

	$(".load-role").empty();
	$("#admp_technician_roles a").on("click",()=>{	
		$(".load-role").html(text);
		$(".popup").toggle(200);
	});
}

function saveUserAssociationDetails() {
    var admpTechnicianWithDomain = $("#admp_technician").val();
    var zendeskUserId = $("#zendesk_user").val();
    var authToken = $("#admp_authtoken").val();
    
    // console.log(admpTechnicianWithDomain);
    // console.log(zendeskUserId);
    // console.log(authToken);

    if (admpTechnicianWithDomain == "" || admpTechnicianWithDomain == null) {
        ADManagerPlusUtils.showCustomNotification("admp_associate_modal_status_message", "warning", "Select an ADManager Plus Technician!", 5000);
    }
    else if (zendeskUserId == "" || zendeskUserId == null) {
        ADManagerPlusUtils.showCustomNotification("admp_associate_modal_status_message", "warning", "Select a Zendesk User!", 5000);
    }
    else if (authToken == "" || authToken == null) {
        ADManagerPlusUtils.showCustomNotification("admp_associate_modal_status_message", "warning", "Enter an authtoken!", 5000);
    }
    else if(isAdmpTechnicianExists(admpTechnicianWithDomain)) {
        ADManagerPlusUtils.showCustomNotification("admp_associate_modal_status_message", "error", "This ADManager Plus technician is already mapped with another Zendesk User.", 5000);
    }
    else if(isZendeskUserExists(zendeskUserId)) {
        ADManagerPlusUtils.showCustomNotification("admp_associate_modal_status_message", "error", "This Zendesk User is already mapped with another ADManager Plus technician.", 5000);
    }
    else {
        var postData = "AuthToken=" + encodeURIComponent(authToken);
        var connection = {
            url: (globalAssociateModalData.admpServerUrl) + "/RestAPI/ValidateAuthToken?" + postData,
            type: 'GET',
            cors: true,
        };
        ADManagerPlusUtils.freezeWindow(true);
        ADManagerPlusUtils.fetchDataFromAdmp(connection)
        .then((data)=> {
            if(data.status=="1" && data.statusMessage=="SUCCESS") {         
                var admpTechnicianRole = (ADManagerPlusUtils.getAdmpTechnicianObj(globalAssociateModalData.allAdmpTechnicianDetails, admpTechnicianWithDomain)).ADMP_ROLE_NAME.valueStr;
                var zendeskUserName = ADManagerPlusUtils.getZendeskUserObj(globalAssociateModalData.allZendeskUserDetails, zendeskUserId).name;
                var zendeskUserEmail = ADManagerPlusUtils.getZendeskUserObj(globalAssociateModalData.allZendeskUserDetails, zendeskUserId).email;
    
                var admpZendeskMapping = globalAssociateModalData.admpZendeskMapping;

                if(ADManagerPlusUtils.getParamValuesByName("action") == "edit-association") {
                    var oldZendeskUserId = ADManagerPlusUtils.getParamValuesByName("zendeskUserId");
                    delete admpZendeskMapping[oldZendeskUserId];
                }

                admpZendeskMapping[zendeskUserId] =  {
                    "admpTechnician": admpTechnicianWithDomain,
                    "admpTechnicianRole": admpTechnicianRole,
                    "zendeskUserId": zendeskUserId,
                    "zendeskUserName": zendeskUserName,
                    "zendeskUserEmail": zendeskUserEmail,
                    "authToken": authToken,
                };
                // console.log(admpZendeskMapping);
                var settings = {
                    "admpZendeskMapping": JSON.stringify(admpZendeskMapping),
                };
                ADManagerPlusUtils.updateSettings(settings)
                .then(()=> {
                    ADManagerPlusUtils.freezeWindow(false);
                    ADManagerPlusUtils.setKey("isMappingSuccess", "yes")
                    .then(()=>{
                        closeAssociateUserModal();
                    });
                })
                .catch(()=> {
                    ADManagerPlusUtils.freezeWindow(false);
                    ADManagerPlusUtils.showCustomNotification("admp_associate_modal_status_message","error", "User association failed.", 5000);
                });
            }
            else if(data.hasOwnProperty("SEVERITY") && data.SEVERITY == "SEVERE") {
                ADManagerPlusUtils.freezeWindow(false);
                ADManagerPlusUtils.showCustomNotification("admp_associate_modal_status_message", "error", data.STATUS_MESSAGE, 5000);
            }
        })
        .catch(()=> {
            ADManagerPlusUtils.freezeWindow(false);
            ADManagerPlusUtils.showCustomNotification("admp_associate_modal_status_message", "error", "Unable to get data from ADManager Plus. Possible reason could be stopping ADManager Plus service.", 5000);
        });
    }
}

function isAdmpTechnicianExists(admpTechnicianWithDomain) {
    return globalAssociateModalData["admpTechniciansMappedList"].includes(admpTechnicianWithDomain); 
}

function isZendeskUserExists(zendeskUserId) {
    return globalAssociateModalData["zendeskUsersMappedList"].includes(zendeskUserId);
}

function arrayRemove(arr, value) {
	return arr.filter(function(ele){return ele != value;});
}

function admpAssociateUserAddEventListeners() {
    $(".custom-select.custom-admp-technician").off("click");
	$(".custom-select.custom-admp-technician").on("click", function() {
        $("#admp_authtoken").val("");
        populateAdmpTechnicianRoles();
	});

    //This event closes the 'More Details' popup box if clicked away from it.
    $(document).mouseup(function (e) {
        var container = $(".popup-container"); 
        if(!container.is(e.target) &&  
        container.has(e.target).length === 0) { 
            $(".popup").hide(); 
        } 
    });
}

function closeAssociateUserModal() {
    client.invoke("destroy");
}

var globalAssociateModalData = {
    allAdmpTechnicianDetails: null,
    allZendeskUserDetails: null,
    admpZendeskMapping: null,
    admpServerUrl: null,
    admpTechniciansMappedList: null,
    zendeskUsersMappedList: null,
};
//ignorei18n_end