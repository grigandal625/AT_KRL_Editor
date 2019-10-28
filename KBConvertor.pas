unit KBConvertor;

//////////////////////////////////////////////////////////////
///  Модуль для конвертации файлов БЗ из .kbs в файлы .xml ///
//////////////////////////////////////////////////////////////
/// Использую                                              ///
///   https://github.com/grigandal625/AT_KRL_Editor        ///
///   JS-библиотека,                                       ///
///   интегрирую через ActiveX-компонент MSScriptControl   ///
//////////////////////////////////////////////////////////////
///************Автор: Григорьев А.А. 05.06.2019************///
//////////////////////////////////////////////////////////////

interface

uses
  Winapi.Windows, Winapi.Messages, System.SysUtils, System.Variants,
  System.Classes, Vcl.Graphics,
  Vcl.Controls, Vcl.Forms, Vcl.Dialogs, Vcl.ComCtrls, Vcl.StdCtrls, ComObj,
  Vcl.OleCtrls;

type

  decs = array of string;

  TForm2 = class(TForm) // просто формочка со строкой прогресса конвертации
    Label1: TLabel;
    ProgressBar1: TProgressBar;
    Memo1: TMemo;
    procedure FormCreate(Sender: TObject);
  private
    { Private declarations }
  public
    { Public declarations }
  end;

  TKBConvertor = class(TObject)
  private
    js: OleVariant;
    declarations: decs;
    KBS: string;
    XML: string;
    function replaceAll(s, old, new: string): string;
    function getDeclarationsCount(s: string): integer;
    function getDeclarations(s: widestring): decs;
  public
    savePath: string;
    ini: TForm2;
    constructor create;
    procedure LoadFromFile(path: string; e: TEncoding);
    procedure SaveToFile(path: string);
    procedure Convert(path: string);
    destructor Destroy;

  end;

implementation

{$R *.dfm}

procedure TForm2.FormCreate(Sender: TObject);
begin
  Caption := 'Статус';
  BorderIcons := [];
  BorderStyle := bsNone;
  Label1.layout := tlCenter;
  Label1.alignment := taLeftJustify;
  Label1.Caption := 'Инициализация';
  Position := poDesktopCenter;
end;

constructor TKBConvertor.create;
var
  loader: TStringList;
  script: string;
begin

  { Scripts: https://github.com/grigandal625/AT_KRL_Editor/tree/master/Scripts }
  ini := TForm2.create(application);
  loader := TStringList.create;
  js := CreateOleObject('ScriptControl'); // msscript.ocx
  js.Language := 'JScript';
  js.TimeOut := -1;
  // всегда ожидаем до конца, не останавливая выполнение скрипта
  js.AllowUI := True;

  // Загрузим все скрипты
  try

    loader.LoadFromFile('Scripts/JSUtils.js');
    script := loader.text;
    js.eval(script);
    loader.clear;
    loader.LoadFromFile('Scripts/XMLUtils.js');
    script := loader.text;
    js.eval(script);
    loader.clear;
    loader.LoadFromFile('Scripts/AT_KRL_Editor.js');
    script := loader.text;
    js.eval(script);
    loader.clear;
    loader.LoadFromFile('Scripts/AT_KRL_Type.js');
    script := loader.text;
    js.eval(script);
    loader.clear;
    loader.LoadFromFile('Scripts/AT_KRL_Object.js');
    script := loader.text;
    js.eval(script);
    loader.clear;
    loader.LoadFromFile('Scripts/AT_KRL_Expressions.js');
    script := loader.text;
    js.eval(script);
    loader.clear;
    loader.LoadFromFile('Scripts/AT_KRL_Fact.js');
    script := loader.text;
    js.eval(script);
    loader.clear;
    loader.LoadFromFile('Scripts/AT_KRL_Rule.js');
    script := loader.text;
    js.eval(script);
    loader.clear;
    loader.LoadFromFile('Scripts/AT_KRL_Parser.js');
    script := loader.text;
    js.eval(script);
    loader.clear;
    js.eval('var e = new AT_KRL_Editor(); var p = new AT_KRL_Parser(e); e.clear();');// e - объект, где будет сохраняться все распарсенное

  except
    on Er : Exception do
    begin
      inputBox('Ошибка конвертации', Er.ClassName+#13#10+#13#10+'Ошибка с сообщением : '+#13#10+replaceAll(Er.Message,'. ','.'+#13#10) + #13#10+#13#10+'(Если ошибка об отсутсвии файлов, загрузите их по ссылке.)', 'https://github.com/grigandal625/AT_KRL_Editor/tree/master/Scripts');
      ini.Close;
      exit;
    end;

  end;
end;

destructor TKBConvertor.Destroy;
begin
  js.free;
end;

function TKBConvertor.replaceAll(s, old, new: string): string;
var
  before, after: string;
begin
  before := s;
  after := StringReplace(before, old, new, [rfReplaceAll]);
  result := after;
end;

// Считат, сколько всего надо распарсить в .kbs
function TKBConvertor.getDeclarationsCount(s: string): integer;
var
  KRL: string;
begin
  KRL := s;
  result := StrToInt(js.eval('(p.getAllDeclarations(''' + replaceAll(KRL, '''',
    '\''') { Экранируем кавычки } + ''').length)'));
end;

// Получаем по-отдельности то, что надо распарсить
function TKBConvertor.getDeclarations(s: widestring): decs;
var
  res: decs;
  i, len: integer;
  KRL: widestring;
begin
  len := getDeclarationsCount(s);
  KRL := '''' + replaceAll(s, '''', '\''') + '''';
  js.eval('var tmp = p.getAllDeclarations(' + KRL + ');');
  setLength(res, len);
  for i := 0 to len - 1 do
  begin
    res[i] := replaceAll(js.eval('JSON.stringify(tmp[' + IntToStr(i) + '])'),
      #10, #13#10); // replaceAll тут по сути и не нужен
  end;
  result := res;
end;

procedure TKBConvertor.LoadFromFile(path: string; e: TEncoding);
var
  KRL: string;
begin
  ini.Memo1.lines.LoadFromFile(path, e);
  KRL := replaceAll(ini.Memo1.text, #13#10, '\n');
  KBS := ini.Memo1.text;
  declarations := getDeclarations(KRL);
end;

procedure TKBConvertor.SaveToFile(path: string);
var
  f: textFile;
begin
  AssignFile(f, path);
  rewrite(f);
  writeln(f, XML);
  closefile(f);
end;


// конвертим из файла
procedure TKBConvertor.Convert(path: string);
var
  i, len: integer;
  s, er, scr, KRL: string;
begin
  ini.Show;
  ini.ProgressBar1.Position := 0;
  application.ProcessMessages;
  try
    LoadFromFile(path, TEncoding.UTF8); // пробуем загрузить c UTF8
  except
    LoadFromFile(path, Nil); // Если не выходит, то с ANSI
  end;

  // Во время LoadFromFile уже получили список declarations

  len := length(declarations);
  ini.ProgressBar1.Max := len + len div 50;

  // парсим каждую из declarations, распарсенное сохранится в "e" (см Конструктор, последний js.eval)
  for i := 0 to len - 1 do
  begin
    s := declarations[i];
    if s <> '' then
    begin
      scr := 'try{p.parseDeclaration(' + AnsiToUTF8(s) +
        ');}catch(error){"!!!ERROR!!!: " + error.message}';
      er := js.eval(scr);
      if pos('!!!ERROR!!!', er) <> 0 then
      begin
        showMessage(UTF8ToAnsi(er));
        exit
      end;
      ini.ProgressBar1.Position := i;
      application.ProcessMessages;

    end;
  end;
  ini.Label1.Caption := 'Конвертация';
  application.ProcessMessages;

  //Конвертируем в XML из "e"
  XML := js.eval('e.toXML();');
  SaveToFile(savePath);
  ini.close;
end;

end.
