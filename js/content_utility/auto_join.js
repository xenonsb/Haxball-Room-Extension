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
					rooms = el.contentWindow.document.querySelectorAll('td');
					joinRoom = Array.from(rooms).filter(el => el.innerText == roomName && el.parentNode.textContent.includes(roomDist))[0].parentNode;
					
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