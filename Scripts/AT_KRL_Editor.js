var AT_KRL_Editor = function () {
	this.types = [];
	this.objects = [];
	this.rules = [];
}

AT_KRL_Editor.prototype.clear = function () {
	this.types = [];
	this.objects = [];
	this.rules = [];
}

AT_KRL_Editor.prototype.getAllTypes = function () {
	return [{
		"id": 0,
		"name": ["ЧИСЛО"],
		"meta": "number",
		"type": "number"
	}, {
		"id": 1,
		"name": ["СИМВОЛ"],
		"meta": "string",
		"type": "string"
	}, {
		"id": 2,
		"name": ["СИМВОЛ", "НЕЧЕТКИЙ"],
		"meta": "fuzzy",
		"type": "string"
	}];
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
							res = res && typeof (t.values[i]) == "string";
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
							res = res && typeof (t.values[i]) == "string";
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

AT_KRL_Editor.prototype.toXML = function () {
	var res = '<?xml version="1.0" encoding="UTF-8"?><knowledge-base creation-date="' + (new Date()).toPString() + '"><problem-info></problem-info><types>';
	for (var i = 0; i < this.types.length; i++) {
		res += this.types[i].toXML();
	}

	res += '</types>' + this.classXML();
	return res + "</knowledge-base>";
}

AT_KRL_Editor.prototype.classXML = function () {
	var classes = new XMLDom('<classes/>');
	var world = new XMLDom('<class id="world" desc="Класс верхнего уровня, включающий в себя экземпляры других классов и общие правила" />');
	var properties = new XMLDom('<properties/>');
	for (var i = 0; i < this.objects.length; i++) {
		classes.appendChild(new XMLDom(this.objects[i].toXML(i)));
		var cls = new XMLDom('<property id="' + this.objects[i].name + '" type="КЛАСС' + (i+1).toString() + '" desc="экземпляр класса КЛАСС' + (i+1).toString() + '" />');
		cls.setAttribute('source','none');
		cls.setAttribute('create','true');
		properties.appendChild(cls);
	}
	world.appendChild(properties);
	world.appendChild(new XMLDom(this.rulesXML()));
	world.appendChild(new XMLDom('<methods />'))
	classes.appendChild(world);
	return classes.XML();
}

AT_KRL_Editor.prototype.rulesXML = function(){
	var rs = new XMLDom('<rules />');
	for (var i = 0; i < this.rules.length; i++){
		rs.appendChild(new XMLDom(this.rules[i].toXML(i)));
	}
	return rs.XML();
}