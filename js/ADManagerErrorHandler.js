// <!-- $Id: ADManagerErrorHandler.js baskar.govindan Exp$-->
//ignorei18n_start
var ADManagerErrorHandler = function() {
	//TODO
}

ADManagerErrorHandler.handle = function(data) {
	var resultJSON = {};
	resultJSON.isSuccess = false;
	if(data != null && data !='')
	{
		data = JSON.parse(data);
		if(data.SEVERITY != null)
		{
			resultJSON.response = data.STATUS_MESSAGE;
		}
		else if(data.ERROR_CODE != null)
		{
			resultJSON.response = ADManagerErrorHandler.getStatusMessage(data.ERROR_CODE);
		}
		else if(data[0])
		{
			var status = data[0].status;
			if(status == 'SEVERE')
			{
				resultJSON.response = data[0].statusMessage.replace(/&amp;/g, "&");
			}
			else
			{
				resultJSON.isSuccess = true;
				resultJSON.response = data;	
			}
		}
		else
		{
			resultJSON.isSuccess = true;
			resultJSON.response = data;		
		}
	}
	else
	{		
		resultJSON.response = 'Cannot connect to ADManager Plus. Possible reasons could be no network connection or stopping ADManager Plus service.';
	}
	return resultJSON;
}

ADManagerErrorHandler.getStatusMessage = function(errorCode) {
	if(errorCode == '00000003') {
		return 'Product to Product Authentication Failure';
	}
	else {
		return 'Can\'t Process the Request';
	}	
}
//ignorei18n_end