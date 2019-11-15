// attach to initial iFrame load
var el = document.getElementsByClassName("gameframe")[0];
var muteAllToggle = false;
var autoJoinObserver;
var refreshCycle;
var myNick;

// for kick/ban buttons
var dblDiv = document.createElement('div');
var dblTxt = document.createTextNode('Double click!');
dblDiv.appendChild(dblTxt);
dblDiv.style = 'visibility: hidden; position: fixed; background-color: #0004';

function copyright() {
	var copyright = document.createElement('p');
	var gitLink = document.createElement('a');
	gitLink.href = 'https://github.com/xenonsb/Haxball-Room-Extension/';
	gitLink.target = 'blank';
	gitLink.innerText = 'Haxball All-in-one Tool version ' + chrome.runtime.getManifest().version;
	copyright.append(gitLink);
	copyright.append(document.createElement('br'), 'Press the Add-on button for options', document.createElement('br'), 'By xenon, thanks to Raamyy and Pacific');
	return copyright
}

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

// search bar by Raamyy and xenon
function createSearch(){
	var gameframe = document.getElementsByClassName("gameframe")[0];
	var dialog = gameframe.contentDocument.getElementsByClassName("dialog")[0];
	var refreshButton = el.contentWindow.document.querySelector('button[data-hook="refresh"]');
	
	var joinButtonObserver = new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				if (!refreshButton.disabled) {
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
		refreshButton.click();
	});
	input.placeholder = "Term1 Term2+Term3/RoomMax - Search bar by Raamyy and xenon";
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
	
	var searchExample = document.createElement('p');
	searchExample.innerText = 'Search example: Hax Ball+pro/14 finds rooms with Hax and Ball, OR pro (max players 14)';
	
	insertPos = dialog.querySelector('h1').nextElementSibling;
	insertPos.parentNode.insertBefore(searchExample, insertPos.nextElementSibling);
	insertPos.parentNode.insertBefore(input, searchExample.nextElementSibling);
	
	
}

// search bar by Raamyy and xenon
function searchForRoom() {
	var gameframe = document.getElementsByClassName("gameframe")[0];
	var dialog = gameframe.contentDocument.getElementsByClassName("dialog")[0];
	var input = gameframe.contentWindow.document.getElementById('searchRoom');
    var searchRoom = input.value.toLowerCase();
	chrome.storage.local.set({'haxRoomSearchTerm': input.value}, function (obj) { });
    var roomTable = dialog.querySelectorAll("[data-hook='list']")[0]
    var totalNumberOfPlayers = 0;
    var totalNumberOfRooms = 0;
	
    for(room of roomTable.rows) {
        var roomName = room.querySelectorAll("[data-hook='name']")[0].innerText;
        var roomNumPlayers = room.querySelectorAll("[data-hook='players']")[0].innerText.split('/')[0];
		var roomMaxPlayers = room.querySelectorAll("[data-hook='players']")[0].innerText.split('/')[1];
        var roomName = roomName.toLowerCase();
		var rexp = /([^\/]+)?\/?(\d+)?/.exec(searchRoom)
		
		var playerTest = (typeof(rexp[2]) === 'undefined' || rexp[2] == roomMaxPlayers);
		var searchTerms = rexp[1] ? rexp[1].split('+').filter(x => x != '') : [];
		
		function myIncl(roomName, terms) {
			return terms.split(' ').every(x => roomName.includes(x));
		}
		
		if ((searchTerms.some(x => myIncl(roomName, x) || myIncl(roomName.replace(/\s/g,''), x)) || !searchTerms.length) && playerTest) {
			room.hidden = false;
			totalNumberOfPlayers += parseInt(roomNumPlayers);
			totalNumberOfRooms++;
        }
    else { room.hidden = true; }
    }
    var roomsStats = dialog.querySelectorAll("[data-hook='count']")[0];
    roomsStats.innerText = totalNumberOfPlayers + " players in "+totalNumberOfRooms+" filtered rooms";
    dialog.querySelector("[data-hook='listscroll']").scrollTo(0,0);
}

// autoJoin by xenon
function createButton() {
	var el = document.documentElement.getElementsByClassName("gameframe")[0];
	var refreshButton = el.contentWindow.document.querySelector('button[data-hook="refresh"]');

	var autoJoinButton = document.createElement('button');
	autoJoinButton.setAttribute('data-hook', 'autoJoin');
	autoJoinButton.onclick = function () { check(this); };
	
	var loginIcon = document.createElement('i');
	loginIcon.className = 'icon-login';
	autoJoinButton.appendChild(loginIcon);
	
	autoJoinDiv = document.createElement('div');
	autoJoinDiv.append('AutoJoin');
	autoJoinButton.appendChild(autoJoinDiv);

	insertPos = el.contentWindow.document.querySelector('button[data-hook="create"]');
	insertPos.parentNode.insertBefore(autoJoinButton, insertPos.nextSibling);
}

// autoJoin by xenon
function check() {
	var el = document.documentElement.getElementsByClassName("gameframe")[0];
	var autoJoinButton = el.contentWindow.document.querySelector('button[data-hook="autoJoin"]');
	var refreshButton = el.contentWindow.document.querySelector('button[data-hook="refresh"]');
	
	try { 
		var selectedRoom = el.contentWindow.document.querySelector('tr.selected').childNodes;
		var roomName = selectedRoom[0].innerText;
		var roomPlayers = selectedRoom[1].innerText;
		var roomDist = selectedRoom[3].innerText;
	
		refreshCycle = setInterval((function() { refreshButton.click() }), 500);
		
		autoJoinObserver = new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				if (!refreshButton.disabled) {
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
		autoJoinButton.lastChild.innerText = 'Joining';
	}
	
	catch {
		if (autoJoinButton.lastChild.innerText == 'AutoJoin') {
			alert('You must select a room first');
		}
		else {
			try {
				autoJoinObserver.disconnect();
				clearInterval(refreshCycle);
				autoJoinButton.lastChild.innerText = 'Autojoin';
			}
			catch { }
		}
	}
}

// admin kick/ban shortcuts by xenon
function createKickBanButtons(x, admin) {
	var displayCheck = (admin ? 'inline' : 'none');
	
	kickBtn = document.createElement('button');
	kickBtn.style = 'padding: 2px 3px';
	kickBtn.style.display = displayCheck;
	kickBtn.className = 'kb';
	kickBtn.onclick = function (event) { 
		dblDiv.style.top = (event.clientY + 20) + 'px';
		dblDiv.style.left = (event.clientX + 20) + 'px';
		dblDiv.style.visibility = 'visible'; 
		window.setTimeout(function () { dblDiv.style.visibility = 'hidden'; }, 500) }
	kickBtn.ondblclick = function() { kickPlayer(this.parentNode, false); };
	kickBtn.innerText = 'K';

	banBtn = document.createElement('button');
	banBtn.style = 'padding: 2px 3px';
	banBtn.style.display = displayCheck;
	banBtn.style.backgroundColor = '#c13535';
	banBtn.className = 'kb';
	banBtn.onclick = function (event) { 
		dblDiv.style.top = (event.clientY + 20) + 'px';
		dblDiv.style.left = (event.clientX + 20) + 'px';
		dblDiv.style.visibility = 'visible'; 
		window.setTimeout(function () { dblDiv.style.visibility = 'hidden'; }, 500) }
	banBtn.ondblclick = function() { kickPlayer(this.parentNode, true); };
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

// chat observer for mute
muted = new Set();
function mutePlayer(name) {
	if (muted.has(name)) {
		muted.delete(name);
	}
	else {
		muted.add(name);
	}
}

// toggle chat button
function toggleChatOpt() {
	var gameframe = document.documentElement.getElementsByClassName("gameframe")[0];
	if (gameframe.contentWindow.document.getElementById('toggleChat')) {
		return;
	}
	
	var bottomSec = gameframe.contentWindow.document.getElementsByClassName('bottom-section')[0];
	var statSec = gameframe.contentWindow.document.getElementsByClassName('stats-view')[0];
	var chatInput = gameframe.contentWindow.document.querySelector('[data-hook="input"]');
	var toggleChatMsg = document.createElement('div');
	toggleChatMsg.id = 'toggleChat';
	toggleChatMsg.align = 'center';
	toggleChatMsg.style = 'position: absolute; top: 10px;';

	var toggleChatBtn = document.createElement('button');
	toggleChatBtn.style = 'position: relative; padding: 2px 2px; border: 0px; border-radius: 5px; color: white; font-family: "Open Sans", sans-serif; font-weight: 700; font-size: 15px; line-height: 100%; background-color: #244967;';
	toggleChatBtn.onmouseover = function () {this.style.backgroundColor = '#2f5e85'};
	toggleChatBtn.onmouseout = function () {this.style.backgroundColor = '#244967'};

	toggleChatBtn.innerText = 'Toggle Chat';
	toggleChatMsg.appendChild(toggleChatBtn);
	toggleChatMsg.onclick = function () { 
		if (bottomSec.style.display != 'none') { 
			bottomSec.style.display = 'none'; 
			}
		else { 
			bottomSec.removeAttribute('style');
			chrome.storage.local.get({'haxTransChatConfig' : false, 'haxAlpha' : 10},
			function (items) {
				if (items.haxTransChatConfig) { 
					bottomSec.style.position = 'absolute';
					bottomSec.style.left = '0px';
					bottomSec.style.right = '0px';
					bottomSec.style.bottom = '0px';
					bottomSec.style.background = '#1A2125' + items.haxAlpha;
					statSec.style.background = 'unset';
					chatInput.style.background = '#1A2125' + items.haxAlpha;
				}
			})
		}
	}

	var toggleChatMsgPos = waitForElement('.bar-container');
	toggleChatMsgPos.then(function (pos) {
		pos.insertBefore(toggleChatMsg, pos.firstChild);
	});
}

// toggle chat kb
function toggleChatKb() {
	var gameframe = document.documentElement.getElementsByClassName("gameframe")[0];
	var bottomSec = gameframe.contentWindow.document.getElementsByClassName('bottom-section')[0];
	var statSec = gameframe.contentWindow.document.getElementsByClassName('stats-view')[0];
	var chatInput = gameframe.contentWindow.document.querySelector('[data-hook="input"]');
	var chatLog = gameframe.contentWindow.document.querySelector('[data-hook="log"]');
	gameframe.contentWindow.document.onkeydown = function (f) {
		if (f.code == 'Backquote') {
			if (bottomSec.style.display == 'none') { 
				bottomSec.removeAttribute('style');
				chrome.storage.local.get({'haxTransChatConfig' : false, 'haxAlpha' : 10},
				function (items) {
					if (items.haxTransChatConfig) { 
						bottomSec.style.position = 'absolute';
						bottomSec.style.left = '0px';
						bottomSec.style.right = '0px';
						bottomSec.style.bottom = '0px';
						bottomSec.style.background = '#1A2125' + items.haxAlpha;
						statSec.style.background = 'unset';
						chatInput.style.background = '#1A2125' + items.haxAlpha;
					}
				})
				chatLog.scrollTo(0, chatLog.scrollHeight);
			}
			else { bottomSec.style.display = 'none'; }
		}
		if (f.code == 'Tab' || f.code == 'Enter') { 
			bottomSec.removeAttribute('style');
			chrome.storage.local.get({'haxTransChatConfig' : false, 'haxAlpha' : 10},
			function (items) {
				if (items.haxTransChatConfig) { 
				bottomSec.style.position = 'absolute';
				bottomSec.style.left = '0px';
				bottomSec.style.right = '0px';
				bottomSec.style.bottom = '0px';
				bottomSec.style.background = '#1A2125' + items.haxAlpha;
				statSec.style.background = 'unset';
				chatInput.style.background = '#1A2125' + items.haxAlpha;
				}
			})
			chatLog.scrollTo(0, chatLog.scrollHeight);
			chatInput.focus(); }
		chrome.storage.local.get({'haxViewModeConfig' : false},
			function (items) {
				if (items.haxViewModeConfig) {
					if (f.key >= 5 && f.key <= 8) { changeView(f.key); }
					}
			})
		if (f.code == 'KeyR') {
			chrome.storage.local.get({'haxRecordHotkey' : false},
				function (items) { if (items.haxRecordHotkey) { record(true) }})
		}
	}
}


// linkify from stackoverflow 1500260
function linkify(text) {
    var urlRegex =/(\b(https?:\/\/|ftp:\/\/|file:\/\/|www\.)[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(urlRegex, function(url) {
		if (url.startsWith('www.')) { url = 'http://' + url; }
        return '<a href="' + url + '" target="blank">' + url + '</a>';
    });
}

// clicking for zoom
function simulateClick(item) {
  item.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true}));
  item.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}));
  item.dispatchEvent(new PointerEvent('pointerup', {bubbles: true}));
  item.dispatchEvent(new MouseEvent('mouseup', {bubbles: true}));
  item.dispatchEvent(new MouseEvent('mouseout', {bubbles: true}));
  item.dispatchEvent(new MouseEvent('click', {bubbles: true}));
  item.dispatchEvent(new Event('change', {bubbles: true}));
  return true;
}

function changeView(viewIndex) {
	if (5 <= viewIndex <= 8) {
		var gameframe = document.getElementsByClassName('gameframe')[0];
		gameframe.contentWindow.document.querySelector('[data-hook="settings"]').click();
		var viewModeToggle = waitForElement('[data-hook="viewmode"]')
		viewModeToggle.then(function (toggle) {
			toggle.selectedIndex = viewIndex;
			simulateClick(toggle);
			closeBtn = waitForElement('[data-hook="close"]');
			closeBtn.then(function (btn) { btn.click() })
		})
	}
}

function record(gameview = true) {
	var gameframe = document.getElementsByClassName('gameframe')[0];
	if (gameview) {
		gameframe.contentWindow.document.querySelector('[data-hook="menu"]').click();
		var recBtn = waitForElement('[data-hook="rec-btn"]');
		recBtn.then(function (btn) { btn.click() });
		gameframe.contentWindow.document.querySelector('[data-hook="menu"]').click();
	}
	else {
		gameframe.contentWindow.document.querySelector('[data-hook="rec-btn"]').click();
	}
}

chatObserver = new MutationObserver(function(mutations) {
	var candidates = mutations.flatMap(x => Array.from(x.addedNodes)).filter(x => x.tagName == 'P');
	var gameframe = document.documentElement.getElementsByClassName("gameframe")[0];
	var bottomSec = gameframe.contentWindow.document.getElementsByClassName('bottom-section')[0];
	var statSec = gameframe.contentWindow.document.getElementsByClassName('stats-view')[0];
	var chatInput = gameframe.contentWindow.document.querySelector('[data-hook="input"]');
	var chatLog = gameframe.contentWindow.document.querySelector('[data-hook="log"]');
	
	chatCheck = function(chatLine) {
		if ([...muted].filter(x => chatLine.innerText.startsWith(x + ': ')).length > 0) {
			chatLine.hidden = true;
		}
		else if (muteAllToggle && muteExceptions.filter(x => chatLine.innerText.startsWith(x + ': ')) == 0 && chatLine.className != 'notice') {
			chatLine.hidden = true;
		}
		
		if (chatLine.innerText.startsWith('Game start')) {
			toggleChatOpt();
			toggleChatKb();
		}
		
		chrome.storage.local.get({'haxTransChatConfig' : false},
			function (items) {
				if (items.haxTransChatConfig) { 
					if (chatLine.innerText.startsWith('Game start')) {	
						chatFormat(bottomSec,statSec,chatInput,'absolute');
					}
					else if (chatLine.innerText.startsWith('Game stop')) {	
						bottomSec.removeAttribute('style');
					}
				}
		});
		
		chatLine.innerHTML = linkify(chatLine.innerHTML);
	}
	candidates.forEach(x => chatCheck(x));
})

// transparent chat by P a c i f i c and xenon
chatFormat = function(btm, stats, ipt, posn) {
	chrome.storage.local.get({'haxAlpha' : 10},
	function (items) {
		btm.style.position = posn;
		btm.style.left = '0px';
		btm.style.right = '0px';
		btm.style.bottom = '0px';
		btm.style.background = '#1A2125' + items.haxAlpha;
		stats.style.background = 'unset';
		ipt.style.background = '#1A2125' + items.haxAlpha;
	});
}

// pretty settings
function configElem(id, def = false, desc) {
	var newConfig = document.createElement('div');
	newConfig.className = 'toggle';
	newConfig.id = id;
	var obj = {[id] : def};
	
	var icon = document.createElement('i');
	chrome.storage.local.get(obj, function(items) {
		icon.className = (items[id] ? 'icon-ok' : 'icon-cancel');
	});
	
	newConfig.onclick = function() {
		var setStatus = !(icon.className == 'icon-ok');
		var obj = {[id] : setStatus};
		chrome.storage.local.set(obj, function (result) {} );
		icon.className = setStatus ? 'icon-ok' : 'icon-cancel';
		if (id === 'haxTransChatConfig') {
			var gameframe = document.getElementsByClassName('gameframe')[0];
			var bottomSec = gameframe.contentWindow.document.getElementsByClassName('bottom-section')[0];
			var statSec = gameframe.contentWindow.document.getElementsByClassName('stats-view')[0];
			var chatInput = gameframe.contentWindow.document.querySelector('[data-hook="input"]');
			try {
				if (setStatus) { 
					chatFormat(bottomSec,statSec,chatInput,'absolute');
				}
				else {
					bottomSec.removeAttribute('style');
				}
			}
			catch(e) { }
		}
		if (id === 'haxShortcutConfig') {
			var gameframe = document.getElementsByClassName('gameframe')[0];
			var chatInput = gameframe.contentWindow.document.querySelector('[data-hook="input"]');
			try {
				if (setStatus) {
					chatInput.addEventListener("keypress", chatListener);
				}
				else {
					chatInput.removeEventListener("keypress", chatListener);
				}
			}
			catch(e) { }
		}
		if (id === 'haxKickBanConfig') {
			var gameframe = document.getElementsByClassName('gameframe')[0];
			try {
				var players = gameframe.contentWindow.document.querySelectorAll('[class^=player-list-item]');
				var adminStatus = (gameframe.contentWindow.document.querySelector("[class$='view admin']") !== null);
				if (setStatus) {
					players.forEach(x => checkForButtons(x, adminStatus));
				}
				else {
					players.forEach(x => checkForButtons(x, false));
				}
			}
			catch(e) { }
		}
		if (id === 'haxTimerConfig') {
			var gameframe = document.getElementsByClassName('gameframe')[0];
			try {
				if (setStatus) {
					timer.style.display = 'unset';
				}
				else {
					timer.style.display = 'none';
				}
			}
			catch(e) { }
		}
	}
	
	newConfig.appendChild(icon);
	newConfig.append(desc);
	return newConfig
}

function addonSettingsPopup(currentView) {
	var addonSettings = document.createElement('div');
	addonSettings.className = 'dialog settings-view';
	addonSettings.style.display = 'none';
	addonSettings.style.maxHeight = '550px';

	var addonSettingsHeader = document.createElement('h1');
	addonSettingsHeader.innerText = 'Add-on Settings';
	addonSettings.appendChild(addonSettingsHeader);

	var addonSettingsClose = document.createElement('button')
	addonSettingsClose.innerText = 'Close';
	addonSettings.appendChild(addonSettingsClose);
	
	var addonSettingsOpen = document.createElement('button');
	addonSettingsOpen.innerText = 'Add-on';
	addonSettingsOpen.setAttribute('data-hook','add-on');
	
	// thing for transparency selection
	var sliderDiv = document.createElement('div');
	sliderDiv.align = 'center';
	
	var sliderOutput = document.createElement('output');
	sliderOutput.id = 'sliderAmt';
	
	var sliderInput = document.createElement('input');
	sliderInput.type = 'range';
	sliderInput.id = 'myTrans';
	sliderInput.min = 10;
	sliderInput.max = 90;
	sliderInput.step = 10;
	
	chrome.storage.local.get({'haxAlpha' : 10},
		function (items) { sliderInput.value = items.haxAlpha; });
	
	sliderOutput.value = sliderInput.value + '%';
	sliderInput.oninput = function () { 
		sliderOutput.value = sliderInput.value + "%";
		chrome.storage.local.set({'haxAlpha': sliderInput.value}, function (obj) { })
		try {
			var gameframe = document.getElementsByClassName('gameframe')[0];
			var bottomSec = gameframe.contentWindow.document.getElementsByClassName('bottom-section')[0];
			var statSec = gameframe.contentWindow.document.getElementsByClassName('stats-view')[0];
			var chatInput = gameframe.contentWindow.document.querySelector('[data-hook="input"]');
		chrome.storage.local.get({'haxTransChatConfig' : false},
			function (items) {
				if (items.haxTransChatConfig) { 
					chatFormat(bottomSec,statSec,chatInput,'absolute');
				}
			});
		}
		catch(e) { }
		};
	
	sliderDiv.append(sliderInput);
	sliderDiv.append(sliderOutput);
	
	var shortcutDiv = document.createElement('div');
	shortcutDiv.align = 'center';
	
	var shortcutPopup = document.createElement('a');
	shortcutPopup.onclick = function () { chrome.runtime.sendMessage({type: 'popup'}); };
	shortcutPopup.innerText = 'Configure shortcuts';
	shortcutDiv.append(shortcutPopup);
	
	var addonSection = document.createElement('div');
	addonSettings.appendChild(addonSection);
	addonSettings.appendChild(copyright());
	addonSection.className = 'section selected';
	addonSection.appendChild(configElem('haxSearchConfig',true,'Search bar (Raamyy)'));
	addonSection.appendChild(configElem('haxAutoJoinConfig',true,'Room AutoJoin'));
	addonSection.appendChild(configElem('haxKickBanConfig',false,'Room Kick/Ban shortcuts (double click)'));
	addonSection.appendChild(configElem('haxHideNavConfig',true,'Hide NavBar by default'));
	addonSection.appendChild(configElem('haxMuteConfig',true,'Local mute'));
	addonSection.appendChild(configElem('haxNotifConfig',false,'Game notifications'));
	addonSection.appendChild(configElem('haxTransChatConfig',false,'Transparent chat (Pacific)'));
	addonSection.appendChild(sliderDiv);
	addonSection.appendChild(configElem('haxViewModeConfig',false,'View-mode hotkeys'));
	addonSection.appendChild(configElem('haxRecordHotkey',false,'Record hotkey R'));
	addonSection.appendChild(configElem('haxShortcutConfig',false,'Chat text expansion and 😃 shortcuts'));
	addonSection.appendChild(shortcutDiv);
	addonSection.appendChild(configElem('haxTimerConfig',true,'Show in-game timer'));
	
	
	if (currentView == 'choose-nickname-view') {
		var nicknameView = el.contentWindow.document.getElementsByClassName('choose-nickname-view')[0];
		
		addonSettingsClose.onclick = function () {
			addonSettings.style.display = 'none';
			nicknameView.childNodes[1].style.display = 'flex';
		};
		
		addonSettingsOpen.onclick = function () { 
			addonSettings.style.display = 'flex';
			nicknameView.childNodes[1].style.display = 'none';
		}
		
		nicknameView.appendChild(addonSettings);

		var okButton = el.contentWindow.document.querySelector('[data-hook="ok"]');
		var buttonDiv = document.createElement('div');
		buttonDiv.align = 'center';
		
		var dividerDiv = document.createElement('div');
		dividerDiv.style = 'width:5px; display:inline-block';
		
		okButton.parentNode.insertBefore(buttonDiv, okButton);
		buttonDiv.appendChild(okButton);
		buttonDiv.appendChild(dividerDiv);
		buttonDiv.appendChild(addonSettingsOpen);
	}
	
	else { 
		var gameframe = document.getElementsByClassName('gameframe')[0];
		var settingButton = gameframe.contentWindow.document.querySelector('[data-hook="settings"]');
		var topSec = gameframe.contentWindow.document.getElementsByClassName('top-section')[0];
		addonSettings.style.position = 'absolute';
		addonSettings.style.left = 0;
		addonSettings.style.right = 0;
		addonSettings.style.top = '15%';
		addonSettings.style.marginLeft = 'auto';
		addonSettings.style.marginRight = 'auto';
		topSec.parentNode.appendChild(addonSettings);
		
		// addonSettingsClose.append(' - press ESC twice to apply');
		
		addonSettingsClose.onclick = function () {
			addonSettings.style.display = 'none';
		}
		
		addonSettingsOpen.onclick = function () { 
			addonSettings.style.display = 'flex';
		}
		
		settingButton.parentNode.appendChild(addonSettingsOpen);
	}
}

// text expansion stuffs
RegExp.escape = function(s) {
    return s.replace(/[-\/\\^$*+!?.()[\]{}]/g, '\\$&');
};

var chatShortcuts;
var chatTimer;
var expandRe;
const emojiShortcuts = {":100:":"💯",":1234:":"🔢",":monkey_face:":"🐵",":grinning:":"😀",":earth_africa:":"🌍",":checkered_flag:":"🏁",":mute:":"🔇",":jack_o_lantern:":"🎃",":atm:":"🏧",":grapes:":"🍇",":earth_americas:":"🌎",":grin:":"😁",":melon:":"🍈",":triangular_flag_on_post:":"🚩",":monkey:":"🐒",":christmas_tree:":"🎄",":put_litter_in_its_place:":"🚮",":speaker:":"🔈",":earth_asia:":"🌏",":crossed_flags:":"🎌",":joy:":"😂",":sound:":"🔉",":watermelon:":"🍉",":gorilla:":"🦍",":fireworks:":"🎆",":potable_water:":"🚰",":wheelchair:":"♿",":rolling_on_the_floor_laughing:":"🤣",":loud_sound:":"🔊",":waving_black_flag:":"🏴",":tangerine:":"🍊",":dog:":"🐶",":sparkler:":"🎇",":globe_with_meridians:":"🌐",":smiley:":"😃",":loudspeaker:":"📢",":sparkles:":"✨",":dog2:":"🐕",":waving_white_flag:":"🏳️",":world_map:":"🗺️",":lemon:":"🍋",":mens:":"🚹",":womens:":"🚺",":rainbow-flag:":"🏳️‍🌈",":smile:":"😄",":banana:":"🍌",":mega:":"📣",":japan:":"🗾",":poodle:":"🐩",":balloon:":"🎈",":flag-ac:":"🇦🇨",":sweat_smile:":"😅",":pineapple:":"🍍",":restroom:":"🚻",":postal_horn:":"📯",":wolf:":"🐺",":tada:":"🎉",":snow_capped_mountain:":"🏔️",":laughing:":"😆",":apple:":"🍎",":flag-ad:":"🇦🇩",":fox_face:":"🦊",":confetti_ball:":"🎊",":bell:":"🔔",":mountain:":"⛰️",":baby_symbol:":"🚼",":wc:":"🚾",":wink:":"😉",":no_bell:":"🔕",":green_apple:":"🍏",":tanabata_tree:":"🎋",":flag-ae:":"🇦🇪",":volcano:":"🌋",":cat:":"🐱",":flag-af:":"🇦🇫",":musical_score:":"🎼",":blush:":"😊",":pear:":"🍐",":bamboo:":"🎍",":passport_control:":"🛂",":mount_fuji:":"🗻",":cat2:":"🐈",":musical_note:":"🎵",":dolls:":"🎎",":lion_face:":"🦁",":camping:":"🏕️",":flag-ag:":"🇦🇬",":customs:":"🛃",":yum:":"😋",":peach:":"🍑",":tiger:":"🐯",":notes:":"🎶",":flags:":"🎏",":beach_with_umbrella:":"🏖️",":cherries:":"🍒",":flag-ai:":"🇦🇮",":baggage_claim:":"🛄",":sunglasses:":"😎",":left_luggage:":"🛅",":wind_chime:":"🎐",":strawberry:":"🍓",":desert:":"🏜️",":studio_microphone:":"🎙️",":flag-al:":"🇦🇱",":tiger2:":"🐅",":heart_eyes:":"😍",":desert_island:":"🏝️",":kiwifruit:":"🥝",":rice_scene:":"🎑",":kissing_heart:":"😘",":warning:":"⚠️",":flag-am:":"🇦🇲",":leopard:":"🐆",":level_slider:":"🎚️",":horse:":"🐴",":children_crossing:":"🚸",":ribbon:":"🎀",":national_park:":"🏞️",":control_knobs:":"🎛️",":kissing:":"😗",":tomato:":"🍅",":flag-ao:":"🇦🇴",":stadium:":"🏟️",":flag-aq:":"🇦🇶",":gift:":"🎁",":no_entry:":"⛔",":kissing_smiling_eyes:":"😙",":coconut:":"🥥",":racehorse:":"🐎",":microphone:":"🎤",":classical_building:":"🏛️",":no_entry_sign:":"🚫",":reminder_ribbon:":"🎗️",":kissing_closed_eyes:":"😚",":unicorn_face:":"🦄",":flag-ar:":"🇦🇷",":headphones:":"🎧",":avocado:":"🥑",":relaxed:":"☺️",":zebra_face:":"🦓",":eggplant:":"🍆",":radio:":"📻",":building_construction:":"🏗️",":flag-as:":"🇦🇸",":admission_tickets:":"🎟️",":no_bicycles:":"🚳",":no_smoking:":"🚭",":slightly_smiling_face:":"🙂",":flag-at:":"🇦🇹",":ticket:":"🎫",":saxophone:":"🎷",":deer:":"🦌",":house_buildings:":"🏘️",":potato:":"🥔",":guitar:":"🎸",":carrot:":"🥕",":cityscape:":"🏙️",":flag-au:":"🇦🇺",":do_not_litter:":"🚯",":hugging_face:":"🤗",":cow:":"🐮",":medal:":"🎖️",":musical_keyboard:":"🎹",":corn:":"🌽",":derelict_house_building:":"🏚️",":non-potable_water:":"🚱",":trophy:":"🏆",":flag-aw:":"🇦🇼",":star-struck:":"🤩",":ox:":"🐂",":trumpet:":"🎺",":hot_pepper:":"🌶️",":sports_medal:":"🏅",":flag-ax:":"🇦🇽",":water_buffalo:":"🐃",":no_pedestrians:":"🚷",":thinking_face:":"🤔",":house:":"🏠",":no_mobile_phones:":"📵",":flag-az:":"🇦🇿",":first_place_medal:":"🥇",":house_with_garden:":"🏡",":violin:":"🎻",":face_with_raised_eyebrow:":"🤨",":cucumber:":"🥒",":cow2:":"🐄",":flag-ba:":"🇧🇦",":pig:":"🐷",":drum_with_drumsticks:":"🥁",":underage:":"🔞",":broccoli:":"🥦",":office:":"🏢",":second_place_medal:":"🥈",":neutral_face:":"😐",":third_place_medal:":"🥉",":mushroom:":"🍄",":flag-bb:":"🇧🇧",":radioactive_sign:":"☢️",":pig2:":"🐖",":expressionless:":"😑",":iphone:":"📱",":post_office:":"🏣",":european_post_office:":"🏤",":soccer:":"⚽",":boar:":"🐗",":peanuts:":"🥜",":calling:":"📲",":biohazard_sign:":"☣️",":flag-bd:":"🇧🇩",":no_mouth:":"😶",":face_with_rolling_eyes:":"🙄",":phone:":"☎️",":pig_nose:":"🐽",":chestnut:":"🌰",":arrow_up:":"⬆️",":hospital:":"🏥",":flag-be:":"🇧🇪",":baseball:":"⚾",":smirk:":"😏",":arrow_upper_right:":"↗️",":flag-bf:":"🇧🇫",":basketball:":"🏀",":ram:":"🐏",":bank:":"🏦",":bread:":"🍞",":telephone_receiver:":"📞",":croissant:":"🥐",":pager:":"📟",":sheep:":"🐑",":arrow_right:":"➡️",":persevere:":"😣",":flag-bg:":"🇧🇬",":volleyball:":"🏐",":hotel:":"🏨",":arrow_lower_right:":"↘️",":goat:":"🐐",":flag-bh:":"🇧🇭",":love_hotel:":"🏩",":disappointed_relieved:":"😥",":baguette_bread:":"🥖",":football:":"🏈",":fax:":"📠",":convenience_store:":"🏪",":dromedary_camel:":"🐪",":arrow_down:":"⬇️",":battery:":"🔋",":rugby_football:":"🏉",":pretzel:":"🥨",":open_mouth:":"😮",":flag-bi:":"🇧🇮",":flag-bj:":"🇧🇯",":pancakes:":"🥞",":school:":"🏫",":tennis:":"🎾",":zipper_mouth_face:":"🤐",":camel:":"🐫",":arrow_lower_left:":"↙️",":electric_plug:":"🔌",":cheese_wedge:":"🧀",":hushed:":"😯",":computer:":"💻",":giraffe_face:":"🦒",":8ball:":"🎱",":flag-bl:":"🇧🇱",":arrow_left:":"⬅️",":department_store:":"🏬",":meat_on_bone:":"🍖",":arrow_upper_left:":"↖️",":flag-bm:":"🇧🇲",":sleepy:":"😪",":bowling:":"🎳",":factory:":"🏭",":desktop_computer:":"🖥️",":elephant:":"🐘",":rhinoceros:":"🦏",":arrow_up_down:":"↕️",":cricket_bat_and_ball:":"🏏",":printer:":"🖨️",":poultry_leg:":"🍗",":tired_face:":"😫",":japanese_castle:":"🏯",":flag-bn:":"🇧🇳",":field_hockey_stick_and_ball:":"🏑",":sleeping:":"😴",":left_right_arrow:":"↔️",":keyboard:":"⌨️",":european_castle:":"🏰",":mouse:":"🐭",":flag-bo:":"🇧🇴",":cut_of_meat:":"🥩",":ice_hockey_stick_and_puck:":"🏒",":mouse2:":"🐁",":three_button_mouse:":"🖱️",":leftwards_arrow_with_hook:":"↩️",":bacon:":"🥓",":relieved:":"😌",":flag-bq:":"🇧🇶",":wedding:":"💒",":tokyo_tower:":"🗼",":arrow_right_hook:":"↪️",":hamburger:":"🍔",":stuck_out_tongue:":"😛",":trackball:":"🖲️",":flag-br:":"🇧🇷",":rat:":"🐀",":table_tennis_paddle_and_ball:":"🏓",":minidisc:":"💽",":stuck_out_tongue_winking_eye:":"😜",":fries:":"🍟",":badminton_racquet_and_shuttlecock:":"🏸",":statue_of_liberty:":"🗽",":flag-bs:":"🇧🇸",":arrow_heading_up:":"⤴️",":hamster:":"🐹",":stuck_out_tongue_closed_eyes:":"😝",":pizza:":"🍕",":boxing_glove:":"🥊",":floppy_disk:":"💾",":arrow_heading_down:":"⤵️",":flag-bt:":"🇧🇹",":rabbit:":"🐰",":church:":"⛪",":drooling_face:":"🤤",":flag-bv:":"🇧🇻",":mosque:":"🕌",":rabbit2:":"🐇",":hotdog:":"🌭",":martial_arts_uniform:":"🥋",":arrows_clockwise:":"🔃",":cd:":"💿",":arrows_counterclockwise:":"🔄",":sandwich:":"🥪",":chipmunk:":"🐿️",":synagogue:":"🕍",":unamused:":"😒",":goal_net:":"🥅",":flag-bw:":"🇧🇼",":dvd:":"📀",":hedgehog:":"🦔",":dart:":"🎯",":taco:":"🌮",":back:":"🔙",":flag-by:":"🇧🇾",":shinto_shrine:":"⛩️",":movie_camera:":"🎥",":sweat:":"😓",":burrito:":"🌯",":flag-bz:":"🇧🇿",":pensive:":"😔",":kaaba:":"🕋",":film_frames:":"🎞️",":bat:":"🦇",":golf:":"⛳",":end:":"🔚",":film_projector:":"📽️",":bear:":"🐻",":ice_skate:":"⛸️",":fountain:":"⛲",":confused:":"😕",":flag-ca:":"🇨🇦",":on:":"🔛",":stuffed_flatbread:":"🥙",":soon:":"🔜",":upside_down_face:":"🙃",":fishing_pole_and_fish:":"🎣",":tent:":"⛺",":clapper:":"🎬",":egg:":"🥚",":flag-cc:":"🇨🇨",":koala:":"🐨",":foggy:":"🌁",":tv:":"📺",":panda_face:":"🐼",":fried_egg:":"🍳",":top:":"🔝",":flag-cd:":"🇨🇩",":money_mouth_face:":"🤑",":running_shirt_with_sash:":"🎽",":astonished:":"😲",":feet:":"🐾",":camera:":"📷",":flag-cf:":"🇨🇫",":place_of_worship:":"🛐",":night_with_stars:":"🌃",":ski:":"🎿",":shallow_pan_of_food:":"🥘",":camera_with_flash:":"📸",":sunrise_over_mountains:":"🌄",":turkey:":"🦃",":white_frowning_face:":"☹️",":flag-cg:":"🇨🇬",":stew:":"🍲",":sled:":"🛷",":atom_symbol:":"⚛️",":curling_stone:":"🥌",":slightly_frowning_face:":"🙁",":sunrise:":"🌅",":om_symbol:":"🕉️",":chicken:":"🐔",":bowl_with_spoon:":"🥣",":flag-ch:":"🇨🇭",":video_camera:":"📹",":video_game:":"🎮",":rooster:":"🐓",":vhs:":"📼",":city_sunset:":"🌆",":confounded:":"😖",":green_salad:":"🥗",":star_of_david:":"✡️",":flag-ci:":"🇨🇮",":popcorn:":"🍿",":city_sunrise:":"🌇",":disappointed:":"😞",":mag:":"🔍",":hatching_chick:":"🐣",":joystick:":"🕹️",":wheel_of_dharma:":"☸️",":flag-ck:":"🇨🇰",":canned_food:":"🥫",":worried:":"😟",":baby_chick:":"🐤",":flag-cl:":"🇨🇱",":game_die:":"🎲",":mag_right:":"🔎",":yin_yang:":"☯️",":bridge_at_night:":"🌉",":spades:":"♠️",":hatched_chick:":"🐥",":flag-cm:":"🇨🇲",":latin_cross:":"✝️",":triumph:":"😤",":hotsprings:":"♨️",":bento:":"🍱",":microscope:":"🔬",":cry:":"😢",":bird:":"🐦",":cn:":"🇨🇳",":telescope:":"🔭",":rice_cracker:":"🍘",":hearts:":"♥️",":orthodox_cross:":"☦️",":milky_way:":"🌌",":rice_ball:":"🍙",":satellite_antenna:":"📡",":flag-co:":"🇨🇴",":carousel_horse:":"🎠",":sob:":"😭",":diamonds:":"♦️",":star_and_crescent:":"☪️",":penguin:":"🐧",":dove_of_peace:":"🕊️",":flag-cp:":"🇨🇵",":ferris_wheel:":"🎡",":clubs:":"♣️",":peace_symbol:":"☮️",":candle:":"🕯️",":frowning:":"😦",":rice:":"🍚",":flag-cr:":"🇨🇷",":roller_coaster:":"🎢",":menorah_with_nine_branches:":"🕎",":black_joker:":"🃏",":eagle:":"🦅",":curry:":"🍛",":bulb:":"💡",":anguished:":"😧",":flag-cu:":"🇨🇺",":barber:":"💈",":duck:":"🦆",":six_pointed_star:":"🔯",":ramen:":"🍜",":flashlight:":"🔦",":mahjong:":"🀄",":fearful:":"😨",":aries:":"♈",":spaghetti:":"🍝",":circus_tent:":"🎪",":izakaya_lantern:":"🏮",":flag-cv:":"🇨🇻",":weary:":"😩",":flower_playing_cards:":"🎴",":owl:":"🦉",":performing_arts:":"🎭",":frog:":"🐸",":flag-cw:":"🇨🇼",":notebook_with_decorative_cover:":"📔",":exploding_head:":"🤯",":taurus:":"♉",":sweet_potato:":"🍠",":closed_book:":"📕",":gemini:":"♊",":frame_with_picture:":"🖼️",":flag-cx:":"🇨🇽",":grimacing:":"😬",":crocodile:":"🐊",":oden:":"🍢",":flag-cy:":"🇨🇾",":book:":"📖",":turtle:":"🐢",":art:":"🎨",":sushi:":"🍣",":cold_sweat:":"😰",":cancer:":"♋",":fried_shrimp:":"🍤",":slot_machine:":"🎰",":scream:":"😱",":green_book:":"📗",":leo:":"♌",":flag-cz:":"🇨🇿",":lizard:":"🦎",":virgo:":"♍",":steam_locomotive:":"🚂",":de:":"🇩🇪",":flushed:":"😳",":blue_book:":"📘",":snake:":"🐍",":fish_cake:":"🍥",":railway_car:":"🚃",":dango:":"🍡",":orange_book:":"📙",":libra:":"♎",":dragon_face:":"🐲",":flag-dg:":"🇩🇬",":zany_face:":"🤪",":books:":"📚",":dragon:":"🐉",":flag-dj:":"🇩🇯",":dumpling:":"🥟",":dizzy_face:":"😵",":scorpius:":"♏",":bullettrain_side:":"🚄",":bullettrain_front:":"🚅",":notebook:":"📓",":fortune_cookie:":"🥠",":sagittarius:":"♐",":sauropod:":"🦕",":flag-dk:":"🇩🇰",":rage:":"😡",":ledger:":"📒",":angry:":"😠",":t-rex:":"🦖",":capricorn:":"♑",":takeout_box:":"🥡",":flag-dm:":"🇩🇲",":train2:":"🚆",":page_with_curl:":"📃",":whale:":"🐳",":face_with_symbols_on_mouth:":"🤬",":flag-do:":"🇩🇴",":metro:":"🚇",":icecream:":"🍦",":aquarius:":"♒",":flag-dz:":"🇩🇿",":whale2:":"🐋",":mask:":"😷",":scroll:":"📜",":shaved_ice:":"🍧",":pisces:":"♓",":light_rail:":"🚈",":dolphin:":"🐬",":face_with_thermometer:":"🤒",":flag-ea:":"🇪🇦",":ophiuchus:":"⛎",":station:":"🚉",":ice_cream:":"🍨",":page_facing_up:":"📄",":doughnut:":"🍩",":face_with_head_bandage:":"🤕",":fish:":"🐟",":newspaper:":"📰",":tram:":"🚊",":flag-ec:":"🇪🇨",":twisted_rightwards_arrows:":"🔀",":flag-ee:":"🇪🇪",":cookie:":"🍪",":monorail:":"🚝",":tropical_fish:":"🐠",":rolled_up_newspaper:":"🗞️",":nauseated_face:":"🤢",":repeat:":"🔁",":bookmark_tabs:":"📑",":repeat_one:":"🔂",":flag-eg:":"🇪🇬",":mountain_railway:":"🚞",":birthday:":"🎂",":blowfish:":"🐡",":face_vomiting:":"🤮",":arrow_forward:":"▶️",":bookmark:":"🔖",":flag-eh:":"🇪🇭",":shark:":"🦈",":train:":"🚋",":sneezing_face:":"🤧",":cake:":"🍰",":bus:":"🚌",":pie:":"🥧",":innocent:":"😇",":fast_forward:":"⏩",":label:":"🏷️",":octopus:":"🐙",":flag-er:":"🇪🇷",":black_right_pointing_double_triangle_with_vertical_bar:":"⏭️",":chocolate_bar:":"🍫",":oncoming_bus:":"🚍",":shell:":"🐚",":face_with_cowboy_hat:":"🤠",":moneybag:":"💰",":es:":"🇪🇸",":crab:":"🦀",":yen:":"💴",":flag-et:":"🇪🇹",":clown_face:":"🤡",":black_right_pointing_triangle_with_double_vertical_bar:":"⏯️",":trolleybus:":"🚎",":candy:":"🍬",":lying_face:":"🤥",":arrow_backward:":"◀️",":dollar:":"💵",":shrimp:":"🦐",":minibus:":"🚐",":flag-eu:":"🇪🇺",":lollipop:":"🍭",":squid:":"🦑",":euro:":"💶",":flag-fi:":"🇫🇮",":ambulance:":"🚑",":custard:":"🍮",":shushing_face:":"🤫",":rewind:":"⏪",":black_left_pointing_double_triangle_with_vertical_bar:":"⏮️",":face_with_hand_over_mouth:":"🤭",":flag-fj:":"🇫🇯",":honey_pot:":"🍯",":snail:":"🐌",":pound:":"💷",":fire_engine:":"🚒",":baby_bottle:":"🍼",":flag-fk:":"🇫🇰",":butterfly:":"🦋",":money_with_wings:":"💸",":face_with_monocle:":"🧐",":police_car:":"🚓",":arrow_up_small:":"🔼",":flag-fm:":"🇫🇲",":glass_of_milk:":"🥛",":credit_card:":"💳",":oncoming_police_car:":"🚔",":bug:":"🐛",":nerd_face:":"🤓",":arrow_double_up:":"⏫",":chart:":"💹",":flag-fo:":"🇫🇴",":ant:":"🐜",":arrow_down_small:":"🔽",":smiling_imp:":"😈",":taxi:":"🚕",":coffee:":"☕",":fr:":"🇫🇷",":oncoming_taxi:":"🚖",":arrow_double_down:":"⏬",":imp:":"👿",":currency_exchange:":"💱",":tea:":"🍵",":bee:":"🐝",":heavy_dollar_sign:":"💲",":car:":"🚗",":sake:":"🍶",":flag-ga:":"🇬🇦",":beetle:":"🐞",":japanese_ogre:":"👹",":double_vertical_bar:":"⏸️",":champagne:":"🍾",":japanese_goblin:":"👺",":black_square_for_stop:":"⏹️",":oncoming_automobile:":"🚘",":email:":"✉️",":cricket:":"🦗",":gb:":"🇬🇧",":black_circle_for_record:":"⏺️",":flag-gd:":"🇬🇩",":spider:":"🕷️",":blue_car:":"🚙",":skull:":"💀",":e-mail:":"📧",":wine_glass:":"🍷",":spider_web:":"🕸️",":cocktail:":"🍸",":skull_and_crossbones:":"☠️",":flag-ge:":"🇬🇪",":eject:":"⏏️",":truck:":"🚚",":incoming_envelope:":"📨",":tropical_drink:":"🍹",":scorpion:":"🦂",":cinema:":"🎦",":articulated_lorry:":"🚛",":envelope_with_arrow:":"📩",":ghost:":"👻",":flag-gf:":"🇬🇫",":bouquet:":"💐",":tractor:":"🚜",":beer:":"🍺",":outbox_tray:":"📤",":low_brightness:":"🔅",":alien:":"👽",":flag-gg:":"🇬🇬",":cherry_blossom:":"🌸",":inbox_tray:":"📥",":flag-gh:":"🇬🇭",":bike:":"🚲",":space_invader:":"👾",":beers:":"🍻",":high_brightness:":"🔆",":package:":"📦",":scooter:":"🛴",":white_flower:":"💮",":clinking_glasses:":"🥂",":robot_face:":"🤖",":signal_strength:":"📶",":flag-gi:":"🇬🇮",":flag-gl:":"🇬🇱",":motor_scooter:":"🛵",":mailbox:":"📫",":vibration_mode:":"📳",":hankey:":"💩",":rosette:":"🏵️",":tumbler_glass:":"🥃",":cup_with_straw:":"🥤",":flag-gm:":"🇬🇲",":mailbox_closed:":"📪",":mobile_phone_off:":"📴",":busstop:":"🚏",":smiley_cat:":"😺",":rose:":"🌹",":motorway:":"🛣️",":smile_cat:":"😸",":flag-gn:":"🇬🇳",":wilted_flower:":"🥀",":mailbox_with_mail:":"📬",":chopsticks:":"🥢",":female_sign:":"♀️",":mailbox_with_no_mail:":"📭",":knife_fork_plate:":"🍽️",":hibiscus:":"🌺",":flag-gp:":"🇬🇵",":railway_track:":"🛤️",":male_sign:":"♂️",":joy_cat:":"😹",":fuelpump:":"⛽",":sunflower:":"🌻",":postbox:":"📮",":flag-gq:":"🇬🇶",":heart_eyes_cat:":"😻",":fork_and_knife:":"🍴",":medical_symbol:":"⚕️",":recycle:":"♻️",":spoon:":"🥄",":blossom:":"🌼",":rotating_light:":"🚨",":smirk_cat:":"😼",":ballot_box_with_ballot:":"🗳️",":flag-gr:":"🇬🇷",":kissing_cat:":"😽",":pencil2:":"✏️",":traffic_light:":"🚥",":fleur_de_lis:":"⚜️",":tulip:":"🌷",":hocho:":"🔪",":flag-gs:":"🇬🇸",":seedling:":"🌱",":amphora:":"🏺",":scream_cat:":"🙀",":vertical_traffic_light:":"🚦",":black_nib:":"✒️",":flag-gt:":"🇬🇹",":trident:":"🔱",":flag-gu:":"🇬🇺",":name_badge:":"📛",":construction:":"🚧",":lower_left_fountain_pen:":"🖋️",":evergreen_tree:":"🌲",":crying_cat_face:":"😿",":flag-gw:":"🇬🇼",":lower_left_ballpoint_pen:":"🖊️",":pouting_cat:":"😾",":deciduous_tree:":"🌳",":octagonal_sign:":"🛑",":beginner:":"🔰",":flag-gy:":"🇬🇾",":lower_left_paintbrush:":"🖌️",":o:":"⭕",":palm_tree:":"🌴",":anchor:":"⚓",":see_no_evil:":"🙈",":boat:":"⛵",":white_check_mark:":"✅",":flag-hk:":"🇭🇰",":lower_left_crayon:":"🖍️",":hear_no_evil:":"🙉",":cactus:":"🌵",":ear_of_rice:":"🌾",":speak_no_evil:":"🙊",":flag-hm:":"🇭🇲",":ballot_box_with_check:":"☑️",":canoe:":"🛶",":memo:":"📝",":herb:":"🌿",":flag-hn:":"🇭🇳",":heavy_check_mark:":"✔️",":briefcase:":"💼",":speedboat:":"🚤",":baby:":"👶",":heavy_multiplication_x:":"✖️",":child:":"🧒",":shamrock:":"☘️",":passenger_ship:":"🛳️",":flag-hr:":"🇭🇷",":file_folder:":"📁",":x:":"❌",":four_leaf_clover:":"🍀",":open_file_folder:":"📂",":boy:":"👦",":ferry:":"⛴️",":flag-ht:":"🇭🇹",":girl:":"👧",":negative_squared_cross_mark:":"❎",":flag-hu:":"🇭🇺",":card_index_dividers:":"🗂️",":maple_leaf:":"🍁",":motor_boat:":"🛥️",":flag-ic:":"🇮🇨",":fallen_leaf:":"🍂",":adult:":"🧑",":ship:":"🚢",":heavy_plus_sign:":"➕",":date:":"📅",":man:":"👨",":flag-id:":"🇮🇩",":leaves:":"🍃",":heavy_minus_sign:":"➖",":calendar:":"📆",":airplane:":"✈️",":spiral_note_pad:":"🗒️",":heavy_division_sign:":"➗",":small_airplane:":"🛩️",":woman:":"👩",":flag-ie:":"🇮🇪",":curly_loop:":"➰",":flag-il:":"🇮🇱",":airplane_departure:":"🛫",":spiral_calendar_pad:":"🗓️",":older_adult:":"🧓",":airplane_arriving:":"🛬",":card_index:":"📇",":loop:":"➿",":older_man:":"👴",":flag-im:":"🇮🇲",":flag-in:":"🇮🇳",":chart_with_upwards_trend:":"📈",":part_alternation_mark:":"〽️",":seat:":"💺",":older_woman:":"👵",":eight_spoked_asterisk:":"✳️",":chart_with_downwards_trend:":"📉",":flag-io:":"🇮🇴",":male-doctor:":"👨‍⚕️",":helicopter:":"🚁",":female-doctor:":"👩‍⚕️",":suspension_railway:":"🚟",":bar_chart:":"📊",":flag-iq:":"🇮🇶",":eight_pointed_black_star:":"✴️",":mountain_cableway:":"🚠",":male-student:":"👨‍🎓",":clipboard:":"📋",":flag-ir:":"🇮🇷",":sparkle:":"❇️",":female-student:":"👩‍🎓",":pushpin:":"📌",":aerial_tramway:":"🚡",":flag-is:":"🇮🇸",":bangbang:":"‼️",":interrobang:":"⁉️",":satellite:":"🛰️",":it:":"🇮🇹",":male-teacher:":"👨‍🏫",":round_pushpin:":"📍",":flag-je:":"🇯🇪",":question:":"❓",":rocket:":"🚀",":female-teacher:":"👩‍🏫",":paperclip:":"📎",":linked_paperclips:":"🖇️",":flying_saucer:":"🛸",":male-judge:":"👨‍⚖️",":grey_question:":"❔",":flag-jm:":"🇯🇲",":bellhop_bell:":"🛎️",":straight_ruler:":"📏",":flag-jo:":"🇯🇴",":female-judge:":"👩‍⚖️",":grey_exclamation:":"❕",":door:":"🚪",":male-farmer:":"👨‍🌾",":jp:":"🇯🇵",":triangular_ruler:":"📐",":exclamation:":"❗",":bed:":"🛏️",":female-farmer:":"👩‍🌾",":scissors:":"✂️",":wavy_dash:":"〰️",":flag-ke:":"🇰🇪",":flag-kg:":"🇰🇬",":couch_and_lamp:":"🛋️",":male-cook:":"👨‍🍳",":card_file_box:":"🗃️",":copyright:":"©️",":file_cabinet:":"🗄️",":registered:":"®️",":flag-kh:":"🇰🇭",":female-cook:":"👩‍🍳",":toilet:":"🚽",":wastebasket:":"🗑️",":flag-ki:":"🇰🇮",":shower:":"🚿",":male-mechanic:":"👨‍🔧",":tm:":"™️",":hash:":"#️⃣",":flag-km:":"🇰🇲",":bathtub:":"🛁",":female-mechanic:":"👩‍🔧",":lock:":"🔒",":male-factory-worker:":"👨‍🏭",":flag-kn:":"🇰🇳",":hourglass:":"⌛",":keycap_star:":"*️⃣",":unlock:":"🔓",":flag-kp:":"🇰🇵",":female-factory-worker:":"👩‍🏭",":zero:":"0️⃣",":lock_with_ink_pen:":"🔏",":hourglass_flowing_sand:":"⏳",":one:":"1️⃣",":kr:":"🇰🇷",":watch:":"⌚",":male-office-worker:":"👨‍💼",":closed_lock_with_key:":"🔐",":female-office-worker:":"👩‍💼",":two:":"2️⃣",":alarm_clock:":"⏰",":key:":"🔑",":flag-kw:":"🇰🇼",":stopwatch:":"⏱️",":male-scientist:":"👨‍🔬",":three:":"3️⃣",":flag-ky:":"🇰🇾",":old_key:":"🗝️",":flag-kz:":"🇰🇿",":hammer:":"🔨",":female-scientist:":"👩‍🔬",":timer_clock:":"⏲️",":four:":"4️⃣",":male-technologist:":"👨‍💻",":mantelpiece_clock:":"🕰️",":five:":"5️⃣",":flag-la:":"🇱🇦",":pick:":"⛏️",":flag-lb:":"🇱🇧",":clock12:":"🕛",":hammer_and_pick:":"⚒️",":six:":"6️⃣",":female-technologist:":"👩‍💻",":hammer_and_wrench:":"🛠️",":flag-lc:":"🇱🇨",":clock1230:":"🕧",":seven:":"7️⃣",":male-singer:":"👨‍🎤",":eight:":"8️⃣",":flag-li:":"🇱🇮",":dagger_knife:":"🗡️",":clock1:":"🕐",":female-singer:":"👩‍🎤",":male-artist:":"👨‍🎨",":crossed_swords:":"⚔️",":nine:":"9️⃣",":flag-lk:":"🇱🇰",":clock130:":"🕜",":clock2:":"🕑",":gun:":"🔫",":keycap_ten:":"🔟",":female-artist:":"👩‍🎨",":flag-lr:":"🇱🇷",":clock230:":"🕝",":bow_and_arrow:":"🏹",":male-pilot:":"👨‍✈️",":flag-ls:":"🇱🇸",":flag-lt:":"🇱🇹",":capital_abcd:":"🔠",":female-pilot:":"👩‍✈️",":clock3:":"🕒",":shield:":"🛡️",":male-astronaut:":"👨‍🚀",":abcd:":"🔡",":clock330:":"🕞",":flag-lu:":"🇱🇺",":wrench:":"🔧",":nut_and_bolt:":"🔩",":clock4:":"🕓",":female-astronaut:":"👩‍🚀",":flag-lv:":"🇱🇻",":gear:":"⚙️",":male-firefighter:":"👨‍🚒",":flag-ly:":"🇱🇾",":symbols:":"🔣",":clock430:":"🕟",":flag-ma:":"🇲🇦",":compression:":"🗜️",":female-firefighter:":"👩‍🚒",":abc:":"🔤",":clock5:":"🕔",":clock530:":"🕠",":a:":"🅰️",":alembic:":"⚗️",":flag-mc:":"🇲🇨",":cop:":"👮",":scales:":"⚖️",":clock6:":"🕕",":flag-md:":"🇲🇩",":ab:":"🆎",":male-police-officer:":"👮‍♂️",":link:":"🔗",":flag-me:":"🇲🇪",":clock630:":"🕡",":b:":"🅱️",":female-police-officer:":"👮‍♀️",":clock7:":"🕖",":cl:":"🆑",":sleuth_or_spy:":"🕵️",":flag-mf:":"🇲🇫",":chains:":"⛓️",":syringe:":"💉",":male-detective:":"🕵️‍♂️",":cool:":"🆒",":clock730:":"🕢",":flag-mg:":"🇲🇬",":free:":"🆓",":flag-mh:":"🇲🇭",":clock8:":"🕗",":pill:":"💊",":female-detective:":"🕵️‍♀️",":clock830:":"🕣",":guardsman:":"💂",":information_source:":"ℹ️",":flag-mk:":"🇲🇰",":smoking:":"🚬",":id:":"🆔",":clock9:":"🕘",":flag-ml:":"🇲🇱",":coffin:":"⚰️",":male-guard:":"💂‍♂️",":m:":"Ⓜ️",":funeral_urn:":"⚱️",":female-guard:":"💂‍♀️",":flag-mm:":"🇲🇲",":clock930:":"🕤",":moyai:":"🗿",":new:":"🆕",":flag-mn:":"🇲🇳",":construction_worker:":"👷",":clock10:":"🕙",":clock1030:":"🕥",":ng:":"🆖",":male-construction-worker:":"👷‍♂️",":flag-mo:":"🇲🇴",":oil_drum:":"🛢️",":o2:":"🅾️",":female-construction-worker:":"👷‍♀️",":clock11:":"🕚",":crystal_ball:":"🔮",":flag-mp:":"🇲🇵",":flag-mq:":"🇲🇶",":prince:":"🤴",":ok:":"🆗",":clock1130:":"🕦",":shopping_trolley:":"🛒",":flag-mr:":"🇲🇷",":princess:":"👸",":new_moon:":"🌑",":parking:":"🅿️",":sos:":"🆘",":man_with_turban:":"👳",":flag-ms:":"🇲🇸",":waxing_crescent_moon:":"🌒",":up:":"🆙",":first_quarter_moon:":"🌓",":flag-mt:":"🇲🇹",":man-wearing-turban:":"👳‍♂️",":moon:":"🌔",":woman-wearing-turban:":"👳‍♀️",":vs:":"🆚",":flag-mu:":"🇲🇺",":man_with_gua_pi_mao:":"👲",":koko:":"🈁",":full_moon:":"🌕",":flag-mv:":"🇲🇻",":person_with_headscarf:":"🧕",":waning_gibbous_moon:":"🌖",":sa:":"🈂️",":flag-mw:":"🇲🇼",":last_quarter_moon:":"🌗",":u6708:":"🈷️",":bearded_person:":"🧔",":flag-mx:":"🇲🇽",":u6709:":"🈶",":person_with_blond_hair:":"👱",":waning_crescent_moon:":"🌘",":flag-my:":"🇲🇾",":u6307:":"🈯",":blond-haired-man:":"👱‍♂️",":crescent_moon:":"🌙",":flag-mz:":"🇲🇿",":new_moon_with_face:":"🌚",":flag-na:":"🇳🇦",":blond-haired-woman:":"👱‍♀️",":ideograph_advantage:":"🉐",":first_quarter_moon_with_face:":"🌛",":man_in_tuxedo:":"🤵",":flag-nc:":"🇳🇨",":u5272:":"🈹",":flag-ne:":"🇳🇪",":last_quarter_moon_with_face:":"🌜",":u7121:":"🈚",":bride_with_veil:":"👰",":u7981:":"🈲",":pregnant_woman:":"🤰",":thermometer:":"🌡️",":flag-nf:":"🇳🇫",":sunny:":"☀️",":accept:":"🉑",":flag-ng:":"🇳🇬",":breast-feeding:":"🤱",":full_moon_with_face:":"🌝",":flag-ni:":"🇳🇮",":u7533:":"🈸",":angel:":"👼",":sun_with_face:":"🌞",":santa:":"🎅",":u5408:":"🈴",":flag-nl:":"🇳🇱",":mrs_claus:":"🤶",":u7a7a:":"🈳",":star:":"⭐",":flag-no:":"🇳🇴",":mage:":"🧙",":star2:":"🌟",":flag-np:":"🇳🇵",":congratulations:":"㊗️",":flag-nr:":"🇳🇷",":stars:":"🌠",":female_mage:":"🧙‍♀️",":secret:":"㊙️",":flag-nu:":"🇳🇺",":u55b6:":"🈺",":male_mage:":"🧙‍♂️",":cloud:":"☁️",":flag-nz:":"🇳🇿",":partly_sunny:":"⛅",":fairy:":"🧚",":u6e80:":"🈵",":black_small_square:":"▪️",":thunder_cloud_and_rain:":"⛈️",":female_fairy:":"🧚‍♀️",":flag-om:":"🇴🇲",":white_small_square:":"▫️",":flag-pa:":"🇵🇦",":mostly_sunny:":"🌤️",":male_fairy:":"🧚‍♂️",":barely_sunny:":"🌥️",":white_medium_square:":"◻️",":flag-pe:":"🇵🇪",":vampire:":"🧛",":female_vampire:":"🧛‍♀️",":partly_sunny_rain:":"🌦️",":flag-pf:":"🇵🇫",":black_medium_square:":"◼️",":white_medium_small_square:":"◽",":rain_cloud:":"🌧️",":flag-pg:":"🇵🇬",":male_vampire:":"🧛‍♂️",":flag-ph:":"🇵🇭",":merperson:":"🧜",":black_medium_small_square:":"◾",":snow_cloud:":"🌨️",":lightning:":"🌩️",":black_large_square:":"⬛",":mermaid:":"🧜‍♀️",":flag-pk:":"🇵🇰",":merman:":"🧜‍♂️",":white_large_square:":"⬜",":tornado:":"🌪️",":flag-pl:":"🇵🇱",":elf:":"🧝",":fog:":"🌫️",":large_orange_diamond:":"🔶",":flag-pm:":"🇵🇲",":flag-pn:":"🇵🇳",":wind_blowing_face:":"🌬️",":female_elf:":"🧝‍♀️",":large_blue_diamond:":"🔷",":male_elf:":"🧝‍♂️",":small_orange_diamond:":"🔸",":flag-pr:":"🇵🇷",":cyclone:":"🌀",":rainbow:":"🌈",":small_blue_diamond:":"🔹",":genie:":"🧞",":flag-ps:":"🇵🇸",":small_red_triangle:":"🔺",":closed_umbrella:":"🌂",":female_genie:":"🧞‍♀️",":flag-pt:":"🇵🇹",":flag-pw:":"🇵🇼",":small_red_triangle_down:":"🔻",":umbrella:":"☂️",":male_genie:":"🧞‍♂️",":zombie:":"🧟",":flag-py:":"🇵🇾",":diamond_shape_with_a_dot_inside:":"💠",":umbrella_with_rain_drops:":"☔",":radio_button:":"🔘",":female_zombie:":"🧟‍♀️",":flag-qa:":"🇶🇦",":umbrella_on_ground:":"⛱️",":black_square_button:":"🔲",":zap:":"⚡",":male_zombie:":"🧟‍♂️",":flag-re:":"🇷🇪",":flag-ro:":"🇷🇴",":snowflake:":"❄️",":white_square_button:":"🔳",":person_frowning:":"🙍",":flag-rs:":"🇷🇸",":man-frowning:":"🙍‍♂️",":white_circle:":"⚪",":snowman:":"☃️",":snowman_without_snow:":"⛄",":ru:":"🇷🇺",":black_circle:":"⚫",":woman-frowning:":"🙍‍♀️",":flag-rw:":"🇷🇼",":comet:":"☄️",":person_with_pouting_face:":"🙎",":red_circle:":"🔴",":large_blue_circle:":"🔵",":man-pouting:":"🙎‍♂️",":flag-sa:":"🇸🇦",":fire:":"🔥",":woman-pouting:":"🙎‍♀️",":flag-sb:":"🇸🇧",":droplet:":"💧",":no_good:":"🙅",":flag-sc:":"🇸🇨",":ocean:":"🌊",":man-gesturing-no:":"🙅‍♂️",":flag-sd:":"🇸🇩",":woman-gesturing-no:":"🙅‍♀️",":flag-se:":"🇸🇪",":flag-sg:":"🇸🇬",":ok_woman:":"🙆",":flag-sh:":"🇸🇭",":man-gesturing-ok:":"🙆‍♂️",":flag-si:":"🇸🇮",":woman-gesturing-ok:":"🙆‍♀️",":information_desk_person:":"💁",":flag-sj:":"🇸🇯",":man-tipping-hand:":"💁‍♂️",":flag-sk:":"🇸🇰",":flag-sl:":"🇸🇱",":woman-tipping-hand:":"💁‍♀️",":flag-sm:":"🇸🇲",":raising_hand:":"🙋",":flag-sn:":"🇸🇳",":man-raising-hand:":"🙋‍♂️",":flag-so:":"🇸🇴",":woman-raising-hand:":"🙋‍♀️",":flag-sr:":"🇸🇷",":bow:":"🙇",":man-bowing:":"🙇‍♂️",":flag-ss:":"🇸🇸",":woman-bowing:":"🙇‍♀️",":flag-st:":"🇸🇹",":face_palm:":"🤦",":flag-sv:":"🇸🇻",":man-facepalming:":"🤦‍♂️",":flag-sx:":"🇸🇽",":flag-sy:":"🇸🇾",":woman-facepalming:":"🤦‍♀️",":shrug:":"🤷",":flag-sz:":"🇸🇿",":flag-ta:":"🇹🇦",":man-shrugging:":"🤷‍♂️",":woman-shrugging:":"🤷‍♀️",":flag-tc:":"🇹🇨",":massage:":"💆",":flag-td:":"🇹🇩",":man-getting-massage:":"💆‍♂️",":flag-tf:":"🇹🇫",":woman-getting-massage:":"💆‍♀️",":flag-tg:":"🇹🇬",":haircut:":"💇",":flag-th:":"🇹🇭",":man-getting-haircut:":"💇‍♂️",":flag-tj:":"🇹🇯",":flag-tk:":"🇹🇰",":woman-getting-haircut:":"💇‍♀️",":walking:":"🚶",":flag-tl:":"🇹🇱",":man-walking:":"🚶‍♂️",":flag-tm:":"🇹🇲",":woman-walking:":"🚶‍♀️",":flag-tn:":"🇹🇳",":runner:":"🏃",":flag-to:":"🇹🇴",":man-running:":"🏃‍♂️",":flag-tr:":"🇹🇷",":flag-tt:":"🇹🇹",":woman-running:":"🏃‍♀️",":flag-tv:":"🇹🇻",":dancer:":"💃",":flag-tw:":"🇹🇼",":man_dancing:":"🕺",":dancers:":"👯",":flag-tz:":"🇹🇿",":flag-ua:":"🇺🇦",":man-with-bunny-ears-partying:":"👯‍♂️",":woman-with-bunny-ears-partying:":"👯‍♀️",":flag-ug:":"🇺🇬",":flag-um:":"🇺🇲",":person_in_steamy_room:":"🧖",":woman_in_steamy_room:":"🧖‍♀️",":flag-un:":"🇺🇳",":us:":"🇺🇸",":man_in_steamy_room:":"🧖‍♂️",":person_climbing:":"🧗",":flag-uy:":"🇺🇾",":woman_climbing:":"🧗‍♀️",":flag-uz:":"🇺🇿",":man_climbing:":"🧗‍♂️",":flag-va:":"🇻🇦",":person_in_lotus_position:":"🧘",":flag-vc:":"🇻🇨",":flag-ve:":"🇻🇪",":woman_in_lotus_position:":"🧘‍♀️",":man_in_lotus_position:":"🧘‍♂️",":flag-vg:":"🇻🇬",":flag-vi:":"🇻🇮",":bath:":"🛀",":sleeping_accommodation:":"🛌",":flag-vn:":"🇻🇳",":man_in_business_suit_levitating:":"🕴️",":flag-vu:":"🇻🇺",":flag-wf:":"🇼🇫",":speaking_head_in_silhouette:":"🗣️",":bust_in_silhouette:":"👤",":flag-ws:":"🇼🇸",":busts_in_silhouette:":"👥",":flag-xk:":"🇽🇰",":fencer:":"🤺",":flag-ye:":"🇾🇪",":flag-yt:":"🇾🇹",":horse_racing:":"🏇",":flag-za:":"🇿🇦",":skier:":"⛷️",":flag-zm:":"🇿🇲",":snowboarder:":"🏂",":golfer:":"🏌️",":flag-zw:":"🇿🇼",":man-golfing:":"🏌️‍♂️",":flag-england:":"🏴󠁧󠁢󠁥󠁮󠁧󠁿",":woman-golfing:":"🏌️‍♀️",":flag-scotland:":"🏴󠁧󠁢󠁳󠁣󠁴󠁿",":flag-wales:":"🏴󠁧󠁢󠁷󠁬󠁳󠁿",":surfer:":"🏄",":man-surfing:":"🏄‍♂️",":woman-surfing:":"🏄‍♀️",":rowboat:":"🚣",":man-rowing-boat:":"🚣‍♂️",":woman-rowing-boat:":"🚣‍♀️",":swimmer:":"🏊",":man-swimming:":"🏊‍♂️",":woman-swimming:":"🏊‍♀️",":person_with_ball:":"⛹️",":man-bouncing-ball:":"⛹️‍♂️",":woman-bouncing-ball:":"⛹️‍♀️",":weight_lifter:":"🏋️",":man-lifting-weights:":"🏋️‍♂️",":woman-lifting-weights:":"🏋️‍♀️",":bicyclist:":"🚴",":man-biking:":"🚴‍♂️",":woman-biking:":"🚴‍♀️",":mountain_bicyclist:":"🚵",":man-mountain-biking:":"🚵‍♂️",":woman-mountain-biking:":"🚵‍♀️",":racing_car:":"🏎️",":racing_motorcycle:":"🏍️",":person_doing_cartwheel:":"🤸",":man-cartwheeling:":"🤸‍♂️",":woman-cartwheeling:":"🤸‍♀️",":wrestlers:":"🤼",":man-wrestling:":"🤼‍♂️",":woman-wrestling:":"🤼‍♀️",":water_polo:":"🤽",":man-playing-water-polo:":"🤽‍♂️",":woman-playing-water-polo:":"🤽‍♀️",":handball:":"🤾",":man-playing-handball:":"🤾‍♂️",":woman-playing-handball:":"🤾‍♀️",":juggling:":"🤹",":man-juggling:":"🤹‍♂️",":woman-juggling:":"🤹‍♀️",":couple:":"👫",":two_men_holding_hands:":"👬",":two_women_holding_hands:":"👭",":couplekiss:":"💏",":woman-kiss-man:":"👩‍❤️‍💋‍👨",":man-kiss-man:":"👨‍❤️‍💋‍👨",":woman-kiss-woman:":"👩‍❤️‍💋‍👩",":couple_with_heart:":"💑",":woman-heart-man:":"👩‍❤️‍👨",":man-heart-man:":"👨‍❤️‍👨",":woman-heart-woman:":"👩‍❤️‍👩",":family:":"👪",":man-woman-boy:":"👨‍👩‍👦",":man-woman-girl:":"👨‍👩‍👧",":man-woman-girl-boy:":"👨‍👩‍👧‍👦",":man-woman-boy-boy:":"👨‍👩‍👦‍👦",":man-woman-girl-girl:":"👨‍👩‍👧‍👧",":man-man-boy:":"👨‍👨‍👦",":man-man-girl:":"👨‍👨‍👧",":man-man-girl-boy:":"👨‍👨‍👧‍👦",":man-man-boy-boy:":"👨‍👨‍👦‍👦",":man-man-girl-girl:":"👨‍👨‍👧‍👧",":woman-woman-boy:":"👩‍👩‍👦",":woman-woman-girl:":"👩‍👩‍👧",":woman-woman-girl-boy:":"👩‍👩‍👧‍👦",":woman-woman-boy-boy:":"👩‍👩‍👦‍👦",":woman-woman-girl-girl:":"👩‍👩‍👧‍👧",":man-boy:":"👨‍👦",":man-boy-boy:":"👨‍👦‍👦",":man-girl:":"👨‍👧",":man-girl-boy:":"👨‍👧‍👦",":man-girl-girl:":"👨‍👧‍👧",":woman-boy:":"👩‍👦",":woman-boy-boy:":"👩‍👦‍👦",":woman-girl:":"👩‍👧",":woman-girl-boy:":"👩‍👧‍👦",":woman-girl-girl:":"👩‍👧‍👧",":selfie:":"🤳",":muscle:":"💪",":point_left:":"👈",":point_right:":"👉",":point_up:":"☝️",":point_up_2:":"👆",":middle_finger:":"🖕",":point_down:":"👇",":v:":"✌️",":crossed_fingers:":"🤞",":spock-hand:":"🖖",":the_horns:":"🤘",":call_me_hand:":"🤙",":raised_hand_with_fingers_splayed:":"🖐️",":hand:":"✋",":ok_hand:":"👌",":+1:":"👍",":-1:":"👎",":fist:":"✊",":facepunch:":"👊",":left-facing_fist:":"🤛",":right-facing_fist:":"🤜",":raised_back_of_hand:":"🤚",":wave:":"👋",":i_love_you_hand_sign:":"🤟",":writing_hand:":"✍️",":clap:":"👏",":open_hands:":"👐",":raised_hands:":"🙌",":palms_up_together:":"🤲",":pray:":"🙏",":handshake:":"🤝",":nail_care:":"💅",":ear:":"👂",":nose:":"👃",":footprints:":"👣",":eyes:":"👀",":eye:":"👁️",":eye-in-speech-bubble:":"👁️‍🗨️",":brain:":"🧠",":tongue:":"👅",":lips:":"👄",":kiss:":"💋",":cupid:":"💘",":heart:":"❤️",":heartbeat:":"💓",":broken_heart:":"💔",":two_hearts:":"💕",":sparkling_heart:":"💖",":heartpulse:":"💗",":blue_heart:":"💙",":green_heart:":"💚",":yellow_heart:":"💛",":orange_heart:":"🧡",":purple_heart:":"💜",":black_heart:":"🖤",":gift_heart:":"💝",":revolving_hearts:":"💞",":heart_decoration:":"💟",":heavy_heart_exclamation_mark_ornament:":"❣️",":love_letter:":"💌",":zzz:":"💤",":anger:":"💢",":bomb:":"💣",":boom:":"💥",":sweat_drops:":"💦",":dash:":"💨",":dizzy:":"💫",":speech_balloon:":"💬",":left_speech_bubble:":"🗨️",":right_anger_bubble:":"🗯️",":thought_balloon:":"💭",":hole:":"🕳️",":eyeglasses:":"👓",":dark_sunglasses:":"🕶️",":necktie:":"👔",":shirt:":"👕",":jeans:":"👖",":scarf:":"🧣",":gloves:":"🧤",":coat:":"🧥",":socks:":"🧦",":dress:":"👗",":kimono:":"👘",":bikini:":"👙",":womans_clothes:":"👚",":purse:":"👛",":handbag:":"👜",":pouch:":"👝",":shopping_bags:":"🛍️",":school_satchel:":"🎒",":mans_shoe:":"👞",":athletic_shoe:":"👟",":high_heel:":"👠",":sandal:":"👡",":boot:":"👢",":crown:":"👑",":womans_hat:":"👒",":tophat:":"🎩",":mortar_board:":"🎓",":billed_cap:":"🧢",":helmet_with_white_cross:":"⛑️",":prayer_beads:":"📿",":lipstick:":"💄",":ring:":"💍",":gem:":"💎"};
const emojiRe = new RegExp("(" + RegExp.escape(Object.keys(emojiShortcuts).join("|")) + ")", "g");

chatExpand = function() {
	var gameframe = document.documentElement.getElementsByClassName("gameframe")[0];
	var chatInput = gameframe.contentWindow.document.querySelector('[data-hook="input"]');
	chrome.storage.local.get({'haxShortcut': '{"/h1":"/handicap 100","/e1":"/extrapolation 10"}'}, function (items) {
		chatShortcuts = JSON.parse(items.haxShortcut);
		expandRe = new RegExp("^(" + RegExp.escape(Object.keys(chatShortcuts).join("|")) + ")$", "g");
	});
	
	chrome.storage.local.get({'haxShortcutConfig': false}, function (items) {
		if (items.haxShortcutConfig) {
			chatInput.value = chatInput.value.replace(expandRe, function($0, $1) {
				return chatShortcuts[$1.replace('\\','').toLowerCase()]; } )
			chatInput.value = chatInput.value.replace(emojiRe, function($0, $1) {
				return emojiShortcuts[$1.replace('\\','').toLowerCase()]; } )
		}});
}

chatListener = function () {
	clearTimeout(chatTimer);
	chatTimer = setTimeout(chatExpand, 100);
}

// gametimer - haxTimerConfig
var totSess;
var curSess;
var timerUpd;
var timer = document.createElement('div');
timer.style = 'position: absolute; bottom: 0px; left: 0px; font-size: 14px; visibility: none';
timer.id = 'gametimer';

function dhm(t){
    var cd = 24 * 60 * 60 * 1000,
        ch = 60 * 60 * 1000,
        d = Math.floor(t / cd),
        h = Math.floor( (t - d * cd) / ch),
        m = Math.round( (t - d * cd - h * ch) / 60000),
        pad = function(n){ return n < 10 ? '0' + n : n; };
  if( m === 60 ){
    h++;
    m = 0;
  }
  if( h === 24 ){
    d++;
    h = 0;
  }
  return [d, pad(h), pad(m)].join(':');
}

chrome.storage.local.get({'haxTotSess': 0}, function (items) {
	totSess = items.haxTotSess;
});

// main observer to detect changes to views
moduleObserver = new MutationObserver(function(mutations) {
	candidates = mutations.flatMap(x => Array.from(x.addedNodes)).filter(x => x.className);
	if (candidates.length == 1) {
		var tempView = candidates[0].className;
		console.log(tempView);
		switch(true) {
			case tempView == "choose-nickname-view":
				nickWait = waitForElement('[data-hook="input"]');
				nickWait.then(function(nicknameInput) { 
					myNick = nicknameInput.value;
					muteExceptions = ['humpyhost','Hostinho',myNick];
					})
				
				// addon settings
				addonSettingsPopup('choose-nickname-view');
				el.contentWindow.document.querySelector('h1').parentNode.appendChild(copyright());
				break;
				
			case tempView == "roomlist-view":
				// early exit
				chrome.storage.local.get({'haxSearchConfig' : true, 'haxAutoJoinConfig' : true},
				function (items) {
					if (items.haxSearchConfig) { createSearch(); }
					if (items.haxAutoJoinConfig) { createButton(); }
				});
				
				var gameframe = document.getElementsByClassName('gameframe')[0];
				var changeNickBtn = gameframe.contentWindow.document.querySelector('[data-hook="changenick"]');
				var addonSettingsBtn = document.createElement('button');
				var addonSettingsDiv = document.createElement('div');
				var addonSettingsIcon = document.createElement('i');
				
				addonSettingsIcon.className = 'icon-cog';
				addonSettingsBtn.appendChild(addonSettingsIcon);
				addonSettingsDiv.append('Add-on');
				addonSettingsBtn.appendChild(addonSettingsDiv);
				
				addonSettingsBtn.onclick = function () {
					changeNickBtn.click();
					var addonSettingsOpen = waitForElement('[data-hook="add-on"]');
					addonSettingsOpen.then(function (btn) { btn.click() });
				}
				
				changeNickBtn.parentNode.insertBefore(addonSettingsBtn,changeNickBtn);
				
				clearInterval(timerUpd);
				break;
				
			case tempView == "game-view":
				muted = new Set();
				muteAllToggle = false;
				chatWait = waitForElement('[data-hook="log"]');
				chatWait.then(function (chatArea) {
					chatObserver.observe(chatArea, {childList: true, subtree: true});
				});
				
				var gameframe = document.documentElement.getElementsByClassName("gameframe")[0];
				var bottomSec = gameframe.contentWindow.document.getElementsByClassName('bottom-section')[0];
				var statSec = gameframe.contentWindow.document.getElementsByClassName('stats-view')[0];
				var chatInput = gameframe.contentWindow.document.querySelector('[data-hook="input"]');
				chatInput.placeholder = 'Press key below ESC to toggle chat hide';
				
				chatInput.addEventListener("keypress", chatListener);
				
				chrome.storage.local.get({'haxTransChatConfig' : false},
					function (items) {
						if (items.haxTransChatConfig) { 
							bottomSec.removeAttribute('style');
						}
				});
				
				inGame = waitForElement('.bar-container');
				inGame.then(function () {
					toggleChatOpt();
					toggleChatKb();
					
					chrome.storage.local.get({'haxTransChatConfig' : false},
					function (items) {
						if (items.haxTransChatConfig) { 
							chatFormat(bottomSec,statSec,chatInput,'absolute');
						}
					});
				});
				
				settingsWait = waitForElement('[data-hook="settings"]');
				settingsWait.then(function (settingButton) {
					navBar = document.getElementsByClassName('header')[0];
					navBar.style.transition = 'height 0.3s';
					hideNavBar = document.createElement('button');
					
					chrome.storage.local.get({'haxHideNavConfig' : true}, function (items) {
						if (items.haxHideNavConfig) {
							hideNavBar.innerText = 'Show Navbar';
							navBar.style.height = '0px';
						}
						else {
							navBar.setAttribute('id','nothidden'); 
							hideNavBar.innerText = 'Hide Navbar';
							navBar.style.height = '35px';
						}
					});
					
					hideNavBar.onclick = function () {
						if (navBar.hasAttribute('id')) { 
							navBar.removeAttribute('id','nothidden');
							navBar.style.height = '0px';
							hideNavBar.innerText = 'Show NavBar';
							}
						else { 
							navBar.style.height = '35px';
							navBar.setAttribute('id','nothidden'); 
							hideNavBar.innerText = 'Hide NavBar';
							}
					}
					
					addonSettingsPopup('game-view');
					settingButton.parentNode.appendChild(hideNavBar);
				})
				
				chrome.storage.local.get({'haxMuteConfig' : true}, function (items) {
					if (items.haxMuteConfig) {
						muteAll = document.createElement('button');
						muteAll.style.padding = '5px 10px';
						muteAll.style.width = '80px';
						muteAll.innerText = 'Mute';
						muteAll.onclick = function () { 
							if (muteAllToggle) {
								muteAllToggle = false;
								var chats = gameframe.contentWindow.document.querySelector('[data-hook="log"]').getElementsByTagName('p');
								for (i = 0; i < chats.length; i++) { chats[i].removeAttribute('hidden'); }
								muteAll.innerText = 'Mute';
							}
							else {
								muteAllToggle = true;
								muteAll.innerText = 'Unmute';
							}
						}
					var dividerDiv = document.createElement('div');
					dividerDiv.style = 'width: 5px';
					chatInput.parentNode.appendChild(dividerDiv);
					chatInput.parentNode.insertBefore(muteAll,chatInput);
					}
				});
				
				chrome.storage.local.get({'haxShortcutConfig' : false}, function (items) {
					if (items.haxShortcutConfig) {
						var emojiDoc = document.createElement('button');
						emojiDoc.style.padding = '5px 10px';
						emojiDoc.innerText = '😊';
						emojiDoc.onclick = function () { chrome.runtime.sendMessage({'type': 'emoji'}) };
						
						chatInput.parentNode.insertBefore(emojiDoc, chatInput.parentNode.lastChild.previousSibling);
					}
				});
				
				var joinTime = new Date();
				var timerPos = document.getElementsByClassName('header')[0];
				timerPos.insertBefore(timer, timerPos.firstChild);
				chrome.storage.local.get({'haxTimerConfig': true}, function (items) {
					if (items.haxTimerConfig) {		
						timer.style.visibility = 'unset';
					}
				});
				
				timerUpd = setInterval(function () {
					curSess = new Date() - joinTime;
					totSess += 1000;
					timer.innerText = `Current: ${dhm(curSess)} | Total: ${dhm(totSess)}`
					chrome.storage.local.set({'haxTotSess': totSess}, function () {});
				}, 1000);
				break;
			case tempView == "dialog":
				chrome.storage.local.get({'haxMuteConfig' : true}, function (items) {
					if (items.haxMuteConfig) {
						var popupWait = waitForElement('div.dialog');
						popupWait.then(function (popup) {
							var name = popup.firstChild.innerText;
							var muteBtn = document.createElement('button');
							muteBtn.className = 'mb';
							popup.insertBefore(muteBtn, popup.lastChild);
							if (muted.has(name)) {
								muteBtn.innerText = 'Unmute';
							}
							else {
								muteBtn.innerText = 'Mute';
							}
							muteBtn.onclick = function () { 
								if (muted.has(name)) {
									muted.delete(name);
									muteBtn.innerText = 'Mute';
									}
								else {
									muted.add(name);
									muteBtn.innerText = 'Unmute';
									}
							}
						});}})
				break;
			case Boolean(tempView.match(/^(room-view|player-list-item|notice)/)):				
				// early exit
				var gameframe = document.documentElement.getElementsByClassName("gameframe")[0];
				
				if (tempView.startsWith('room-view')) {
					var bottomSec = gameframe.contentWindow.document.getElementsByClassName('bottom-section')[0];
					var statSec = gameframe.contentWindow.document.getElementsByClassName('stats-view')[0];
					var chatInput = gameframe.contentWindow.document.querySelector('[data-hook="input"]');
					bottomSec.removeAttribute('style');
					gameframe.contentWindow.document.onkeydown = function (f) {
						if (f.code == 'KeyR') {
							chrome.storage.local.get({'haxRecordHotkey' : false},
								function (items) { if (items.haxRecordHotkey) { record(false) }})
						}
					}
					
				}
				
				chrome.storage.local.get({'haxKickBanConfig' : false}, function (items) {
					if (items.haxKickBanConfig) {
						var players = gameframe.contentWindow.document.querySelectorAll('[class^=player-list-item]');
						var adminStatus = (gameframe.contentWindow.document.querySelector("[class$='view admin']") !== null);
						players.forEach(x => checkForButtons(x, adminStatus));
						gameframe.contentWindow.document.getElementsByTagName('body')[0].appendChild(dblDiv);
					}
				});
				
				// notification funstuff begins!	
				chrome.storage.local.get({'haxNotifConfig' : false}, function (items) {
					if (items.haxNotifConfig) {
						var notifOpt = {type: 'basic', title: 'Haxball All-in-one Tool', 
										message: 'You were moved into a team', iconUrl: 'icon.png'};
						if (tempView.match(/^(player-list-item)/)) {
							playersMoved = mutations.filter(x => x.addedNodes.length > 0 && x.target.parentNode.className.match(/[blue|red]$/));
							if (playersMoved.flatMap(x => Array.from(x.addedNodes)).map(x => x.childNodes[1].innerText).includes(myNick)) {
								chrome.runtime.sendMessage({type: 'team', opt: notifOpt});
								}
							}
						if (tempView == 'notice') {
							var noticeMsgs = mutations.flatMap(x => Array.from(x.addedNodes)).map(x => x.innerText);
							if (noticeMsgs.filter(x => x.startsWith(myNick + ' was moved')).length > 0) {
								chrome.runtime.sendMessage({type: 'team', opt: notifOpt});
							}
						}
				}});
				break;
			case tempView == 'highlight':
				chrome.storage.local.get({'haxNotifConfig' : false}, function (items) {
					if (items.haxNotifConfig) {
						var highlightMsg = candidates[0].innerText;
						var notifOpt = {type: 'basic', title: 'Haxball All-in-one Tool', 
										message: highlightMsg, iconUrl: 'icon.png'};
						chrome.runtime.sendMessage({type: 'highlight', opt: notifOpt});
				}});
				break;
			case tempView == 'game-state-view':
				var gameframe = document.documentElement.getElementsByClassName("gameframe")[0];
				var bottomSec = gameframe.contentWindow.document.getElementsByClassName('bottom-section')[0];
				var statSec = gameframe.contentWindow.document.getElementsByClassName('stats-view')[0];
				var chatInput = gameframe.contentWindow.document.querySelector('[data-hook="input"]');
				
				chrome.storage.local.get({'haxTransChatConfig' : false},
					function (items) {
						if (items.haxTransChatConfig) { 
							chatFormat(bottomSec,statSec,chatInput,'absolute');
						}
				});
				
				// toggle chat visibility
				toggleChatOpt();
				toggleChatKb();
				break;
			}	
		}
});

// where it all begins for view detection
init = waitForElement("div[class$='view']");
init.then(function(value) {
	currentView = value.parentNode;
	moduleObserver.observe(currentView, {childList: true, subtree: true});
});