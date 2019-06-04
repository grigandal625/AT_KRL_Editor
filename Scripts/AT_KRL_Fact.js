var AT_KRL_Fact = function (leftside, rightside, sing, sure, exact) {

	function validateSides(l, r, s) {
		var relsForString = ['>=', '<=', '<', '>', '='];
		var relsForNumber = ['>=', '<=', '<', '>', '='];
		var numleft = AT_KRL_MathExpression.prototype.isNumber(l);
		var numrigth = AT_KRL_MathExpression.prototype.isNumber(r);

		if (numleft != numrigth) {
			throw new Error('Incompatible types for left and right sides to create a Fact');
		}
		if (numleft && relsForNumber.indexOf(s) == -1) {
			throw new Error('Bad relation type "' + s + '" for number types to create a Fact');
		}
		if (!numleft && relsForString.indexOf(s) == -1) {
			throw new Error('Bad relation type "' + s + '" for string or fuzzy types to create a Fact');
		}
		return [l, r, s];
	}

	this.leftside = validateSides(leftside, rightside, sing)[0];
	this.rightside = rightside;
	this.sing = sing;

	function validateShure(s) {
		if (s && s.length && s.length == 2 && s[0] >= 0 && s[0] <= s[1] && s[1] <= 100) {
			return s;
		} else {
			return null;
		}
	}

	function validateExact(e) {
		if (typeof(e) == "number" && 0 <= e && e <= 100) {
			return e;
		} else {
			return null;
		}
	}

	this.shure = [50, 100] || validateShure(shure);
	this.exact = parseFloat(validateExact(exact).toString() || '100');

}

AT_KRL_Fact.prototype.getKRL = function () {
	var res = '';
	res += this.leftside.getKRL();
	res += this.sing;
	res += this.rightside.getKRL();
	res += ' УВЕРЕННОСТЬ ' + JSON.stringify(this.shure) + ' ТОЧНОСТЬ ' + this.exact.toString();
	return res;
}

AT_KRL_Fact.prototype.getLeftSide = function () {
	if (AT_KRL_MathExpression.prototype.isNumber(this.leftside)) {
		return this.leftside.calculate();
	} else {
		if (typeof(this.leftside) == 'string') {
			return this.leftside.getKRL();
		} else {
			return this.leftside.expressions[0].object.attributes[this.leftside.expressions[0].aIndex].value.getKRL();
		}
	}
}

AT_KRL_Fact.prototype.getRightSide = function () {
	if (AT_KRL_MathExpression.prototype.isNumber(this.rightside)) {
		return this.rightside.calculate();
	} else {
		if (typeof(this.rightside) == 'string') {
			return this.rightside.getKRL();
		} else {
			return this.rightside.expressions[0].object.attributes[this.rightside.expressions[0].aIndex].value.getKRL();
		}
	}
}

AT_KRL_Fact.prototype.calculate = function () {
	var s = this.sing;
	s = (s.length == 1) ? s.replace('=', '==') : s;
	var l = this.getLeftSide();
	var r = this.getRightSide();
	var res = eval(l.toString() + s + r.toString());
	return res;

}

AT_KRL_Fact.prototype.hasObjAttrRef = function(name, index, deep){
	if (!deep && this.leftside.expressions){
		return (this.leftside.hasObjAttrRef(name,index,deep))
	}
	if (deep){
		return (this.leftside.hasObjAttrRef(name,index,deep) || this.rightside.hasObjAttrRef(name,index,deep))
	}
}

AT_KRL_Fact.prototype.toXML = function(){
	var xmlSing = {"=":"eq","<":"lt",">":"gt","<=":"le",">=":"ge"}[this.sing];
	var sg = new XMLDom('<' + xmlSing + ' />');
	var l = new XMLDom(this.leftside.toXML());
	var r = new XMLDom(this.rightside.toXML());
	sg.appendChild(l);
	sg.appendChild(r);
	var wh = new XMLDom('<with />')
	wh.setAttribute('belief',this.shure[0].toString());
	wh.setAttribute('probability',this.shure[1].toString()); 
	wh.setAttribute('accuracy',this.exact.toString());
	sg.appendChild(wh);
	return sg.XML();
}