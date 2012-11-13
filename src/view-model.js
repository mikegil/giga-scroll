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

  var _visibleItemsCache = ko.observableArray();
  var _numberOfServerItems = ko.observable(null);
  var _viewPortHeight = ko.observable(null);
  var _elementHeight = ko.observable(null);
  var _scrollPosition = ko.observable(0);

  var _visibleStartIndex = DC(function() {
    if (_scrollPosition() === null || _elementHeight() === null) {
      return null;
    }
    return _scrollPosition() / _elementHeight();
  });

  var _fitsInViewPort = DC(function() {
    if (_viewPortHeight() === null || _elementHeight() === null) {
      return null;
    }
    var val = _viewPortHeight() / _elementHeight();
    return val;
  });

  var _loadIfMissing = function(startIndex, length) {
    if (startIndex !== null && length !== null) {
      self.getItemsMissing(startIndex, length, _onGetItemsMissingResult);
    }
  };

  var _onGetItemsMissingResult = function(items, numberOfServerItems) {
    _numberOfServerItems(numberOfServerItems);
    _visibleItemsCache(items);
  }

  self.visibleItems = DC(function() {
    console.log("visibleItems")
    _loadIfMissing(_visibleStartIndex(), _fitsInViewPort())
    return _visibleItemsCache();
  });

  self.offsetTop = DC(function() {
    return _scrollPosition();
  });

  self.setViewPortHeight = function(height)  {
    _viewPortHeight(height);
  }
  self.setElementHeight = function(height)  {
    _elementHeight(height);
    self.getItemsMissing(0, 10, _onGetItemsMissingResult);
  }
  self.setScrollPosition = function(y) {
    _scrollPosition(y);
  }

  self.gigaDivHeight = DC(function() {
    return _numberOfServerItems() * _elementHeight();
  });



}