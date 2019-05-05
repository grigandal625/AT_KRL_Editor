var AT_KRL_ConditionNot = function (c) {
	if (c.getKRL) {
		this.condition = [c];
	} else {
		throw new Error('Invalid type of input condition or fact')
	}
}

AT_KRL_ConditionNot.prototype.getKRL = function () {
	var res = "~(" + this.condition[0].getKRL() + ")";
	return res;
}

AT_KRL_ConditionNot.prototype.calculate = function () {
	return !(this.condition[0].calculate());
}

var AT_KRL_ConditionOr = function (cs) {
	if (cs && cs.length >= 2) {
		this.condition = cs;
	} else {
		throw new Error('Invalid type of input set of conditions or facts');
	}
}

AT_KRL_ConditionOr.prototype.getKRL = function () {
	var res = '(';
	for (var i = 0; i < this.condition.length; i++) {
		res += '(' + this.condition[i].getKRL() + ")|\n"
	}
	return res.slice(0, res.length - 2) + ')';
}

AT_KRL_ConditionOr.prototype.calculate = function () {
	var res = false;
	for (var i = 0; i < this.condition.length; i++) {
		res = res || this.condition[i].calculate();
	}
	return res;
}

var AT_KRL_ConditionAnd = function (cs) {
	if (cs && cs.length >= 2) {
		this.condition = cs;
	} else {
		throw new Error('Invalid type of input set of conditions or facts');
	}
}

AT_KRL_ConditionAnd.prototype.getKRL = function () {
	var res = '(';
	for (var i = 0; i < this.condition.length; i++) {
		res += '(' + this.condition[i].getKRL() + ")&\n"
	}
	return res.slice(0, res.length - 2) + ')';
}

AT_KRL_ConditionAnd.prototype.calculate = function () {
	var res = true;
	for (var i = 0; i < this.condition.length; i++) {
		res = res && this.condition[i].calculate();
	}
	return res;
}

var AT_KRL_Rule = function (a, cs, fs, n, e) {
	function validateResult(fs) {
		var r = fs.result ? (fs.result.length ? fs.result : [fs.result]) : (fs.length ? fs : [fs]);
		var res = true;
		for (var i = 0; i < r.length; i++) {
			if (!AT_KRL_Parser.prototype.factIsSimple(r[i])) {
				throw new Error('Invalid format of conclusion facts to create Rule');
			}
			res = res && AT_KRL_Parser.prototype.factIsSimple(r[i]);
		}
		if (fs.elsresult) {
			r = fs.elsresult.length ? fs.elsresult : [fs.elsresult];
			for (var i = 0; i < r.length; i++) {
				for (var i = 0; i < r.length; i++) {
					if (!AT_KRL_Parser.prototype.factIsSimple(r[i])) {
						throw new Error('Invalid format of conclusion facts to create Rule');
					}
					res = res && AT_KRL_Parser.prototype.factIsSimple(r[i]);
				}
			}
		}
		return res;
	}
	var verificated = true && this.conditionHasTwoSides(cs) && validateResult(fs);

	if (verificated) {
		function validateName(s) {
			var inv = '~!@#$%^&*()-=+/*|\\?.,:;`\'" ';
			for (var i = 0; i < inv.length; i++) {
				if (s.indexOf(inv[i]) != -1) {
					throw new Error('Invalid character "' + inv[i] + '" in name ' + s);
				}
			}
			return s;
		}
		this.name = validateName(a.replaceAll(' ', '') || ("ПРАВИЛО" + e.rules.length));
		this.comment = n || this.name;
		this.ifConds = cs;
		this.result = fs.result ? (fs.result.length ? fs.result : [fs.result]) : (fs.length ? fs : [fs]);
		this.elsresult = fs.elsresult ? (fs.elsresult.length ? fs.elsresult : [fs.elsresult]) : [];
		e.pushRule(this);
	} else {
		throw new Error('Wrong format of parameters to create rule, condition must have two expressions in minimum');
	}
}

AT_KRL_Rule.prototype.conditionHasTwoSides = function (cs) {
	if (cs.condition.length > 1) {
		return true;
	}
	if (cs.condition[0].condition) {
		return this.conditionHasTwoSides(cs.condition[0]);
	}
	return false;
}

AT_KRL_Rule.prototype.getKRL = function () {
	var res = "ПРАВИЛО " + this.name + "\nЕСЛИ\n " + this.ifConds.getKRL() + '\nТО\n';
	for (var i = 0; i < this.result.length; i++) {
		res += this.result[i].getKRL() + '\n';
	}
	if (this.elsresult && this.elsresult.length > 0) {
		res += 'ИНАЧЕ\n'
		for (var i = 0; i < this.elsresult.length; i++) {
			res += this.elsresult[i].getKRL() + '\n';
		}
	}
	res += "КОММЕНТАРИЙ " + this.comment;
	return res;
};
