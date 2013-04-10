(function() {

var GUESSTIMATED_ROW_LENGTH = 6
var GUESSTIMATED_ROW_HEIGHT = 200

ko.bindingHandlers.gigaScroll = {
  init: function(element, valueAccessor, allBindingsAccessor) {

    var viewModel     = valueAccessor()
    var viewPort      = createViewPort(viewModel, element)
    var offsetCache   = watchListItemsOffsets(viewPort)

    watchViewPortScrollPosition (viewModel, viewPort)
    watchViewPortHeight         (viewModel, viewPort)
    watchRows                   (viewModel, offsetCache)

    return { controlsDescendantBindings: true }

  }
}

function createViewPort(viewModel, itemTemplateElement) {
  var itemTemplate  = itemTemplateElement.innerHTML
  var templateEngine = createNativeStringTemplateEngine()
  templateEngine.addTemplate('gigaScroll', "\
    <div id=\"gigaViewport\" style=\"width: 100%; height: 100%; overflow-y: scroll\">\
      <div id=\"gigaRiver\" data-bind=\"style: { height: gigaDivHeight() + 'px' }\">\
        <div class=\"gigaRaft\" data-bind=\"style: { paddingTop: offsetTop() + 'px' }\">\
          <ul data-bind=\"foreach: visibleItems\">\
            "+itemTemplate+"\
          </ul>\
        </div>\
      </div>\
    </div>");
  ko.renderTemplate(
    "gigaScroll", viewModel, { templateEngine: templateEngine }, itemTemplateElement, "replaceNode" )
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
      uniques.sort()
      if (uniques.length <= 1)
        viewModel.setRowHeight(GUESSTIMATED_ROW_HEIGHT)
      else
        viewModel.setRowHeight(uniques[1] - uniques[0])
    })
  }

  function watchRowLength() {
    ko.computed(function() {
      if (offsetCache().length <= 1) {
        viewModel.setRowLength(GUESSTIMATED_ROW_LENGTH)
        return
      }

      var longestRow
      uniqueOffsets().forEach(function(offset) {
        rowLength = offsetMap()[offset.toString()]
        if (!longestRow || rowLength > longestRow)
          longestRow = rowLength
      })

      viewModel.setRowLength(longestRow)
    })
  }

  var uniqueOffsets = ko.computed({
    read: function() {
      var unique = []
      for(key in offsetMap()) {
        unique.push(parseInt(key))
      }
      return unique;
    },
    deferEvaluation: true,
  })

  var offsetMap = ko.computed({
    read: function() {
      var map = {}
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

    ULElement.addEventListener(
      'DOMNodeInserted', measureRowsThrottled, false)
    window.addEventListener(
      'resize',          measureRowsThrottled, false)
    measureRowsThrottled()

    return offsetCache
  }

  function refreshOffsetCache() {
    var offset,
        mutated = false,
        underlyingArray = offsetCache.peek()
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
    offsetMeasuringHandle = setTimeout(refreshOffsetCache, 1000)
  }

  var ULElement = viewPort.getElementsByTagName('UL')[0]
  var offsetMeasuringHandle
  var offsetCache

  return exec()

}


})();