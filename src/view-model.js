var deferredComputed = function(fn) {
  return ko.computed({
    read: fn,
    deferEvaluation: true
  });
};

var DC = deferredComputed;

function GigaScrollViewModel() {

  var self = this;

  self.visibleItems = DC(function() {
    var loadStartIndex, loadLength, lastIndex;

    if (_visibleStartIndex() === null || _fitsInViewPort === null) {
      return [];
    }

    loadStartIndex = Math.max(_visibleStartIndex()-_fitsInViewPort(), 0);
    loadLength = _fitsInViewPort() * (loadStartIndex === 0 ? 2 : 3);

    _loadIfMissing(loadStartIndex, loadLength);

    // Ensure array long enough
    lastIndex = _visibleStartIndex() + _fitsInViewPort();
    if (!_itemCache()[lastIndex]) { _itemCache()[lastIndex] = null; }

    return _itemCache().slice(_visibleStartIndex(), _visibleStartIndex()+_fitsInViewPort());
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

  self.getItemsMissing = null;

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
      self.getItemsMissing(startIndex, length, function(items, numberOfServerItems) {
        _numberOfServerItems(numberOfServerItems);
        for(var i = 0; i < length; i++) {
          _itemCache()[startIndex+i] = items[i];
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