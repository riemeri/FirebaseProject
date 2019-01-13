//JS file details page after login

var user = firebase.auth().currentUser;
var name, email, photoUrl, uid, emailVerified;
var db = firebase.database();

let notesBody = document.getElementById('notes-body');
let noteDisplay = document.getElementById('note-display');
//let nameDisplay = document.getElementById('name-display');
//let emailDisplay = document.getElementById('email-display');

//On change of auth state, get user info or return home if no one is logged in
firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		// User is signed in.
		name = user.displayName;
		email = user.email;
		photoUrl = user.photoURL;
		emailVerified = user.emailVerified;
		uid = user.uid;  // The user's ID, unique to the Firebase project. Do NOT use
					   // this value to authenticate with your backend server, if
					   // you have one. Use User.getToken() instead.
		//nameDisplay.innerHTML = 'Display Name: ' + name;
		//emailDisplay.innerHTML = 'Email: ' + email;

		db.ref('users/' + uid).set({
			name: name,
			email: email,
		});

		checkTable(uid);
	} else {
		// No user is signed in.
		window.location.href = "https://fir-notes-2eb81.firebaseapp.com/";
	}
});

//Logout user (which triggers an auth state change, returning the user to the login page
let logoutBtn = document.getElementById('logout');
logoutBtn.addEventListener('click', (ev) => { 
	firebase.auth().signOut().then(() => {
		//window.location.href = "https://fir-notes-2eb81.firebaseapp.com/";
	}).catch(err => {
		alert('Error: ' + err.message);
		console.log(error);
	});
}, false);

let addButton = document.getElementById('add-button');
addButton.addEventListener('click', (ev) => {

	var newKey = db.ref().child('notes/'+ uid).push({
		title: 'New note yo',
		content: 'Write notes here',
		created: '01-12-2019',
		updated: '01-12-2019'
	}).key;
	
	showNote(newKey);
	/*var noteData = {
		title: 'New note',
		content: 'Write notes here',
		created: '01-12-2019',
		updated: '01-12-2019'
	};
	var updates = {};
	updates['/notes/' + uid + '/' + newKey] = noteData;
	db.ref().update(updates);
	*/
});

function checkTable(id) {
	var notesRef = db.ref('/notes/' + id);
	notesRef.on('value', (snapshot) => {
		updateTable(snapshot);
		//alert('table updated');
	});
}

function updateTable(snapshot) {
	var notes = snapshot.val();
	console.log(notes);
	notesBody.innerHTML = '';
	var key;
	var fst = 0;
	snapshot.forEach(function (notes){
		//console.log(element.key);
		if (fst == 0) {
			key = notes.key;
			fst = 1;
		}
		var len = notes.val().content.length;
		addTableEntry(notes.val().title, len, notes.key);
	});
	showNote(key);
}

function addTableEntry(title, length, key) {
	var rows = notesBody.rows.length;
	row = notesBody.insertRow(rows);
	var cell1 = row.insertCell(0);
	var cell2 = row.insertCell(1);
	var cell3 = row.insertCell(2);
	cell1.className = "mdl-data-table__cell--non-numeric";
	cell1.innerHTML = title;
	row.addEventListener('click', (ev) => {
		showNote(key);
	});

	cell2.innerHTML = length;
	cell3.innerHTML = '<a class="mdl-list__item-secondary-action" href="#"><i class="material-icons">list</i></a>';
	//Add button which activates the function 'showNote(noteKey)'
	/*var myhtml = '<button class="mdl-button mdl-js-button" onclick="showNote(';
	myhtml += "'";
	myhtml += key;
	myhtml += "'";
	myhtml += ')"><i class="material-icons">list</i></button>';
	cell3.innerHTML = myhtml;*/
}

function showNote(noteKey) {
	db.ref('notes/' + uid + '/' + noteKey).once('value').then(function(snapshot) {
		noteDisplay = document.getElementById('note-display');
		var htmlText = '<form class="">';
		htmlText += '	<div class="edit-note-title mdl-textfield mdl-js-textfield mdl-textfield--floating-label">';
		htmlText += '		<label for="title-input">Title</label>';
		htmlText += '		<input type="text" class="mdl-textfield__input" id="title-input" value="' + snapshot.val().title + '">';
		htmlText += '	</div><br>';
		htmlText += '	<div class="edit-content mdl-textfield mdl-js-textfield">';
		htmlText += '		<textarea type="text" rows="10" class="mdl-textfield__input" id="text-input">';
		htmlText += snapshot.val().content;
		htmlText += '</textarea></div></form>';
		noteDisplay.innerHTML = htmlText;
		
		var btn = document.createElement("BUTTON");
		btn.appendChild(document.createTextNode("Save"));
		btn.className = "mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent";
		btn.id = "save-button";
		noteDisplay.appendChild(btn);
		saveButton(noteKey);
		//document.getElementById('note-title').innerHTML = snapshot.val().title;
		//document.getElementById('note-content').innerHTML = snapshot.val().content;
	});
}

function saveButton(noteKey) {
	let saveButton = document.getElementById('save-button');
	saveButton.addEventListener('click', (ev) => {
		//alert("Save button clicked");
		var noteData = {
			title: document.getElementById('title-input').value,
			content: document.getElementById('text-input').value,
			created: '01-12-2019',
			updated: '01-12-2019'
		};
		var updates = {};
		updates['/notes/' + uid + '/' + noteKey] = noteData;
		db.ref().update(updates);
	});
}
