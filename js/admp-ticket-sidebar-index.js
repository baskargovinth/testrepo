//ignorei18n_start
$(document).ready(function() {
    client.on('app.activated', init);
    client.on('app.registered', init);
    client.on('app.expanded', init);
});

var globalAdmpTicketSidebarData = {
    zendeskUserId : null,
};

function init() {
    ADManagerPlusUtils.freezeWindow(true);
    $("#admp_sidebar_buttons,#admp_sidebar_message").hide();
    ADManagerPlusUtils.getLoggedInZendeskUser()
    .then((data)=> {
        globalAdmpTicketSidebarData.zendeskUserId = (data.user.id).toString();
        return ADManagerPlusUtils.getSettings();
    })
    .then((data)=> {
        try {
            var admpZendeskMapping = JSON.parse(data.admpZendeskMapping);
            if(admpZendeskMapping.hasOwnProperty(globalAdmpTicketSidebarData.zendeskUserId)) {
                ADManagerPlusUtils.freezeWindow(false);
                $("#admp_sidebar_buttons").show();
                $("#admp_sidebar_message").hide();
            } else {
                ADManagerPlusUtils.freezeWindow(false);
                zendeskUserNotMapped();
            }
        } catch(err) {
            ADManagerPlusUtils.freezeWindow(false);
            zendeskUserNotMapped();
        }
    })
    .catch(()=> {
        ADManagerPlusUtils.freezeWindow(false);
        zendeskUserNotMapped();
    });
}

function zendeskUserNotMapped() {
    $("#admp_sidebar_buttons").hide();
    $("#admp_sidebar_message").show().text("You are not authorized to perform Active Directory user management actions. Please contact your system administrator.");
}

function openModal(id) {
    client.get('ticket.id').then(function(data) {
        var ticket_id = data["ticket.id"];
        var url = null;
        var postData = 'ticket_id=' + ticket_id;
            postData += '&zendeskUserId=' + globalAdmpTicketSidebarData.zendeskUserId;
        switch(parseInt(id)) {
            case 1:
                    url = 'assets/html/management/create_user.html?';
                    break;
            case 2:
                    url = 'assets/html/management/delete_user.html?';
                    break;
            case 3:  
                    url = 'assets/html/management/disable_user.html?';
                    break;
            case 4:
                    url = 'assets/html/management/enable_user.html?';
                    break;
            case 5:
                    url = 'assets/html/management/reset_password.html?';
                    break;
            case 6:
                    url = 'assets/html/management/unlock_user.html?';
                    break;
        }
        client.invoke('instances.create', {
            location: 'modal',
            url: url + postData
        }).then(function(data) {
            var instanceGuid = data['instances.create'][0].instanceGuid;
            var modalClient = client.instance(instanceGuid);
            modalClient.invoke('resize', { width: '900px', height: '350px'});
        });
    });
}
//ignorei18n_end
