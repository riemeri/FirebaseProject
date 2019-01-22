
var user = firebase.auth().currentUser;
var name, email, photoUrl, uid, emailVerified;
var db = firebase.database();
var storageRef = firebase.storage().ref();
var imgElements = [];

let currentKey = null;
let categoryKey = null;
let curNoteKey = null;
let currentPath = null;
let createDate;
let notesBody = document.getElementById('notes-body');
let noteDisplay = document.getElementById('note-display');

function updateCurrentPath() {
	currentPath = uid +'/'+ categoryKey +'/notes/'+ curNoteKey;
}

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

		//checkTable(uid);
		manualUpdate();
	} else {
		// No user is signed in.
		window.location.href = "https://fir-notes-2eb81.firebaseapp.com/";
	}
});

//Logout user (which triggers an auth state change, returning the user to the login page
let logoutBtn = document.getElementById('logout');
logoutBtn.addEventListener('click', (ev) => { 
	firebase.auth().signOut().then(() => {
	}).catch(err => {
		alert('Error: ' + err.message);
		console.log(error);
	});
}, false);

let addCategoryButton = document.getElementById('add-category-button');
addCategoryButton.addEventListener('click', (ev) => {
    var dateObj = new Date();

	categoryKey = db.ref().child('note-categories/'+ uid).push({
		title: 'New Category',
		created: dateObj.toJSON(),
		updated: dateObj.toJSON()
	}).key;
	
	addNote();
	//manualUpdate();
	//showNote(currentKey);
});

function checkTable(id) {
	var notesRef = db.ref('/note-categories/' + id);
	notesRef.on('value', (snapshot) => {
		updateTable(snapshot);
		//alert('table updated');
	});
}

function updateTable(snapshot) {
	notesBody.innerHTML = '';
	snapshot.forEach(function (category){
		if (categoryKey == null) {
			categoryKey = category.key;
		}
		if (curNoteKey == null) {
			category.child('notes').forEach(function(note) {
				curNoteKey = note.key;
				updateCurrentPath();
				showNote(curNoteKey);
				return true;
			});
		}
		addTableEntry(category.val().title, category.key, category.exportVal().notes);
	});
}

function manualUpdate() {
	db.ref('/note-categories/' + uid).once('value', (snapshot) => {
		updateTable(snapshot);
	});
}

function addTableEntry(title, key, notes) {

	var rows = notesBody.rows.length;
	row = notesBody.insertRow(rows);
	var cell1 = row.insertCell(0);
	var cell2 = row.insertCell(1);

	cell1.className = "mdl-data-table__cell--non-numeric";
	//cell1.innerHTML = title;
	//row.addEventListener('click', (ev) => {
	//	showNote(noteKey);
	//});

    //var dateObj = new Date(date);
    //var dateText = '' + (dateObj.getMonth()+1) + '/' + dateObj.getDate() + '/' + dateObj.getFullYear();
	//cell2.innerHTML = dateText;
	var notesArray =  Object.values(notes);
	var noteKeys = Object.keys(notes);
	console.log(notesArray);
	console.log(noteKeys);
	var i = 0;
	const noteList = notesArray.map((note) => {
		const nKey = noteKeys[i];
		function doShowNote() {
			curNoteKey = nKey;
			categoryKey = key;
			updateCurrentPath();
			showNote(nKey);
		}
		i = i + 1;
		return (
			<li key={note.created}>
				<a href="#" onClick={doShowNote}>{note.title}</a>
			</li> )
	}
	);

	ReactDOM.render(<ul key={key}>{noteList}</ul> , cell1);
	ReactDOM.render(<NoteAddButton/>, cell2);

}

function NoteAddButton() {
	return (
		<button onClick={addNote} className="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored mdl-shadow--4dp">
			<i className="material-icons">add</i>
		</button>
	)
}

function addNote() {
	var dateObj = new Date();

	curNoteKey = db.ref().child('note-categories/'+ uid + '/' + categoryKey + '/notes').push({
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
	db.ref('note-categories/' + uid +'/'+ categoryKey + '/notes/' + noteKey).once('value').then(function(snapshot) {
        const noteElement = (
            <form key={snapshot.key}>
                <div className="edit-note-title mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
                    <label className="title-label mdl-textfield__label" htmlFor="title-input">Title</label>
                    <input type="text" className="mdl-textfield__input" id="title-input" defaultValue={snapshot.val().title}></input>
                </div><br></br>	
                <div className="edit-content mdl-textfield mdl-js-textfield">
                    <textarea type="text" rows="10" className="mdl-textfield__input" id="text-input" defaultValue={snapshot.val().content}>
                    </textarea>
                    <label className="note-label mdl-textfield__label" htmlFor="text-input">Notes</label>
                </div>
            </form>
        );

		var noteform = document.getElementById('note-form');
		ReactDOM.render(noteElement, noteform);
		
		//showNoteFiles(noteKey);

        noteKey = snapshot.key;
		updateCurrentPath();
		createDate = snapshot.val().created;
	}).catch(function(error) {
		console.log(error.message);
	});
}

function showNoteFiles(noteKey) {
	var filesRef = storageRef.child('/files/' + uid + '/' + noteKey);
	var fileDisplay = document.getElementById('file-display');
	ReactDOM.render(<div></div>, fileDisplay);

	var notesMeta = db.ref('notes/' + uid + '/' + noteKey + '/files').once('value')
		.then(function(snapshot) {
			if (snapshot.hasChildren()) {
				var fileArray = Object.values(snapshot.exportVal());
				createImageList(fileArray, filesRef, fileDisplay);
			}
			else {
				//snackbarToast("No files.");
			}
		});
}

function createImageList(fileArray, filesRef, fileDisplay) {

	var promises = fileArray.map(function(file) {
		return filesRef.child(file.name).getDownloadURL().then(url => {
			var tag = file.name.slice(-4).toLowerCase();
			return <FileHolder path={url} name={file.name} tag={tag}/>;
		})
	});
	Promise.all(promises).then(function(imgElements) {
		ReactDOM.render(imgElements, fileDisplay);
	});	
}


function FileHolder(props) {
	function deleteClicked() { 
		var path = '/files/' + uid + '/' + currentKey + '/' + props.name;
		deleteFile(path);
		db.ref('/notes/' + uid + '/' + currentKey + '/files/' + props.name.slice(0,-4)).remove()
			.then(function() {
				//snackbarToast("Entry removed.");
			}).catch(function(error) {
				snackbarToast("Failed to remove DB entry.");
				console.log(error.message);
			});
		showNote(currentKey);
	}
	if (props.tag == '.jpg' || props.tag == '.png') {
		return 	(
			<div className="file-card mdl-card mdl-cell mdl-cell--6-col mdl-cell--8-col-phone mdl-shadow--2dp">
				<img className="file-image" src={props.path} alt={props.name}></img>
				<a className="file-card-text mdl-card__supporting-text" href={props.path}>{props.name}</a>
				<button onClick={deleteClicked} className="delete-file-button mdl-button mdl-js-button mdl-button--icon">
					<i className="material-icons">delete_forever</i>
				</button>
			</div>
		);
	}
	else {
		return 	(
			<div className="file-card mdl-card mdl-cell mdl-cell--6-col mdl-cell--8-col-phone mdl-shadow--2dp">
				<a className="file-card-text no-image mdl-card__supporting-text  mdl-components__link" href={props.path}>{props.name}</a>
				<button onClick={deleteClicked} className="delete-file-button mdl-button mdl-js-button mdl-button--icon">
					<i className="material-icons">delete_forever</i>
				</button>
			</div>
		);
	}
}

let saveButton = document.getElementById('save-button');
saveButton.addEventListener('click', (ev) => {
    var dateObj = new Date();

    var noteData = {
        title: document.getElementById('title-input').value,
        content: document.getElementById('text-input').value,
        created: createDate,
		updated: dateObj.toJSON()
	};
	db.ref('/note-categories/' + currentPath).once('value')
		.then(function(snapshot) {
			if (snapshot.hasChild('files')) {
				noteData.files = snapshot.child('files').val();
			}
			else {
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
	storageRef.child(path).delete().then(function() {
		snackbarToast("Deleted: " + path);
	}).catch(function(error) {
		snackbarToast("Failed to delete files.");
		console.log(error.message);
	});
}

let deleteButton = document.getElementById('delete-button');
deleteButton.addEventListener('click', (ev) => {
	var title = document.getElementById('title-input').value;
	var curNote = db.ref('/note-categories/' + currentPath);
	curNote.once('value')
		.then(function(snapshot) {
			if (snapshot.hasChild('files')) {
				var curFiles = snapshot.child('files');
				curFiles.forEach(function(cs) {
					deleteFile(cs.val().path);
				});
			}
		});

	curNote.remove()
        .then(function() {
			snackbarToast('"' + title + '" deleted.');
			categoryKey = null;
			curNoteKey = null;
			currentPath = null;
			manualUpdate();
        })
        .catch(function(error) {
            snackbarToast('Failed to delete "' + title + '"')
        });
});


let addFileButton = document.getElementById("add-file-button");
let fileInput = document.getElementById("file-input");
addFileButton.addEventListener('click', (ev) => {
	fileInput.click();
});

fileInput.addEventListener('change', (ev) => {
	var selectedFile = fileInput.files[0];
	addFile(selectedFile);
});


function addFile(file) {
	var uidKey = uid + '/' + currentKey
	var fileRef = storageRef.child('files/' + uidKey + '/' + file.name);
	snackbarToast("Uploading: " + file.name);
	fileRef.put(file)
		.then(function(snapshot) {
			snackbarToast('Successfully uploaded "' + file.name + '"')
			showNoteFiles(currentKey);
		}).catch(function(error) {
			snackbarToast('Failed to upload "' + file.name + '"')
			console.log(error.message);
		});

	var fileMeta = db.ref().child('notes/'+ uidKey + '/files/' + file.name.slice(0, -4)).set({
		name: file.name,
		path: fileRef.fullPath,
		type: file.type
	});
	showNote(currentKey);
}

function snackbarToast(toast) {
	var snackbar = document.getElementById('note-snackbar');
	snackbar.MaterialSnackbar.showSnackbar({
		message: toast
	});
}


