// attach to initial iFrame load
var el = document.getElementsByClassName("gameframe")[0];
var muteAllToggle = false;
var myNick;

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
	chrome.storage.local.set({'haxRoomSearchTerm': input.value}, function (obj) { });
    var roomTable = dialog.querySelectorAll("[data-hook='list']")[0]
    var totalNumberOfPlayers = 0;
    var totalNumberOfRooms = 0;
	
    for(room of roomTable.rows) {
        var roomName = room.querySelectorAll("[data-hook='name']")[0].innerText;
        var roomNumPlayers = room.querySelectorAll("[data-hook='players']")[0].innerText.split('/')[0];
        roomName = roomName.toLowerCase();
	
		var searchTerms = searchRoom.split('+').filter(x => x != '');
		if (searchTerms.some(x => roomName.includes(x) || roomName.replace(/\s/g,'').includes(x)) || searchRoom == '') {
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
	autoJoinButton.onclick = check;
	
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
	try { 
		var el = document.documentElement.getElementsByClassName("gameframe")[0];
		var refreshButton = el.contentWindow.document.querySelector('button[data-hook="refresh"]');
		var selectedRoom = el.contentWindow.document.querySelector('tr.selected').childNodes;
		var roomName = selectedRoom[0].innerText;
		var roomPlayers = selectedRoom[1].innerText;
		var roomDist = selectedRoom[3].innerText;
		
		var refreshCycle = setInterval((function() { refreshButton.click() }), 500);
		
		var autoJoinObserver = new MutationObserver(function(mutations) {
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
	}
	catch { 
		alert('You must select a room first'); }
}

// admin kick/ban shortcuts by xenon
function createKickBanButtons(x, admin) {
	var displayCheck = (admin ? 'inline' : 'none');
	
	var dblDiv = document.createElement('div');
	var dblTxt = document.createTextNode('Double click!');
	dblDiv.appendChild(dblTxt);
	dblDiv.style = 'visibility: hidden; position: fixed; background-color: #0004';
	x.appendChild(dblDiv);
	
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
			record();
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

function record() {
	var gameframe = document.getElementsByClassName('gameframe')[0];
	gameframe.contentWindow.document.querySelector('[data-hook="menu"]').click();
	var recBtn = waitForElement('[data-hook="rec-btn"]');
	recBtn.then(function (btn) { btn.click() });
	gameframe.contentWindow.document.querySelector('[data-hook="menu"]').click();
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
	}
	
	newConfig.appendChild(icon);
	newConfig.append(desc);
	return newConfig
}

function addonSettingsPopup(currentView) {
	var addonSettings = document.createElement('div');
	addonSettings.className = 'dialog settings-view';
	addonSettings.style.display = 'none';

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
		};
	
	sliderDiv.append(sliderInput);
	sliderDiv.append(sliderOutput);
	
	var addonSection = document.createElement('div');
	addonSettings.appendChild(addonSection);
	addonSettings.appendChild(copyright());
	addonSection.className = 'section selected';
	addonSection.appendChild(configElem('haxSearchConfig',true,'Search bar (Raamyy)'));
	addonSection.appendChild(configElem('haxAutoJoinConfig',true,'Room AutoJoin'));
	addonSection.appendChild(configElem('haxKickBanConfig',false,'Room Kick/Ban shortcuts (double click)'));
	addonSection.appendChild(configElem('haxMuteConfig',true,'Local mute'));
	addonSection.appendChild(configElem('haxNotifConfig',false,'Game notifications'));
	addonSection.appendChild(configElem('haxTransChatConfig',false,'Transparent chat (Pacific)'));
	addonSection.appendChild(sliderDiv);
	addonSection.appendChild(configElem('haxViewModeConfig',false,'View-mode hotkeys'));
	
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
		
		addonSettingsClose.append(' - press ESC twice to apply');
		
		addonSettingsClose.onclick = function () {
			addonSettings.style.display = 'none';
		}
		
		addonSettingsOpen.onclick = function () { 
			addonSettings.style.display = 'flex';
		}
		
		settingButton.parentNode.appendChild(addonSettingsOpen);
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
					navBar.id = 'nothidden';
					hideNavBar = document.createElement('button');
					hideNavBar.innerText = 'Hide Navbar';
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
						muteAll = document.createElement('button')
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
					gameframe.contentWindow.document.onkeydown = null;
					chatInput.onkeydown = null;
					
				}
				
				chrome.storage.local.get({'haxKickBanConfig' : false}, function (items) {
					if (items.haxKickBanConfig) {
						var players = gameframe.contentWindow.document.querySelectorAll('[class^=player-list-item]');
						var adminStatus = (gameframe.contentWindow.document.querySelector("[class$='view admin']") !== null);
						players.forEach(x => checkForButtons(x, adminStatus));
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
