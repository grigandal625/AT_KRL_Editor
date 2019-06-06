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

AT_KRL_ConditionNot.prototype.toXML = function(){
	var not = new XMLDom('<not />')
	for (var i = 0; i < this.condition.length; i++){
		not.appendChild(new XMLDom(this.condition[i].toXML()));
	}
	return not.XML();
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

AT_KRL_ConditionOr.prototype.toXML = function(){
	var or = new XMLDom('<or />')
	for (var i = 0; i < this.condition.length; i++){
		or.appendChild(new XMLDom(this.condition[i].toXML()));
	}
	return or.XML();
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

AT_KRL_ConditionAnd.prototype.toXML = function(){
	var and = new XMLDom('<and />')
	for (var i = 0; i < this.condition.length; i++){
		and.appendChild(new XMLDom(this.condition[i].toXML()));
	}
	return and.XML();
}

var AT_KRL_Rule = function (a, cs, fs, n, e) {
	var self = this;

	function validateResult(fs) {
		var r = fs.result ? (fs.result.length ? fs.result : [fs.result]) : (fs.length ? fs : [fs]);
		var res = true;
		for (var i = 0; i < r.length; i++) {
			if (!self.factIsSimple(r[i])) {
				throw new Error('Invalid format of conclusion facts to create Rule');
			}
			res = res && self.factIsSimple(r[i]);
		}
		if (fs.elsresult) {
			r = fs.elsresult.length ? fs.elsresult : [fs.elsresult];
			for (var i = 0; i < r.length; i++) {
				for (var i = 0; i < r.length; i++) {
					if (!self.factIsSimple(r[i])) {
						throw new Error('Invalid format of conclusion facts to create Rule');
					}
					res = res && self.factIsSimple(r[i]);
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
		this.editor = e;
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

AT_KRL_Rule.prototype.sideHasNoObject = function (side) {
	if (typeof (side) == "number" || typeof (side) == "string") {
		return true;
	}
	if (side.expressions) {
		var res = true;
		for (var i = 0; i < side.expressions.length; i++) {
			res = res && this.sideHasNoObject(side.expressions[i]);
		}
		return res;
	}
	return false;
}

AT_KRL_Rule.prototype.sideIsOnlyObject = function (side) {
	if (side.object && side.aIndex != null && side.object.attributes[side.aIndex]) {
		return true;
	}
	if (side.expressions && side.expressions.length == 1) {
		return this.sideIsOnlyObject(side.expressions[0]);
	}
	return false;
}

AT_KRL_Rule.prototype.factIsSimple = function (f, l) {
	var res = this.sideIsOnlyObject(f.leftside) && this.sideHasNoObject(f.rightside);
	if (!res) {
		throw new SyntaxError('Описание факта "' + l + '" не подходит для описания результата правила\nТребуемый формат: ОБЪЕКТ.АТРИБУТ=значение');
	}
	return res;
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
	res += "КОММЕНТАРИЙ " + this.comment + '\n\n';
	return res;
};

AT_KRL_Rule.prototype.hasObjAttrRef = function (name, index, deep) {
	if (!deep) {
		var res = false;
		var facts = this.result.concat(this.elsresult);
		for (var i = 0; i < facts.length; i++) {
			res = res || facts[i].hasObjAttrRef(name, index, deep);
		}
		return res;
	} else {
		var KRL = this.getKRL();
		var obj;
		for (var i = 0; i < this.editor.objects.length; i++) {
			var o = this.editor.objects[i];
			if (name == o.name) {
				obj = o;
				break;
			}
		}
		var aName = obj.attributes[index].name;
		return (KRL.indexOf(name + '.' + aName) != -1);
	}
}

AT_KRL_Rule.prototype.toXML = function (index) {
	var num = index || 0;
	var rule = new XMLDom('<rule />');
	rule.setAttribute('id',(num+1).toString());
	rule.setAttribute('meta','simple');
	rule.setAttribute('desc',this.comment);
	var condition = new XMLDom('<condition />');
	condition.appendChild(new XMLDom(this.ifConds.toXML()));
	rule.appendChild(condition);

	var action = new XMLDom('<action />');
	for (var i = 0; i < this.result.length; i++) {
		var assign = new XMLDom('<assign />');
		var eq = new XMLDom(this.result[i].toXML());
		assign.appendChild(eq.getChildNodes()[0]);
		assign.appendChild(eq.getChildNodes()[1]);
		action.appendChild(assign);
	}
	rule.appendChild(action);

	if (this.elsresult.length != 0) {
		var elseAction = new XMLDom('<else-action />');
		for (var i = 0; i < this.elsresult.length; i++) {
			var assign = new XMLDom('<assign />');
			var eq = new XMLDom(this.elsresult[i].toXML());
			assign.appendChild(eq.getChildNodes()[0]);
			assign.appendChild(eq.getChildNodes()[1]);
			elseAction.appendChild(assign);
		}
		rule.appendChild(elseAction);
	}
	return rule.XML();
}