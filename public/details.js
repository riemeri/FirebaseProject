let logoutBtn = document.getElementById('logout');
logoutBtn.addEventListener('click', (ev) => { 
	firebase.auth().signOut().then(() => {
		window.location.href = "https://fir-notes-2eb81.firebaseapp.com/";
	}).catch(err => {
		//TODO: Handle errors here.
		console.log(error);
	});
}, false);