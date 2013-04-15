function GigaScrollViewModel(opts) {

  var sinceEpoch = function() {
    return Number(new Date())
  }
  var start = sinceEpoch()
  var sinceStart = function() {
    return sinceEpoch() - start
  }

  /*
   * This is a general-purpose "notifyComparer" extender that can be chained
   * onto any observable or computed value. It causes the target only to
   * issue change notifications when the equalityComparer says the value has changed.
   * */
  ko.extenders.notifyComparer = function(target, equalityComparer) {
      var valueToNotify = ko.observable();
      valueToNotify.equalityComparer = function(x, y) {
        var i;
        if (Array.isArray(x)) {
          if (Array.isArray(y)) {
            if (x.length !== y.length) {
              return false;
            }
            for(i = 0; i < x.length; i++) {
              if (!equalityComparer(x[i], y[i])) {
                return false;
              }
            }
            return true;
          }
          return false;
        }
        return equalityComparer(x, y)
      }
      target.subscribe(valueToNotify);
      var firstRead = true;
      return ko.computed({
        deferEvaluation: true,
        read: function(){
          if (firstRead) {
            firstRead = false;
            valueToNotify(target.peek());
          }
          return valueToNotify();
      } });
  };


  // Shorthand to create a computed property with deferred evaluation.
  function computedLazy(fn) {
    return ko.computed({
      read: fn,
      deferEvaluation: true
    }).extend({
      notifyComparer: opts.equalityComparer || simpleComparer
    })
  }

  function simpleComparer(x, y) {
    return x === y
  }



  var self = this;

  self.sample = function(sampleSize) {
    _sampling(sampleSize)
  }

  self.visibleItems = computedLazy(function() {
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

  self.offsetTop = computedLazy(function() {
    return Math.floor(_visibleStartIndex() / _rowLength()) * _rowHeight() ;
  });

  self.gigaDivHeight = computedLazy(function() {
    return Math.floor(_numberOfServerItems() / _rowLength()) * _rowHeight();
  });

  self.setViewPortHeight = function(height) {
    if(!_sampling())
      throw new Error("Call sample and then render and measure the resulting " +
                      "visibleItems before calling setViewPortHeight.")
    _viewPortHeight(height);
  }
  self.setRowHeight = function(height)  {
    if(!_sampling())
      throw new Error("Call sample and then render and measure the resulting " +
                      "visibleItems before calling setRowHeight.")
    _rowHeight(height);
  }
  self.setRowLength = function(rowLength) {
    if(!_sampling())
      throw new Error("Call sample and then render and measure the resulting " +
                      "visibleItems before calling setRowLength.")
    _rowLength(rowLength);
  }
  self.setScrollPosition = function(y) {
    _scrollPosition(y);
  }


  var _visibleStartIndex = computedLazy(function() {
    if (_rowHeight() === null) {
      // _rowHeight is required to calculate,
      // but if we have a sampling, we're still okay:
      return !!_sampling() ? 0 : null
    }
    var rowAtScrollPosition = Math.floor(_scrollPosition() / _rowHeight());
    var lastIndex = _numberOfServerItems();
    var lastStartIndex = lastIndex - _fitsInViewPort();
    var indexAtScrollPosition = (rowAtScrollPosition) * _rowLength();
    return Math.min(lastStartIndex, indexAtScrollPosition);
  });

  var _fitsInViewPort = computedLazy(function() {

    if (_viewPortHeight() === null || _rowHeight() === null) {
      return _sampling() || null
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
    }, 250);

  };

  var _itemCache = ko.observableArray();
  var _numberOfServerItems = ko.observable(null);
  var _viewPortHeight = ko.observable(null);
  var _rowHeight = ko.observable(null);
  var _scrollPosition = ko.observable(0);
  var _rowLength = ko.observable(1)
  var _sampling = ko.observable(null)

}