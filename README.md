Данная библиотека включает в себя следующие модули:
- JSUtils.js – данный модуль предназначен для поддержки кросс-платформенного функционирования библиотеки, в том числе для интеграции в программный код библиотек инструментального комплекса АТ-ТЕХНОЛОГИЯ и универсального АТ-РЕШАТЕЛЯ с помощью ActiveX компонента MS ScriptControl (msscript.ocx).
-	XMLUtils.js – данный модуль содержит класс для работы с форматом XML также с поддержкой кросс-платформенности.
-	AT_KRL_Editor.js – данный модуль содержит класс верхнего уровня AT_KRL_Editor, предназначенный для хранения данных о загруженной БЗ на ЯПЗ и методов ее конвертации.
-	AT_KRL_Type.js – в данном модуле описан класс для хранения типов, загруженных из ЯПЗ. Класс может хранить числовой, символьный и нечеткий типы. Кроме того, класс предоставляет методы по конвертации типов в XML. 
-	AT_KRL_Object.js – данный модуль содержит класс для хранения загруженных из ЯПЗ объектов и методов конвертации в XML.
-	AT_KRL_Expressions.js – в данном модуле реализованы классы, предназначенные для описания выражений, которые в последствии могут сравниваться или присваиваться атрибутам. Из выражений в последствие могут быть составлены сложные математические выражения.
-	AT_KRL_Fact.js – данный модуль содержит класс, который предназначен для хранения и обработки фактов и действий для правил. Из фактов в последствии могут быть составлены логические выражения. Действия описывают результат срабатывания правил.	
-	AT_KRL_Rule.js – в данном модуле описаны классы для хранения и обработки логических выражений и правил, а также содержащие методы конвертации правил в XML.
-	AT_KRL_Parser.js – данный модуль содержит класс для обработки собственно ЯПЗ и конвертации его в экземпляры классов, описанных выше, с последующей возможностью конвертации их в XML.

Для интеграции данной библиотеки в программный код универсального АТ-РЕШАТЕЛЯ был разработан модуль TKBConvertor.pas. Интеграция производится с помощью ActiveX компонента MS ScriptControl (msscript.ocx).
