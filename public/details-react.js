
var user = firebase.auth().currentUser;
var name, email, photoUrl, uid, emailVerified;
var db = firebase.database();
var storageRef = firebase.storage().ref();
var imgElements = [];

var categoryKey = null;
var curNoteKey = null;
var currentPath = null;
var createDate = void 0;
var notesBody = document.getElementById('notes-body');
var categoryList = document.getElementById('category-list');
var noteDisplay = document.getElementById('note-display');

function updateCurrentPath() {
	currentPath = uid + '/' + categoryKey + '/notes/' + curNoteKey;
}

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

		//checkTable(uid);
		manualUpdate();
	} else {
		// No user is signed in.
		window.location.href = "https://fir-notes-2eb81.firebaseapp.com/";
	}
});

//Logout user (which triggers an auth state change, returning the user to the login page
var logoutBtn = document.getElementById('logout');
logoutBtn.addEventListener('click', function (ev) {
	firebase.auth().signOut().then(function () {}).catch(function (err) {
		alert('Error: ' + err.message);
		console.log(error);
	});
}, false);

var addCategoryButton = document.getElementById('add-category-button');
addCategoryButton.addEventListener('click', function (ev) {
	var dateObj = new Date();

	categoryKey = db.ref().child('note-categories/' + uid).push({
		title: 'New Category',
		created: dateObj.toJSON(),
		updated: dateObj.toJSON()
	}).key;

	addNote();
});

function checkTable(id) {
	var notesRef = db.ref('/note-categories/' + id);
	notesRef.on('value', function (snapshot) {
		updateTable(snapshot);
		//alert('table updated');
	});
}

function manualUpdate() {
	db.ref('/note-categories/' + uid).once('value', function (snapshot) {
		updateTable(snapshot);
	});
}

function updateTable(snapshot) {
	//notesBody.innerHTML = '';
	snapshot.forEach(function (category) {
		if (categoryKey == null) {
			categoryKey = category.key;
		}
		if (curNoteKey == null) {
			category.child('notes').forEach(function (note) {
				curNoteKey = note.key;
				updateCurrentPath();
				showNote(curNoteKey);
				return true;
			});
		}
		return true;
	});

	var catKeys = Object.keys(snapshot.exportVal());
	var catArray = Object.values(snapshot.exportVal());
	var i = 0;
	var catList = catArray.map(function (category) {
		var cKey = catKeys[i];
		//console.log(category);
		i++;
		return React.createElement(CategoryEntry, { name: category.title, cKey: cKey, notes: category.notes });
	});

	ReactDOM.render(catList, categoryList);
}

function CategoryEntry(props) {
	function selectCategory() {
		categoryKey = props.cKey;
		updateCurrentPath();
		manualUpdate();
	}
	function saveCategory() {
		var name = document.getElementById('cat-title').value;
		db.ref('/note-categories/' + currentPath).update({ title: name });
		manualUpdate();
	}
	function editCatName() {
		var titleDiv = document.getElementById('cat-title-box');
		var elm = React.createElement(
			'form',
			null,
			React.createElement('input', { id: 'cat-title', type: 'text', value: props.name, className: 'mdl-textfield--input' }),
			React.createElement(
				'button',
				{ onClick: saveCategory, className: 'mdl-button mdl-js-button mdl-button--icon' },
				React.createElement(
					'i',
					{ className: 'material-icons' },
					'save'
				)
			)
		);
		ReactDOM.render(elm, titleDiv);
	}
	//var dateObj = new Date(date);
	//var dateText = '' + (dateObj.getMonth()+1) + '/' + dateObj.getDate() + '/' + dateObj.getFullYear();
	var notesArray = [];
	if (props.notes != null) {
		notesArray = Object.values(props.notes);
		var noteKeys = Object.keys(props.notes);
	}
	var i = 0;
	var noteList = notesArray.map(function (note) {
		var nKey = noteKeys[i];
		function doShowNote() {
			curNoteKey = nKey;
			categoryKey = props.cKey;
			updateCurrentPath();
			showNote(nKey);
		}
		i = i + 1;
		return React.createElement(
			'li',
			{ key: note.created },
			React.createElement(
				'a',
				{ href: '#', onClick: doShowNote },
				note.title
			)
		);
	});

	if (props.cKey == categoryKey) {
		return React.createElement(
			'div',
			{ onClick: selectCategory, className: 'cat-card mdl-card mdl-shadow--2dp', key: props.cKey },
			React.createElement(
				'div',
				{ id: 'cat-title-box' },
				React.createElement(
					'h4',
					{ style: { marginLeft: '14px' } },
					props.name
				),
				React.createElement(
					'button',
					{ onClick: editCatName, className: 'edit-cat mdl-button mdl-js-button mdl-button--icon' },
					React.createElement(
						'i',
						{ className: 'material-icons' },
						'edit'
					)
				)
			),
			React.createElement(
				'ul',
				null,
				noteList
			),
			React.createElement(NoteAddButton, { cKey: props.cKey })
		);
	} else {
		return React.createElement(
			'div',
			{ onClick: selectCategory, className: 'cat-card mdl-card mdl-shadow--2dp', key: props.cKey },
			React.createElement(
				'h5',
				{ style: { marginLeft: '14px' } },
				props.name
			)
		);
	}
}

function NoteAddButton(props) {
	function callAddNote() {
		addNote(props.cKey);
	}

	return React.createElement(
		'button',
		{ onClick: callAddNote, className: 'add-note-button mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab mdl-js-ripple-effect mdl-button--colored mdl-shadow--4dp' },
		React.createElement(
			'i',
			{ className: 'material-icons' },
			'add'
		)
	);
}

function addNote(catKey) {
	var dateObj = new Date();

	curNoteKey = db.ref().child('note-categories/' + uid + '/' + catKey + '/notes').push({
		title: 'New note',
		content: '',
		created: dateObj.toJSON(),
		updated: dateObj.toJSON()
	}).key;

	updateCurrentPath();
	manualUpdate();
	showNote(curNoteKey);
}

function showNote(noteKey) {
	db.ref('note-categories/' + uid + '/' + categoryKey + '/notes/' + noteKey).once('value').then(function (snapshot) {
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
				React.createElement('textarea', { type: 'text', rows: '10', className: 'mdl-textfield__input', id: 'text-input', defaultValue: snapshot.val().content }),
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

		noteKey = snapshot.key;
		updateCurrentPath();
		createDate = snapshot.val().created;
	}).catch(function (error) {
		console.log(error.message);
	});
}

function showNoteFiles(noteKey) {
	var filesRef = storageRef.child('/files/' + currentPath);
	var fileDisplay = document.getElementById('file-display');
	ReactDOM.render(React.createElement('div', null), fileDisplay);

	var notesMeta = db.ref('note-categories/' + currentPath + '/files').once('value').then(function (snapshot) {
		if (snapshot.hasChildren()) {
			var fileArray = Object.values(snapshot.exportVal());
			createImageList(fileArray, filesRef, fileDisplay);
		} else {
			//snackbarToast("No files.");
		}
	});
}

function createImageList(fileArray, filesRef, fileDisplay) {

	var promises = fileArray.map(function (file) {
		return filesRef.child(file.name).getDownloadURL().then(function (url) {
			var tag = file.name.slice(-4).toLowerCase();
			return React.createElement(FileHolder, { path: url, name: file.name, tag: tag });
		});
	});
	Promise.all(promises).then(function (imgElements) {
		ReactDOM.render(imgElements, fileDisplay);
	});
}

function FileHolder(props) {
	function deleteClicked() {
		var path = '/files/' + currentPath + '/' + props.name;
		deleteFile(path);
		db.ref('/note-categories/' + currentPath + '/files/' + props.name.slice(0, -4)).remove().then(function () {
			//snackbarToast("Entry removed.");
		}).catch(function (error) {
			snackbarToast("Failed to remove DB entry.");
			console.log(error.message);
		});
		showNote(curNoteKey);
	}
	if (props.tag == '.jpg' || props.tag == '.png') {
		return React.createElement(
			'div',
			{ className: 'file-card mdl-card mdl-cell mdl-cell--6-col mdl-cell--8-col-phone mdl-shadow--2dp' },
			React.createElement('img', { className: 'file-image', src: props.path, alt: props.name }),
			React.createElement(
				'a',
				{ className: 'file-card-text mdl-card__supporting-text', href: props.path },
				props.name
			),
			React.createElement(
				'button',
				{ onClick: deleteClicked, className: 'delete-file-button mdl-button mdl-js-button mdl-button--icon' },
				React.createElement(
					'i',
					{ className: 'material-icons' },
					'delete_forever'
				)
			)
		);
	} else {
		return React.createElement(
			'div',
			{ className: 'file-card mdl-card mdl-cell mdl-cell--6-col mdl-cell--8-col-phone mdl-shadow--2dp' },
			React.createElement(
				'a',
				{ className: 'file-card-text no-image mdl-card__supporting-text  mdl-components__link', href: props.path },
				props.name
			),
			React.createElement(
				'button',
				{ onClick: deleteClicked, className: 'delete-file-button mdl-button mdl-js-button mdl-button--icon' },
				React.createElement(
					'i',
					{ className: 'material-icons' },
					'delete_forever'
				)
			)
		);
	}
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
	db.ref('/note-categories/' + currentPath).once('value').then(function (snapshot) {
		if (snapshot.hasChild('files')) {
			noteData.files = snapshot.child('files').val();
		} else {
			//snackbarToast("No files to update.");
		}
		var updates = {};
		updates['/note-categories/' + currentPath] = noteData;
		db.ref().update(updates);
		manualUpdate();
		snackbarToast('"' + noteData.title + '" saved.');
	});
});

function deleteFile(path) {
	storageRef.child(path).delete().then(function () {
		snackbarToast("Deleted: " + path);
	}).catch(function (error) {
		snackbarToast("Failed to delete files.");
		console.log(error.message);
	});
}

var deleteButton = document.getElementById('delete-button');
deleteButton.addEventListener('click', function (ev) {
	var title = document.getElementById('title-input').value;
	var curNote = db.ref('/note-categories/' + currentPath);
	curNote.once('value').then(function (snapshot) {
		if (snapshot.hasChild('files')) {
			var curFiles = snapshot.child('files');
			curFiles.forEach(function (cs) {
				deleteFile(cs.val().path);
			});
		}
	});

	curNote.remove().then(function () {
		snackbarToast('"' + title + '" deleted.');
		categoryKey = null;
		curNoteKey = null;
		currentPath = null;
		manualUpdate();
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
	var fileRef = storageRef.child('files/' + currentPath + '/' + file.name);
	snackbarToast("Uploading: " + file.name);
	fileRef.put(file).then(function (snapshot) {
		snackbarToast('Successfully uploaded "' + file.name + '"');
		showNoteFiles(curNoteKey);
	}).catch(function (error) {
		snackbarToast('Failed to upload "' + file.name + '"');
		console.log(error.message);
	});

	var fileMeta = db.ref().child('note-categories/' + currentPath + '/files/' + file.name.slice(0, -4)).set({
		name: file.name,
		path: fileRef.fullPath,
		type: file.type
	});
	showNote(curNoteKey);
}

function snackbarToast(toast) {
	var snackbar = document.getElementById('note-snackbar');
	snackbar.MaterialSnackbar.showSnackbar({
		message: toast
	});
}