//Main JS page for index.html/login page

//Getting the Email/Password and Signin button from the inputs above.
let signIn = document.getElementById('login');

//Listening on the signIn button click.
signIn.addEventListener('click', (ev) => {
	let email = document.getElementById('email').value;
	let password = document.getElementById('password').value;
	firebase.auth().signInWithEmailAndPassword(email, password).then(user => {
			//Handling the successful authentication.
			window.location.href = "details.html";
		}).catch(function(error) {
			//Handling the error showcasing.
			alert(error.message);
			console.log(error);
		});
}, false);

//Assigns sign-up functionality to the Sign Up button
let signUp = document.getElementById('signup');
signUp.addEventListener('click', (ev) => {
	let email = document.getElementById('email').value;
	let password = document.getElementById('password').value;
	firebase.auth().createUserWithEmailAndPassword(email, password).then(function(result) {
		console.log(result);
		var user = result.user;
		//Extract name from email and assign to the user
		var idx = email.indexOf('@');
		var name = email.slice(0, idx);
		user.updateProfile({
			displayName: name,
			photoURL: ""
		}).then(function() {
			//
		}).catch(function(error) {
			alert("Error updating name");
		});
		window.location.href = "details.html";
	}).catch(function(error) {
		//Hande errors here
		var errorCode = error.code;
		var errorMessage = error.message;
		if (errorCode == 'auth/weak-password') {
			alert('The password is too weak.');
		} else {
			alert(errorMessage);
		}
		console.log(error);
	});
});


//Opens pop-up for google login
let googleLogin = document.getElementById('googleLogin');
googleLogin.addEventListener('click', () => {
	//TODO: Handle Google auth here.
	var googleProvider = new firebase.auth.GoogleAuthProvider();
	firebase.auth().signInWithPopup(googleProvider).then(function(result) {
		console.log(result);
		var user = result.user;
		window.location.href = "details.html";
	}).catch(function (error) {
		//TODO: Handle errors here.
		console.log(error);
	});
});


