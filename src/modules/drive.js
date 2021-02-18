// drive.js
//
// functions related to google drive integration
//
// Client ID and API key from the Developer Console
//var CLIENT_ID = '510675615014-9lqtlnqb3tegh66l6mnrag5kodnf4eq6.apps.googleusercontent.com';
var CLIENT_ID = '510675615014-2v1g2df4o4h3m8mko83cptqi6v08kigo.apps.googleusercontent.com' //"890126954059-m3as2oih4q27iju419mkpqr99ucngi6p.apps.googleusercontent.com";
var API_KEY = 'AIzaSyBEnaFDunvaufD-A1l77_lTXefr6S25WNk'//"AIzaSyB7Dm2ZmkoszbuoZecKgl5Dd0B3QVeMIyc";

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
//var SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.install';
var SCOPES = "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.install"
const authorizeButton = document.querySelector("[google-authorise]");
const signoutButton = document.querySelector("[google-signout]");
const errorDiv = document.querySelector("[google-error]");

// stores ids from url
let fileIds = [];

const authenticate = async (url) => {
    const _j = JSON.parse(decodeURI(url));
    fileIds = _j.ids;
    errorDiv.removeAttribute("hidden");        
    if(fileIds.length == 0) {
        errorDiv.innerHTML = "no files";
        return;
    }
    errorDiv.innerHTML = "authenticating ...";
    errorDiv.removeAttribute("hidden");

    await loadJS("https://apis.google.com/js/api.js");
    gapi.load('client:auth2', initClient);
}

const loadJS = (url) => {
    return new Promise(resolve => {
        const fileref = document.createElement('script');
        fileref.setAttribute("type", "text/javascript");
        fileref.setAttribute("src", url);

        // add to head
        fileref.onload = () => {
            resolve();
        }
        document.getElementsByTagName("head")[0].appendChild(fileref);
    });
}

const initClient = () => {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        authorizeButton.onclick = handleAuthClick;
        signoutButton.onclick = handleSignoutClick;

    }, function (error) {

        errorDiv.innerHTML = JSON.stringify(error, null, 2);
        errorDiv.removeAttribute("hidden");
    });
}

const handleAuthClick = (ev) => {
    gapi.auth2.getAuthInstance().signIn();
}

const handleSignoutClick = (ev) => {
    authorizeButton.removeAttribute("hidden");
    signoutButton.setAttribute("hidden", "");
    errorDiv.innerHTML = "";
    errorDiv.setAttribute("hidden", "");
    gapi.auth2.getAuthInstance().signOut();
}

function updateSigninStatus(isSignedIn) {
    errorDiv.innerHTML = "";
    errorDiv.setAttribute("hidden", "");
    if (isSignedIn) {
        authorizeButton.setAttribute("hidden", "");
        signoutButton.removeAttribute("hidden");
        let filename = "untitled.umd"; // default set will be overwritten below
        if (fileIds.length > 0) {
            errorDiv.innerHTML = "loading ...";
            errorDiv.removeAttribute("hidden");
            getFilename(fileIds[0])
                .then(_name => {
                    filename = _name;
                    return downloadFile(fileIds[0]);
                })
                .then(blob => {
                    if (blob) {
                        const _file = new File([blob], filename);
                        const ev = new CustomEvent("drive-file", {
                            bubbles: true,
                            composed: true,
                            detail: {
                                "file": _file
                            }
                        });
                        document.dispatchEvent(ev);
                    }
                    errorDiv.innerHTML = "";
                    errorDiv.setAttribute("hidden", "");
                });
        }
    } else {
        //authorizeButton.removeAttribute("hidden");
        //authorizeButton.click();
        handleAuthClick();
        signoutButton.setAttribute("hidden", "");
    }
}

const getFilename = (id) => {
    return new Promise(resolve => {
        var request = gapi.client.drive.files.get({
            'fileId': id
        });
        request.execute(resp => {
            resolve(resp.name);
        });
    })
}

const downloadFile = (id) => {
    return new Promise(resolve => {
        const _url = `https://www.googleapis.com/drive/v3/files/${id}?alt=media`;
        var accessToken = gapi.auth.getToken().access_token;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', _url);
        xhr.responseType = 'blob';
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        xhr.onload = function (e) {
            resolve(xhr.response)
        };
        xhr.onerror = function (err) {
            console.log(err)
            resolve(null);
        };
        xhr.send();
    });
}

export { authenticate };