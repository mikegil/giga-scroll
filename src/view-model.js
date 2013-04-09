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
    return Math.floor(_visibleStartIndex() / _rowLength()) * _rowHeight() ;
  });

  self.gigaDivHeight = DC(function() {
    return Math.floor(_numberOfServerItems() / _rowLength()) * _rowHeight();
  });

  self.setViewPortHeight = function(height)  {
    _viewPortHeight(height);
  }
  self.setRowHeight = function(height)  {
    _rowHeight(height);
  }
  self.setScrollPosition = function(y) {
    _scrollPosition(y);
  }
  self.setRowLength = function(rowLength) {
    _rowLength(rowLength);
  }

  var _visibleStartIndex = DC(function() {
    if (_scrollPosition() === null || _rowHeight() === null) {
      return null;
    }
    var lastIndex = _numberOfServerItems();
    var lastStartIndex = lastIndex - _fitsInViewPort();
    var rowAtScrollPosition = Math.floor(_scrollPosition() / _rowHeight());
    var indexAtScrollPosition = (rowAtScrollPosition) * _rowLength();
    return Math.min(lastStartIndex, indexAtScrollPosition);
  });

  var _fitsInViewPort = DC(function() {
    if (_viewPortHeight() === null || _rowHeight() === null) {
      return null;
    }
    var val = Math.ceil(_viewPortHeight() / _rowHeight()) * _rowLength();
    return val ;
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
  var _rowHeight = ko.observable(null);
  var _scrollPosition = ko.observable(0);
  var _rowLength = ko.observable(1)

}