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