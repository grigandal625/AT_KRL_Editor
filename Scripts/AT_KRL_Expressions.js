var AT_KRL_StFzExpression = function (object, aIndex) {
	if (object.attributes[aIndex].type.vType != 1 && object.attributes[aIndex].type.vType != 2) {
		throw new Error('Type of attributes must be string or fuzzy');
	}
	this.expressions = [{}];
	this.expressions[0].object = object;
	this.expressions[0].aIndex = aIndex;
}

AT_KRL_StFzExpression.prototype.getKRL = function () {
	return (this.expressions[0].object.name) + '.' + (this.expressions[0].object.attributes[this.expressions[0].aIndex].name);
}

AT_KRL_StFzExpression.prototype.hasObjAttrRef = function (name, index, deep) {
	return (this.expressions[0].object.name == name && this.expressions[0].aIndex == index);
}

AT_KRL_StFzExpression.prototype.toXML = function () {
	var r1 = new XMLDom('<ref />')
	r1.setAttribute('id', this.expressions[0].object.name);
	var r2 = new XMLDom('<ref />');
	r2.setAttribute('id', this.expressions[0].object.attributes[this.expressions[0].aIndex].name);
	r1.appendChild(r2);
	return r1.XML();
}

var AT_KRL_MathExpression = function (es, sing) {
	function validateEs(es, sing, t) {
		var res = true;
		for (var i = 0; i < es.length; i++) {
			res = res && t.isNumber(es[i]);
		}
		if (!res) {
			throw new Error(JSON.stringify(es[i]) + ' must be able to be converted to number type');
		}

		var sgs = t.getAllSings();
		var sg;
		for (var i = 0; i < sgs.length; i++) {
			if (sgs[i].sing == sing) {
				sg = sgs[i];
			}
		}

		if (es.length > sg.pos) {
			throw new Error('Too much elements for making "' + sing + '" expression');
		}
		if (sg.type.indexOf('bin') != -1 && es.length == 1 && sg.type.indexOf('coef') == -1) {
			throw new Error('Too little elements for making "' + sing + '" expression');
		}
		return es;
	}

	function validateSing(s, t) {
		var sgs = t.getAllSings();
		var res = false;
		for (var i = 0; i < sgs.length; i++) {
			res = res || sgs[i].sing == s;
			if (res) {
				return s;
			}
		}
		if (!res) {
			throw new Error('Invalid sing ' + JSON.stringify(s))
		}
	}

	this.sing = validateSing(sing, this);
	this.expressions = es.length ? validateEs(es, sing, this) : validateEs([es], sing, this);
}

AT_KRL_MathExpression.prototype.isNumber = function (ex) {
	if (typeof (ex) == "number") {
		return true;
	}
	if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && ex.object.attributes[ex.aIndex].type.vType == 0) {
		return true;
	}
	var res = (ex.expressions) ? true : false;
	if (res) {
		for (var i = 0; i < ex.expressions.length; i++) {
			res = res && this.isNumber(ex.expressions[i]);
		}
	}
	return res;
}

AT_KRL_MathExpression.prototype.getAllSings = function () {
	return [{
		"sing": null,
		"name": null,
		"pos": 2,
		"type": [],
		"priority": null,
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 1) {
				return getExpressionValue(es[0]);
			}
		}
	}, {
		"sing": "-",
		"name": "minus",
		"pos": 2,
		"type": ["bin", "coef"],
		"priority": [0],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 1) {
				return -getExpressionValue(es[0]);
			}
			if (es.length == 2) {
				return getExpressionValue(es[0]) - getExpressionValue(es[1]);
			}
		}
	}, {
		"sing": "+",
		"name": "plus",
		"pos": Infinity,
		"type": ["bin"],
		"priority": [0],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			var res = 0;
			for (var i = 0; i < es.length; i++) {
				res += getExpressionValue(es[i]);
			}
			return res;
		}
	}, {
		"sing": "/",
		"name": "dev",
		"pos": 2,
		"type": ["bin"],
		"priority": [1],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 2) {
				return getExpressionValue(es[0]) / getExpressionValue(es[1]);
			}
		}
	}, {
		"sing": "*",
		"name": "mult",
		"pos": Infinity,
		"type": ["bin"],
		"priority": [1],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			var res = 1;
			for (var i = 0; i < es.length; i++) {
				res = res * getExpressionValue(es[i]);
			}
			return res;
		}
	}, {
		"sing": "^",
		"name": "pow",
		"pos": 2,
		"type": ["bin"],
		"priority": [1],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 2) {
				return Math.pow(getExpressionValue(es[0]), getExpressionValue(es[1]));
			}
		}
	}, {
		"sing": "sin",
		"name": "sin",
		"pos": 1,
		"type": ["op"],
		"priority": [2],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 1) {
				return Math.sin(getExpressionValue(es[0]));
			}
		}
	}, {
		"sing": "cos",
		"name": "cos",
		"pos": 1,
		"type": ["op"],
		"priority": [2],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 1) {
				return Math.cos(getExpressionValue(es[0]));
			}
		}
	}, {
		"sing": "tan",
		"name": "tan",
		"pos": 1,
		"type": ["op"],
		"priority": [2],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 1) {
				return Math.tan(getExpressionValue(es[0]));
			}
		}
	}, {
		"sing": "ctan",
		"name": "ctan",
		"pos": 1,
		"type": ["op"],
		"priority": [2],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 1) {
				return Math.ctan(getExpressionValue(es[0]));
			}
		}
	}, {
		"sing": "asin",
		"name": "asin",
		"pos": 1,
		"type": ["op"],
		"priority": [2],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 1) {
				return Math.asin(getExpressionValue(es[0]));
			}
		}
	}, {
		"sing": "acos",
		"name": "acos",
		"pos": 1,
		"type": ["op"],
		"priority": [2],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 1) {
				return Math.acos(getExpressionValue(es[0]));
			}
		}
	}, {
		"sing": "atan",
		"name": "atan",
		"pos": 1,
		"type": ["op"],
		"priority": [2],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 1) {
				return Math.atan(getExpressionValue(es[0]));
			}
		}
	}, {
		"sing": "actan",
		"name": "actan",
		"pos": 1,
		"type": ["op"],
		"priority": [2],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 1) {
				return Math.actan(getExpressionValue(es[0]));
			}
		}
	}, {
		"sing": "sinh",
		"name": "sinh",
		"pos": 1,
		"type": ["op"],
		"priority": [2],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 1) {
				return Math.sinh(getExpressionValue(es[0]));
			}
		}
	}, {
		"sing": "cosh",
		"name": "cosh",
		"pos": 1,
		"type": ["op"],
		"priority": [2],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 1) {
				return Math.cosh(getExpressionValue(es[0]));
			}
		}
	}, {
		"sing": "tanh",
		"name": "tanh",
		"pos": 1,
		"type": ["op"],
		"priority": [2],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 1) {
				return Math.tanh(getExpressionValue(es[0]));
			}
		}
	}, {
		"sing": "ctanh",
		"name": "ctanh",
		"pos": 1,
		"type": ["op"],
		"priority": [2],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 1) {
				return Math.ctanh(getExpressionValue(es[0]));
			}
		}
	}, {
		"sing": "asinh",
		"name": "asinh",
		"pos": 1,
		"type": ["op"],
		"priority": [2],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 1) {
				return Math.asinh(getExpressionValue(es[0]));
			}
		}
	}, {
		"sing": "acosh",
		"name": "acosh",
		"pos": 1,
		"type": ["op"],
		"priority": [2],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 1) {
				return Math.acosh(getExpressionValue(es[0]));
			}
		}
	}, {
		"sing": "atanh",
		"name": "atanh",
		"pos": 1,
		"type": ["op"],
		"priority": [2],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 1) {
				return Math.atanh(getExpressionValue(es[0]));
			}
		}
	}, {
		"sing": "actanh",
		"name": "actanh",
		"pos": 1,
		"type": ["op"],
		"priority": [2],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 1) {
				return Math.actanh(getExpressionValue(es[0]));
			}
		}
	}, {
		"sing": "exp",
		"name": "exp",
		"pos": 1,
		"type": ["op"],
		"priority": [2],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 1) {
				return Math.exp(getExpressionValue(es[0]));
			}
		}
	}, {
		"sing": "log",
		"name": "log",
		"pos": 2,
		"type": ["bin", "op"],
		"priority": [2],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 2) {
				return Math.logb(getExpressionValue(es[1]), getExpressionValue(es[0]));
			}
		}
	}, {
		"sing": "lg",
		"name": "lg",
		"pos": 1,
		"type": ["op"],
		"priority": [2],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 1) {
				return Math.logb(10, getExpressionValue(es[0]));
			}
		}
	}, {
		"sing": "ln",
		"name": "ln",
		"pos": 1,
		"type": ["op"],
		"priority": [2],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 1) {
				return Math.logb(Math.E, getExpressionValue(es[0]));
			}
		}
	}, {
		"sing": "sqrt",
		"name": "sqrt",
		"pos": 1,
		"type": ["op"],
		"priority": [2],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 1) {
				return Math.sqrt(getExpressionValue(es[0]));
			}
		}
	}, {
		"sing": "abs",
		"name": "abs",
		"pos": 1,
		"type": ["op"],
		"priority": [2],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 1) {
				return Math.abs(getExpressionValue(es[0]));
			}
		}
	}, {
		"sing": "sign",
		"name": "sign",
		"pos": 1,
		"type": ["op"],
		"priority": [2],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 1) {
				return Math.sign(getExpressionValue(es[0]));
			}
		}
	}, {
		"sing": "div",
		"name": "div",
		"pos": 2,
		"type": ["bin"],
		"priority": [1],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 2) {
				return parseInt(getExpressionValue(es[0]) / getExpressionValue(es[1]));
			}
		}
	}, {
		"sing": "mod",
		"name": "mod",
		"pos": 2,
		"type": ["bin"],
		"priority": [1],
		"calc": function (es) {
			function getExpressionValue(ex) {
				if (typeof (ex) == "number") {
					return ex;
				}
				if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes && ex.object.attributes[ex.aIndex] && typeof (ex.object.attributes[ex.aIndex].value) == "number") {
					return ex.object.attributes[ex.aIndex].value;
				}
				if (ex.expressions) {
					return ex.calculate();
				}
			}
			if (es.length == 2) {
				return parseInt(getExpressionValue(es[0]) % getExpressionValue(es[1]));
			}
		}
	}]
}

AT_KRL_MathExpression.prototype.getThisSing = function () {
	var sgs = this.getAllSings();
	for (var i = 0; i < sgs.length; i++) {
		if (sgs[i].sing == this.sing) {
			return sgs[i];
		}
	}
}

AT_KRL_MathExpression.prototype.getKRL = function () {
	var sing = this.getThisSing();
	var res = '';

	function chKRL(ex) {
		var res = '';
		if (ex.object && ex.hasOwnProperty('aIndex') && ex.object.attributes[ex.aIndex] && AT_KRL_MathExpression.prototype.isNumber(ex)) {
			res += ex.object.name + '.' + ex.object.attributes[ex.aIndex].name;
		}
		if (ex.expressions && ex.getThisSing()) {
			res += ex.getKRL();
		}
		if (typeof (ex) == 'number') {
			res += ex.toString();
		}
		return res;
	}
	if (sing.type.indexOf('op') == -1) {
		if (sing.type.indexOf('coef') != -1 && this.expressions.length == 1) {
			res += '(' + this.sing + '(' + chKRL(this.expressions[0]) + '))';
		}
		if (sing.type.indexOf('bin') != -1 && this.expressions.length > 1) {
			res += '(';
			for (var i = 0; i < this.expressions.length; i++) {
				res += '(' + chKRL(this.expressions[i]) + ')' + ((i < this.expressions.length - 1) ? this.sing : '');
			}
			res += ')'
		}
		if (sing.type.length == 0) {
			res += chKRL(this.expressions[0]);
		}
	} else {
		if (sing.type.indexOf('bin') != -1) {
			res += this.sing + '(' + chKRL(this.expressions[0]) + ')(' + chKRL(this.expressions[1]) + ')';
		} else {
			res += this.sing + '(' + chKRL(this.expressions[0]) + ')';
		}
	}
	return res;
}

AT_KRL_MathExpression.prototype.calculate = function () {
	var sing = this.getThisSing();
	return sing.calc(this.expressions);
}

AT_KRL_MathExpression.prototype.hasObjAttrRef = function (name, index, deep) {
	if (this.expressions.length == 1 && !deep) {
		if (this.expressions[0].hasOwnProperty('object') && this.expressions[0].hasOwnProperty('aIndex')) {
			return (this.expressions[0].object.name == name && this.expressions[0].aIndex == index) && (this.sing == null);
		} else
		if (this.expressions[0].expressions) {
			return this.expressions[0].hasObjAttrRef(name, index, deep) && (this.sing == null);
		}
	}
	if (deep) {
		var res = false;
		for (var i = 0; i < this.expressions.length; i++) {
			if (this.expressions[i].hasOwnProperty('object') && this.expressions[0].hasOwnProperty('aIndex')) {
				res = res || (this.expressions[i].object.name == name && this.expressions[i].aIndex == index);
			} else
			if (this.expressions[i].expressions) {
				res = res || this.expressions[i].hasObjAttrRef(name, index, deep);
			}
		}
		return res;
	}
	return false;
}

AT_KRL_MathExpression.prototype.toXML = function () {
	if (this.sing == null) {
		if (this.expressions[0].object) {
			var r1 = new XMLDom('<ref />')
			r1.setAttribute('id', this.expressions[0].object.name);
			var r2 = new XMLDom('<ref />');
			r2.setAttribute('id', this.expressions[0].object.attributes[this.expressions[0].aIndex].name);
			r1.appendChild(r2);
			return r1.XML();
		} else {
			return this.expressions[0].toXML();
		}
	} else {
		var sg = new XMLDom('<math-' + this.getThisSing().name + ' />');
		for (var i = 0; i < this.expressions.length; i++) {
			sg.appendChild(new XMLDom(this.expressions[i].toXML()));
		}
		return sg.XML();
	}
}