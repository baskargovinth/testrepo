//ignorei18n_start
$(document).ready(function() {
    // console.log("admp-associate-users.js");
    showTable();
});

function showTable() {
    ADManagerPlusUtils.freezeWindow(true);
    ADManagerPlusUtils.getAllTechnicianDetails()
    .then((data)=>{
        ADManagerPlusUtils.freezeWindow(false);
        displayAssociateUsersTable(data);
    })
    .catch((error)=>{
        ADManagerPlusUtils.freezeWindow(false);
        var jsonObj = {};
		jsonObj.isDataAvailable = "false";
        displayAssociateUsersTable(jsonObj);
        ADManagerPlusUtils.showCustomNotification("admp_configuration_status_message", "error", error.message, 5000);
    });
}

function displayAssociateUsersTable(allTechnicianDetails) {
    ADManagerPlusUtils.freezeWindow(true);
	$(".associate-users-table-body").empty();
    ADManagerPlusUtils.getSettings()
    .then((data)=> {
        ADManagerPlusUtils.freezeWindow(false);
        var admpZendeskMapping = JSON.parse(data.admpZendeskMapping);
        for(var key in admpZendeskMapping) {
            var details = {};
            if(allTechnicianDetails.isDataAvailable == "false") {
                details.FULL_NAME = (admpZendeskMapping[key].admpTechnician).split("\\")[1];
                details.DOMAINNAME = (admpZendeskMapping[key].admpTechnician).split("\\")[0];
                details.ADMP_ROLE_NAME = {};
                details.ADMP_ROLE_NAME.valueStr = admpZendeskMapping[key].admpTechnicianRole;
            }
            else {
                details = ADManagerPlusUtils.getAdmpTechnicianObj(allTechnicianDetails, (admpZendeskMapping[key].admpTechnician));
            }
            if(details != null) {
                var row="";
                row+="<tr>";
                row+="<td>"+ ADManagerPlusUtils.escapeHtml(details.FULL_NAME) +"</td>";
                row+="<td>"+ ADManagerPlusUtils.escapeHtml(details.DOMAINNAME)+"</td>";
                row+="<td>"+ ADManagerPlusUtils.escapeHtml(details.ADMP_ROLE_NAME.valueStr)+"</td>";
                row+="<td>"+ ADManagerPlusUtils.escapeHtml(admpZendeskMapping[key].zendeskUserName)+"</td>";
                row+="<td><a onclick=\"openAssociateEditModal('"+key+"');\">Edit</a>&nbsp&nbsp<a onclick=\"openDisassociateDialog('"+key+"',"+false+");\">Disassociate</a></td>";
                row+="</tr>";
                $(".associate-users-table-body").append(row);
            } else {
                var row="";
                row+="<tr class='deleted-technician-row' title='Action needed: This ADMP technician has been deleted in ADManager Plus.'>";
                row+="<td>"+ ADManagerPlusUtils.escapeHtml((admpZendeskMapping[key].admpTechnician).split("\\")[1]) +"</td>";
                row+="<td>"+ ADManagerPlusUtils.escapeHtml((admpZendeskMapping[key].admpTechnician).split("\\")[0]) +"</td>";
                row+="<td>"+ ADManagerPlusUtils.escapeHtml(admpZendeskMapping[key].admpTechnicianRole) +"</td>";
                row+="<td>"+ ADManagerPlusUtils.escapeHtml(admpZendeskMapping[key].zendeskUserName)+"</td>";
                row+="<td><a onclick=\"openAssociateEditModalDeleted('"+key+"');\">Edit</a>&nbsp&nbsp<a onclick=\"openDisassociateDialog('"+key+"',"+true+");\">Disassociate</a></td>";
                row+="</tr>";
                $(".associate-users-table-body").append(row);
            }
        }
	})
	.catch(()=>{
        ADManagerPlusUtils.freezeWindow(false);
        ADManagerPlusUtils.showCustomNotification("admp_configuration_status_message", "error", "Unable to retrieve data from storage", 5000);
	});
}

function openAssociateUserModal() {
    var postData = 'action=' + 'new-association';
    ADManagerPlusUtils.freezeWindow(true);
    ADManagerPlusUtils.getAllTechnicianDetails()
    .then((data)=>{
        ADManagerPlusUtils.freezeWindow(false);
        client.invoke('instances.create', {
            location: 'modal',
            url: 'assets/html/modal/associate-users-modal.html?' + postData
        })
        .then(function(modalContext) {
            var modalClient = client.instance(modalContext['instances.create'][0].instanceGuid);
            modalClient.invoke('resize', { width: '600px', height: '350px'});
            modalClient.on('modal.close', function() {
                ADManagerPlusUtils.getKey("isMappingSuccess")
                .then((data)=> {
                    // console.log(data);
                    if(data == "yes") {
                        ADManagerPlusUtils.deleteKey("isMappingSuccess");
                        ADManagerPlusUtils.showCustomNotification("admp_configuration_status_message", "success", "Successfully associated.", 5000);
                        showTable(); 
                    }
                });
            });
        });
    })
    .catch((error)=>{
        ADManagerPlusUtils.freezeWindow(false);
        ADManagerPlusUtils.showCustomNotification("admp_configuration_status_message", "error", error.message, 5000);
    });
}

function openAssociateEditModal(zendeskUserId) {
    ADManagerPlusUtils.freezeWindow(true);
    var postData = 'action=' + 'edit-association';
        postData += '&zendeskUserId=' + zendeskUserId;
    ADManagerPlusUtils.getAllTechnicianDetails()
    .then((data)=>{
        ADManagerPlusUtils.freezeWindow(false);
        client.invoke('instances.create', {
            location: 'modal',
            url: 'assets/html/modal/associate-users-modal.html?' + postData
        })
        .then(function(modalContext) {
            var modalClient = client.instance(modalContext['instances.create'][0].instanceGuid);
            modalClient.invoke('resize', { width: '600px', height: '350px'});
            modalClient.on('modal.close', function() {
                ADManagerPlusUtils.getKey("isMappingSuccess")
                .then((data)=> {
                    // console.log(data);
                    if(data == "yes") {
                        ADManagerPlusUtils.deleteKey("isMappingSuccess");
                        ADManagerPlusUtils.showCustomNotification("admp_configuration_status_message", "success", "Successfully updated.", 5000);
                        showTable(); 
                    }
                });
            });
        });
                
    })
    .catch((error)=>{
        ADManagerPlusUtils.freezeWindow(false);
        ADManagerPlusUtils.showCustomNotification("admp_configuration_status_message", "error", error.message, 5000);
    });
}

function openDisassociateDialog(zendeskUserId, isDeletedInAdmp) {
    var disassociateMapping = function () {
        ADManagerPlusUtils.freezeWindow(true);
        disassociateCheck()
        .then(()=>{
            ADManagerPlusUtils.getSettings()
            .then((data)=> {
                var admpZendeskMapping = JSON.parse(data.admpZendeskMapping);
                delete admpZendeskMapping[zendeskUserId];
                // console.log(admpZendeskMapping);
        
                var settings = {
                    "admpZendeskMapping": JSON.stringify(admpZendeskMapping),
                };
                return ADManagerPlusUtils.updateSettings(settings);
            })
            .then(()=> {
                ADManagerPlusUtils.freezeWindow(false);
                ADManagerPlusUtils.showCustomNotification("admp_configuration_status_message", "success", "User association removed successfully.", 5000);
                // console.log("Disassociate User Successful.");
                showTable();
            })
            .catch(()=> {
                ADManagerPlusUtils.freezeWindow(false);
                ADManagerPlusUtils.showCustomNotification("admp_configuration_status_message", "error", "Some internal error occured.", 5000);
                // console.log("Disassociate User Failed.");
            });
        })
        .catch(()=>{
            ADManagerPlusUtils.freezeWindow(false);
            ADManagerPlusUtils.showCustomNotification("admp_configuration_status_message", "warning", "Cannot remove all the associated users. There must be atleast one.");
        });
    }
    var title = "Disassociate Mapping";
    var message = "This mapping will be deleted. Are you sure?";
    if(isDeletedInAdmp) {
        title = "Action required";
        message = "This HDT has been removed from ADMP. Do you wish to remove this mapping?";
    }
    ADManagerPlusUtils.confirmBox(title, message, disassociateMapping);
}

function disassociateCheck() {    
	return new Promise((resolve,reject)=> {
        ADManagerPlusUtils.getSettings()
        .then((data)=> {
            var admpZendeskMapping = JSON.parse(data.admpZendeskMapping);
            if(Object.keys(admpZendeskMapping).length > 1) {
                resolve();
            } else {
                reject();
            }
        })
        .catch(()=>{
            reject();
        });
	});
}
//ignorei18n_end