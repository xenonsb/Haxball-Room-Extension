chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(sender.tab.windowId);
	console.log(sender.tab.id);
	if(request.type === "highlight"){
		chrome.notifications.clear('highlight', function () {});
		chrome.notifications.create('highlight', request.opt, function(){})
	}
	if(request.type === "team"){
		chrome.notifications.clear('team', function () {});
		chrome.notifications.create('team', request.opt, function(){})
	}
	chrome.notifications.onClicked.addListener(function (notifId) {
			chrome.windows.update(sender.tab.windowId, {"focused": true}, function(window){ });
			chrome.tabs.update(sender.tab.id, {"active": true}, function(tab){ });
		});
});