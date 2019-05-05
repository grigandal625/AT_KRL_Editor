var AT_KRL_Editor = function () {
	this.types = [];
	this.objects = [];
	this.rules = [];
}

AT_KRL_Editor.prototype.getAllTypes = function () {
	return [{
			"id": 0,
			"name": ["ЧИСЛО"],
			"type": "number"
		}, {
			"id": 1,
			"name": ["СИМВОЛ"],
			"type": "string"
		}, {
			"id": 2,
			"name": ["СИМВОЛ", "НЕЧЕТКИЙ"],
			"type": "string"
		}
	];
}

AT_KRL_Editor.prototype.verificateType = function (t) {
	if (t && t.vType != null) {
		try {
			switch (t.vType) {
			case 0:
				return (t.values && t.values.length && t.values.length == 2 && !isNaN(parseFloat(t.values[0])) && !isNaN(parseFloat(t.values[1])) && parseFloat(t.values[0]) == t.values[0] && parseFloat(t.values[1]) == t.values[1] && t.values[1] >= t.values[0]);
			case 1:
				var res = (t.values && t.values.length)
				if (res) {
					for (var i = 0; i < t.values.length; i++) {
						res = res && typeof(t.values[i]) == "string";
						if (!res) {
							break;
						}
					}
				}
				return res;
			case 2:
				var res = (t.values && t.values.length)
				if (res) {
					for (var i = 0; i < t.values.length; i++) {
						res = res && typeof(t.values[i]) == "string";
						if (!res) {
							break;
						}
					}
				}
				var FP = [];
				res = res && (t.FP.length == t.values.length)
					for (var i = 0; i < t.FP.length; i++) {
						FP.push(t.FP[i].value);
						var min = t.FP[i].min;
						var max = t.FP[i].max;
						for (var j = 0; j < t.FP[i].coordinates.length; j++) {
							res = res && (t.FP[i].coordinates[j].X >= min && t.FP[i].coordinates[j].X <= max && t.FP[i].coordinates[j].Y >= 0 && t.FP[i].coordinates[j].Y <= 1)
						}
						if (!res) {
							break;
						}
					}
					for (var i = 0; i < t.values.length; i++) {
						if (!res) {
							break;
						}
						res = res && FP.indexOf(t.values[i] != -1);
					}
					return res;
			default:
				return false;
			}

		} catch (e) {
			return false;
		}
	} else {
		return false;
	}
}

AT_KRL_Editor.prototype.pushType = function (t) {
	var names = [];
	for (var i = 0; i < this.types.length; i++) {
		names.push(this.types[i].name);
	}
	if (names.indexOf(t.name) != -1) {
		t.name = "ТИП" + this.types.length;
	}
	this.types.push(t);
}

AT_KRL_Editor.prototype.pushObject = function (o) {
	var names = [];
	for (var i = 0; i < this.objects.length; i++) {
		names.push(this.objects[i].name);
	}
	if (names.indexOf(o.name) != -1) {
		o.name = "ОБЪЕКТ" + this.objects.length;
	}
	this.objects.push(o);
}

AT_KRL_Editor.prototype.pushRule = function (r) {
	var names = [];
	for (var i = 0; i < this.rules.length; i++) {
		names.push(this.rules[i].name);
	}
	if (names.indexOf(r.name) != -1) {
		r.name = "ПРАВИЛО" + this.rules.length;
	}
	this.rules.push(r);
}

AT_KRL_Editor.prototype.createType = function (a, t, v, n) {
	var type = new AT_KRL_Type(a, t, v, n, this);
	return type;
}

AT_KRL_Editor.prototype.createObject = function (a, as, n) {
	var o = new AT_KRL_Type(a, as, n, this);
	return o;
}

AT_KRL_Editor.prototype.getKRL = function () {
	var res = "";
	for (var i = 0; i < this.types.length; i++) {
		res += this.types[i].getKRL();
	}

	for (var i = 0; i < this.objects.length; i++) {
		res += this.objects[i].getKRL();
	}

	for (var i = 0; i < this.rules.length; i++) {
		res += this.rules[i].getKRL();
	}
	return res;
}

String.prototype.replaceAll = function (o, n) {
	if (n.indexOf(o) != -1){
		throw new ReferenceError('Substitute value must not include replaceable value');
	}
	var s = '';
	for (var i = 0; i < this.length; i++) {
		s += this[i];
	}
	while (s.indexOf(o) != -1) {
		s = s.replace(o, n);
	}
	return s;
}

Number.prototype.getKRL = function () {
	return (this).toString();
}

String.prototype.getKRL = function () {
	return '"' + this + '"';
}

Math.logb = function (number, base) {
	return Math.log(number) / Math.log(base);
};

Math.ctan = function (x) {
	return 1 / Math.tan(x);
}

Math.ctanh = function (x) {
	return 1 / Math.tanh(x);
}

Math.actan = function (x) {
	return Math.PI / 2 - Math.atan(x);
}

Math.actanh = function (x) {
	return (Math.logb((x + 1) / (x - 1), Math.E)) * 0.5
}

Array.prototype.includesAll = function (a) {
	var res = true;
	for (var i = 0; i < a.length; i++) {
		res = res && (this.indexOf(a[i]) != -1);
	}
	return res;
}

Number.prototype.calculate = function () {
	return parseFloat(this.toString());
}
