var user = firebase.auth().currentUser;
var name, email, photoUrl, uid, emailVerified;

let nameDisplay = document.getElementById('name-display');
let emailDisplay = document.getElementById('email-display');

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
		nameDisplay.innerHTML = 'Display Name: ' + name;
		emailDisplay.innerHTML = 'Email: ' + email;
	} else {
		// No user is signed in.
		window.location.href = "https://fir-notes-2eb81.firebaseapp.com/";
	}
});

let logoutBtn = document.getElementById('logout');
logoutBtn.addEventListener('click', (ev) => { 
	firebase.auth().signOut().then(() => {
		//window.location.href = "https://fir-notes-2eb81.firebaseapp.com/";
	}).catch(err => {
		alert('Error: ' + err.message);
		console.log(error);
	});
}, false);