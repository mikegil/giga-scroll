(function() {

  var GUESSTIMATED_ROW_LENGTH = 6
  var GUESSTIMATED_ROW_HEIGHT = 200

  ko.bindingHandlers.gigaScroll = {
    init: function(element, valueAccessor, allBindingsAccessor) {
      var viewModel = valueAccessor();
      var _viewPort;
      var _offsets = ko.observableArray();
      var ul;
      var throttlingHandle;

      function renderTemplate() {
        var itemTemplate = element.innerHTML;
        var templateEngine = createNativeStringTemplateEngine();
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
          "gigaScroll", viewModel, { templateEngine: templateEngine }, element, "replaceNode" )
        _viewPort = document.getElementById('gigaViewport');
        ul = _viewPort.getElementsByTagName('UL')[0];
      }
      renderTemplate()

      function watchScrollPosition() {
        _viewPort.addEventListener('scroll', function (e) {
          viewModel.setScrollPosition(_viewPort.scrollTop);
        });
      }
      watchScrollPosition()



      function refreshOffsets() {
        var offset,
            mutated = false,
            underlyingArray = _offsets.peek()
            elements = ul.getElementsByTagName('li')

        for (var i = 0; i < elements.length; i++) {
          offset = elements[i].offsetTop
          if (underlyingArray[i] !== offset) {
            underlyingArray[i] = offset
            mutated = true
          }
        }
        if (mutated) _offsets.valueHasMutated()
      }

      var offsetMap = ko.computed({
        deferEvaluation: true,
        read: function() {
          var map = {}
          _offsets().forEach(function(offset) {
            key = offset.toString()
            map[key] = map[key] ? map[key] + 1 : 1
          })
          return map
        }
      })

      var uniqueOffsets = ko.computed({
        deferEvaluation: true,
        read: function() {
          var unique = []
          for(key in offsetMap()) {
            unique.push(parseInt(key))
          }
          return unique;
        }
      })

      function watchRowHeight() {
        ko.computed(function() {
          var _offsets = uniqueOffsets()
          _offsets.sort()
          if (_offsets.length <= 1)
            viewModel.setRowHeight(GUESSTIMATED_ROW_HEIGHT)
          else
            viewModel.setRowHeight(_offsets[1] - _offsets[0])
        })
      }
      watchRowHeight()

      function watchRowLength() {
        ko.computed(function() {
          if (_offsets().length <= 1) {
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
      watchRowLength()

      var measureRowsThrottled = function() {
        clearTimeout(throttlingHandle)
        throttlingHandle = setTimeout(refreshOffsets, 1000)
      }

      function watchListItemsOffsets() {
        var onListItemInserted = function(e) {
          if(e.target.nodeName !== "LI") return
          $(e.target).find('img').each(function() {
            var $img = $(this);
            var loadHandler = function() {
              measureRowsThrottled()
              $img.off('load', loadHandler)
            }
            $img.on('load', loadHandler)
          })
          measureRowsThrottled()

          ul.removeEventListener("DOMNodeInserted", onListItemInserted, false);
        }
        ul.addEventListener("DOMNodeInserted", onListItemInserted, false);
      }
      watchListItemsOffsets()

      function watchViewPortHeight() {
        var onViewPortResize = function() {
          measureRowsThrottled()
          viewModel.setViewPortHeight(_viewPort.offsetHeight)
        }
        window.addEventListener('resize', onViewPortResize)
        onViewPortResize()
      }
      watchViewPortHeight()

      return { controlsDescendantBindings: true };

    }
  };
})();