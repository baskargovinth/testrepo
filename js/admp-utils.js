//ignorei18n_start
var ADManagerPlusUtils = function() {
};

var globalUtilsData = {
	statusMessageCount: 0,
};

var client = ZAFClient.init();

ADManagerPlusUtils.showCustomNotification = function(id, type, message, ttl) {
	$("#"+id).empty(); // Line added to show only one status message at a time.
	var dynamicId = "status_message_" + (++(globalUtilsData.statusMessageCount));
	var typeIcon = $("<i>"); typeIcon.addClass("admp-icon");
	var display = "<span>"+ (message) +"</span>";
	var closeIcon = "<i class='admp-icon icon-close'></i>";
	var statusMessage = $("<div>"); statusMessage.addClass("alert-box"); statusMessage.attr("id", dynamicId);
	if(type == "success") {
		typeIcon.addClass("icon-success");
		statusMessage.addClass("success");
	} else if(type == "warning") {
		typeIcon.addClass("icon-warning");
		statusMessage.addClass("warning");
	} else if(type == "error") {
		typeIcon.addClass("icon-error");
		statusMessage.addClass("error");
	}

    if(id == "admp_associate_modal_status_message") {
        statusMessage.css("max-width", "100%");
        statusMessage.css("margin-bottom", "30px");
    }
    if(id == "admp_mgmt_modal_status_message") {
        statusMessage.css("max-width", "100%");
    }
    if(id == "admp_configuration_status_message") {
        statusMessage.addClass("absolute-status-message");
    }

	statusMessage.append(typeIcon, display, closeIcon);
	if(ttl != null) {
		$("#"+id).append(statusMessage);
		$("#"+dynamicId).slideDown().delay(ttl).slideUp();
	} else {
		$("#"+id).append(statusMessage);
		$("#"+dynamicId).slideDown();
	}
	$("#"+dynamicId+" .icon-close").off();
	$("#"+dynamicId+" .icon-close").on("click", function() { //Event listener to close the respective status message.
		$("#"+dynamicId).hide();
	});
}

ADManagerPlusUtils.freezeWindow = function(freeze) {
	if(freeze == true) {
		$(".overlay").show();
	}
	else {
		$(".overlay").hide();
	}
}

ADManagerPlusUtils.fetchDataFromAdmp = function(connection) {
	return new Promise((resolve,reject)=>{
		client.request(connection)
		.then(function(data) {
			// console.log(data);
			// console.log(JSON.parse(data));
			resolve(JSON.parse(data));
		})
		.catch(function(error) {
			// console.log(error);
			reject(error);
		});
	});
}

ADManagerPlusUtils.customDropdown = function(customClass) {
	var selector1=".custom-select."+customClass+" div";
	$(selector1).remove();
	var selector2="."+customClass+" select";
	$(selector2).css("display","none");
	
	var x, i, j, selElmnt, a, b, c;
    /*look for any elements with the class "custom-select":*/
    x = document.getElementsByClassName(customClass);
    for (i = 0; i < x.length; i++) {
        selElmnt = x[i].getElementsByTagName("select")[0];
        /*for each element, create a new DIV that will act as the selected item:*/
        a = document.createElement("DIV");
		a.setAttribute("class", "select-selected");
		a.setAttribute("title", selElmnt.options[selElmnt.selectedIndex].innerHTML);
        a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
        x[i].appendChild(a);
        /*for each element, create a new DIV that will contain the option list:*/
        b = document.createElement("DIV");
        b.setAttribute("class", "select-items select-hide custom-select-scroll");
        for (j = 0; j < selElmnt.length; j++) {
            /*for each option in the original select element,
            create a new DIV that will act as an option item:*/
            c = document.createElement("DIV");
            c.innerHTML = selElmnt.options[j].innerHTML;
            c.addEventListener("click", function() {
                /*when an item is clicked, update the original select box,
                and the selected item:*/
                var y, i, k, s, h;
                s = this.parentNode.parentNode.getElementsByTagName("select")[0];
                h = this.parentNode.previousSibling;
                for (i = 0; i < s.length; i++) {
                    if (s.options[i].innerHTML == this.innerHTML) {
                        s.selectedIndex = i;
                        h.innerHTML = this.innerHTML;
                        y = this.parentNode.getElementsByClassName("same-as-selected");
                        for (k = 0; k < y.length; k++) {
                            y[k].removeAttribute("class");
                        }
						this.setAttribute("class", "same-as-selected");
						$(".custom-select."+customClass+" .select-selected").attr("title", this.innerHTML);
                        break;
                    }
                }
                h.click();
            });
            b.appendChild(c);
        }
        x[i].appendChild(b);
        a.addEventListener("click", function(e) {
            /*when the select box is clicked, close any other select boxes,
            and open/close the current select box:*/
            e.stopPropagation();
            closeAllSelect(this);
            this.nextSibling.classList.toggle("select-hide");
            this.classList.toggle("select-arrow-active");
        });
    }

    function closeAllSelect(elmnt) {
        /*a function that will close all select boxes in the document,
        except the current select box:*/
        var x, y, i, arrNo = [];
        x = document.getElementsByClassName("select-items");
        y = document.getElementsByClassName("select-selected");
        for (i = 0; i < y.length; i++) {
            if (elmnt == y[i]) {
                arrNo.push(i)
            } else {
                y[i].classList.remove("select-arrow-active");
            }
        }
        for (i = 0; i < x.length; i++) {
            if (arrNo.indexOf(i)) {
                x[i].classList.add("select-hide");
            }
        }
    }
    /*if the user clicks anywhere outside the select box,
    then close all select boxes:*/
    document.addEventListener("click", closeAllSelect);
}

ADManagerPlusUtils.getSettings = function() {
    return new Promise((resolve, reject)=>{
		client.metadata()
		.then((metadata)=> {
            var getSettings = {
                url: '/api/v2/apps/installations/' + metadata.installationId + '.json',
                type: 'GET',
            };
            return client.request(getSettings);
		})
        .then((data)=>{
			resolve(data.settings);
		})
        .catch(()=>{
            reject();
        });
	});
}

ADManagerPlusUtils.updateSettings =  function(settings) {
    return new Promise((resolve, reject)=>{
        client.metadata()
        .then((metadata)=>{
            var updateSettings = {
                url: '/api/v2/apps/installations/' + metadata.installationId + '.json',
                type: 'PUT',
                dataType: 'json',
                contentType: 'application/json',
                data: JSON.stringify({settings: settings}),
            };
            return client.request(updateSettings);
        })
		.then(()=>{
			resolve();
		})
        .catch(()=>{
            reject();
        });
    });
}

ADManagerPlusUtils.getLoggedInZendeskUser = function() {
    return new Promise((resolve, reject)=>{
        var fetchSelf = {
            url: '/api/v2/users/me.json',
            type: 'GET',
        };
        client.request(fetchSelf)
        .then((data)=> {
            resolve(data);
        })
        .catch(()=> {
            reject();
        });
    });
}

ADManagerPlusUtils.getAllZendeskUsers = function() {
    return new Promise((resolve, reject)=>{
        var fetchAllZendeskUsers = {
            url: '/api/v2/users.json',
            type: 'GET',
        };
        client.request(fetchAllZendeskUsers)
        .then((data)=> {
            resolve(data);
        })
        .catch(()=> {
            reject();
        });
    });
}

ADManagerPlusUtils.getAdmpTechnicianObj = function (allTechniciansObj, admpTechnicianWithDomain) {
	if(allTechniciansObj == null || admpTechnicianWithDomain==null) {
		return null;
	}
	var length = allTechniciansObj.length;
	for(var i=0; i<length; i++) {
		if(allTechniciansObj[i].NAME==(admpTechnicianWithDomain.split("\\")[1]) && allTechniciansObj[i].DOMAINNAME==(admpTechnicianWithDomain.split("\\")[0])) {
			return(allTechniciansObj[i]);
		}
	}
	return null;
}

ADManagerPlusUtils.getZendeskUserObj = function (allZendeskUsersObj, zendeskUserId) {
	if(allZendeskUsersObj == null || zendeskUserId == null) {
		return null;
	}
	var length = allZendeskUsersObj.users.length;
	for(var i=0; i<length; i++) {
		if((allZendeskUsersObj.users[i].id).toString() == (zendeskUserId)) {
			return(allZendeskUsersObj.users[i]);
		}
	}
	return null;
}

ADManagerPlusUtils.setKey = function(key, val) {
    return new Promise((resolve)=>{
        client.metadata()
        .then((metadata)=> {
            var returnValue = localStorage.setItem(metadata.installationId + ":" + key, val);
            resolve(returnValue);
        });
    });
}

ADManagerPlusUtils.getKey = function(key) {
    return new Promise((resolve)=>{
        client.metadata()
        .then((metadata)=> {
            var returnValue = localStorage.getItem(metadata.installationId + ":" + key);
            resolve(returnValue);
        });
    });
}

ADManagerPlusUtils.deleteKey = function(key) {
    return new Promise((resolve)=>{
        client.metadata()
        .then((metadata)=> {
            var returnValue = localStorage.removeItem(metadata.installationId + ":" + key);
            resolve(returnValue);
        });
    });
}

ADManagerPlusUtils.getAllTechnicianDetails = function() {
	return new Promise((resolve,reject)=> {
        var errObj = {};
        ADManagerPlusUtils.getSettings()
        .then((data)=>{
            var admpConfiguration = JSON.parse(data.admpConfiguration);
            var admpServerUrl = admpConfiguration.admpServerUrl;
            var authToken = admpConfiguration.authToken;
            var postData = "AuthToken=" + encodeURIComponent(authToken);
            var connection = {
                url: admpServerUrl + "/RestAPI/GetAllTechnicianDetails?" + postData,
                type: 'GET',
                cors: true,
            };
            return ADManagerPlusUtils.fetchDataFromAdmp(connection) 
        })
        .then((data)=> {
            if(data.hasOwnProperty("SEVERITY") && data.SEVERITY == "SEVERE") {
				errObj.message = data.STATUS_MESSAGE;
				reject(errObj);
			} else {
				resolve(data);
			}
        })
        .catch(()=> {
            errObj.message = "Unable to get data from ADManager Plus. Possible reason could be stopping ADManager Plus service.";
			reject(errObj);
        });
	});
}

ADManagerPlusUtils.escapeHtml = function(str) {
	return String(str).replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
		return '&#'+i.charCodeAt(0)+';';
	});
}


ADManagerPlusUtils.confirmBox = function(title, message, callback) {
	var html = '<div class="admp-popup" style="display:none;">';
	html += '<div class="admp-modal">';
	html += '<div class="admp-modal-content">';
	html += '<div class="admp-modal-header">';
	html += '<a class="admp-close"> <span>&times;</span> </a>';
	html += '<h4 class="admp-modal-title">'+title+'</h4>';
	html += '</div>';
	html += '<div class="admp-modal-body">';
	html += '<div class="alert-div"><i class="alert_icon"></i><span>'+message+'</span></div>';
	html += '</div>';
	html += '<div class="admp-modal-footer">';
	if(callback) {  //Confirm Box
		html += '<input type="button" value="Yes" class="btn-green" style="margin-right:10px;" id="confirm_ok">';
		html += '<input type="button" value="No" class="btn-gray" id="confirm_cancel">';
	} else {  //Alert Box
		html += '<input type="button" value="OK" class="btn-green" style="margin-right:10px;" id="confirm_ok">';
	}
	html += '</div>';		
	html += '</div>';
	html += '</div>';
	html += '</div>';
	
	$("#admp-modal").html(html);

	$(".admp-popup").show();

	$("#confirm_ok").off("click");
	$("#confirm_ok").on("click", function() {
		$(".admp-popup").hide();
		if(callback) {
            callback();
        }
	});

    $("#confirm_cancel").off("click");
	$("#confirm_cancel").on("click", function() {
		$(".admp-popup").hide();
	});

    $(".admp-close").off("click");
	$(".admp-close").on("click", function() {
		$(".admp-popup").toggle();
	});
}

ADManagerPlusUtils.getAdmpTechniciansMappedList = function(admpZendeskMapping) {
    var admpTechniciansMappedList = [];
    if(Object.keys(admpZendeskMapping).length > 0) {
        for(var key in admpZendeskMapping) {
            admpTechniciansMappedList.push(admpZendeskMapping[key].admpTechnician);
        }
    }
    return admpTechniciansMappedList;
}

ADManagerPlusUtils.getZendeskUsersMappedList = function(admpZendeskMapping) {
    var zendeskUsersMappedList = [];
    if(Object.keys(admpZendeskMapping).length > 0) {
        for(var key in admpZendeskMapping) {
            zendeskUsersMappedList.push(admpZendeskMapping[key].zendeskUserId);
        }
    }
    return zendeskUsersMappedList;
}

ADManagerPlusUtils.getParamValuesByName = function(parameter) {
    var queryString = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < queryString.length; i++) {
        var urlParam = queryString[i].split('=');
        if (urlParam[0] == parameter) {
            return urlParam[1];
        }
    }
}
//ignorei18n_start
