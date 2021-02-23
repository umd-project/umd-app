// drive.js
//
// functions related to google drive integration
//
// Client ID and API key from the Developer Console
//var CLIENT_ID = '510675615014-9lqtlnqb3tegh66l6mnrag5kodnf4eq6.apps.googleusercontent.com';
var CLIENT_ID = "526115143718-5kfu9icc4608dob4l6pp4tgf0j11647k.apps.googleusercontent.com";
var API_KEY = "AIzaSyB3iI0gKgwu46U1FxXLKyO1PhKtoZtn86w"

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
//var SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.install';
var SCOPES = "https://www.googleapis.com/auth/drive"

let googleAuth = false;

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
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    }, error => {
        console.log(error);
        googleAuth = false;
    });
}

function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        googleAuth = true;
    } else {
        googleAuth = false;
    }
    const ev = new CustomEvent('drive-auth', {
        bubbles: true,
        composed: true
    });
    document.dispatchEvent(ev);
}

const authenticate = async (url) => {
    gapi.auth2.getAuthInstance().signIn();
}

const signout = () => {
    gapi.auth2.getAuthInstance().signOut();
}

const getStarted = async () => {
    await loadJS("https://apis.google.com/js/api.js");
    gapi.load('client:auth2', initClient);
}

const listFiles = () => {
    return new Promise(resolve => {
        let arr = [];
        gapi.client.drive.files.list({
            'pageSize': 100,
            'fields': "nextPageToken, files(id, name)"
        }).then(function (response) {
            var files = response.result.files;
            if (files && files.length > 0) {
                for (var i = 0; i < files.length; i++) {
                    const fileid = files[i].id;
                    const filename = files[i].name;
                    const ext = filename.split(".").pop();
                    if (ext.toLowerCase() == "umd") {
                        arr.push({ "fileid": fileid, "filename": filename });
                    }
                }
            }
            resolve(arr);
        });
    })
}

const fetchFile = (id, filename) => {
    const token = gapi.auth.getToken().access_token;
    return new Promise(resolve => {
        fetch("https://www.googleapis.com/drive/v3/files/" + id + '?alt=media', {
            "method": "GET",
            headers: {
                'Content-Type': 'application/zip',
                'Authorization': 'Bearer '+ token,
            }
        })
        .then(resp => {
            return resp.blob();
        })
        .then(blob => {
            const file = new File([blob], filename);
            resolve(file);
        });
    });
}

getStarted();

export { googleAuth, authenticate, signout, listFiles, fetchFile };