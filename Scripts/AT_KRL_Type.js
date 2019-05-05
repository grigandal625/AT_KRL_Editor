var AT_KRL_Type = function (a, t, v, n, e) {
	function validateName(s) {
		var inv = '~!@#$%^&*()-=+/*|\\?.,:;`\'" ';
		for (var i = 0; i < inv.length; i++) {
			if (s.indexOf(inv[i]) != -1) {
				throw new Error('Invalid character "' + inv[i] + '" in name ' + s);
			}
		}
		return s;
	}
	this.name = validateName(a ? (a.replaceAll(' ', '')) : ("ТИП" + (e ? (e.types.length + 1) : 1)));
	this.vType = t;
	this.values = v.values;
	this.comment = n || this.name;
	if (t == 2) {
		this.FP = v.FP;
	}
	if (e && e.verificateType(this)) {
		e.pushType(this)
	} else if (e) {
		this.vType = null;
		this.values = null;
		throw new Error('Mismatch between type of values and values');
	} else {
		var e = new AT_KRL_Editor();
		if (!e.verificateType(this)) {
			this.vType = null;
			this.values = null;
			throw new Error('Mismatch between type of values and values');
		}
	}
}

AT_KRL_Type.prototype.getAllTypes = function () {
	return (new AT_KRL_Editor()).getAllTypes();
}

AT_KRL_Type.prototype.getFPKRL = function (f) {
	var res = '"' + f.value + '" ' + f.min + ' ' + f.max + ' ' + f.coordinates.length + ' ={';
	for (var i = 0; i < f.coordinates.length; i++) {
		res += f.coordinates[i].X.toString() + '|' + f.coordinates[i].Y.toString() + ((i < (f.coordinates.length - 1)) ? '; ' : '}');
	}
	return res;
}

AT_KRL_Type.prototype.getKRL = function () {
	var res = "ТИП " + this.name + "\n" + this.getAllTypes()[this.vType].name[0] + "\n";
	switch (this.vType) {
	case 0:
		res += "ОТ " + this.values[0] + "\nДО " + this.values[1] + "\n";
		break;
	case 1:
		for (var i = 0; i < this.values.length; i++) {
			res += '"' + this.values[i] + '"\n';
		}
		break;
	case 2:
		for (var i = 0; i < this.values.length; i++) {
			res += '"' + this.values[i] + '"\n';
		}

		res += 'НЕЧЕТКИЙ\n' + this.FP.length + "\n";
		for (var i = 0; i < this.FP.length; i++) {
			res += this.getFPKRL(this.FP[i]) + '\n';
		}
		break;
	}
	res += "КОММЕНТАРИЙ " + this.comment + "\n\n";
	return res;
}

AT_KRL_Type.prototype.isValidValue = function (v) {
	if (typeof(v) == this.getAllTypes()[this.vType].type) {
		var t = this.vType;
		switch (t) {
		case 0:
			return (v >= this.values[0] && v <= this.values[1]);
			break;
		case 1:
			return (this.values.indexOf(v) != -1);
			break;
		case 2:
			return (typeof(v) == "number" || this.values.indexOf(v) != -1);
			break;
		default:
			return false;
		}
	}
	return false;
}
