// TODO(API): Update base URL to the deployed API origin for the environment.
const urlBase = 'https://contactmanager4331.xyz';
const extension = 'php';

let userId = 0;
let firstName = "";
let lastName = "";

function doLogin()
{
	userId = 0;
	firstName = "";
	lastName = "";

	let login = document.getElementById("username").value;
	let password = document.getElementById("password").value;
	// TODO(API): Remove debug logging before production.
	if (login === "" || password === "") return// clear previous error
	document.getElementById("login-error-text").innerHTML = "";

	login = login.trim();
	password = password.trim();

	if (login === "" || password === "") {
  		document.getElementById("login-error-text").innerHTML = "Please enter username and password.";
  		return;
	};

	console.log(login);
	console.log(password);

	let tmp = {login:login,password:password};
	let jsonPayload = JSON.stringify( tmp );

	// TODO(API): Keep endpoint path in sync with backend routing.
	let url = urlBase + '/LAMPAPI/Login.' + extension;
	let xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
	try
	{
		xhr.onreadystatechange = function()
		{
			if (this.readyState == 4 && this.status == 200)
			{
				let jsonObject = JSON.parse( xhr.responseText );
				userId = jsonObject.id;

				// TODO(API): Display login errors from the API instead of silent return.
				if (userId < 1) {
  					document.getElementById("login-error-text").innerHTML = jsonObject.error || "Invalid username or password.";
 					 return;
				}

				console.log(userId);
				firstName = jsonObject.firstName;
				lastName = jsonObject.lastName;

				// TODO(API): Consider replacing cookie auth with a session/JWT flow from the backend.
				saveCookie();

				window.location.href = "contacts.html";
			}
			else{
				console.log(this.readyState + ' ' + this.status);
			}
		};
		xhr.send(jsonPayload);
	}
	catch(err)
	{
		console.log(err);
	}

}

function saveCookie()
{
	let minutes = 20;
	let date = new Date();
	date.setTime(date.getTime()+(minutes*60*1000));
	document.cookie = "firstName=" + firstName + ";expires=" + date.toGMTString() + ";path=/";
	document.cookie = "lastName=" + lastName + ";expires=" + date.toGMTString() + ";path=/";
	document.cookie = "userId=" + userId + ";expires=" + date.toGMTString() + ";path=/";
}

function readCookie()
{
	userId = -1;
	let data = document.cookie;
	let splits = data.split(";");
	for(var i = 0; i < splits.length; i++)
	{
		let thisOne = splits[i].trim();
		let tokens = thisOne.split("=");
		if( tokens[0] == "firstName" )
		{
			firstName = tokens[1];
		}
		else if( tokens[0] == "lastName" )
		{
			lastName = tokens[1];
		}
		else if( tokens[0] == "userId" )
		{
			userId = parseInt( tokens[1].trim() );
		}
	}

	if( userId < 0 )
	{
		window.location.href = "index.html";
	}
	else
	{
//		document.getElementById("userName").innerHTML = "Logged in as " + firstName + " " + lastName;
	}
}

function doLogout()
{
	userId = 0;
	firstName = "";
	lastName = "";
	document.cookie = "firstName=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
	document.cookie = "lastName=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
	document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
	window.location.href = "index.html";
}

function doSignup()
{
	userId = 0;

	let fname = document.getElementById("cm-signup-first-name").value;
	let lname = document.getElementById("cm-signup-last-name").value;
	let login = document.getElementById("cm-signup-username").value;
	let password = document.getElementById("cm-signup-password").value;
	// TODO(API): Remove debug logging before production.
	// TODO: add error logging for signup
	document.getElementById("login-error-text").innerHTML = "";

	login = login.trim();
	password = password.trim();
	fname = fname.trim();
	lname = lname.trim();

	if (login === "" || password === "" || fname === "" || lname === "") {
  		//document.getElementById("login-error-text").innerHTML = "Please enter username and password.";
  		return;
	};

	console.log(login);
	console.log(password);
	console.log(fname);
	console.log(lname);

	let tmp = {login:login,password:password,fname:fname,lname:lname};
	let jsonPayload = JSON.stringify( tmp );

	// TODO(API): Keep endpoint path in sync with backend routing.
	let url = urlBase + '/LAMPAPI/Signup.' + extension;
	let xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
	try
	{
		xhr.onreadystatechange = function()
		{
			if (this.readyState == 4 && this.status == 200)
			{
				let jsonObject = JSON.parse( xhr.responseText );
				userId = jsonObject.id;

				// TODO(API): Display login errors from the API instead of silent return.
				if (userId >= 0) {
					document.getElementById("login-error-text").innerHTML = "Accout created. Please login";
 					return;
				}
				else{
					document.getElementById("login-error-text").innerHTML = "Username already in use.";
				}



				// TODO(API): Consider replacing cookie auth with a session/JWT flow from the backend.
				// saveCookie();

				// window.location.href = "contacts.html";
			}
			else{
				console.log(this.readyState + ' ' + this.status);
			}
		};
		xhr.send(jsonPayload);
	}
	catch(err)
	{
		console.log(err);
	}

}