
var user = firebase.auth().currentUser;
var name, email, photoUrl, uid, emailVerified;
var db = firebase.database();
var storageRef = firebase.storage().ref();
var imgElements = [];

let categoryKey = null;
let curNoteKey = null;
let currentPath = null;
let createDate;
let categoryList = document.getElementById('category-list');
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

//Add a new category
let addCategoryButton = document.getElementById('add-category-button');
addCategoryButton.addEventListener('click', (ev) => {
    var dateObj = new Date();

	categoryKey = db.ref().child('note-categories/'+ uid).push({
		title: 'New Category',
		created: dateObj.toJSON(),
		updated: dateObj.toJSON()
	}).key;
	
	addNote();
});

function checkTable(id) {
	var notesRef = db.ref('/note-categories/' + id);
	notesRef.on('value', (snapshot) => {
		updateTable(snapshot);
		//alert('table updated');
	});
}

function manualUpdate() {
	db.ref('/note-categories/' + uid).once('value', (snapshot) => {
		updateTable(snapshot);
	});
}

function updateTable(snapshot) {
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
		return true;
	});

	var catKeys = Object.keys(snapshot.exportVal());
	var catArray = Object.values(snapshot.exportVal());
	var i = 0;
	const catList = catArray.map((category) => {
		const cKey = catKeys[i];
		//console.log(category);
		i++;
		return <CategoryEntry name={category.title} cKey={cKey} notes={category.notes}/>;
	});

	ReactDOM.render(catList, categoryList);
}

class CategoryTitle extends React.Component {
	constructor(props) {
		super(props);
		this.state = {value: props.name, render: 0};

		this.textChange = this.textChange.bind(this);
		this.edit = this.edit.bind(this);
		this.save = this.save.bind(this);
	}

	textChange(event) {
		this.setState({value: event.target.value});
	}

	edit() {
		this.setState({render: 1});
	}
	save() {
		db.ref('/note-categories/' + uid + '/'+ categoryKey).update({title: this.state.value});
		this.setState({render: 0});
	}

	render() {
		if(this.state.render == 0) {
			return (
				<div id="cat-title-box">
					<h4 style={{marginLeft: '14px'}}>{this.state.value}</h4>
					<button onClick={this.edit} className="edit-cat mdl-button mdl-js-button mdl-button--icon">
						<i className="material-icons">edit</i>
					</button>
				</div>
			);
		}
		else {
			return (
				<form>
					<input id="cat-title" type="text" value={this.state.value} onChange={this.textChange} className="mdl-textfield--input"/>
					<button onClick={this.save} className="mdl-button mdl-js-button mdl-button--icon">
						<i className="material-icons">save</i>
					</button>
				</form>
			);
		}
	}
}

function CategoryEntry(props) {
	function selectCategory() {
		categoryKey = props.cKey;
		updateCurrentPath();
		manualUpdate();
	}

	var notesArray = [];
	if (props.notes != null) {
		notesArray = Object.values(props.notes);
		var noteKeys = Object.keys(props.notes);
	}
	var i = 0;
	const noteList = notesArray.map((note) => {
		const nKey = noteKeys[i];
		function doShowNote() {
			curNoteKey = nKey;
			categoryKey = props.cKey;
			updateCurrentPath();
			showNote(nKey);
		}
		i = i + 1;
		return (
			<li key={note.created}>
				<a href="#" onClick={doShowNote}>{note.title}</a>
			</li> )
	});

	if (props.cKey == categoryKey) {
		return (
			<div onClick={selectCategory} className="cat-card mdl-card mdl-shadow--2dp" key={props.cKey}>
				<CategoryTitle name={props.name}/>
				<ul>{noteList}</ul>
				<NoteAddButton cKey={props.cKey}/>
			</div>
		);
	}
	else {
		return (
			<div onClick={selectCategory} className="cat-card mdl-card mdl-shadow--2dp" key={props.cKey}>
				<h5 style={{marginLeft: '14px'}}>{props.name}</h5>
			</div>
		);
	}
}


function NoteAddButton(props) {
	function callAddNote() {
		addNote(props.cKey);
	}

	return (
		<button onClick={callAddNote} className="add-note-button mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab mdl-js-ripple-effect mdl-button--colored mdl-shadow--4dp">
			<i className="material-icons">add</i>
		</button>
	)
}

function addNote(catKey) {
	var dateObj = new Date();

	curNoteKey = db.ref().child('note-categories/'+ uid + '/' + catKey + '/notes').push({
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
		
		showNoteFiles(noteKey);

        noteKey = snapshot.key;
		updateCurrentPath();
		createDate = snapshot.val().created;
	}).catch(function(error) {
		console.log(error.message);
	});
}

function showNoteFiles(noteKey) {
	var filesRef = storageRef.child('/files/' + currentPath);
	var fileDisplay = document.getElementById('file-display');
	ReactDOM.render(<div></div>, fileDisplay);

	var notesMeta = db.ref('note-categories/' + currentPath + '/files').once('value')
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
		var path = '/files/' + currentPath + '/' + props.name;
		deleteFile(path);
		db.ref('/note-categories/' + currentPath + '/files/' + props.name.slice(0,-4)).remove()
			.then(function() {
				//snackbarToast("Entry removed.");
			}).catch(function(error) {
				snackbarToast("Failed to remove DB entry.");
				console.log(error.message);
			});
		showNote(curNoteKey);
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
	var fileRef = storageRef.child('files/' + currentPath + '/' + file.name);
	snackbarToast("Uploading: " + file.name);
	fileRef.put(file)
		.then(function(snapshot) {
			snackbarToast('Successfully uploaded "' + file.name + '"')
			showNoteFiles(curNoteKey);
		}).catch(function(error) {
			snackbarToast('Failed to upload "' + file.name + '"')
			console.log(error.message);
		});

	var fileMeta = db.ref().child('note-categories/'+ currentPath + '/files/' + file.name.slice(0, -4)).set({
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
