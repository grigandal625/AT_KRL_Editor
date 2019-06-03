var AT_KRL_Parser = function (e) {
	this.editor = e || new AT_KRL_Editor();
}

//------Предобработка текста------
AT_KRL_Parser.prototype.getAllDeclarations = function (krl) { //Улучшить, чтобы не обязательно был бы \n между каждым объявлением
	var text = (krl || this.editor.getKRL()) + "\n";
	var ds = [];
	text = text.replaceAll('\n\n\n', '\n\n');
	while (text != "") {
		var i = text.indexOf('\n\n') != -1 ? text.indexOf('\n\n') : (text.length - 1);
		var d = text.slice(0, i);
		if (d != "") {
			ds.push(d);
		}
		i = (i + 2 < text.length) ? i : (i - 2);
		text = text.substr(i + 2, text.length - 1);
	}
	return ds;
}

AT_KRL_Parser.prototype.getAllLines = function (declaration) {
	var lines = [];
	var d = declaration + "\n";
	while (d != "") {
		var i = d.indexOf("\n");
		var line = d.substring(0, i);
		if (line != "") {
			lines.push(line);
		}
		if (i = d.length - 1) {
			i--;
		}
		d = d.substring(d.indexOf("\n") + 1, d.length);
	}
	return lines;
}

AT_KRL_Parser.prototype.getTextFromLines = function (lines) {
	var res = "";
	for (var i = 0; i < lines.length; i++) {
		res += lines[i] + '\n';
	}
	return res;
}

//------Вспомогательное------
AT_KRL_Parser.prototype.getAllTypes = function () {
	return (new AT_KRL_Editor()).getAllTypes();
}

AT_KRL_Parser.prototype.validateName = function (n, pl) {
	var invalidSymbols = "'\"`~!@#$%^&*()+-=/*{[]}\\|,<.>/? ";
	for (var i = 0; i < invalidSymbols.length; i++) {
		if (n.indexOf(invalidSymbols[i]) != -1) {
			throw new SyntaxError("Недопустимый символ: " + invalidSymbols[i].replace(" ", "ПРОБЕЛ") + " В имени: " + n + " На позиции" + n.indexOf(invalidSymbols[i]));
		}
	}
	var names = [];
	for (var i = 0; i < this.editor[pl].length; i++) {
		names.push(this.editor[pl][i].name);
	}
	if (names.indexOf(n) != -1) {
		throw new SyntaxError('Имя "' + n + '" уже сущетсвует');
	}
	return n;
}

//------Парсинг типа------
AT_KRL_Parser.prototype.parseTypeName = function (line) {
	if (line.indexOf("ТИП ") != 0) {
		throw new SyntaxError("Невозможно получить имя типа из: " + line);
	}
	var name = this.validateName(line.replace('ТИП ', ''), 'types');
	return name;
}

AT_KRL_Parser.prototype.parseTypeNameFL = function (lines) {
	return this.parseTypeName(lines[0]);
}

AT_KRL_Parser.prototype.parseTypeParentFL = function (lines) {
	var res = NaN;
	var err = "";
	for (var i = 0; i < lines.length; i++) {
		var l = lines[i];
		switch (l) {
			case "ЧИСЛО":
				res = 0;
				break;
			case "СИМВОЛ":
				res = 1;
				break;
			case "НЕЧЕТКИЙ":
				res = 2;
				break;
			default:
				break;
		}
		err += l + "\n";
	}
	if (isNaN(res)) {
		throw new SyntaxError('Невозможно получить изначальный тип ("ЧИСЛО", "СИМВОЛ" или "НЕЧЕТКИЙ") из:\n' + err);
	}
	return res;
}

AT_KRL_Parser.prototype.parseCoordinates = function (l) {
	var coordinates = [];
	if (l.toArray()[0] != '{' || l.toArray()[l.length - 1] != '}') {
		throw new SyntaxError('Неверный синтаксис задания координат функции принадлежности в объявлении: ' + l);
	}

	function sNum(c, s) {
		var res = 0;
		for (var i = 0; i < s.length; i++) {
			if (c == s.slice(i, i + c.length)) {
				res++;
			}
		}
		return res;
	}
	if (sNum('|', l) != sNum(';', l) + 1) {
		throw new SyntaxError('Неверный синтаксис задания координат функции принадлежности в объявлении: ' + l);
	}
	var state = 'ini';
	var i = 0;
	var x = '';
	var y = '';
	while (i < l.length) {

		if (state == 'parseX' && l.toArray()[i] == '|') {
			state = "parseY";
			i++;
		}
		if (state == 'parseY' && (l.toArray()[i] == ';' || l.toArray()[i] == '}')) {
			state = 'makePair';
		}

		if (state == 'makePair' || state == "ini") {
			if (state != "ini") {
				if (x == '' || y == '') {
					throw new SyntaxError('Некорректный символ в определении координат функции принадлежности \nВ объявлении ' + l + '\nНа позиции ' + i);
				}

				var cs = {
					"X": parseFloat(x),
					"Y": parseFloat(y)
				};
				coordinates.push(cs);
			}
			x = '';
			y = '';
			while (isNaN(parseInt(l.toArray()[i])) && i < l.length) {
				i++;
			}
			state = 'parseX';
			if (i == l.length) {
				state = 'end';
			}
		}

		if (state == 'parseX') {
			if (isNaN(parseInt(l.toArray()[i])) && l.toArray()[i] != ',' && l.toArray()[i] != '.') {
				throw new SyntaxError('Некорректный символ в определении координат функции принадлежности \nВ объявлении ' + l + '\nНа позиции ' + i);
			}
			x += l.toArray()[i].replace(',', '.');
		}

		if (state == 'parseY') {
			if (isNaN(parseInt(l.toArray()[i])) && l.toArray()[i] != ',' && l.toArray()[i] != '.') {
				throw new SyntaxError('Некорректный символ в определении координат функции принадлежности \nВ объявлении ' + l + '\nНа позиции ' + i);
			}
			y += l.toArray()[i].replace(',', '.');
		}
		i++;
	}
	return coordinates;
}

AT_KRL_Parser.prototype.parseFP = function (line, v) {
	if (!line || line.indexOf("КОММЕНТАРИЙ ") == 0) {
		throw new SyntaxError("Не совпадают количество объявлений функций принадлежности и количество значений типа");
	}
	if (line.slice(0, 1) != '"' || line.lastIndexOf('" ') == -1) {
		throw new SyntaxError("Невозможно получить имя функции принадлежности в объявлении: " + line);
	}
	var name = line.substring(1, line.lastIndexOf('" '));
	if (v.indexOf(name) == -1) {
		throw new SyntaxError('Имя функции принадлежности должно быть равно одному из символьных щначений, указанном в типе (' + JSON.stringify(v).slice(0, JSON.stringify(v).length - 1).slice(1) + ')');
	}
	var l = line.slice(name.length + 3);
	var minS = l.slice(0, l.indexOf(' '));
	if (minS == '' || isNaN(parseFloat(minS))) {
		throw new SyntaxError('Невозможно получить минимум абсциссы функции принадлежности в объявлении: ' + line);
	}
	var min = parseFloat(minS);
	l = l.slice(minS.length + 1);
	var maxS = l.slice(0, l.indexOf(' '));
	if (maxS == '' || isNaN(parseFloat(maxS))) {
		throw new SyntaxError('Невозможно получить максимум абсциссы функции принадлежности в объявлении: ' + line);
	}
	var max = parseFloat(maxS);
	if (max <= min) {
		throw new SyntaxError('Минимум абсциссы функции принадлежности не должен быть больше или равен максимуму абсциссы в объявлении: ' + line);
	}
	l = l.slice(maxS.length + 1);
	var lgt = l.slice(0, l.indexOf(' '));
	l = l.slice(l.indexOf('={') + 1);
	if (l.indexOf('{') != 0) {
		throw new SyntaxError('Неверный синтаксис задания координат функции принадлежности в объявлении: ' + line);
	}
	var coordinates = this.parseCoordinates(l);
	if (coordinates.length != parseInt(lgt)) {
		throw new SyntaxError("Несовпадение заданного числа и количества координат в объявлении: " + line);
	}
	var FP = {
		"value": name,
		"min": min,
		"max": max,
		"coordinates": coordinates
	};
	return FP;
}

AT_KRL_Parser.prototype.parseTypeParamsFL = function (lines, p) {
	var res = {
		"values": []
	};
	switch (p) {
		case 0:
			var v = [parseFloat(lines[lines.indexOf("ЧИСЛО") + 1].replace('ОТ ', '').replaceAll(',', '.')), parseFloat(lines[lines.indexOf("ЧИСЛО") + 2].replace('ДО ', '').replaceAll(',', '.'))];
			if (isNaN(v[0]) || isNaN(v[1])) {
				throw new SyntaxError('Несовпадение типа и значений в объявлении:\n' + this.getTextFromLines(lines));
			};
			res.values = v;
			return res;
		case 1:
			var v = [];
			for (var i = lines.indexOf("СИМВОЛ") + 1; i < lines.length; i++) {
				if (lines[i].indexOf('КОММЕНТАРИЙ ') != 0) {
					if (lines[i].slice(0, 1) != '"' || lines[i].slice(lines[i].length - 1) != '"') {
						throw new SyntaxError('Неверный синтаксис задания символьного значения в объявлении:\n' + this.getTextFromLines(lines) + '\nСтрока: ' + i);
					}
					v.push(lines[i].slice(1, lines[i].length - 1));
				}
			}
			res.values = v;
			return res;
			break;
		case 2:
			var v = [];
			var i = lines.indexOf("СИМВОЛ") + 1;
			var j = lines.indexOf("НЕЧЕТКИЙ");
			if (j == -1 || i == 0) {
				throw new SyntaxError('Неверный синтаксис задания нечеткого типа в объявлении:\n' + this.getTextFromLines(lines) + '\nСтрока: ' + 0);
			}
			while (i < j) {
				if (lines[i].slice(0, 1) != '"' || lines[i].slice(lines[i].length - 1) != '"') {
					throw new SyntaxError('Неверный синтаксис задания символьного значения в объявлении:\n' + this.getTextFromLines(lines) + '\nСтрока: ' + i);
				}
				v.push(lines[i].slice(1, lines[i].length - 1));
				i++;
			}
			if (parseInt(lines[j + 1]) != v.length) {
				throw new SyntaxError('Несовпадение количества значений типа и количества функций принадлежности в объявлении:\n' + this.getTextFromLines(lines) + '\nСтрока: ' + (j + 1));
			}
			var pos = j + 2;
			var FP = [];
			for (var i = 0; i < v.length; i++) {
				FP.push(this.parseFP(lines[pos + i], v));
			}
			res.values = v;
			res.FP = FP;
			return res;
			break;
	}
}

AT_KRL_Parser.prototype.parseCommentFL = function (lines) {
	if (lines[lines.length - 1].indexOf('КОММЕНТАРИЙ ') == 0) {
		return lines[lines.length - 1].replace('КОММЕНТАРИЙ ', '');
	} else {
		return 'Пустой комментарий';
	}
}

AT_KRL_Parser.prototype.parseType = function (declaration) {
	var lines = this.getAllLines(declaration);
	var name = this.parseTypeNameFL(lines);
	var parent = this.parseTypeParentFL(lines);
	var params = this.parseTypeParamsFL(lines, parent);
	var comment = this.parseCommentFL(lines);
	var type = new AT_KRL_Type(name, parent, params, comment, this.editor);
	return type;
}

//------Парсинг объекта------
AT_KRL_Parser.prototype.parseObjectName = function (line) {
	if (line.indexOf("ОБЪЕКТ ") != 0) {
		throw new SyntaxError("Невозможно получить имя объекта из: " + line);
	}
	var name = this.validateName(line.replace('ОБЪЕКТ ', ''), 'objects');
	return name;
}

AT_KRL_Parser.prototype.parseObjectNameFL = function (lines) {
	return this.parseObjectName(lines[0]);
}

AT_KRL_Parser.prototype.parseAttributeName = function (line) {
	if (line.indexOf("АТРИБУТ ") != 0) {
		throw new SyntaxError("Невозможно получить имя атрибута из: " + line);
	}
	var name = line.replace('АТРИБУТ ', '');
	return name;
}

AT_KRL_Parser.prototype.parseAttributeNameFL = function (lines) {
	return this.parseAttributeName(lines[0]);
}

AT_KRL_Parser.prototype.parseAttributeTypeFL = function (lines) {
	if (lines[1].indexOf('ТИП ') != 0) {
		throw new SyntaxError('Невозможно получить имя типа для атрибута в объявлении:\n' + this.getTextFromLines(lines) + '\nСтрока 1');
	}
	var name = lines[1].replace('ТИП ', '');
	var type = false;
	for (var i = 0; i < this.editor.types.length; i++) {
		if (this.editor.types[i].name == name) {
			type = this.editor.types[i];
		}
	}
	if (!type) {
		throw new SyntaxError('Атрибут имеет неизвестный тип в объявлении:\n' + this.getTextFromLines(lines) + '\nСтрока 1');
	}
	return type;
}

AT_KRL_Parser.prototype.parseObjectAttribute = function (ls, i) {
	var lines = [ls[i], ls[i + 1], ls[i + 2]];
	var name = this.parseAttributeNameFL(lines);
	var type = this.parseAttributeTypeFL(lines);
	var comment = this.parseCommentFL(lines);
	var attribute = new AT_KRL_Attribute(name, type, type.values[0], comment);
	return attribute;
}

AT_KRL_Parser.prototype.validateAttribute = function (attribute, attributes) {
	var names = [];
	for (var i = 0; i < attributes.length; i++) {
		names.push(attributes[i].name);
	}
	if (names.indexOf(attribute.name) != -1) {
		throw new SyntaxError('Повторное объявление атрибута ' + name);
	}
	return attribute;
}

AT_KRL_Parser.prototype.parseObjectAttributesFl = function (lines) {
	var attributes = [];
	for (var i = 0; i < lines.length; i++) {
		if (lines[i].indexOf('АТРИБУТ ') == 0) {
			attributes.push(this.validateAttribute(this.parseObjectAttribute(lines, i), attributes))
		}
	}
	return attributes;
}

AT_KRL_Parser.prototype.parseObject = function (declaration) {
	var lines = this.getAllLines(declaration);
	var name = this.parseObjectNameFL(lines);
	var attributes = this.parseObjectAttributesFl(lines);
	var comment = this.parseCommentFL(lines)
	var object = new AT_KRL_Object(name, attributes, comment, this.editor);
	return object;
}

//------Парсинг математических методом построения и обхода дерева разбора и парсинг строковых или нечетких выражений------//
AT_KRL_Parser.prototype.parseStFzExpression = function (subline) {
	if (subline.indexOf('"') == 0 && subline.lastIndexOf('"') == subline.length - 1) {
		return subline.substr(1, subline.length - 2);
	} else {
		var StFz = subline;
		var obj = StFz.substring(0, StFz.lastIndexOf('.'));
		var att = StFz.substring(StFz.lastIndexOf('.') + 1, StFz.length);

		var object = null;

		for (var i = 0; i < this.editor.objects.length; i++) {
			if (this.editor.objects[i].name == obj) {
				object = this.editor.objects[i];
			}
		}
		if (!object) {
			throw new SyntaxError('Недопустимое имя объекта "' + obj + '" в объявлении:\n' + line);
		}
		var aIndex = -1;
		for (var i = 0; i < object.attributes.length; i++) {
			if (att == object.attributes[i].name) {
				aIndex = i;
			}
		}
		if (aIndex == -1) {
			throw new SyntaxError('Недопустимое имя атрибута "' + att + '" в объявлении:\n' + line);
		}
		if (object.attributes[aIndex].type.vType != 1 && object.attributes[aIndex].type.vType != 2) {
			throw new SyntaxError('Атрибут ' + obj + '.' + att + ' имеет недопустимый тип\nОжидался символьный или нечеткий тип атрибута');
		}
		return new AT_KRL_StFzExpression(object, aIndex);
	}
}

AT_KRL_Parser.prototype.parseSimpleMathExpression = function (subline) {
	var obj = subline.substring(0, subline.lastIndexOf('.'));
	var att = subline.substring(subline.lastIndexOf('.') + 1, subline.length);

	var object = null;

	for (var i = 0; i < this.editor.objects.length; i++) {
		if (this.editor.objects[i].name == obj) {
			object = this.editor.objects[i];
		}
	}
	if (!object) {
		throw new SyntaxError('Недопустимое имя объекта "' + obj + '" в объявлении:\n' + subline);
	}
	var aIndex = -1;
	for (var i = 0; i < object.attributes.length; i++) {
		if (att == object.attributes[i].name) {
			aIndex = i;
		}
	}
	if (aIndex == -1) {
		throw new SyntaxError('Недопустимое имя атрибута "' + att + '" в объявлении:\n' + subline);
	}
	if (object.attributes[aIndex].type.vType != 0) {
		throw new SyntaxError('Атрибут ' + obj + '.' + att + ' имеет недопустимый тип\nОжидался числовой тип атрибута');
	}
	var m = new AT_KRL_MathExpression({
		object: object,
		aIndex: aIndex
	});
	return m;
}

AT_KRL_Parser.prototype.getToNextMathOperation = function (subline, sNames, index, current) {
	var i = index + current.length;
	var bracket = (subline.toArray()[i] == '(') ? 1 : 0;

	function isOperation(s, n, i) {
		var res = false;
		for (var k = 0; k < n.length; k++) {
			res = res || ((s.indexOf(n[k], i) == i) && (n.indexOf(s.substr(i, n[k].length + 1)) == -1));
			if (res) {
				return n[k];
			}
		}
		return false;
	}
	var o = isOperation(subline, sNames, i);
	while ((!isOperation(subline, sNames, i) || isOperation(subline, sNames, i) && bracket != 0) && i < subline.length - 1) {
		i++;
		o = isOperation(subline, sNames, i);
		if (subline.toArray()[i] == "(") {
			bracket++;
		}
		if (subline.toArray()[i] == ")") {
			bracket--;
		}
	}
	if (i == subline.length - 1) {
		return false;
	}
	return {
		index: i,
		operation: o
	};
}

AT_KRL_Parser.prototype.getToFirstMathOperation = function (subline, sNames) {
	return this.getToNextMathOperation(subline, sNames, 0, '');
}

AT_KRL_Parser.prototype.getLineFromBrackets = function (line, index) {
	var i = index;
	var res = '';
	while (line.toArray()[i] != '(' && i < line.length) {
		i++;
	}
	if (line.toArray()[i] == '(') {
		var b = 1;
		while (i < line.length && b != 0) {
			i++;
			if (line.toArray()[i] == '(') {
				b++;
			}
			if (line.toArray()[i] == ')') {
				b--;
			}
			if (b != 0) {
				res += line.toArray()[i]
			}
		}
		return {
			res: res,
			index: i
		};
	}
	return {
		res: '',
		index: -1
	};
}

AT_KRL_Parser.prototype.getLineFromFirstBrackets = function (line) {
	return this.getLineFromBrackets(line, 0);
}

AT_KRL_Parser.prototype.getOperationSides = function (subline, operation, index) {
	function isInBrackets(line) {
		if (line.toArray()[0] != '(') {
			return false;
		} else {
			var b = 1;
			var i = 1;
			var index = 0;
			while (b != 0 && i < line.length) {
				if (line.toArray()[i] == '(') {
					b++;
				}
				if (line.toArray()[i] == ')') {
					b--;
				}
				if (b == 0 && index == 0) {
					index = i;
				}
				if (b == 0 && i != line.length - 1) {
					return false;
				}
				i++;
			}
			if (b == 0 && index == line.length - 1) {
				return true;
			}
		}
	}

	var left;
	var right;
	if (operation.sing != 'log') {
		left = subline.substring(0, index);
		right = subline.substring(index + operation.sing.length, subline.length);
	} else {
		left = this.getLineFromBrackets(subline, index + 3).res;
		right = this.getLineFromBrackets(subline, index + left.length + 4).res;
	}
	while (isInBrackets(left)) {
		left = this.getLineFromFirstBrackets(left).res;
	}
	while (isInBrackets(right)) {
		right = this.getLineFromFirstBrackets(right).res;
	}
	if (left == '') {
		return [right];
	}
	/*if (){
	throw new SyntaxError('Невозможно интерпретировать математическое выражение в объявлении:\n' + subline);
	}*/
	return [left, right];
}

AT_KRL_Parser.prototype.getMathExpressionTree = function (subline) {
	var inv = '`~!@"№$%&<>?=';

	function isInBrackets(line) {
		if (line.toArray()[0] != '(') {
			return false;
		} else {
			var b = 1;
			var i = 1;
			var index = 0;
			while (b != 0 && i < line.length) {
				if (line.toArray()[i] == '(') {
					b++;
				}
				if (line.toArray()[i] == ')') {
					b--;
				}
				if (b == 0 && index == 0) {
					index = i;
				}
				if (b == 0 && i != line.length - 1) {
					return false;
				}
				i++;
			}
			if (b == 0 && index == line.length - 1) {
				return true;
			}
		}
	}
	while (isInBrackets(subline)) {
		subline = this.getLineFromFirstBrackets(subline).res;
	}
	for (var i = 0; i < inv.length; i++) {
		if (subline.indexOf(inv[i]) != -1) {
			throw new SyntaxError('Недопустимый символ "' + inv[i] + '" в объявлении ' + subline + ' на позиции ' + subline.indexOf(inv[i]));
		}
	}
	var sings = AT_KRL_MathExpression.prototype.getAllSings();
	var sNames = [];
	for (var i = 0; i < sings.length; i++) {
		if (sings[i].sing) {
			sNames.push(sings[i].sing);
		}
	}

	function getOperationByName(name) {
		var s = AT_KRL_MathExpression.prototype.getAllSings();
		for (var i = 0; i < s.length; i++) {
			if (s[i].sing == name) {
				return s[i];
			}
		}
		return null;
	}

	var thisLayerOperations = [];
	var o = this.getToFirstMathOperation(subline, sNames);
	while (o) {
		thisLayerOperations.push({
			"operation": getOperationByName(o.operation),
			"index": o.index
		});
		o = this.getToNextMathOperation(subline, sNames, o.index, o.operation);
	}

	if (thisLayerOperations.length != 0) {
		var o = thisLayerOperations[0];
		for (var i = 1; i < thisLayerOperations.length; i++) {
			if (thisLayerOperations[i].operation.priority[0] <= o.operation.priority[0]) {
				o = thisLayerOperations[i];
			}
		}
		var sides = this.getOperationSides(subline, o.operation, o.index);
		if (sides.length == 1) {
			return {
				"operation": o.operation,
				"right": this.getMathExpressionTree(sides[0]),
				"left": null
			}
		}
		if (sides.length == 2) {
			return {
				"operation": o.operation,
				"left": this.getMathExpressionTree(sides[0]),
				"right": this.getMathExpressionTree(sides[1])
			}
		}
	} else {
		while (isInBrackets(subline)) {
			subline = this.getLineFromFirstBrackets(subline).res;
		}
		if (!isNaN(parseFloat(subline))) {
			return parseFloat(subline);
		} else {
			return this.parseSimpleMathExpression(subline);
		}
	}
}

AT_KRL_Parser.prototype.getMathExpressionFromTree = function (root) {
	if (root.left != null && root.right != null) {
		return new AT_KRL_MathExpression([this.getMathExpressionFromTree(root.left), this.getMathExpressionFromTree(root.right)], root.operation.sing);
	}
	if (root.right != null) {
		return new AT_KRL_MathExpression([this.getMathExpressionFromTree(root.right)], root.operation.sing);
	}
	if (AT_KRL_MathExpression.prototype.isNumber(root)) {
		return new AT_KRL_MathExpression(root);
	}
}

AT_KRL_Parser.prototype.parseMathExpression = function (line) {
	var tree;
	if (line.replaceAll(' ', '') == '') {
		tree = this.getMathExpressionTree('0');
	} else {
		tree = this.getMathExpressionTree(line.replaceAll(' ', ''));
	}
	return this.getMathExpressionFromTree(tree);
}

//------Парсинг фактов для математических выражений и парсинг строковых или нечетких выражений------
AT_KRL_Parser.prototype.parseStFzFact = function (line) {
	while (line.indexOf(' ') == 0){
		line = line.slice(1);
	}
	if (line.indexOf('"') == 0) {
		throw new SyntaxError('Невозможно получить факт из объявления:\n' + line + '\nЕсли в выражении присутствует строка, то в левой части выражения должен быть объект и атрибут, а строка в правой');
	}
	if (line.indexOf('=') == -1) {
		throw new SyntaxError('Невозможно получить факт из объявления:\n' + line + '\nВыражения для символьных и нечетких значений должны сравниваться только знаком "="')
	}
	var eq = line.indexOf('=');
	var l = line.substring(0, eq);
	var r = line.substring(eq + 1, line.lastIndexOf(' УВЕРЕННОСТЬ ['));

	var left = this.parseStFzExpression(l);
	var right = this.parseStFzExpression(r);

	var ExSu = line.substring(line.lastIndexOf('УВЕРЕННОСТЬ ['), line.length);

	function checkExSu(str) {
		var s = str;
		while (s.toArray()[s.length - 1] == ' ') {
			s = s.slice(0, s.length - 1);
		}
		var check = (s.indexOf('УВЕРЕННОСТЬ [') == 0 && s.indexOf('] ТОЧНОСТЬ ') != 0);
		if (!check) {
			return (s.indexOf('УВЕРЕННОСТЬ [') != 0) ? ' Некорректный символ на позиции 0\nТребуемый формат: УВЕРЕННОСТЬ [число >=0, число >=0] ТОЧНОСТЬ число >=0' : (s.indexOf(']') == -1 ? ' Не найден конец объявления уверенности в ' + s + '\nТребуемый формат: УВЕРЕННОСТЬ [число >=0, число >=0] ТОЧНОСТЬ число >=0' : ' Невозможно получить значение точности\nТребуемый формат: УВЕРЕННОСТЬ [число >=0, число >=0] ТОЧНОСТЬ число >=0');
		}
		var sure = s.substring(s.indexOf('['), s.indexOf('] ТОЧНОСТЬ ') + 1);
		if (sure.indexOf(';') != -1) {
			sure = sure.replaceAll(',', '.').replaceAll(';', ',');
		}
		var sr;
		try {
			sr = JSON.parse(sure);
			if (sr.length != 2) {
				return ' Невозможно получить значение уверенности в объявлении:\n' + s + '\nТребуемый формат: УВЕРЕННОСТЬ [число >=0, число >=0] ТОЧНОСТЬ число >=0';
			}
			if (typeof (sr[0]) != 'number' || typeof (sr[1]) != 'number') {
				return ' Невозможно получить значение уверенности в объявлении:\n' + s + '\nТребуемый формат: УВЕРЕННОСТЬ [число >=0, число >=0] ТОЧНОСТЬ число >=0';
			}
		} catch (e) {
			return ' Невозможно получить значение уверенности в объявлении:\n' + s + '\nТребуемый формат: УВЕРЕННОСТЬ [число >=0, число >=0] ТОЧНОСТЬ число >=0';
		}
		var exIndex = s.indexOf('] ТОЧНОСТЬ ') + ('] ТОЧНОСТЬ ').length;
		for (var i = exIndex; i < s.length; i++) {
			var count = 0;
			if (isNaN(parseInt(s.toArray()[i])) && (s.toArray()[i] != ',' || s.toArray()[i] != '.') || (s.toArray()[i] == ',' || s.toArray()[i] == '.') && count > 0) {
				return ' Невозможно получить значение точности в объявлении:\n' + s + '\nНекорректный символ на позиции ' + i + '\nТребуемый формат: УВЕРЕННОСТЬ [число >=0, число >=0] ТОЧНОСТЬ число >=0';
			}
			if (s.toArray()[i] == ',' || s.toArray()[i] == '.') {
				count++;
			}
		}
		return -1;
	}

	if (line.indexOf('УВЕРЕННОСТЬ') == -1 || checkExSu(ExSu) != -1) {
		throw new SyntaxError('Невозможно получить значение уверенности и точности в объявлении:\n' + ExSu + '\n' + checkExSu(ExSu));
	}
	var s = ExSu.substring(ExSu.indexOf('['), ExSu.indexOf(']') + 1);
	if (s.indexOf(';') != -1) {
		s = s.replaceAll(',', '.').replaceAll(';', ',');
	}
	var sure = JSON.parse(s);

	var exact = parseFloat(ExSu.substring(ExSu.indexOf('] ТОЧНОСТЬ ') + ('] ТОЧНОСТЬ ').length, ExSu.length).replaceAll(',', '.'));
	var f = new AT_KRL_Fact(left, right, '=', sure, exact);
	return f;
}

AT_KRL_Parser.prototype.parseMathFact = function (line) {
	while (line.indexOf(' ') == 0){
		line = line.slice(1);
	}
	function getRel(line) {
		var s = ['<=', '>=', '<', '>', '='];
		for (var i = 0; i < s.length; i++) {
			if (line.indexOf(s[i]) != -1) {
				return s[i];
			}
		}
	}

	var rel = getRel(line);
	var eq = line.indexOf(rel);

	var l = line.substring(0, eq);
	var r = line.substring(eq + rel.length, line.lastIndexOf(' УВЕРЕННОСТЬ ['));

	var left = this.parseMathExpression(l);
	var right = this.parseMathExpression(r);

	var ExSu = line.substring(line.lastIndexOf('УВЕРЕННОСТЬ ['), line.length);

	function checkExSu(str) {
		var s = str;
		while (s.toArray()[s.length - 1] == ' ') {
			s = s.slice(0, s.length - 1);
		}
		var check = (s.indexOf('УВЕРЕННОСТЬ [') == 0 && s.indexOf('] ТОЧНОСТЬ ') != 0);
		if (!check) {
			return (s.indexOf('УВЕРЕННОСТЬ [') != 0) ? ' Некорректный символ на позиции 0\nТребуемый формат: УВЕРЕННОСТЬ [число >=0, число >=0] ТОЧНОСТЬ число >=0' : (s.indexOf(']') == -1 ? ' Не найден конец объявления уверенности в ' + s + '\nТребуемый формат: УВЕРЕННОСТЬ [число >=0, число >=0] ТОЧНОСТЬ число >=0' : ' Невозможно получить значение точности\nТребуемый формат: УВЕРЕННОСТЬ [число >=0, число >=0] ТОЧНОСТЬ число >=0');
		}
		var sure = s.substring(s.indexOf('['), s.indexOf('] ТОЧНОСТЬ ') + 1);
		if (sure.indexOf(';') != -1) {
			sure = sure.replaceAll(',', '.').replaceAll(';', ',');
		}
		var sr;
		try {
			sr = JSON.parse(sure);
			if (sr.length != 2) {
				return ' Невозможно получить значение уверенности в объявлении:\n' + s + '\nТребуемый формат: УВЕРЕННОСТЬ [число >=0, число >=0] ТОЧНОСТЬ число >=0';
			}
			if (typeof (sr[0]) != 'number' || typeof (sr[1]) != 'number') {
				return ' Невозможно получить значение уверенности в объявлении:\n' + s + '\nТребуемый формат: УВЕРЕННОСТЬ [число >=0, число >=0] ТОЧНОСТЬ число >=0';
			}
		} catch (e) {
			return ' Невозможно получить значение уверенности в объявлении:\n' + s + '\nТребуемый формат: УВЕРЕННОСТЬ [число >=0, число >=0] ТОЧНОСТЬ число >=0';
		}
		var exIndex = s.indexOf('] ТОЧНОСТЬ ') + ('] ТОЧНОСТЬ ').length;
		for (var i = exIndex; i < s.length; i++) {
			var count = 0;
			if (isNaN(parseInt(s.toArray()[i])) && (s.toArray()[i] != ',' || s.toArray()[i] != '.') || (s.toArray()[i] == ',' || s.toArray()[i] == '.') && count > 0) {
				return ' Невозможно получить значение точности в объявлении:\n' + s + '\nНекорректный символ на позиции ' + i + '\nТребуемый формат: УВЕРЕННОСТЬ [число >=0, число >=0] ТОЧНОСТЬ число >=0';
			}
			if (s.toArray()[i] == ',' || s.toArray()[i] == '.') {
				count++;
			}
		}
		return -1;
	}

	if (line.indexOf('УВЕРЕННОСТЬ') == -1 || checkExSu(ExSu) != -1) {
		throw new SyntaxError('Невозможно получить значение уверенности и точности в объявлении:\n' + ExSu + '\n' + checkExSu(ExSu));
	}
	var s = ExSu.substring(ExSu.indexOf('['), ExSu.indexOf(']') + 1);
	if (s.indexOf(';') != -1) {
		s = s.replaceAll(',', '.').replaceAll(';', ',');
	}
	var sure = JSON.parse(s);
	var exact = parseFloat(ExSu.substring(ExSu.indexOf('] ТОЧНОСТЬ ') + ('] ТОЧНОСТЬ ').length, ExSu.length).replaceAll(',', '.'));
	var f = new AT_KRL_Fact(left, right, rel, sure, exact);
	return f;
}

//------Парсинг условий для правил методом построения и обхода дерева разбора------
AT_KRL_Parser.prototype.getToNextLogicOperation = function (subline, sNames, index, current) {
	var i = index + current.length;
	var bracket = (subline.toArray()[i] == '(') ? 1 : 0;

	function isOperation(sl, n, i) {
		function isInBrackets(line) {
			if (line.toArray()[0] != '(') {
				return false;
			} else {
				var b = 1;
				var i = 1;
				var index = 0;
				while (b != 0 && i < line.length) {
					if (line.toArray()[i] == '(') {
						b++;
					}
					if (line.toArray()[i] == ')') {
						b--;
					}
					if (b == 0 && index == 0) {
						index = i;
					}
					if (b == 0 && i != line.length - 1) {
						return false;
					}
					i++;
				}
				if (b == 0 && index == line.length - 1) {
					return true;
				}
			}
		}

		var s = sl;
		while (isInBrackets(s)) {
			s = AT_KRL_Parser.prototype.getLineFromFirstBrackets(s).res;
		}
		var res = false;
		for (var k = 0; k < n.length; k++) {
			res = (res || ((s.indexOf(n[k], i) == i) && (n.indexOf(s.substr(i, n[k].length + 1)) == -1))) && (s.lastIndexOf(')') > s.lastIndexOf('УВЕРЕННОСТЬ') || s.lastIndexOf(')') == -1);
			if (res) {
				return n[k];
			}
		}
		return false;
	}
	var o = isOperation(subline, sNames, i);
	while ((!isOperation(subline, sNames, i) || isOperation(subline, sNames, i) && bracket != 0) && i < subline.length - 1) {
		i++;
		o = isOperation(subline, sNames, i);
		if (subline.toArray()[i] == "(") {
			bracket++;
		}
		if (subline.toArray()[i] == ")") {
			bracket--;
		}
	}
	if (i == subline.length - 1) {
		return false;
	}
	return {
		index: i,
		operation: o
	};
}

AT_KRL_Parser.prototype.getToFirstLogicOperation = function (subline, sNames) {
	return this.getToNextLogicOperation(subline, sNames, 0, '');
}

AT_KRL_Parser.prototype.getAllLogicSings = function () {
	return [{
		"sing": "~",
		"pos": 1,
		"type": ["coef"],
		"priority": [0]
	}, {
		"sing": "|",
		"pos": Infinity,
		"type": ["bin"],
		"priority": [0]
	}, {
		"sing": "&",
		"pos": Infinity,
		"type": ["bin"],
		"priority": [1]
	}]
}

AT_KRL_Parser.prototype.getLogicSingByName = function (name) {
	var s = this.getAllLogicSings();
	for (var i = 0; i < s.length; i++) {
		if (s[i].sing == name) {
			return s[i];
		}
	}
}

AT_KRL_Parser.prototype.getLogicOperationSides = function (subline, operation, index) {
	function isInBrackets(line) {
		if (line.toArray()[0] != '(') {
			return false;
		} else {
			var b = 1;
			var i = 1;
			var index = 0;
			while (b != 0 && i < line.length) {
				if (line.toArray()[i] == '(') {
					b++;
				}
				if (line.toArray()[i] == ')') {
					b--;
				}
				if (b == 0 && index == 0) {
					index = i;
				}
				if (b == 0 && i != line.length - 1) {
					return false;
				}
				i++;
			}
			if (b == 0 && index == line.length - 1) {
				return true;
			}
		}
	}

	var left = this.getLineFromFirstBrackets(subline);
	var right = this.getLineFromBrackets(subline, index + 1);
	while (isInBrackets(left)) {
		left = this.getLineFromFirstBrackets(left).res;
	}
	while (isInBrackets(right)) {
		right = this.getLineFromFirstBrackets(right).res;
	}
	if (operation == '~') {
		return [right];
	}
	/*if (){
	throw new SyntaxError('Невозможно интерпретировать математическое выражение в объявлении:\n' + subline);
	}*/
	return [left, right];
}

AT_KRL_Parser.prototype.getLogicExpressionTree = function (subline) {
	function isInBrackets(line) {
		if (line.toArray()[0] != '(') {
			return false;
		} else {
			var b = 1;
			var i = 1;
			var index = 0;
			while (b != 0 && i < line.length) {
				if (line.toArray()[i] == '(') {
					b++;
				}
				if (line.toArray()[i] == ')') {
					b--;
				}
				if (b == 0 && index == 0) {
					index = i;
				}
				if (b == 0 && i != line.length - 1) {
					return false;
				}
				i++;
			}
			if (b == 0 && index == line.length - 1) {
				return true;
			}
		}
	}
	while (isInBrackets(subline)) {
		subline = this.getLineFromFirstBrackets(subline).res;
	}
	subline = subline.replaceAll('\n', '');

	var sings = this.getAllLogicSings();
	var sNames = [];
	for (var i = 0; i < sings.length; i++) {
		if (sings[i].sing) {
			sNames.push(sings[i].sing);
		}
	}

	var thisLayerOperations = [];
	var o = this.getToFirstLogicOperation(subline, sNames);
	while (o) {
		thisLayerOperations.push({
			"operation": this.getLogicSingByName(o.operation),
			"index": o.index
		});
		o = this.getToNextLogicOperation(subline, sNames, o.index, o.operation);
	}

	if (thisLayerOperations.length != 0) {
		var o = thisLayerOperations[0];
		for (var i = 1; i < thisLayerOperations.length; i++) {
			if (thisLayerOperations[i].operation.priority[0] <= o.operation.priority[0]) {
				o = thisLayerOperations[i];
			}
		}
		var sides = this.getOperationSides(subline, o.operation, o.index);
		if (sides.length == 1) {
			return {
				"operation": o.operation,
				"right": this.getLogicExpressionTree(sides[0]),
				"left": null
			}
		}
		if (sides.length == 2) {
			return {
				"operation": o.operation,
				"left": this.getLogicExpressionTree(sides[0]),
				"right": this.getLogicExpressionTree(sides[1])
			}
		}
	} else {
		try {
			return this.parseMathFact(subline);
		} catch (e) {
			try {
				return this.parseStFzFact(subline);
			} catch (g) {
				throw new SyntaxError('ЕСЛИ ВЫ ХОТЕЛИ ВВЕСТИ ПРАВИЛО ДЛЯ ЧИСЛОВОГО ЗНАЧЕНИЯ:\n' + e.message + '\n\n' + 'ЕСЛИ ВЫ ХОТЕЛИ ВВЕСТИ ПРАВИЛО ДЛЯ СИМВОЛЬНОГО ИЛИ НЕЧЕТКОГО ЗНАЧЕНИЯ:\n' + g.message);
			}
		}
	}
}

AT_KRL_Parser.prototype.getConditionFromTree = function (root) {
	var cs = [];
	if (root.left != null) {
		if (root.left.operation != null) {
			cs.push(this.getConditionFromTree(root.left));
		}
		if (root.left.leftside != null && root.left.rightside != null) {
			cs.push(root.left);
		}
	}
	if (root.right.operation != null) {
		cs.push(this.getConditionFromTree(root.right));
	}
	if (root.right.leftside != null && root.right.rightside != null) {
		cs.push(root.right);
	}
	var s = root.operation.sing;
	switch (s) {
		case '~':
			if (cs.length == 1) {
				return new AT_KRL_ConditionNot(cs[0]);
			} else {
				throw new SyntaxError('Логический оператор "~" должен иметь единственный член');
			}
			break;
		case '&':
			if (cs.length == 2) {
				return new AT_KRL_ConditionAnd(cs);
			} else {
				throw new SyntaxError('Логический оператор "&" должен иметь минимум два члена');
			}
			break;
		case '|':
			if (cs.length == 2) {
				return new AT_KRL_ConditionOr(cs);
			} else {
				throw new SyntaxError('Логический оператор "|" должен иметь минимум два члена');
			}
			break;
		default:
			throw new SyntaxError('Ошибка чтения логического оператора из "' + s + '"');
			break;
	}
}

//------Парсинг правила------
AT_KRL_Parser.prototype.parseRuleName = function (line) {
	if (line.indexOf("ПРАВИЛО ") != 0) {
		throw new SyntaxError("Невозможно получить имя правила из: " + line);
	}
	var name = this.validateName(line.replace('ПРАВИЛО ', ''), 'rules');
	return name;
}

AT_KRL_Parser.prototype.parseRuleNameFL = function (lines) {
	return this.parseRuleName(lines[0]);
}

AT_KRL_Parser.prototype.removeBracketSpases = function (line) {
	return line.replaceAll(' (', '(').replaceAll('( ', '(').replaceAll(' )', ')').replaceAll(') ', ')').replaceAll(')УВЕРЕННОСТЬ', ') УВЕРЕННОСТЬ');
}

AT_KRL_Parser.prototype.parseRuleConditions = function (line) {
	var tree = this.getLogicExpressionTree(this.removeBracketSpases(line));
	return this.getConditionFromTree(tree);
}

AT_KRL_Parser.prototype.parseRuleConditionsFL = function (lines) {
	var line = '';
	for (var i = lines.indexOf('ЕСЛИ') + 1; i < lines.indexOf('ТО'); i++) {
		line += lines[i];
	}
	return this.parseRuleConditions(line);
}

AT_KRL_Parser.prototype.sideHasNoObject = function (side) {
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

AT_KRL_Parser.prototype.sideIsOnlyObject = function (side) {
	if (side.object && side.aIndex != null && side.object.attributes[side.aIndex]) {
		return true;
	}
	if (side.expressions && side.expressions.length == 1) {
		return this.sideIsOnlyObject(side.expressions[0]);
	}
	return false;
}

AT_KRL_Parser.prototype.factIsSimple = function (f, l) {
	var res = this.sideIsOnlyObject(f.leftside) && this.sideHasNoObject(f.rightside);
	if (!res) {
		throw new SyntaxError('Описание факта "' + l + '" не подходит для описания результата правила\nТребуемый формат: ОБЪЕКТ.АТРИБУТ=значение');
	}
	return res;
}

AT_KRL_Parser.prototype.parseRuleFactsFL = function (lines) {
	var i1 = lines.indexOf('ТО');
	var i2 = lines.indexOf('ИНАЧЕ');
	var i3 = -1;
	for (var i = 0; i < lines.length; i++) {
		if (lines[i].indexOf('КОММЕНТАРИЙ') == 0) {
			i3 = i;
		}
	}
	if (i2 == -1) {
		i2 = i3;
	}
	if (i1 == -1 || i2 == -1) {
		throw new SyntaxError('Невозможно получить результат правила в объявлении:\n' + this.getTextFromLines(lines));
	}
	var result = [];
	for (var i = i1 + 1; i < i2; i++) {
		var f;
		try {
			f = this.parseMathFact(lines[i]);
		} catch (e) {
			try {
				f = this.parseStFzFact(lines[i]);
			} catch (g) {
				throw new SyntaxError('ЕСЛИ ВЫ ХОТЕЛИ ВВЕСТИ ПРАВИЛО ДЛЯ ЧИСЛОВОГО ЗНАЧЕНИЯ:\n' + e.message + '\n\n' + 'ЕСЛИ ВЫ ХОТЕЛИ ВВЕСТИ ПРАВИЛО ДЛЯ СИМВОЛЬНОГО ИЛИ НЕЧЕТКОГО ЗНАЧЕНИЯ:\n' + g.message);
			}
		}
		if (this.factIsSimple(f, lines[i])) {
			result.push(f);
		}
	}

	var elsresult = null;

	if (i2 != i3) {
		elsresult = [];
		for (var i = i2 + 1; i < i3; i++) {
			var f;
			try {
				f = this.parseMathFact(lines[i]);
			} catch (e) {
				try {
					f = this.parseStFzFact(lines[i]);
				} catch (g) {
					throw new SyntaxError('ЕСЛИ ВЫ ХОТЕЛИ ВВЕСТИ ПРАВИЛО ДЛЯ ЧИСЛОВОГО ЗНАЧЕНИЯ:\n' + e.message + '\n\n' + 'ЕСЛИ ВЫ ХОТЕЛИ ВВЕСТИ ПРАВИЛО ДЛЯ СИМВОЛЬНОГО ИЛИ НЕЧЕТКОГО ЗНАЧЕНИЯ:\n' + g.message);
				}
			}
			if (this.factIsSimple(f, lines[i])) {
				elsresult.push(f);
			}
		}
	}
	return {
		"result": result,
		"elsresult": elsresult
	};
}

AT_KRL_Parser.prototype.parseRule = function (declaration) {
	var lines = this.getAllLines(declaration);
	var name = this.parseRuleNameFL(lines);
	var conditions = this.parseRuleConditionsFL(lines);
	var facts = this.parseRuleFactsFL(lines);
	var comment = this.parseCommentFL(lines);
	var rule = new AT_KRL_Rule(name, conditions, facts, comment, this.editor);
	return rule;
}

//------Парсинг объявления------
AT_KRL_Parser.prototype.parseDeclaration = function (declaration) {
	var lines = this.getAllLines(declaration);
	var decType = lines[0].slice(0, lines[0].indexOf(' ') + 1);
	switch (decType) {
		case 'ТИП ':
			return this.parseType(declaration);
		case 'ОБЪЕКТ ':
			return this.parseObject(declaration);
		case 'ПРАВИЛО ':
			return this.parseRule(declaration);
		default:
			throw new SyntaxError('Некорректное объявление:\n' + declaration + '\nСтрока 0');
	}
}