var ActiveXObject;
var XMLDom = function (XMLString) {
    this.ActiveXMode = (ActiveXObject != undefined);
    if (this.ActiveXMode) {
        var x = new ActiveXObject("Microsoft.XMLDOM");
        x.async = false;
        x.loadXML(XMLString);
        this.creator = x;
        this.XMLControl = x.documentElement;
    } else {
        this.creator = new DOMParser().parseFromString(XMLString, 'text/xml');
        this.XMLControl = new DOMParser().parseFromString(XMLString, 'text/xml').documentElement;
    }
    this.parentNode = null;
};

XMLDom.prototype.XML = function () {
    if (this.ActiveXMode) {
        return this.XMLControl.xml;
    } else {
        return new XMLSerializer().serializeToString(this.XMLControl);
    }
}

XMLDom.prototype.createElement = function (tag) {
    var element = this.creator.createElement(tag);
    if (this.ActiveXMode) {
        return new XMLDom(element.xml);
    } else {
        return new XMLDom(new XMLSerializer().serializeToString(element));
    }
}

XMLDom.prototype.findParentNode = function (doc) {
    var res = null;
    if (doc.parentNode != undefined) {
        if (doc.parentNode.setAttribute != undefined) {
            if (this.ActiveXMode) {
                res = new XMLDom(doc.parentNode.xml);
            } else {
                res = new XMLDom(new XMLSerializer().serializeToString(doc.parentNode));
            }
            res.parentNode = this.findParentNode(doc.parentNode);
        }
    }
    return res;
}

XMLDom.prototype.appendChild = function (Node) {
    var append = Node;
    if (Node.XMLControl) {
        append = Node.XMLControl;
    }
    var child = this.XMLControl.appendChild(append);
    var res;
    if (this.ActiveXMode) {
        res = new XMLDom(child.xml);
    } else {
        res = new XMLDom(new XMLSerializer().serializeToString(child));
    }
    res.parentNode = this;
    return res;
}

XMLDom.prototype.setText = function (text) {
    if (this.ActiveXMode) {
        this.XMLControl.text = text;
    } else {
        this.XMLControl.textContent = text;
    }
}

XMLDom.prototype.getText = function () {
    if (this.ActiveXMode) {
        return this.XMLControl.text;
    } else {
        return this.XMLControl.textContent;
    }
}

XMLDom.prototype.getChildNodes = function () {
    var els = this.XMLControl.childNodes;
    var res = [];
    if (this.ActiveXMode) {
        for (var i = 0; i < els.length; i++) {
            var r = new XMLDom(els[i].xml);
            r.parentNode = this;
            res.push(r)
        }
    } else {
        for (var i = 0; i < els.length; i++) {
            var r = new XMLDom(new XMLSerializer().serializeToString(els[i]));
            r.parentNode = this;
            res.push(r)
        }
    }
    return res;
}

XMLDom.prototype.getElementsByClassName = function (name) {
    var els = this.getChildNodes()
    var res = [];
    for (var i = 0; i < els.length; i++) {
        if (els[i].getAttribute('class') == name) {
            res.push(els[i]);
            res = res.concat(els[i].getElementsByClassName(name));
        }
    }
    return res;
}

XMLDom.prototype.getElementsByTagName = function (name) {
    var els = this.getChildNodes()
    var res = [];
    for (var i = 0; i < els.length; i++) {
        if (els[i].XMLControl.tagName == name) {
            res.push(els[i]);
            res = res.concat(els[i].getElementsByTagName(name));
        }
    }
    return res;
}

XMLDom.prototype.getElementById = function (id) {
    for (var i = 0; i < this.getChildNodes().length; i++) {
        if (this.getChildNodes()[i].getAttribute('id') == id) {
            return this.getChildNodes()[i];
        } else {
            return this.getChildNodes()[i].getElementById(id)
        }
    }
    return null;
}

XMLDom.prototype.setAttribute = function (name, value) {
    this.XMLControl.setAttribute(name, value);
}
XMLDom.prototype.getAttribute = function (name) {
    return this.XMLControl.getAttribute(name);
}

XMLDom.prototype.removeAttribute = function (name) {
    this.XMLControl.removeAttribute(name);
}