// component.js
//
// holds the component with editing actions
//
//
const _html = `
    <div class="component-action-row invisible">
        <div edit class="action icon-edit" title="edit"></div>
        <div up class="action icon-up" title="move up"></div>
        <div down class="action icon-down" title="move down"></div>
        <div delete class="action icon-remove" title="delete"></div>
    </div> 
    <div class="component"></div>
    <div class="confirmation" hidden>
        <div class="message">Remove Component</div>
        <div class="action-buttons">
            <div confirm-yes-action class="action" title="yes">&#10004;</div>
            <div confirm-no-action class="action" title="do not cancel">&#10007;</div>
        </div>
    </div>
    `;

export default class Component {
    constructor(ele) {
        this.ele = ele;
        this.ele.innerHTML = _html;
        this.mode = false;
        this.path = "/dist/components";
    }

    setEvents() {
        // hide and show of action row
        // action events
        this.ele.querySelector("[edit]").addEventListener("click", this.editComponent.bind(this));
        this.ele.querySelector("[up]").addEventListener("click", this.moveUpComponent.bind(this));
        this.ele.querySelector("[down]").addEventListener("click", this.moveDownComponent.bind(this));
        this.ele.querySelector("[delete]").addEventListener("click", this.deleteConfirmation.bind(this));
        this.ele.addEventListener("click", this.clearConfirm.bind(this));
        this.ele.querySelector("[confirm-yes-action]").addEventListener("click", this.deleteComponent.bind(this))
        this.ele.querySelector("[confirm-no-action]").addEventListener("click", this.clearConfirm.bind(this));
        this.ele.addEventListener("mouseover", this.toggleActionRow.bind(this), false);
        this.ele.addEventListener("mouseout", this.toggleActionRow.bind(this), false);
    }

    setComponent(ele) {
        this.ele.setAttribute("data-no", ele.getAttribute("data-no"));
        const _container = this.ele.querySelector(".component");
        _container.innerHTML = "";
        this._tagname = ele.tagName.toLowerCase();
        _container.appendChild(ele);
        this.ele.removeAttribute("hidden");
    }

    setMode(mode) {
        this.mode = mode;
    }

    toggleActionRow(e) {
        const _ele = this.ele.querySelector(".component-action-row");
        if (!this.mode) {
            _ele.classList.add("invisible");
            return;
        }
        if (_ele.classList.contains("invisible")) {
            _ele.classList.remove("invisible");
        }
        else {
            _ele.classList.add("invisible");
        }
    }

    editComponent(e) {
        const _ele = this.ele.querySelector(this._tagname);
        // create event
        const ev = new CustomEvent('edit-component', {
            bubbles: true,
            composed: true,
            detail: {
                "no": _ele.getAttribute("data-no")
            }
        });
        this.ele.dispatchEvent(ev);
    }

    moveUpComponent(e) {
        const _ele = this.ele.querySelector(this._tagname);
        // create event
        const ev = new CustomEvent('move-component', {
            bubbles: true,
            composed: true,
            detail: {
                "no": _ele.getAttribute("data-no"),
                "direction": "U"
            }
        });
        this.ele.dispatchEvent(ev);
    }

    moveDownComponent(e) {
        const _ele = this.ele.querySelector(this._tagname);
        // create event
        const ev = new CustomEvent('move-component', {
            bubbles: true,
            composed: true,
            detail: {
                "no": _ele.getAttribute("data-no"),
                "direction": "D"
            }
        });
        this.ele.dispatchEvent(ev);
    }

    deleteConfirmation(e) {
        e.stopPropagation();
        this.ele.querySelector(".confirmation").removeAttribute("hidden");
        this.ele.querySelector(".component-action-row").setAttribute("hidden", "");
    }

    clearConfirm(e) {
        this.ele.querySelector(".confirmation").setAttribute("hidden", "");
        this.ele.querySelector(".component-action-row").removeAttribute("hidden");
    }

    deleteComponent(e) {
        e.stopPropagation();
        // create event
        const ev = new CustomEvent('delete-component', {
            bubbles: true,
            composed: true,
            detail: {
                "no": this.ele.getAttribute("data-no")
            }
        });
        this.ele.dispatchEvent(ev);
    }
}    