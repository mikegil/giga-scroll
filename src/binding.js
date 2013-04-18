(function() {

ko.bindingHandlers.gigaScroll = {
  init: function(element, valueAccessor, allBindingsAccessor) {

    var viewModel     = ko.utils.unwrapObservable(valueAccessor())
    var view          = createView(viewModel, element)


    viewModel.sample(7)

    // Wait for the sample to render before triggering
    // the measurment watchers.
    var isWatchingMeasurements = false
    viewModel.visibleItems.subscribe(function(newValue) {
      if (!newValue[newValue.length-1]) {
        // This is just an empty result so far, we're
        // not ready to measure yet.
        return
      }

      // Don't start the watchers twice
      if (isWatchingMeasurements) return
      isWatchingMeasurements = true

      setTimeout(function() {
        var offsetCache   = watchListItemsOffsets(view)
        watchViewPortScrollPosition (viewModel, view)
        watchViewPortHeight         (viewModel, view)
        watchRows                   (viewModel, offsetCache)
      }, 0)

    })

    return { controlsDescendantBindings: true }

  }
}

function createView(viewModel, originalListElement) {
  var templateListItem = originalListElement.innerHTML
  var templateEngine = createNativeStringTemplateEngine()
  templateEngine.addTemplate('gigaScroll', "\
    <div id=\"gigaViewport\" style=\"width: 100%; height: 100%; overflow-y: scroll\">\
      <div id=\"gigaRiver\" data-bind=\"style: { height: gigaDivHeight() + 'px' }\">\
        <div class=\"gigaRaft\" data-bind=\"style: { paddingTop: offsetTop() + 'px' }\">\
          <ul id=\"gigaList\" data-bind=\"foreach: visibleItems\">\
            " +  templateListItem+ "\
          </ul>\
        </div>\
      </div>\
    </div>");
  ko.renderTemplate(
    "gigaScroll", viewModel, { templateEngine: templateEngine }, originalListElement, "replaceNode" )

  // Copy attributes (except for data-bind) from the original
  // list element to the new element.
  var newListElement = document.getElementById('gigaList')
  var originalAttributes = originalListElement.attributes
  for(var i = 0; i < originalAttributes.length; i++) {
    var attr = originalAttributes[i]
    if (attr.name !== 'data-bind') {
      newListElement.setAttribute(attr.name, attr.value)
    }
  }

  return document.getElementById('gigaViewport')
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
      var uniques = uniqueOffsets()
      uniques.sort(function(a,b){return a-b})
      if (uniques.length <= 1)
        singleRowCaseWarning()
      else {
        var val = uniques[1] - uniques[0]
        viewModel.setRowHeight(val)
      }
    })
  }

  function watchRowLength() {
    ko.computed(function() {
      var longestRow,
          rowLength

      if (offsetCache().length <= 1) {
        singleRowCaseWarning()
        return
      }

      uniqueOffsets().forEach(function(offset) {
        rowLength = offsetMap()[offset.toString()]
        if (!longestRow || rowLength > longestRow)
          longestRow = rowLength
      })

      viewModel.setRowLength(longestRow)
    })
  }

  function singleRowCaseWarning() {
    console.warn( "Tried to measure rowLength, but failed because the" +
                  "set was too small to fill one row. If there are more " +
                  "items on the server, this means that we need to load more " +
                  "but if there isn't, it's due to an edge case that GigaScroll " +
                  "does not yet support. ")
  }

  var uniqueOffsets = ko.computed({
    read: function() {
      var unique = []
      for(var key in offsetMap()) {
        unique.push(parseInt(key))
      }
      return unique;
    },
    deferEvaluation: true,
  })

  var offsetMap = ko.computed({
    read: function() {
      var key, map = {}
      offsetCache().forEach(function(offset) {
        key = offset.toString()
        map[key] = map[key] ? map[key] + 1 : 1
      })
      return map
    },
    deferEvaluation: true,
  })

  return exec()
}

function watchListItemsOffsets(viewPort) {

  function exec() {
    offsetCache = ko.observableArray()

    ULElement.addEventListener('DOMNodeInserted', measureRowsThrottled, false)
    window.   addEventListener('resize',          measureRowsThrottled, false)
    window.   addEventListener('scroll',          measureRowsThrottled, false)
    measureRowsThrottled()

    return offsetCache
  }

  function refreshOffsetCache() {
    var offset,
        mutated = false,
        underlyingArray = offsetCache.peek(),
        elements = ULElement.getElementsByTagName('li')

    for (var i = 0; i < elements.length; i++) {
      offset = elements[i].offsetTop
      if (underlyingArray[i] !== offset) {
        underlyingArray[i] = offset
        mutated = true
      }
    }
    if (mutated) offsetCache.valueHasMutated()
  }

  var measureRowsThrottled = function() {
    clearTimeout(offsetMeasuringHandle)
    offsetMeasuringHandle = setTimeout(refreshOffsetCache, 16)
  }

  var ULElement = viewPort.getElementsByTagName('UL')[0]
  var offsetMeasuringHandle
  var offsetCache

  return exec()

}


})();