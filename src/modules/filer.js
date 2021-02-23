// filer.js
//
// all functions related to the filer container
//
// import Umd Class
import Umd from "./Umd.min.js";
import Builder from "./builder.js";
import * as Drive from "./drive.js";
import { saveAs } from 'file-saver';

let docarr = [];
let fileobj = null;

// functions related to file-open
const setEvents = () => {
    // file-open events
    document.querySelector("[new-button]").addEventListener("click", newButton);
    document.querySelector("[open-button]").addEventListener("click", openButton);
    document.querySelector("[file-input]").addEventListener("change", fileChange);
    document.querySelector("[url-input]").addEventListener("blur", openUrl);
    document.querySelector("[url-input]").addEventListener("keyup", inputKeyup);
    document.querySelector("[password-input]").addEventListener("blur", onPasswordSet);
    document.querySelector("[password-input]").addEventListener("keyup", inputKeyup);
    document.querySelector("[password-close]").addEventListener("click", onPasswordClose);
    document.querySelector("#tab-new").addEventListener("click", switchTab);
    document.querySelector("#tab-drive").addEventListener("click", switchTab);
    document.querySelector("[terms]").addEventListener("click", loadTerms);
    document.querySelector("[authorise-drive-button]").addEventListener("click", authoriseDrive);
    document.querySelector("[open-drive-button]").addEventListener("click", listDriveDocs);
    document.querySelector("[signout-drive-button]").addEventListener("click", signoutDrive);
    document.querySelector("#drive-close").addEventListener("click", closeDrive);

    document.addEventListener("drive-auth", updateGoogleDriveButtons);
    // google drive related event
    //  document.addEventListener("drive-file", loadDriveFile);
    // check for url in queryString
    const _url = getQueryString("url");
    if (_url) {
        const _ele = document.querySelector("[url-input]");
        _ele.focus()
        _ele.value = _url;
        _ele.blur();
        return;
    }
    // if not check for google drive state param
    const _state = getQueryString("state");
    if (_state) {
        // show drive tab and make it active
        document.querySelector("#tab-drive").removeAttribute("hidden");
        setTabActive("drive");
        // show doc
        document.querySelectorAll(".doc").forEach(ele => ele.classList.add("visuallyhidden"));
        document.querySelector("#doc-drive").classList.remove("visuallyhidden");
        // remove tabbar invisibility
        document.querySelector(".tab-bar").classList.remove("invisible");
        //
        //Drive.authenticate(_state);
    }
    // check for google drive auth status
    updateGoogleDriveButtons();
}

const updateGoogleDriveButtons = () => {
    if (Drive.googleAuth) { // if authenticated
        document.querySelector("[authorise-drive-button]").setAttribute("hidden", "");
        document.querySelector("[open-drive-button]").removeAttribute("hidden");
    }
    else {
        document.querySelector("[open-drive-button]").setAttribute("hidden", "");
        document.querySelector("[authorise-drive-button]").removeAttribute("hidden");
    }
}

const getQueryString = (field) => {
    const href = window.location.href;
    const reg = new RegExp("[?&]" + field + "=([^&#]*)", "i");
    const string = reg.exec(href);
    return string ? string[1] : null;
};

const switchTab = (e) => {
    if (!e.currentTarget.id) return;
    const _id = e.currentTarget.id.split("-").pop();
    if (!_id) return;

    // set active
    setTabActive(_id);

    // show doc
    document.querySelectorAll(".doc").forEach(ele => ele.classList.add("visuallyhidden"));
    document.querySelector(`#doc-${_id}`).classList.remove("visuallyhidden");
}

const newButton = (e) => {
    // reset fileobj
    fileobj = null;
    const _umd = new Umd();
    _umd.filename = "untitled";
    _umd.password = "";
    // create add doc 
    addDoc("", _umd);
    // reset inputs
    document.querySelector("[file-input]").value = "";
    document.querySelector("[url-input]").value = "";

    // add to google analytics
    gtag("event", "new_doc");
}

const openButton = (e) => {
    // resetting the filer and password containers
    document.querySelector(".filer-container").classList.remove("visuallyhidden");
    document.querySelector(".password-container").classList.add("visuallyhidden");
    document.querySelector("[url-input]").value = "";
    document.querySelector("[file-input]").click();
    // analytics
    gtag("event", "open_doc");
}

const fileChange = (e) => {
    fileobj = document.querySelector("[file-input]").files[0];
    if (fileobj) {
        const filename = fileobj.name;
        const ext = filename.split(".").pop();
        if (ext.toLowerCase() != "umd") return;

        document.querySelector("[open-button]").innerHTML = "loading ...";
        loadFile(fileobj, ""); // initially pass the pw as blank
    }
}

const openUrl = (e) => {
    const _ele = document.querySelector("[url-input]");
    if (!_ele.value) return;
    const _url = parseUrl(_ele.value);
    if (!_url) return;

    let _filename = "untitled";
    const _f = _url.split("/").pop();
    if (_f) {
        _filename = _f;
    }

    _ele.setAttribute("disabled", "disabled");
    _ele.value = "loading ...";
    fetch(_url)
        .then(response => {
            if (response.status >= 200 && response.status <= 299) {
                return response.blob();
            } else {
                throw Error(response.statusText);
            }
        })
        .then(blob => {
            fileobj = new File([blob], _filename, { type: blob.type });
            _ele.value = "";
            _ele.removeAttribute("disabled");
            loadFile(fileobj);
            // analytics
            gtag("event", "open_url");
        })
        .catch(_err => {
            _ele.value = _url;
            _ele.classList.add("input-error");
            _ele.removeAttribute("disabled");
        })
}

const parseUrl = (url) => {
    try {
        const _url = new URL(url);
        const _origin = _url.origin.toLowerCase();
        const _pathname = _url.pathname;
        switch (_origin) {
            case "http://www.dropbox.com":
            case "http:/dropbox.com":
            case "https://www.dropbox.com":
            case "https:/dropbox.com":
                return `https://dl.dropboxusercontent.com${_pathname}`;
            default:
                return url;
        }
    }
    catch (err) {
        return url
    }
}

const inputKeyup = (e) => {
    e.currentTarget.classList.remove("input-error")
    if (e.key == "Enter") {
        e.currentTarget.blur();
    }
}

const onPasswordSet = (e) => {
    const _pw = document.querySelector("[password-input").value;
    if (fileobj && _pw) {
        loadFile(fileobj, _pw); // initially pass the pw as blank
        // reset screen
        document.querySelector(".filer-container").classList.remove("visuallyhidden");
        document.querySelector(".password-container").classList.add("visuallyhidden");
    }
}

const onPasswordClose = (e) => {
    document.querySelector("[file-input]").value = "";
    document.querySelector("[password-input").value = "";
    // reset screen
    document.querySelector(".filer-container").classList.remove("visuallyhidden");
    document.querySelector(".password-container").classList.add("visuallyhidden");
}

const loadFile = (file, pw) => {
    fileobj = file;
    const _umd = new Umd();
    _umd.filename = fileobj.name;
    _umd.password = pw;
    _umd.openFile(fileobj)
        .then(_ => {
            document.querySelector("[open-button").innerHTML = "Open Document";
            addDoc(fileobj, _umd);
            // reset inputs
            document.querySelector("[file-input]").value = "";
            document.querySelector("[url-input]").value = "";
            document.querySelector("[password-input").value = "";
        })
        .catch(err => {
            document.querySelector("[open-button").innerHTML = "Open Document";
            // check if error is password-required (fixed err)
            if (err == "password-required") {
                document.querySelector(".filer-container").classList.add("visuallyhidden");
                document.querySelector(".password-container").classList.remove("visuallyhidden");
                document.querySelector("[password-input]").focus();
            }
        });
}

const addDoc = (file, umd) => {

    const _filetuple = splitFilename(umd.filename);
    const _name = `${_filetuple.primary}.${_filetuple.ext}`;
    umd.registerListener((val) => setFilename(val));
    // generate id
    const _id = generateId("");

    // get tabbar
    const _tabbar = document.querySelector(".tab-bar");

    // create tab element
    const _tabele = document.createElement("div");
    // set the tab id
    _tabele.id = `tab-${_id}`;
    // add classes
    _tabele.classList.add("tab", "tab-active");
    // create action ele
    const _actionele = document.createElement("div");
    // current set id
    _actionele.id = `action-${_id}`;
    // set class
    _actionele.classList.add("tab-action");
    _actionele.classList.add("icon-M");
    // action event
    _actionele.addEventListener("click", actionClick);
    // updates to this field are done in setFilename function

    // add element
    _tabele.appendChild(_actionele);
    // create name ele
    const _nameele = document.createElement("div");
    // set id
    _nameele.id = `name-${_id}`;
    // update name
    _nameele.innerHTML = _name;
    // add class
    _nameele.classList.add("tab-title");
    // add element
    _tabele.appendChild(_nameele);
    // create close ele
    const _closeele = document.createElement("div");
    // add class
    _closeele.classList.add("tab-action");
    // add cross
    _closeele.classList.add("icon-close");
    //    _closeele.innerHTML = "&#10005;";
    // add close element
    _tabele.appendChild(_closeele);
    // close click event
    _closeele.addEventListener("click", closeDoc);
    // set title
    _closeele.setAttribute("title", "close document");

    // append tab element to tabbar before tab-new
    const _tabnew = document.querySelector("#tab-new");
    _tabbar.insertBefore(_tabele, _tabnew);

    // tab click event
    _tabele.addEventListener("click", switchTab);

    // remove tabbar invisibility if so
    _tabbar.classList.remove("invisible");

    // get tab container
    const _container = document.querySelector(".tab-container");
    // hide all docs
    _container.querySelectorAll(".doc").forEach((e => e.classList.add("visuallyhidden")));
    // create new doc
    const _newdoc = document.createElement("div");

    // add class
    _newdoc.classList.add("file-container");
    _newdoc.classList.add("doc");
    // set id
    _newdoc.id = `doc-${_id}`;
    // append doc element to tab-container before footer
    const _footer = document.querySelector(".footer");
    _container.insertBefore(_newdoc, _footer);

    // make current tab active
    //document.querySelectorAll(".tab").forEach(ele => ele.classList.remove("tab-active"));
    //_tabele.classList.add("tab-active");
    setTabActive(_id);

    // creator builder object for this doc
    const _builder = new Builder(_newdoc, umd);
    _builder.setEvents();
    _builder.listComponents();

    // add close-doc & download-doc events 
    _newdoc.addEventListener("close-doc", closeDocConfirmation);
    _newdoc.addEventListener("download-doc", downloadDoc);
    // append to docarr
    docarr.push({ "id": _id, "umd": umd, "builder": _builder });
    // set filename
    setFilename(umd);
    // show the doc
    showDoc(`doc-${_id}`);
}

const setFilename = (umd) => {
    // identify the doc
    const _ind = docarr.findIndex(ele => ele.umd == umd);
    if (_ind == -1) return;

    const _thisumd = docarr[_ind].umd;
    const _id = docarr[_ind].id;
    const _actionele = document.querySelector(`#action-${_id}`);
    _actionele.classList.remove("icon-download");
    _actionele.classList.remove("icon-editdoc");
    if (_thisumd.readonly) {
        // show blank
        _actionele.innerHTML = ""
        _actionele.title = "";
        document.querySelector(`#name-${_id}`).innerHTML = _thisumd.filename;
        _actionele.setAttribute("data-action", "");
    }
    else {
        if (_thisumd.isEdited) {
            //            if (_thisumd.hasChanged) {
            // show download
            //_actionele.innerHTML = "&#8615"; //"&#11015;"
            _actionele.classList.add("icon-download");
            _actionele.title = "download document";
            _actionele.setAttribute("data-action", "download");
            document.querySelector(`#name-${_id}`).innerHTML = `${_thisumd.filename}*`;
            //           }
            //           else {
            //               _actionele.innerHTML = "";
            //               _actionele.setAttribute("data-action", "");
            //               document.querySelector(`#name-${_id}`).innerHTML = `${_thisumd.filename}`;
            //           }
        }
        else {
            // show edit
            //_actionele.innerHTML = "&#10000;"
            _actionele.classList.add("icon-editdoc");
            _actionele.title = "edit document";
            _actionele.setAttribute("data-action", "edit");
            document.querySelector(`#name-${_id}`).innerHTML = `${_thisumd.filename}`;
        }
    }
}

const closeDoc = (e) => {
    e.stopPropagation();

    // get the id from the parent of close
    if (!e.currentTarget.parentElement.id) return;
    const _id = e.currentTarget.parentElement.id.split("-").pop();
    if (!_id) return;

    // find index in docarr
    const _umdind = docarr.findIndex(ele => ele.id == _id);
    if (_umdind == -1) return;

    const _umd = docarr[_umdind].umd;
    if (!_umd) return;

    if (_umd.hasChanged) {
        docarr[_umdind].builder.showCloseConfirmation();
    }
    else {
        clearDoc(_id);
    }
}

const downloadDoc = (e) => {
    if (!e.detail) return;
    if (!e.detail.umd) return;

    const _umd = e.detail.umd;

    // find index in docarr
    const _umdind = docarr.findIndex(ele => ele.umd == _umd);
    if (_umdind == -1) return;

    const _builder = docarr[_umdind].builder;
    if (!_builder) return;

    // now proceed
    //setFilename(_umd);
    return new Promise(resolve => {
        _umd.save()
            .then(file => {
                saveAs(file, file.name);
                // reset mode of document
                _builder.setMode();
                // reset filename
                setFilename(_umd);
                // analytics
                //ga("send", {
                //    hitType: "event",
                //    eventCategory: "action",
                //    eventAction: "download"
                //});
                gtag("event", "download_doc");
                resolve();
            });
    });
}

const actionClick = (e) => {
    e.stopPropagation();
    const _action = e.currentTarget.getAttribute("data-action");
    if (!_action) return;

    // get the UMD
    if (!e.currentTarget.parentElement.id) return;
    const _id = e.currentTarget.parentElement.id.split("-").pop();
    if (!_id) return;

    // find index in docarr
    const _umdind = docarr.findIndex(ele => ele.id == _id);
    if (_umdind == -1) return;

    const _umd = docarr[_umdind].umd;
    if (!_umd) return;

    const _builder = docarr[_umdind].builder;
    switch (_action) {
        case "edit":
            //_umd.readonly = false;
            _umd.isEdited = true;
            _builder.setMode();
            setFilename(_umd);
            break;
        case "download":
            _builder.showDownloadConfirmation();
            break;
    }
}

// called from event sent by builder
const closeDocConfirmation = (e) => {
    if (!e.detail) return;
    if (!e.detail.umd) return;

    const _ind = docarr.findIndex(ele => ele.umd == e.detail.umd);
    if (_ind == -1) return;

    const _id = docarr[_ind].id;
    clearDoc(_id);
}

const clearDoc = (id) => {
    // remove umd from array
    const _umdind = docarr.findIndex(ele => ele.id == id);
    if (_umdind == -1) return;

    const _umd = docarr[_umdind].umd;
    if (!_umd) return;

    docarr.splice(_umdind, 1);

    // first set new active
    //document.querySelectorAll(".tab").forEach(ele => ele.classList.remove("tab-active"));
    //document.querySelector("#tab-new").classList.add("tab-new");
    setTabActive("new");

    // show doc-new
    document.querySelectorAll(".doc").forEach(ele => ele.classList.add("visuallyhidden"));
    document.querySelector(`#doc-new`).classList.remove("visuallyhidden");

    // remove the tab
    document.querySelector(`#tab-${id}`).remove();
    // remove the doc
    document.querySelector(`#doc-${id}`).remove();

    // if no docs then hide tab-bar
    if (docarr.length == 0) {
        document.querySelector(".tab-bar").classList.add("invisible");
    }
}

const showDoc = (id) => {
    document.querySelectorAll(".doc").forEach(ele => ele.classList.add("visuallyhidden"));
    document.querySelector(`#${id}`).classList.remove("visuallyhidden");
}

const setTabActive = (id) => {
    document.querySelectorAll(".tab").forEach(ele => {
        ele.classList.remove("tab-active");
        ele.querySelectorAll(".tab-action").forEach(subele => {
            subele.classList.add("invisible");
        });
    });
    const _active = document.querySelector(`#tab-${id}`);
    _active.classList.add("tab-active");
    _active.querySelectorAll(".tab-action").forEach(subele => {
        subele.classList.remove("invisible");
    });
}

const loadTerms = (e) => {
    const _url = e.currentTarget.getAttribute("data-url");
    if (_url) {
        document.querySelector("[url-input]").value = _url;
        openUrl(e);
        // analytics
        gtag("event", "read_terms");
    }
}

const authoriseDrive = (e) => {
    Drive.authenticate();
}

const signoutDrive = (e) => {
    Drive.signout();
    document.querySelector("#drive-close").click();
}

const listDriveDocs = async (e) => {
    // remove tabbar invisibility if so
    const _tabbar = document.querySelector(".tab-bar");
    _tabbar.classList.remove("invisible");
    // unhide drive tab
    document.querySelector("#tab-drive").removeAttribute("hidden");
    // set drive as active tab
    document.querySelector("#tab-drive").click();
    // clear list
    const _listele = document.querySelector("#drive-file-list");
    _listele.innerHTML = "";
    // load file list
    const arr = await Drive.listFiles();
    if(arr.length == 0) {
        _listele.innerHTML = "no umd files in drive";
        return;
    }
    // else 
    for(let i=0; i < arr.length; i++) {
        const _filerow = document.createElement("div");
        _filerow.classList.add("standard");
        _filerow.innerHTML = arr[i].filename;
        _filerow.setAttribute("data-fileid", arr[i].fileid);
        _filerow.setAttribute("data-filename", arr[i].filename);
        _filerow.setAttribute("data-weblink", arr[i].weblink);
        _filerow.addEventListener("click", downloadDriveFile)
        _listele.appendChild(_filerow);
    } 

}

const closeDrive = (e) => {
    e.stopPropagation();
    document.querySelector("#tab-new").click();
    document.querySelector("#tab-drive").setAttribute("hidden", "");
    if (docarr.length == 0) {
        document.querySelector(".tab-bar").classList.add("invisible");
    }
}

const downloadDriveFile = async (e) => {
    const _ele = e.currentTarget;
    const _fileid = _ele.getAttribute("data-fileid");
    const _filename = _ele.getAttribute("data-filename");

    document.querySelector("#drive-close").click();
    document.querySelector("[open-button]").innerHTML = "loading ...";
    const _file = await Drive.fetchFile(_fileid, _filename);
    loadFile(_file);
}


const loadDriveFile = (e) => {
    if (!e.detail) return;
    if (!e.detail.file) return;

    fileobj = e.detail.file;
    document.querySelector("#tab-new").click();
    if (fileobj) {
        document.querySelector("[open-button]").innerHTML = "loading ...";
        loadFile(fileobj, "");
    }
}

const splitFilename = (name) => {
    if (!name) return { "primary": "", "ext": "" };

    const _arr = name.split(".");
    const _ext = _arr[_arr.length - 1];
    _arr.pop();
    const _primary = _arr.join(".");
    return { "primary": _primary, "ext": _ext };
}

const generateId = () => {
    return `${Math.random().toString(36).substr(2, 9)}`;
}

export { setEvents, loadFile }