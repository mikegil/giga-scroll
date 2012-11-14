var deferredComputed = function(fn) {
  return ko.computed({
    read: fn,
    deferEvaluation: true
  });
};

var DC = deferredComputed;

function GigaScrollViewModel() {

  var self = this;

  self.getItemsMissing = null;

  var _itemCache = ko.observableArray();
  var _numberOfServerItems = ko.observable(null);
  var _viewPortHeight = ko.observable(null);
  var _elementHeight = ko.observable(null);
  var _scrollPosition = ko.observable(0);

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

  var _loadIfMissing = function(startIndex, length) {
    if (startIndex !== null && length !== null) {
      self.getItemsMissing(startIndex, length, function(items, numberOfServerItems) {
        _numberOfServerItems(numberOfServerItems);
        for(var i = 0; i < length; i++) {
          _itemCache()[startIndex+i] = items[i];
        }
        _itemCache.valueHasMutated();
      });
    }
  };


  self.visibleItems = DC(function() {
    var i, iServer, cached, toReturn;

    toReturn = new Array(_fitsInViewPort() || 0);
    for (i = 0; i < _fitsInViewPort(); i++) {

      iServer = _visibleStartIndex() + i;
      cached =  _itemCache()[iServer];
      if (!cached) {
        _loadIfMissing(iServer, _fitsInViewPort() - i);
        break;
      }
      toReturn[i] = cached;
    }
    return toReturn;
  });

  self.offsetTop = DC(function() {
    return _visibleStartIndex() * _elementHeight();
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

  self.gigaDivHeight = DC(function() {
    return _numberOfServerItems() * _elementHeight();
  });



}