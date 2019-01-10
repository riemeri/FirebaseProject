let logoutBtn = document.getElementById('logout');
logoutBtn.addEventListener('click', (ev) => { 
	firebase.auth().signOut().then(() => {
		window.location.href = "https://fir-notes-2eb81.firebaseapp.com/";
	}).catch(err => {
		alert('Error: ' + err.message);
		console.log(error);
	});
}, false);