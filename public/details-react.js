
var user = firebase.auth().currentUser;
var name, email, photoUrl, uid, emailVerified;
var db = firebase.database();
var storageRef = firebase.storage().ref();
var imgElements = [];

var currentKey = void 0;
var createDate = void 0;
var notesBody = document.getElementById('notes-body');
var noteDisplay = document.getElementById('note-display');

//On change of auth state, get user info or return home if no one is logged in
firebase.auth().onAuthStateChanged(function (user) {
	if (user) {
		// User is signed in.
		name = user.displayName;
		email = user.email;
		photoUrl = user.photoURL;
		emailVerified = user.emailVerified;
		uid = user.uid; // The user's ID, unique to the Firebase project. Do NOT use
		// this value to authenticate with your backend server, if
		// you have one. Use User.getToken() instead.

		db.ref('users/' + uid).set({
			name: name,
			email: email
		});

		checkTable(uid);
	} else {
		// No user is signed in.
		window.location.href = "https://fir-notes-2eb81.firebaseapp.com/";
	}
});

//Logout user (which triggers an auth state change, returning the user to the login page
var logoutBtn = document.getElementById('logout');
logoutBtn.addEventListener('click', function (ev) {
	firebase.auth().signOut().then(function () {
		//window.location.href = "https://fir-notes-2eb81.firebaseapp.com/";
	}).catch(function (err) {
		alert('Error: ' + err.message);
		console.log(error);
	});
}, false);

var addButton = document.getElementById('add-button');
addButton.addEventListener('click', function (ev) {
	var dateObj = new Date();

	var newKey = db.ref().child('notes/' + uid).push({
		title: 'New note',
		content: '',
		created: dateObj.toJSON(),
		updated: dateObj.toJSON()
	}).key;

	showNote(newKey);
});

function checkTable(id) {
	var notesRef = db.ref('/notes/' + id);
	notesRef.on('value', function (snapshot) {
		updateTable(snapshot);
		//alert('table updated');
	});
}

function updateTable(snapshot) {
	notesBody.innerHTML = '';
	var key;
	var fst = 0;
	snapshot.forEach(function (notes) {
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
	row.addEventListener('click', function (ev) {
		showNote(key);
	});

	var dateObj = new Date(date);
	var dateText = '' + (dateObj.getMonth() + 1) + '/' + dateObj.getDate() + '/' + dateObj.getFullYear();
	cell2.innerHTML = dateText;
}

function showNote(noteKey) {
	db.ref('notes/' + uid + '/' + noteKey).once('value').then(function (snapshot) {
		var noteElement = React.createElement(
			'form',
			{ key: snapshot.key },
			React.createElement(
				'div',
				{ className: 'edit-note-title mdl-textfield mdl-js-textfield mdl-textfield--floating-label' },
				React.createElement(
					'label',
					{ className: 'title-label mdl-textfield__label', htmlFor: 'title-input' },
					'Title'
				),
				React.createElement('input', { type: 'text', className: 'mdl-textfield__input', id: 'title-input', defaultValue: snapshot.val().title })
			),
			React.createElement('br', null),
			React.createElement(
				'div',
				{ className: 'edit-content mdl-textfield mdl-js-textfield' },
				React.createElement('textarea', { type: 'text', rows: '12', className: 'mdl-textfield__input', id: 'text-input', defaultValue: snapshot.val().content }),
				React.createElement(
					'label',
					{ className: 'note-label mdl-textfield__label', htmlFor: 'text-input' },
					'Notes'
				)
			)
		);

		var noteform = document.getElementById('note-form');
		ReactDOM.render(noteElement, noteform);

		showNoteFiles(noteKey);

		currentKey = snapshot.key;
		createDate = snapshot.val().created;
	});
}

function showNoteFiles(noteKey) {
	var filesRef = storageRef.child('/files/' + uid + '/' + noteKey);
	var fileDisplay = document.getElementById('file-display');
	ReactDOM.render(React.createElement('div', null), fileDisplay);

	var notesMeta = db.ref('notes/' + uid + '/' + noteKey + '/files').once('value').then(function (snapshot) {
		var len = snapshot.length;
		if (snapshot.hasChildren()) {
			var fileArray = Object.values(snapshot.exportVal());
			createImageList(fileArray, filesRef);
		}
	});
}

function createImageList(fileArray, filesRef) {
	var fileDisplay = document.getElementById('file-display');

	var promises = fileArray.map(function (file) {
		return filesRef.child(file.name).getDownloadURL().then(function (url) {
			return React.createElement(ImageHolder, { path: url, name: file.name });
		});
	});
	Promise.all(promises).then(function (imgElements) {
		console.log(imgElements);
		ReactDOM.render(imgElements, fileDisplay);
		snackbarToast("Finished loading files");
	});
}
//<img src={props.path} alt={props.name}></img>
//<div className="file-image" style={styles}></div>

function ImageHolder(props) {
	var style = 'background-image:url(' + props.path + ')';
	var styles = {
		backgroundImage: 'url(' + props.path + ')'
	};
	styles.backgroundImage = 'url(' + props.path + ')';
	return React.createElement(
		'div',
		{ className: 'mdl-card mdl-cell mdl-cell--6-col' },
		React.createElement('img', { className: 'file-image', src: props.path, alt: props.name })
	);
}

var saveButton = document.getElementById('save-button');
saveButton.addEventListener('click', function (ev) {
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

var deleteButton = document.getElementById('delete-button');
deleteButton.addEventListener('click', function (ev) {
	var title = document.getElementById('title-input').value;
	db.ref('/notes/' + uid + '/' + currentKey).remove().then(function () {
		snackbarToast('"' + title + '" deleted.');
	}).catch(function (error) {
		snackbarToast('Failed to delete "' + title + '"');
	});
});

var addFileButton = document.getElementById("add-file-button");
var fileInput = document.getElementById("file-input");
addFileButton.addEventListener('click', function (ev) {
	fileInput.click();
});

fileInput.addEventListener('change', function (ev) {
	var selectedFile = fileInput.files[0];
	addFile(selectedFile);
});

function addFile(file) {
	var uidKey = uid + '/' + currentKey;
	var fileRef = storageRef.child('files/' + uidKey + '/' + file.name);
	fileRef.put(file).then(function (snapshot) {
		snackbarToast('Uploaded "' + file.name + '"');
		showNoteFiles(currentKey);
	}).catch(function (error) {
		snackbarToast('Failed to upload "' + file.name + '"');
		console.log(error.message);
	});

	var fileMeta = db.ref().child('notes/' + uidKey + '/files/' + file.name.slice(0, -4)).set({
		name: file.name,
		path: fileRef.fullPath,
		type: file.type
	});
}

function snackbarToast(toast) {
	var snackbar = document.getElementById('note-snackbar');
	snackbar.MaterialSnackbar.showSnackbar({
		message: toast
	});
}