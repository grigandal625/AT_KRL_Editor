var AT_KRL_Object = function (a, as, n, e) {
	function validateName(s) {
		var inv = '~!@#$%^&*()-=+/*|\\?.,:;`\'" ';
		for (var i = 0; i < inv.length; i++) {
			if (s.indexOf(inv[i]) != -1) {
				throw new Error('Invalid character "' + inv[i] + '" in name ' + s);
			}
		}
		return s;
	}

	this.attributes = as || [];
	this.name = validateName((typeof(a) == "string" ? a.replaceAll(' ', '') : ("ОБЪЕКТ" + ((e && e.objects) ? e.objects.length : 1))));
	this.comment = n || this.name;
	if (e) {
		e.pushObject(this);
	}
}

AT_KRL_Object.prototype.verificateAttribute = function (a) {
	try {
		var v = a.value;
		var t = a.type.vType;
		var vs = a.type.values;
		switch (t) {
		case 0:
			return (typeof(v) == "number" && v >= vs[0] && v <= vs[1]);
			break;
		case 1:
			return (typeof(v) == "string" && vs.indexOf(v) != -1);
			break;
		case 2:
			return true;
			break;
		}
		return false;
	} catch (e) {
		return false;
	}
}

AT_KRL_Object.prototype.pushAttribute = function (a) {
	var names = [];
	for (var i = 0; i < this.attributes.length; i++) {
		names.push(this.attributes[i].name);
	}
	if (names.indexOf(a.name) != -1) {
		a.name = "АТРИБУТ" + names.length;
	}
	this.attributes.push(a);
}

AT_KRL_Object.prototype.createAttribute = function (a, t, v, n) {
	var a = new AT_KRL_Attribute(a, t, v, n, this);
	return a;
}

AT_KRL_Object.prototype.getKRL = function () {
	var res = "ОБЪЕКТ " + this.name + "\nГРУППА ГРУППА1\nАТРИБУТЫ\n";
	for (i = 0; i < this.attributes.length; i++) {
		res += this.attributes[i].getKRL();
	}
	res += "КОММЕНТАРИЙ " + this.comment + "\n\n";
	return res;
}

var AT_KRL_Attribute = function (a, t, v, n, o) {
	function validateName(s) {
		var inv = '~!@#$%^&*()-=+/*|\\?.,:;`\'" ';
		for (var i = 0; i < inv.length; i++) {
			if (s.indexOf(inv[i]) != -1) {
				throw new Error('Invalid character "' + inv[i] + '" in name ' + s);
			}
		}
		return s;
	}
	this.name = validateName(typeof(a) == "string" ? a.replaceAll(' ', '') : ("АТРИБУТ" + (o && o.attributes ? o.attributes.length : 1)));
	if (!t) {
		throw new Error('Wrong type parameter');
	}
	this.type = t;
	this.value = v;
	this.comment = n || this.name;
	if (o && o.verificateAttribute(this)) {
		o.pushAttribute(this)
	} else if (o) {
		this.type = null;
		this.value = null;
		throw new Error('Mismatch between type of values and values');
	} else {
		var o = new AT_KRL_Object()
			if (!o.verificateAttribute(this)) {
				this.type = null;
				this.value = null;
				throw new Error('Mismatch between type of values and values');
			}
	}
}

AT_KRL_Attribute.prototype.getKRL = function () {
	var res = "АТРИБУТ " + this.name + "\nТИП " + this.type.name + "\nКОММЕНТАРИЙ " + this.comment + "\n";
	return res;
}
