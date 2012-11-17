function createNativeStringTemplateEngine() {

  var StringTemplate = function(text) {
    var _data = {};
    var _text = text;
    this.data = function(key, value) {
        if (!value) return _data[key];
        _data[key] = value;
    }
    this.text = function(newValue) {
        if (!newValue) return _text;
        _text = newValue;
    }
  }

  var _templates = {};
  var _nativeEngine = new ko.nativeTemplateEngine();

  _nativeEngine.makeTemplateSource = function(templateName) {
      return _templates[templateName];
  }

  _nativeEngine.addTemplate = function(name, body) {
      _templates[name] = new StringTemplate(body);
  }

  return _nativeEngine;
}