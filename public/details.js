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
		alert('table updated');
	});
}

function updateTable(snapshot) {
	var notes = snapshot.val();
	console.log(notes);
	notesBody.innerHTML = '';
	snapshot.forEach(function (element){
		//console.log(element.key);
		var len = element.val().content.length;
		addTableEntry(element.val().title, len, element.key);
	});
}

function addTableEntry(title, length, key) {
	var rows = notesBody.rows.length;
	row = notesBody.insertRow(rows);
	var cell1 = row.insertCell(0);
	var cell2 = row.insertCell(1);
	var cell3 = row.insertCell(2);
	cell1.className = "mdl-data-table__cell--non-numeric";
	cell1.innerHTML = title;

	cell2.innerHTML = length;
	//cell3.innerHTML = '<a class="mdl-list__item-secondary-action" href="#"><i class="material-icons">list</i></a>';
	//Add button which activates the function 'showNote(noteKey)'
	var myhtml = '<button class="mdl-button mdl-js-button" onclick="showNote(';
	myhtml += "'";
	myhtml += key;
	myhtml += "'";
	myhtml += ')"><i class="material-icons">list</i></button>';
	cell3.innerHTML = myhtml;
}

function showNote(noteKey) {
	db.ref('notes/' + uid + '/' + noteKey).once('value').then(function(snapshot) {
		document.getElementById('note-title').innerHTML = snapshot.val().title;
		document.getElementById('note-content').innerHTML = snapshot.val().content;
	});
}