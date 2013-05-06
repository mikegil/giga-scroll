/*
 * This is a general-purpose "notifyComparer"
 * Knockout extender (http://knockoutjs.com/documentation/extenders.html)
 * that can be chained onto any observable or computed value. It causes the
 * target only to issue change notifications when the equalityComparer says
 * the value has changed.
 */
ko.extenders.notifyComparer = function(target, equalityComparer) {
  var valueToNotify = ko.observable()
  valueToNotify.equalityComparer = function(x, y) {
    // If both x and y are arrays,
    // loop through them and compare the
    // individual items using the equalityComparer.
    if (Array.isArray(x)) {
      if (Array.isArray(y)) {
        if (x.length !== y.length) {
          return false
        }
        for(var i = 0; i < x.length; i++) {
          if (!equalityComparer(x[i], y[i])) {
            return false
          }
        }
        return true
      }
      return false
    }
    return equalityComparer(x, y)
  }
  target.subscribe(valueToNotify)
  var firstRead = true
  return ko.computed({
    deferEvaluation: true,
    read: function() {
      if (firstRead) {
        firstRead = false
        valueToNotify(target.peek())
      }
      return valueToNotify()
    }
  })
}


function GigaScrollViewModel(opts) {

  var self = this;

  // sample sets the size of the initial sampling that
  // is loaded as a basis for DOM measurments that is then
  // passes back into the viewmodel using setRowHeight and
  // setRowLength. This should be an integer that is bigger
  // than the maximum possible row items (i.e. if the user
  // uses a very wide screen that fits lots of items on a
  // single row)
  self.sample = function(sampleSize) {
    _sampling(sampleSize)
  }

  // setActive accepts a boolean value that
  // determines whether or not this instance of GigaScroll should
  // be rendering items. When setActive is set to false, GigaScroll
  // is in a dormant state and won't return any renderItems.
  self.setActive = function(value) {
    _isActive(value)
  }

  // renderItems is a computed property that represents
  // the subset of all items that should be rendered to the DOM.
  self.renderItems = _computedLazy(function() {
    var i, loadStartIndex, loadLength, oneViewPortAboveIndex, visibles;

    if (_renderLength() === 0) return [];

    // Calculate how many items to load from server (we preload three screens
    // worth of content)
    if (_renderIndex() === null) return [];
    oneViewPortAboveIndex = _renderIndex() - _renderLength();
    loadStartIndex = Math.max(oneViewPortAboveIndex, 0);
    loadLength = _renderLength() * 3;
    _loadIfMissing(loadStartIndex, loadLength);

    // Return an array with the same length as
    // the number of items that we want to render.
    // The items in the array that are not yet
    // loaded will be undefined.
    visibles = new Array(_renderLength())
    for (i = 0; i < _renderLength(); i++) {
      visibles[i] = _itemCache()[_renderIndex() + i]
    }

    return visibles
  })

  // raftOffsetTop is a computed property that represents the how
  // far down the raft is positioned in the river div.
  self.raftOffsetTop = _computedLazy(function() {
    if(_rowLength() === null || _rowHeight() === null) return 0

    var numberOfRowsAboveIndex =  _renderIndex() / _rowLength()
    var ret = numberOfRowsAboveIndex * _rowHeight()
    return ret;
  })

  // riverHeight is simply the height of the river div.
  self.riverHeight = _computedLazy(function() {
    return Math.floor(_numberOfServerItems() / _rowLength()) * _rowHeight()
  })

  // setViewPortHeight is used by the view to notify the ViewModel
  // of how big the viewport is.
  self.setViewPortHeight = function(height) {
    if(!_sampling())
      throw new Error("Call sample and then render and measure the resulting " +
                      "renderItems before calling setViewPortHeight.")
    _viewPortHeight(height);
  }

  // setRowHeight is used by the view to notify the ViewModel
  // of how high a row is in pixels
  self.setRowHeight = function(heightPx)  {
    if(!_sampling())
      throw new Error("Call sample and then render and measure the resulting " +
                      "renderItems before calling setRowHeight.")

    // The below should be done using the throttle extender,
    // but due to throttle extender not supporting
    // deferEvaluation (https://github.com/SteveSanderson/knockout/issues/926)
    // we have to do it this way now.
    clearTimeout(_setRowLengthPositionHandle)
    _setRowLengthPositionHandle = setTimeout(function() {

      // Because of the fun of floating point math,
      // the measurement of elements might sometimes change by
      // a single pixel some cases, which in turn caused an infinite
      // loop of renderItems changes and measurements. To handle this,
      // we ignore changes to rowHeight that are just a
      // single pixel. A bit hacky, but the best way I can think of at
      // the moment.
      var diff = heightPx - _rowHeight()
      var isDiffTooSmall = diff === 1 || diff === -1
      if(isDiffTooSmall) return;

      _rowHeight(heightPx)
    }, 16)
  }

  // setRowLength is used to tell the ViewModel how many list items that
  // currently fits in a single row.
  self.setRowLength = function(rowLength) {
    if(!_sampling())
      throw new Error("Call sample and then render and measure the resulting " +
                      "renderItems before calling setRowLength.")
    _rowLength(rowLength)
  }

  // setScrollPosition is used by the View to keep the ViewModel informed
  // of how far down on the Raft we've scrolled.
  self.setScrollPosition = function(y) {
    _scrollPosition(y)
  }

  // invalidateCache will cause a reload of the rendered items,
  // and purge any other cached items.
  self.invalidateCache = function() {
    _cacheIsStale(true)
  }

  self.setRowBuffer = function(rows) {
    _rowBuffer(rows)
  }

  var _renderIndex = _computedLazy(function() {
    if (_rowHeight() === null) {
      // _rowHeight is required to calculate,
      // but if we have a sampling, we're still okay:
      return !!_sampling() ? 0 : null
    }

    var lastPossibleStartIndex = _numberOfServerItems() - _renderLength()
    var rowAtTopBound = Math.floor(_renderAreaBoundTop() / _rowHeight())
    var indexAtTopBound = rowAtTopBound * _rowLength()
    return Math.max(0, Math.min(lastPossibleStartIndex, indexAtTopBound))
  })

  // The number of items to render to the DOM.
  var _renderLength = _computedLazy(function() {

    // Never render any items when inactive
    if (!_isActive()) return 0;

    if (_rowHeight() === null) {
      // Looks like the view has not yet measured rowHeight or viewPort ...
      if (_sampling()) {
        // but it's cool, because sampling has been set - let's load the sampling
        // so that the view has something to measure.

        // Make sure we never render more items than are available on the server.
        if (_numberOfServerItems() &&
            _numberOfServerItems() < _sampling())
          return _numberOfServerItems()

        return _sampling()
      }
      return 0
    }

    // Standard case, we have viewPortHeight and rowHeight ...
    var fitsInRenderAreaRows = Math.ceil(_renderAreaHeight() / _rowHeight())
    var fitsInRenderAreaItems = fitsInRenderAreaRows * _rowLength()


    // Make sure we never render more items than are available on the server.
    if (_numberOfServerItems() !== null &&
        _numberOfServerItems() < fitsInRenderAreaItems) {
      return _numberOfServerItems()
    }

    return fitsInRenderAreaItems
  })

  // Ensures that a range of items is loaded. Will automatically
  // shrink load range if part of it is cached already.
  var _loadIfMissing = function(startIndex, length) {

    // Shrink load range from left so that
    // we don't re-load items that are cached.
    while(!_cacheIsStale() && _isCached(startIndex)) {
      startIndex++;
      length--;
    }
    // Do the same from the right, but also avoid loading past the
    // end of items (i.e. loading 100 items if there are only 97 on the
    // server)
    while((!_cacheIsStale() && _isCached(startIndex+length-1)) ||
            _isMissing(startIndex+length-1)) {
      if (length-- < 1) return
    }

    // Issue the actual load, using the load method passed in the options.
    // We throttle this a bit so that we don't issue tons of loads while scrolling.
    // TODO: It might be cleaner throttle at the point of origin.
    clearTimeout(_getItemsMissingHandle);
    _getItemsMissingHandle = setTimeout(function() {
      opts.load(startIndex, length, function(loadedArr, numberOfServerItems) {
        var cacheArr = _itemCache.peek() // Grab underlying array

        if(_cacheIsStale()) {
          cacheArr.length = 0 // Clear the cache
        }
        for(var i = 0; i < length; i++) {
          cacheArr[startIndex + i] = loadedArr[i]
        }
        _numberOfServerItems(numberOfServerItems)
        _cacheIsStale(false)
        // Notify subscribers that the underlying array has changed
        _itemCache.valueHasMutated()
      })
    }, 250)

  }

  var _renderAreaHeight = _computedLazy(function() {
    return Math.max(_renderAreaBoundBottom() - _renderAreaBoundTop(), 0)
  })

  var _renderAreaBoundTop = _computedLazy(function() {
    return Math.max(0, _scrollPosition() - _rowBuffer() * _rowHeight())
  })

  var _renderAreaBoundBottom = _computedLazy(function() {
    return Math.min(
      self.riverHeight(),
      _scrollPosition() + _viewPortHeight() + _rowBuffer() * _rowHeight()
    )
  })

  // Returns true if this index is verified
  // not to exist on the server
  var _isMissing = function(index) {
    return _numberOfServerItems() !== null &&
           _numberOfServerItems() <= index
  }

  var _isCached = function(index) {
    return !!_itemCache()[index]
  }

  // _computedLazy is just shorthand to create a computed
  // property with deferred evaluation and that only notifies
  // subscribers if it's result has changed.
  function _computedLazy(fn) {
    return ko.computed({
      read: fn,
      deferEvaluation: true
    }).extend({
      notifyComparer: _simpleComparer
    })
  }

  // TODO: Extend ViewModel interface to support
  // passing a custom comparer function.
  function _simpleComparer(x, y) {
    return x === y
  }

  var _itemCache                  = ko.observableArray()
  var _numberOfServerItems        = ko.observable(null)
  var _viewPortHeight             = ko.observable(null)
  var _rowHeight                  = ko.observable(null)
  var _scrollPosition             = ko.observable(0)
  var _rowLength                  = ko.observable(1)
  var _sampling                   = ko.observable(null)
  var _isActive                   = ko.observable(true)
  var _cacheIsStale               = ko.observable(false)
  var _getItemsMissingHandle      = null
  var _setRowLengthPositionHandle = null
  var _rowBuffer                  = ko.observable(0)

}