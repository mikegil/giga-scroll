(function() {

// The GigaScroll binding is applied to an existing UL element.
// It will use the inner HTML of the UL as a template for the items
// rendered, and accepts a GigaScrollViewModel as a single argument.
ko.bindingHandlers.gigaScroll = {

  init: function(element, valueAccessor, allBindingsAccessor) {

    var viewModel     = ko.utils.unwrapObservable(valueAccessor())
    var view          = createView(viewModel, element)

    viewModel.setActive(false)
    viewModel.sample(7) // TODO: Make this a dynamic option

    // Wait for the sample to render before triggering
    // the measurment watchers.
    var isWatchingMeasurements = false
    viewModel.renderItems.subscribe(function(newValue) {
      if (!newValue[newValue.length-1]) {
        // This is just an empty result so far, we're
        // not ready to measure yet.
        return
      }

      // Don't start the watchers twice
      if (isWatchingMeasurements) return
      isWatchingMeasurements = true

      var offsetCache   = watchListItemsOffsets(view)
      watchViewPortScrollPosition (viewModel, view)
      watchViewPortHeight         (viewModel, view)
      watchRows                   (viewModel, offsetCache)

    })

    return { controlsDescendantBindings: true }

  }
}


function createView(viewModel, originalListElement) {

  // GigaScroll works by wrapping the bound UL in three DIV elements,
  // a ViewPort, a River and a Raft.
  //
  // * ViewPort
  // This is the "window" pointing at a specific point in the the very long list of items.
  // It's essentially a div with 100% x 100% that overflows vertically.
  //
  // * River
  // The ViewPort contains a River, which is essentially a huuuge DIV that is as large
  // as the list would be, had it rendered all items available on the server.
  //
  // * Raft
  // The Raft is the DIV that holds the UL. It follows along as the ViewPort
  // scrolls down the River by constantly repositioning itself.
  //
  // * List
  // The list is actually very short, and is continually re-populated to reflect
  // the items at the given scroll position.

  var templateListItem = originalListElement.innerHTML
  var templateEngine = createNativeStringTemplateEngine()

  // Generate unique ids so that we can use multiple
  // gigascrolls.
  var viewPortId  = 'gigaScrollViewport' + randomString()
  var listId      = 'gigaScrollList' + randomString()

  // Promote the view to be composited to improve scrolling
  // performance in Chrome.
  // https://code.google.com/p/chromium/issues/detail?id=136555
  var compositioningHack = '-webkit-transform:translateZ(0)'

  templateEngine.addTemplate('gigaScroll', "\
    <div id=\"" + viewPortId + "\" style=\"width: 100%; height: 100%; overflow-y: scroll; " + compositioningHack +"\">\
      <div data-bind=\"style: { height: riverHeight() + 'px' }\">\
        <div data-bind=\"style: { paddingTop: raftOffsetTop() + 'px' }\">\
          <ul id=\"" + listId + "\" data-bind=\"foreach: renderItems\">\
            " +  templateListItem + "\
          </ul>\
        </div>\
      </div>\
    </div>");
  ko.renderTemplate(
    "gigaScroll", viewModel, { templateEngine: templateEngine }, originalListElement, "replaceNode" )

  // Copy attributes (except for data-bind) from the original
  // list element to the new element.
  var newListElement = document.getElementById(listId)
  var originalAttributes = originalListElement.attributes
  for(var i = 0; i < originalAttributes.length; i++) {
    var attr = originalAttributes[i]
    if (attr.name !== 'data-bind') {
      newListElement.setAttribute(attr.name, attr.value)
    }
  }

  return document.getElementById(viewPortId)
}

function watchViewPortScrollPosition(viewModel, viewPort) {
  viewPort.addEventListener('scroll', function (e) {
    viewModel.setScrollPosition(viewPort.scrollTop)
  })
}

function watchViewPortHeight(viewModel, viewPort) {
  var onViewPortResize = function() {
    viewModel.setViewPortHeight(viewPort.offsetHeight)
  }
  window.addEventListener('resize', onViewPortResize, false)
  onViewPortResize()
}

function watchRows(viewModel, offsetCache) {

  function exec() {
    watchRowHeight()
    watchRowLength()
  }

  function watchRowHeight() {
    ko.computed(function() {
      // Calculate the row height by subtracting
      // the offset of the top row with the second top row
      var uniques = rowOffsets()
      if (uniques.length === 0) return;
      uniques.sort(function(a,b){ return a - b })
      viewModel.setRowHeight(uniques[1] - uniques[0])
    })
  }

  function watchRowLength() {
    ko.computed(function() {
      var longestRow,
          rowLength

      if (offsetMap().length === 0)
        return

      // find the row with most items in it
      rowOffsets().forEach(function(offset) {
        rowLength = offsetMap()[offset.toString()]
        if (!longestRow || rowLength > longestRow)
          longestRow = rowLength
      })

      viewModel.setRowLength(longestRow)
    })
  }

  // An array of integers representing
  // the topOffsets of the rendered rows
  var rowOffsets = ko.computed({
    read: function() {
      var unique = []
      for(var key in offsetMap()) {
        unique.push(parseInt(key))
      }
      return unique
    },
    deferEvaluation: true
  })

  // A map that maps
  // offsetTop -> number of list items with that offsetTop
  var offsetMap = ko.computed({
    read: function() {
      var key, map = {}
      offsetCache().forEach(function(offset) {
        key = offset.toString()
        map[key] = map[key] ? map[key] + 1 : 1
      })
      if (map.length === 1) {
        // Only one row of items, so not possible to
        // measure row height. This case will arise if
        // the sample is either bigger than the total
        // amount of items on the server, or sample is
        // smaller than one row. In the latter case,
        // input is wrong and must be increased.
        return {}
      }
      return map
    },
    deferEvaluation: true
  })

  return exec()
}

function watchListItemsOffsets(viewPort) {

  function exec() {
    offsetCache = ko.observableArray()

    ULElement.addEventListener('DOMNodeInserted', refreshOffsetCacheThrottled, false)
    window.   addEventListener('resize',          refreshOffsetCacheThrottled, false)
    window.   addEventListener('scroll',          refreshOffsetCacheThrottled, false)
    refreshOffsetCacheThrottled()

    return offsetCache
  }

  // Create an array of the offsetTops of all list items and
  // store them all in offsetCache
  function refreshOffsetCache() {
    var offset,
        mutated = false,
        underlyingArray = offsetCache.peek(),
        elements = ULElement.getElementsByTagName('li')

    for (var i = 0; i < elements.length; i++) {

      // Don't measure items that are based on undefined data (loading)
      if (!ko.dataFor(elements[i])) return;

      offset = elements[i].offsetTop
      if (underlyingArray[i] !== offset) {
        underlyingArray[i] = offset
        mutated = true
      }
    }
    if (mutated) offsetCache.valueHasMutated()
  }

  // Throttled variant if refreshOffsetCache, since it's
  // a pretty expensive operation to do.
  var refreshOffsetCacheThrottled = function() {
    clearTimeout(offsetMeasuringHandle)
    offsetMeasuringHandle = setTimeout(refreshOffsetCache, 16)
  }

  var ULElement = viewPort.getElementsByTagName('UL')[0]
  var offsetMeasuringHandle
  var offsetCache

  return exec()

}

function randomString() {
  return Math.floor((Math.random()*1000000)+1).toString()
}


})();