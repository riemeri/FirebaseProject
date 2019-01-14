
var user = firebase.auth().currentUser;
var name, email, photoUrl, uid, emailVerified;
var db = firebase.database();

let currentKey;
let createDate;
let notesBody = document.getElementById('notes-body');
let noteDisplay = document.getElementById('note-display');

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
    var dateObj = new Date();
    //var date = "" + dateObj.getMonth() + '-'

	var newKey = db.ref().child('notes/'+ uid).push({
		title: 'New note',
		content: '',
		created: dateObj.toJSON(),
		updated: dateObj.toJSON()
	}).key;
	
	showNote(newKey);
});

function checkTable(id) {
	var notesRef = db.ref('/notes/' + id);
	notesRef.on('value', (snapshot) => {
		updateTable(snapshot);
		//alert('table updated');
	});
}

function updateTable(snapshot) {
	notesBody.innerHTML = '';
	var key;
	var fst = 0;
	snapshot.forEach(function (notes){
		if (fst == 0) {
			key = notes.key;
			fst = 1;
		}
		//var len = notes.val().content.length;
		addTableEntry(notes.val().title, notes.key, notes.val().created);
	});
	showNote(key);
}

function addTableEntry(title, key, date) {
	var rows = notesBody.rows.length;
	row = notesBody.insertRow(rows);
	var cell1 = row.insertCell(0);
	var cell2 = row.insertCell(1);
	//var cell3 = row.insertCell(2);
	cell1.className = "mdl-data-table__cell--non-numeric";
	cell1.innerHTML = title;
	row.addEventListener('click', (ev) => {
		showNote(key);
	});

    var dateObj = new Date(date);
    var dateText = '' + (dateObj.getMonth()+1) + '/' + dateObj.getDate() + '/' + dateObj.getFullYear();
    cell2.innerHTML = dateText;
}

function showNote(noteKey) {
	db.ref('notes/' + uid + '/' + noteKey).once('value').then(function(snapshot) {
        const noteElement = (
            <form key={snapshot.key}>
                <div className="edit-note-title mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
                    <label className="title-label mdl-textfield__label" htmlFor="title-input">Title</label>
                    <input type="text" className="mdl-textfield__input" id="title-input" defaultValue={snapshot.val().title}></input>
                </div><br></br>	
                <div className="edit-content mdl-textfield mdl-js-textfield">
                    <textarea type="text" rows="12" className="mdl-textfield__input" id="text-input" defaultValue={snapshot.val().content}>
                    </textarea>
                    <label className="note-label mdl-textfield__label" htmlFor="text-input">Notes</label>
                </div>
            </form>
        );

		var noteform = document.getElementById('note-form');
        ReactDOM.render(noteElement, noteform);

        ReactDOM.render("Save", document.getElementById('save-button'));
        currentKey = snapshot.key;
        createDate = snapshot.val().created;
	});
}

let saveButton = document.getElementById('save-button');
saveButton.addEventListener('click', (ev) => {
    //alert("Save button clicked");
    var dateObj = new Date();

    var noteData = {
        title: document.getElementById('title-input').value,
        content: document.getElementById('text-input').value,
        created: createDate,
        updated: dateObj.toJSON()
    };
    var updates = {};
    updates['/notes/' + uid + '/' + currentKey] = noteData;
    db.ref().update(updates);
    snackbarToast('"' + noteData.title + '" saved.');
});

let deleteButton = document.getElementById('delete-button');
deleteButton.addEventListener('click', (ev) => {
        var title = document.getElementById('title-input').value;
    db.ref('/notes/' + uid + '/' + currentKey).remove()
        .then(function() {
            snackbarToast('"' + title + '" deleted.');
        })
        .catch(function(error) {
            snackbarToast('Failed to delete "' + title + '"')
        });
});


function snackbarToast(toast) {
	var snackbar = document.getElementById('note-snackbar');
	snackbar.MaterialSnackbar.showSnackbar({
		message: toast
	});
}


