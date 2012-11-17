function GigaScrollViewModel(opts) {

  // Shorthand to create a computed property with deferred evaluation.
  function DC(fn) { return ko.computed({ read: fn, deferEvaluation: true }) }

  var self = this;

  self.visibleItems = DC(function() {
    var i, loadStartIndex, loadLength, oneViewPortAboveIndex, visibles;

    if (_visibleStartIndex() === null || _fitsInViewPort === null) {
      return [];
    }

    oneViewPortAboveIndex = _visibleStartIndex() - _fitsInViewPort();
    loadStartIndex = Math.max(oneViewPortAboveIndex, 0);
    loadLength = _fitsInViewPort() * 3;

    _loadIfMissing(loadStartIndex, loadLength);

    visibles = new Array(_fitsInViewPort());
    for (i = 0; i < _fitsInViewPort(); i++) {
      visibles[i] = _itemCache()[_visibleStartIndex() + i];
    }
    return visibles;
  });

  self.offsetTop = DC(function() {
    return _visibleStartIndex() * _elementHeight();
  });

  self.gigaDivHeight = DC(function() {
    return _numberOfServerItems() * _elementHeight();
  });

  self.setViewPortHeight = function(height)  {
    _viewPortHeight(height);
  }
  self.setElementHeight = function(height)  {
    _elementHeight(height);
  }
  self.setScrollPosition = function(y) {
    _scrollPosition(y);
  }

  var _visibleStartIndex = DC(function() {
    if (_scrollPosition() === null || _elementHeight() === null) {
      return null;
    }
    return Math.floor(_scrollPosition() / _elementHeight());
  });

  var _fitsInViewPort = DC(function() {
    if (_viewPortHeight() === null || _elementHeight() === null) {
      return null;
    }
    var val = Math.ceil(_viewPortHeight() / _elementHeight());
    return val;
  });

  var _getItemsMissingHandle = null;

  var _loadIfMissing = function(startIndex, length) {

    while(_itemCache()[startIndex]) {
      startIndex++;
      length--;
    }
    while(_itemCache()[startIndex+length-1]) {
      length--;
      if (length < 1) return;
    }

    clearTimeout(_getItemsMissingHandle);
    _getItemsMissingHandle = setTimeout(function (){
      opts.load(startIndex, length, function(items, numberOfServerItems) {
        _numberOfServerItems(numberOfServerItems);
        for(var i = 0; i < length; i++) {
          _itemCache()[startIndex + i] = items[i];
        }
        _itemCache.valueHasMutated();
      });
    }, 100);

  };

  var _itemCache = ko.observableArray();
  var _numberOfServerItems = ko.observable(null);
  var _viewPortHeight = ko.observable(null);
  var _elementHeight = ko.observable(null);
  var _scrollPosition = ko.observable(0);

}