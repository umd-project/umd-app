import Quill from "quill";
import validFilename from "valid-filename";

import {UmdComponentAudio, UmdComponentForm, UmdComponentImage, UmdComponentMd, UmdComponentPdf, UmdComponentText, UmdComponentVideo} from "./umd-components.min.js";
import Component from "./component.js";

const namearr = [
    {
        "name": "text",
        "ext": ["txt", "html", "html"],
        "accept": ".html, .htm"
    },
    {
        "name": "image",
        "ext": ["jpg", "png", "jpeg"],
        "accept": "image/jpg, image/png, image/jpeg"
    }, {
        "name": "audio",
        "ext": ["mp3", "ogg", "wav"],
        "accept": "audio/mp3, audio/ogg, audio/wav"
    }, {
        "name": "video",
        "ext": ["mp4"],
        "accept": "video/mp4"
    },
    {
        "name": "md",
        "ext": ["md"],
        "accept": ".md"
    },
    {
        "name": "pdf",
        "ext": ["pdf"],
        "accept": ".pdf"
    }

];

var toolbarOptions = [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', /*'strike'*/],        // toggled buttons
    [/*'blockquote',*/ 'code-block'],

    //[{ 'header': 1 }, { 'header': 2 }],               // custom button values
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    //[{ 'script': 'sub' }, { 'script': 'super' }],      // superscript/subscript
    [{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent
    //[{ 'direction': 'rtl' }],                         // text direction

    //[{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
    ['link'],
    [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
    //[{ 'font': [] }],
    [{ align: '' }, { align: 'center' }, { align: 'right' }, { align: 'justify' }],

    //['clean']                                         // remove formatting button
];


const html = `
<div edit-component class="edit-component-container" hidden>
    <div class="action-row r1c3">
        <div edit-save class="action" title="save">&#10004;</div>
        <div edit-cancel class="action" title="cancel">&#10007;</div>
    </div>
    <div class="name r1c1"></div>
    <div class="form r2">
        <div class="text text-editor-toolbar r1c1" hidden>
            <div class="text-editor"></div>
        </div>
        <input edit-aspect-input class="standard r2c1 video presentation" type="text"
            placeholder="enter aspect ratio, e.g 16:9" hidden>
        <input edit-url-input class="standard r3c1 image md video audio pdf form presentation" type="text"
            placeholder="enter url link" hidden>
        <div edit-clear class="action clear r3c1" hidden>&#215;</div>
        <div class="message r4c1 audio image md video" hidden>-- or --</div>
        <button edit-button class="standard r5c1 image audio md pdf video" hidden></button>
        <input edit-file-input type="file" accept="" hidden>
    </div>
</div>
<div new-component class="new-component-container" hidden>
    <div class="action-row">
        <div close class="action" hidden>&#10005;</div>
    </div>
    <div class="message r1c2">Select Component to Add</div>
    <div class="menu-bar">
        <div id="text" class="action icon-text" title="text component"></div>
        <div id="image" class="action icon-image" title="image component"></div>
        <div id="audio" class="action icon-audio" title="audio component"></div>
        <div id="md" class="action icon-md" title="markdown component"></div>
        <div id="pdf" class="action icon-pdf" title="pdf component"></div>
        <div id="video" class="action icon-video" title="video component"></div>
        <div id="presentation" class="action icon-presentation" title="presentation component"></div>
        <div id="form" class="action icon-form" title="form component"></div>
    </div>
</div>
<div class="close-confirmation" hidden>
    <div class="message">Ignore Changes</div>
    <div class="action-buttons">
        <div close-yes-action class="action" title="yes">&#10004;</div>
        <div close-no-action class="action" title="keep edits">&#10007;</div>
    </div>
</div>
<div download-confirmation class="download-container" hidden>
    <div class="message">Document Settings</div>
    <input download-filename-input class="standard" type="text" placeholder="enter valid filename">
    <input download-password-input class="standard" type="text" placeholder="optinal password">
    <div class="standard transparent">
        <input download-readonly-input type="checkbox" name="readonly" value="Y">
        <label for="readonly">Set document to Read-only</label
    </div>
    <div class="action-buttons">
        <div download-yes-action class="action" title="yes, download">&#10004;</div>
        <div download-no-action class="action" title="do not download">&#10007;</div>
    </div>
</div>
`;

export default class Builder {

    constructor(ele, umd) {
        this.docele = ele;
        this.docele.innerHTML = html;
        this.umd = umd;
        this.componentsarr = [];
    }

    setEvents() {
        // new component events
        this.docele.querySelectorAll("[new-component] .action").forEach(ele => ele.addEventListener("click", this.newComponentClicked.bind(this)));
        // edit component events
        this.docele.querySelector("[edit-save]").addEventListener("click", this.saveEdit.bind(this));
        this.docele.querySelector("[edit-cancel]").addEventListener("click", this.cancelEdit.bind(this));
        this.docele.querySelector("[edit-clear]").addEventListener("click", this.clearInputEdit.bind(this));
        this.docele.querySelector("[edit-file-input]").addEventListener("change", this.saveEdit.bind(this));
        this.docele.querySelector("[edit-button]").addEventListener("click", this.buttonEdit.bind(this));
        // confirmation events
        this.docele.querySelector("[close-yes-action]").addEventListener("click", this.confirmClose.bind(this))
        this.docele.querySelector("[close-no-action]").addEventListener("click", this.clearCloseConfirm.bind(this));
        // quill elements
        const _quillele = this.docele.querySelector(".text-editor");
        this.quill = new Quill(_quillele, {
            modules: {
                toolbar: toolbarOptions
            },
            placeholder: "Your text here",
            theme: 'snow'
        });
        // download events
        this.docele.querySelector("[download-yes-action]").addEventListener("click", this.confirmDownload.bind(this))
        this.docele.querySelector("[download-no-action]").addEventListener("click", this.clearDownloadConfirm.bind(this));
        // set mode
        this.setMode();
    }

    setMode() {
        this.componentsarr.forEach(ele => ele.component.setMode(this.umd.isEdited));
        if (this.umd.isEdited) {
            this.docele.querySelector("[new-component]").removeAttribute("hidden");
        }
        else {
            this.docele.querySelector("[new-component]").setAttribute("hidden", "");
        }
    }

    newComponentClicked(e) {
        const _name = e.currentTarget.id;
        if (!_name) return;

        // get elements
        const _editele = this.docele.querySelector("[edit-component]");
        // reset edit;
        this.resetEdit();
        // set data attributes
        _editele.setAttribute("data-no", ""); // since it is a new component
        _editele.setAttribute("data-name", _name);
        // now populate edit
        this.populateEdit(_name);
        // then position edit
        if (this.docele.childElementCount > 2) {
            this.docele.querySelector("[new-component]").insertAdjacentElement("beforebegin", _editele);
        }
        // unhide edit element
        _editele.removeAttribute("hidden");
        // hide new component
        this.docele.querySelector("[new-component]").setAttribute("hidden", "");
    }

    resetEdit() {
        const _editele = this.docele.querySelector("[edit-component]");
        _editele.setAttribute("data-name", "");
        _editele.setAttribute("data-source", "");
        _editele.setAttribute("data-content", "");
        _editele.setAttribute("data-no", "");
        _editele.setAttribute("data-url", "");
        _editele.querySelector("[edit-url-input]").removeAttribute("hidden");
        _editele.querySelector("[edit-button]").removeAttribute("hidden");
        _editele.querySelector(".message").removeAttribute("hidden");
        _editele.querySelector(".clear").setAttribute("hidden", "");
        _editele.querySelector("[edit-url-input]").classList.remove("input-error");
        this.quill.setText("");
    }

    async populateEdit(name) {

        // get edit ele
        const _editele = this.docele.querySelector("[edit-component]");

        // get no
        const _no = _editele.getAttribute("data-no");

        // update title
        _editele.querySelector(".name").innerHTML = (_no ? _no.toString() + ". " : "") + name;

        // get fileinput element
        const _fileinputele = _editele.querySelector("[edit-file-input]");

        // set input mask
        const _nameind = namearr.findIndex(ele => ele.name == name);
        if (_nameind != -1) { // exists
            _fileinputele.setAttribute("accept", namearr[_nameind].accept);
        }

        // hide all children of form
        _editele.querySelectorAll(".form > *").forEach(ele => {
            if (ele.classList.contains(name)) {
                ele.removeAttribute("hidden");
            }
            else {
                ele.setAttribute("hidden", "");
            }
        });

        // check for data-content
        const _content = _editele.getAttribute("data-content");
        if (_content) {
            if (_editele.getAttribute("data-source") == "include") {
                // specific for text component
                if (name == "text") {
                    const _url = _editele.getAttribute("data-url");
                    if (_url) {
                        // fetch content
                        const _c = await this.fetchFile(_url);
                        // populate quill
                        this.quill.root.innerHTML = _c;
                    }
                }
                else {
                    _editele.querySelector("[edit-button]").innerHTML = `tap to clear ${_content}`;
                }
            }
            else {
                _editele.querySelector("[edit-url-input]").value = _content;
                _editele.querySelector(".clear").removeAttribute("hidden");
            }
        }
        else {
            _editele.querySelector("[edit-url-input]").value = "";
            _editele.querySelector("[edit-button]").innerHTML = "Upload File";
        }
    }

    async saveEdit(e) {
        const _editele = this.docele.querySelector("[edit-component]");
        const _name = _editele.getAttribute("data-name");
        // get the data content value if any
        const _datacontent = _editele.getAttribute("data-content");
        // get url value
        let _formurl = _editele.querySelector("[edit-url-input]").value;
        // try to get form file value
        let _formfile = "";
        try {
            _formfile = _editele.querySelector("[edit-file-input]").files[0];
        }
        catch (e) {
        }

        // between formulr and formfile give formfile precedence
        if(_formfile) {
            // reset form_url
            _editele.querySelector("[edit-url-input]").value = "";
            _formurl = "";
        }

        let _textcontent = "";
        if (_name == "text") {
            // get text editor content
            _textcontent = this.quill.root.innerHTML;
            const _filename = this.generateId("text", "html");
            _formfile = new File([_textcontent], _filename, { type: "text/html;charset=utf-8" });
        }
        // first check all inputs are blank
        if (!_formfile && !_formurl && !_datacontent) {
            _editele.querySelector("[edit-url-input]").classList.add("input-error");
            return;
        }
        if (_formfile) {
            // check extension if form upload
            const _arr = _formfile.name.split(".");
            const _ext = _arr[_arr.length - 1];
            const _nameind = namearr.findIndex(ele => ele.name == _name);
            if (_nameind == -1) return;

            if (!namearr[_nameind].ext.includes(_ext.toLowerCase())) {
                return;
            }
        }

        let _json = {};
        _json["no"] = _editele.getAttribute("data-no");
        _json["name"] = `umd-component-${_name}`;

        // first check for formfile
        if (_formfile) { // means user has uploaded a file
            _json["source"] = "include";
            _json["content"] = _formfile.name;
            _json["file"] = _formfile;
            _editele.querySelector("[edit-file-input]").value = ""; // clear the input field
            this.saveComponent(_json);
        }
        else if (_formurl) {
            _json["source"] = "embed";
            if (_name == "video") {
                const _videoUrl = this.createVideoUrl(_formurl);
                _editele.querySelector("[edit-url-input]").value = _videoUrl;
                _json["content"] = _videoUrl;
                // if aspect has been set
                const _aspectratio = _editele.querySelector("[edit-aspect-input]").value;
                if (_aspectratio) {
                    _json["aspect"] = _aspectratio;
                }
            }
            else {
                _json["content"] = this.parseUrl(_formurl);
            }
            this.saveComponent(_json);
        }
        else {
            this.cancelEdit();
        }
    }

    saveComponent(json) {
        if (!json) return;

        const _editele = this.docele.querySelector("[edit-component]");
        // check if new
        if (!_editele.getAttribute("data-no")) {
            this.umd.appendComponent(json)
                .then(_n => {
                    const _ele = this.umd.elements[_n - 1];
                    this.addComponent(_ele);
                });
        }
        else {
            this.umd.editComponent(json)
                .then(_ => {
                    const _n = json.no;
                    // get the element from umd
                    const _ele = this.umd.elements[_n - 1];
                    // get the view element
                    const _viewele = this.docele.querySelectorAll(`.component-container[data-no="${json.no}"]`)[0];
                    if (_viewele) {
                        // get component id
                        const _componentid = _viewele.getAttribute("data-id");
                        if (!_componentid) return;
                        // set the component
                        const _compind = this.componentsarr.findIndex(ele => ele.id == _componentid);
                        if (_compind == -1) return;
                        this.componentsarr[_compind].component.setComponent(_ele);
                        // show viewele
                        _viewele.removeAttribute("hidden");
                    }
                });
        }
        // hide edit component
        _editele.setAttribute("hidden", "");
        // show new component
        this.docele.querySelector("[new-component]").removeAttribute("hidden");

    }

    addComponent(ele) {
        // create the view element and set attribute
        const _viewele = document.createElement("div");
        const _component = new Component(_viewele);
        _viewele.classList.add("component-container");
        // set component id
        const _componentid = this.generateId("component", "");
        _viewele.setAttribute("data-id", _componentid);
        // add to array
        this.componentsarr.push({ "id": _componentid, "component": _component });
        this.docele.insertBefore(_viewele, this.docele.querySelector("[new-component]"));
        // set the component
        _component.setComponent(ele);
        _component.setEvents();
        _component.setMode(this.umd.isEdited); // should be same as true
        // set all events
        _viewele.addEventListener("edit-component", this.changeComponent.bind(this));
        _viewele.addEventListener("move-component", this.moveComponent.bind(this));
        _viewele.addEventListener("delete-component", this.deleteComponent.bind(this));
    }

    cancelEdit(e) {

        const _editele = this.docele.querySelector("[edit-component]");
        // get component no
        const _no = _editele.getAttribute("data-no");
        if (_no) {
            // show component
            const _viewele = this.docele.querySelectorAll(`.component-container[data-no="${_no}"]`)[0];
            if (_viewele) {
                _viewele.removeAttribute("hidden")
            }
        }
        // hide edit and show new components
        _editele.setAttribute("hidden", "");
        this.docele.querySelector("[new-component]").removeAttribute("hidden");
    }

    clearInputEdit(e) {
        e.stopPropagation();
        const _editele = this.docele.querySelector("[edit-component]");
        _editele.querySelector("[edit-url-input]").value = "";
        _editele.querySelector(".clear").setAttribute("hidden", "");
    }

    buttonEdit(e) {
        const _editele = this.docele.querySelector("[edit-component]");
        if (_editele.getAttribute("data-content")) {
            // clear the data-content
            _editele.setAttribute("data-content", "");
            _editele.querySelector("[edit-button]").innerHTML = "Upload File";
        }
        else {
            _editele.querySelector("[edit-file-input]").click();
        }
    }

    changeComponent(e) {
        const _no = parseInt(e.currentTarget.getAttribute("data-no"));
        if (!_no) return;

        try {
            const _ele = this.umd.elements[_no - 1];
            // get edit element
            const _editele = this.docele.querySelector("[edit-component]");

            // check if any earlier edit has not been closed
            const _prevno = parseInt(_editele.getAttribute("data-no"));
            if (_prevno) {
                const _prevviewele = this.docele.querySelectorAll(`.component-container[data-no="${_prevno}"]`)[0];
                if (_prevviewele) {
                    _prevviewele.removeAttribute("hidden");
                }
            }
            // reset edit
            this.resetEdit();
            // set initial attributes
            const _name = _ele.tagName.toLowerCase().replace("umd-component-", "");
            _editele.setAttribute("data-no", _ele.getAttribute("data-no"));
            _editele.setAttribute("data-name", _name); // set only the name
            _editele.setAttribute("data-source", _ele.getAttribute("data-source"));
            _editele.setAttribute("data-content", _ele.getAttribute("data-content"));
            if (_ele.hasAttribute("data-url")) {
                _editele.setAttribute("data-url", _ele.getAttribute("data-url"));
            }
            if (_ele.hasAttribute("data-aspect")) {
                _editele.setAttribute("data-aspect", _ele.getAttribute("data-aspect"));
            }

            this.populateEdit(_name);
            // reposition edit element at appropriate place
            const _viewele = this.docele.querySelectorAll(`.component-container[data-no="${_no}"]`)[0];
            if (_viewele) {
                _viewele.insertAdjacentElement("afterend", _editele);
                _viewele.setAttribute("hidden", "");
            }
            // show edit element
            _editele.removeAttribute('hidden');
            // hide new component
            this.docele.querySelector("[new-component]").setAttribute("hidden", "");
        }
        catch (e) {
            console.log(e);
        }
    }

    listComponents() {
        // clear all viewelements
        this.docele.querySelectorAll(".component-container").forEach(ele => ele.remove());
        // clear the components arr
        this.componentsarr = [];
        for (let i = 0; i < this.umd.elements.length; i++) {
            this.addComponent(this.umd.elements[i]);
        }
    }

    moveComponent(e) {
        if (!e.detail) return;

        const _no = parseInt(e.detail.no);
        const _direction = e.detail.direction;
        if (!_no) return;

        // check if any earlier edit has not been closed
        const _editele = this.docele.querySelector("[edit-component]");
        const _prevno = parseInt(_editele.getAttribute("data-no"));
        if (_prevno) {
            const _prevviewele = this.docele.querySelectorAll(`.component-container[data-no="${_prevno}"]`)[0];
            if (_prevviewele) {
                _prevviewele.removeAttribute("hidden");
            }
            _editele.setAttribute("hidden", "");
        }

        this.umd.moveComponent(_no, _direction);
        this.listComponents();
    }

    deleteComponent(e) {
        const _no = parseInt(e.currentTarget.getAttribute("data-no"));
        if (!_no) return;

        this.umd.deleteComponent(_no);
        // not removing the component from componentsarr because it is being reset in listComponents
        this.listComponents();
    }

    showCloseConfirmation(e) {
        const _id = this.docele.id;

        this.docele.parentElement.querySelectorAll(`#${_id} > *`).forEach(ele => ele.setAttribute("hidden", ""));
        this.docele.querySelector(".close-confirmation").removeAttribute("hidden");
    }

    clearCloseConfirm(e) {
        const _id = this.docele.id;
        this.docele.parentElement.querySelectorAll(`#${_id} > *`).forEach(ele => ele.setAttribute("hidden", ""));
        this.docele.querySelectorAll(".component-container").forEach(ele => ele.removeAttribute("hidden"));
        if (!this.umd.readonly) {
            this.docele.querySelector("[new-component]").removeAttribute("hidden", "");
        }
    }

    confirmClose(e) {
        this.clearCloseConfirm(e);
        // create event
        const ev = new CustomEvent("close-doc", {
            bubbles: true,
            composed: true,
            detail: {
                "umd": this.umd
            }
        });
        this.docele.dispatchEvent(ev);
    }

    showDownloadConfirmation() {
        const _id = this.docele.id;
        this.docele.querySelector("[download-filename-input").value = this.umd.filename;
        this.docele.parentElement.querySelectorAll(`#${_id} > *`).forEach(ele => ele.setAttribute("hidden", ""));
        this.docele.querySelector("[download-confirmation").removeAttribute("hidden");
    }

    clearDownloadConfirm(e) {
        const _id = this.docele.id;
        this.docele.parentElement.querySelectorAll(`#${_id} > *`).forEach(ele => ele.setAttribute("hidden", ""));
        this.docele.querySelectorAll(".component-container").forEach(ele => ele.removeAttribute("hidden"));
        if (!this.umd.readonly) {
            this.docele.querySelector("[new-component]").removeAttribute("hidden", "");
        }
    }

    confirmDownload(e) {
        if (!this.verifyDownload()) return;

        this.clearDownloadConfirm(e);
        // create event
        const ev = new CustomEvent("download-doc", {
            bubbles: true,
            composed: true,
            detail: {
                "umd": this.umd
            }
        });
        this.docele.dispatchEvent(ev);
    }

    verifyDownload() {
        const _filename = this.docele.querySelector("[download-filename-input]");
        const _password = this.docele.querySelector("[download-password-input]");
        const _readonly = this.docele.querySelector("[download-readonly-input");
        if (!validFilename(_filename.value)) {
            return false;
        }
        this.umd.filename = _filename.value;
        this.umd.password = _password.value;
        this.umd.readonly = _readonly.checked;
        return true;
    }

    // helper functions
    parseUrl (url) {
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

    parseVideoUrl(url) {
        // - Supported YouTube URL formats:
        //   - http://www.youtube.com/watch?v=My2FRPA3Gf8
        //   - http://youtu.be/My2FRPA3Gf8
        //   - https://youtube.googleapis.com/v/My2FRPA3Gf8
        // - Supported Vimeo URL formats:
        //   - http://vimeo.com/25451551
        //   - http://player.vimeo.com/video/25451551
        // - Also supports relative URLs:
        //   - //player.vimeo.com/video/25451551

        url.match(/(http:|https:|)\/\/(player.|www.)?(vimeo\.com|youtu(be\.com|\.be|be\.googleapis\.com))\/(video\/|embed\/|watch\?v=|v\/)?([A-Za-z0-9._%-]*)(\&\S+)?/);

        if (RegExp.$3.indexOf('youtu') > -1) {
            var type = 'youtube';
        } else if (RegExp.$3.indexOf('vimeo') > -1) {
            var type = 'vimeo';
        }

        return {
            type: type,
            id: RegExp.$6
        };
    }

    createVideoUrl(url) {
        // Returns an iframe of the video with the specified URL.
        var videoObj = this.parseVideoUrl(url);
        if (videoObj.type == "youtube") {
            return "//www.youtube.com/embed/" + videoObj.id;
        } else if (videoObj.type == "vimeo") {
            return "//player.vimeo.com/video/" + videoObj.id;
        }
        return url;
    }

    generateId(prefix, suffix) {
        let _str = "";
        if (prefix) {
            _str += prefix + "_";
        }
        _str += Math.random().toString(36).substr(2, 9);
        if (suffix) {
            _str += "." + suffix;
        }
        return _str;
        //return `${prefix}_${Math.random().toString(36).substr(2, 9)}.${suffix}`;
    }

    fetchFile(url) {
        return new Promise(resolve => {
            fetch(url)
                .then(resp => {
                    return resp.text();
                })
                .then(t => {
                    resolve(t);
                })
        });
    }

    support() {
        if (!window.DOMParser) return false;
        var parser = new DOMParser();
        try {
            parser.parseFromString("x", "text/html");
        } catch (err) {
            return false;
        }
        return true;
    };

    stringToHTML(str) {
        // If DOMParser is supported, use it
        if (support) {
            var parser = new DOMParser();
            var doc = parser.parseFromString(str, "text/html");
            return doc.body;
        }

        // Otherwise, fallback to old-school method
        var dom = this.docele.createElement("div");
        dom.innerHTML = str;
        return dom;
    };
}


