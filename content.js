// attach to initial iFrame load
var el = document.getElementsByClassName("gameframe")[0];

// wait until the game in iFrame loads, then continue
function waitForElement(selector) {
  return new Promise(function(resolve, reject) {
    var element = document.getElementsByClassName("gameframe")[0].contentWindow.document.querySelector(selector);

    if(element) {
      resolve(element);
      return;
    }

    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        var nodes = Array.from(mutation.addedNodes);
        for(var node of nodes) {
          if(node.matches && node.matches(selector)) {
            resolve(node);
            return;
          }
        };
      });
    });

    observer.observe(document.getElementsByClassName("gameframe")[0].contentWindow.document, { childList: true, subtree: true });
  });
}

// script configuration
function toggleScript(x) {
	obj = {[x.id] : x.checked};
	chrome.storage.local.set(obj, function (result) { console.log(obj); });
}

// search bar by Raamyy and xenon
function createSearch(){
	var gameframe = document.getElementsByClassName("gameframe")[0];
	var dialog = gameframe.contentDocument.getElementsByClassName("dialog")[0];
	var refreshButton = el.contentWindow.document.querySelector('button[data-hook="refresh"]');
	
	var joinButtonObserver = new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				if (!refreshButton.disabled) {
					console.log("Room list refreshed");
					searchForRoom();
					}
			});
		});
	joinButtonObserver.observe(refreshButton, {attributes: true});

	var input = document.createElement('input'); 
	input.type = "search"; 
	input.id = "searchRoom";
	chrome.storage.local.get({'haxRoomSearchTerm': ''}, function(result) {
		input.value = result.haxRoomSearchTerm;
		console.log(input.value);
		refreshButton.click();
	});
	input.placeholder = "Enter room name and press [ENTER] - Haxball Search Bar by Raamyy and xenon";
	input.autocomplete = "off";
	
	input.oninput = function(e) {
		if(e.keyCode === 27) { input.value = ''; }
		searchForRoom();
	};
	input.onkeyup = function(e) {
		if(e.keyCode === 27) { input.value = ''; }
		searchForRoom();
	};
	input.onchange = function(e) {
		if(e.keyCode === 27) { input.value = ''; }
		searchForRoom();
	};

	insertPos = dialog.querySelector('h1').nextElementSibling;
	insertPos.parentNode.insertBefore(input, insertPos.nextElementSibling);
}

// search bar by Raamyy and xenon
function searchForRoom() {
	var gameframe = document.getElementsByClassName("gameframe")[0];
	var dialog = gameframe.contentDocument.getElementsByClassName("dialog")[0];
	input = gameframe.contentWindow.document.getElementById('searchRoom');
    searchRoom = input.value.toLowerCase();
	chrome.storage.local.set({'haxRoomSearchTerm': input.value}, function (obj) { console.log('search term updated'); });
    var roomTable = dialog.querySelectorAll("[data-hook='list']")[0]
    var totalNumberOfPlayers = 0;
    var totalNumberOfRooms = 0;
	
    for(room of roomTable.rows) {
        var roomName = room.querySelectorAll("[data-hook='name']")[0].innerHTML;
        var roomNumPlayers = room.querySelectorAll("[data-hook='players']")[0].innerHTML.split('/')[0];
        roomName = roomName.toLowerCase();

    if(roomName.includes(searchRoom) || roomName.replace(/\s/g,'').includes(searchRoom)) {
        room.hidden = false;
        totalNumberOfPlayers += parseInt(roomNumPlayers);
        totalNumberOfRooms++;
        }
    else { room.hidden = true; }
    }
    var roomsStats = dialog.querySelectorAll("[data-hook='count']")[0];
    roomsStats.innerHTML = totalNumberOfPlayers + " players in "+totalNumberOfRooms+" filtered rooms";
}

// autoJoin by xenon
function createButton() {
	var el = document.documentElement.getElementsByClassName("gameframe")[0];
	var refreshButton = el.contentWindow.document.querySelector('button[data-hook="refresh"]');

	var autoJoinButton = document.createElement('button');
	autoJoinButton.setAttribute('data-hook', 'autoJoin');
	autoJoinButton.innerText = 'Test';
	autoJoinButton.onclick = check;

	insertPos = el.contentWindow.document.querySelector('button[data-hook="create"]');
	insertPos.parentNode.insertBefore(autoJoinButton, insertPos.nextSibling);
	autoJoinButton.innerHTML = '<i class="icon-login"></i><div>AutoJoin</div>';
}

// autoJoin by xenon
function check() {
	try { 
		var el = document.documentElement.getElementsByClassName("gameframe")[0];
		var refreshButton = el.contentWindow.document.querySelector('button[data-hook="refresh"]');
		var selectedRoom = el.contentWindow.document.querySelector('tr.selected').childNodes;
		var roomName = selectedRoom[0].innerText;
		var roomPlayers = selectedRoom[1].innerText;
		var roomDist = selectedRoom[3].innerText;
		console.log(roomName);
		console.log(roomPlayers);
		console.log(roomDist);
		
		var refreshCycle = setInterval((function() { refreshButton.click() }), 500);
		
		var autoJoinObserver = new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				if (!refreshButton.disabled) {
					console.log("Room list refreshed");
					rooms = el.contentWindow.document.querySelectorAll('tr');
					joinRoom = Array.from(rooms).filter(el => el.textContent.includes(roomName) && el.textContent.includes(roomDist))[0];
					
					players = joinRoom.childNodes[1].innerText.split("/");
					
					if (players[0] != players[1]) {
						clearInterval(refreshCycle);
						joinRoom.dispatchEvent(new Event('dblclick'));
						refreshCycle.disabled = true;
						autoJoinObserver.disconnect();
						}
					}
			});
		});
		autoJoinObserver.observe(refreshButton, {attributes: true});
	}
	catch { 
		alert('You must select a room first'); }
}

// admin kick/ban shortcuts by xenon
function createKickBanButtons(x, admin) {
	var displayCheck = (admin ? 'inline' : 'none');
	
	kickBtn = document.createElement('button');
	kickBtn.style = 'padding: 2px 3px';
	kickBtn.style.display = displayCheck;
	kickBtn.className = 'kb';
	kickBtn.onclick = function() { kickPlayer(this.parentNode, false); };
	kickBtn.innerText = 'K';

	banBtn = document.createElement('button');
	banBtn.style = 'padding: 2px 3px';
	banBtn.style.display = displayCheck;
	banBtn.style.backgroundColor = '#c13535';
	banBtn.className = 'kb';
	banBtn.onclick = function() { kickPlayer(this.parentNode, true); };
	banBtn.innerText = 'B';
	x.appendChild(kickBtn);
	x.appendChild(banBtn);
}

// admin kick/ban shortcuts by xenon
function kickPlayer(x, ban) {
	var gameframe = document.getElementsByClassName('gameframe')[0];
	var ev3 = new MouseEvent("contextmenu", {
		bubbles: true,
		cancelable: false,
		view: window,
		button: 2,
		buttons: 0
	});
	
	x.dispatchEvent(ev3);
	gameframe.contentWindow.document.querySelector('[data-hook="kick"]').click();
	if(ban) {
		gameframe.contentWindow.document.querySelector('[data-hook="ban-btn"]').click();
	}
	gameframe.contentWindow.document.querySelector('[data-hook="kick"]').click();
}

// admin kick/ban shortcuts by xenon
function checkForButtons(x, admin) {
	var displayCheck = (admin ? 'inline' : 'none');
	if(x.childNodes.length == 3) {
		createKickBanButtons(x, admin);
	}
	if(x.childNodes.length == 5) {
		kickBanButtons = x.querySelectorAll('[class="kb"]');
		kickBanButtons.forEach(y => y.style.display = displayCheck);
	}
}

// main observer to detect changes to views
moduleObserver = new MutationObserver(function(mutations) {
	candidates = mutations.flatMap(x => Array.from(x.addedNodes)).filter(x => x.className);
	if (candidates.length == 1) {
		var tempView = candidates[0].className;
		console.log(tempView);
		switch(true) {
			case tempView == "choose-nickname-view":
				console.log('choose nickname view');
				var copyright = document.createElement('p');
				copyright.innerHTML = 'Script version ' + chrome.runtime.getManifest().version;
				
				var searchConfig = document.createElement('input');
				searchConfig.type = 'checkbox';
				searchConfig.id = 'haxSearchConfig';
				searchConfig.onclick = function () { toggleScript(this); }
				
				var autoJoinConfig = document.createElement('input');
				autoJoinConfig.type = 'checkbox';
				autoJoinConfig.id = 'haxAutoJoinConfig';
				autoJoinConfig.onclick = function () { toggleScript(this); }
				
				var kickBanConfig = document.createElement('input');
				kickBanConfig.type = 'checkbox';
				kickBanConfig.id = 'haxKickBanConfig';
				kickBanConfig.onclick = function () { toggleScript(this); }
				
				chrome.storage.local.get({'haxSearchConfig' : true,
										  'haxAutoJoinConfig' : true,
										  'haxKickBanConfig' : false},
										  function(items) { 
											searchConfig.checked = items.haxSearchConfig;
											autoJoinConfig.checked = items.haxAutoJoinConfig;
											kickBanConfig.checked = items.haxKickBanConfig;
				});
				
				copyright.append(document.createElement('br'), searchConfig, 'Search Bar by Raamyy and xenon',
								 document.createElement('br'), autoJoinConfig, 'Room AutoJoin by xenon',
								 document.createElement('br'), kickBanConfig, 'Room Kick/Ban shortcuts by xenon');
				el.contentWindow.document.querySelector('h1').parentNode.appendChild(copyright);
				break;
			case tempView == "roomlist-view":
				// early exit
				chrome.storage.local.get({'haxSearchConfig' : true, 'haxAutoJoinConfig' : true},
				function (items) {
					if (items.haxSearchConfig) { createSearch(); }
					if (items.haxAutoJoinConfig) { createButton(); }
				});
				break;
			case Boolean(tempView.match(/^(room-view|player-list-item|notice)/)):
				// early exit
				chrome.storage.local.get({'haxKickBanConfig' : true}, function (items) {
					if (items.haxKickBanConfig) {
						var gameframe = document.getElementsByClassName('gameframe')[0];
						var players = gameframe.contentWindow.document.querySelectorAll('[class^=player-list-item]');
						var adminStatus = (gameframe.contentWindow.document.querySelector("[class$='view admin']") !== null);
						players.forEach(x => checkForButtons(x, adminStatus));
					}
				});
				break;
			}	
		}
});

// where it all begins for view detection
init = waitForElement("div[class$='view']");
init.then(function(value) {
	console.log('Done');
	console.log(value.parentNode);
	currentView = value.parentNode;
	moduleObserver.observe(currentView, {childList: true, subtree: true});
});
