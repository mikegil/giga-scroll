(function() {

  ko.bindingHandlers.gigaScroll = {
    init: function(element, valueAccessor, allBindingsAccessor) {
      var viewModel = valueAccessor();

      var itemTemplate = element.innerHTML;

      var templateEngine = createNativeStringTemplateEngine();

      templateEngine.addTemplate('gigaScroll', "\
        <div id=\"gigaViewport\">\
          <div id=\"gigaRiver\" data-bind=\"style: { height: gigaDivHeight() + 'px' }\">\
            <div class=\"gigaRaft\" data-bind=\"style: { paddingTop: offsetTop() + 'px' }\">\
              <ul data-bind=\"foreach: visibleItems\">\
                "+itemTemplate+"\
              </ul>\
            </div>\
          </div>\
        </div>");

      ko.renderTemplate("gigaScroll", viewModel, { templateEngine: templateEngine }, element, "replaceNode" );

      var viewPort = document.getElementById('gigaViewport');
      viewPort.style.width = "100%";
      viewPort.style.height = "100%";
      viewPort.style.overflowY = "scroll";

      viewPort.addEventListener('scroll', function (e) {
        viewModel.setScrollPosition(viewPort.scrollTop);
      });

      var ul = viewPort.getElementsByTagName('UL')[0];

      ul.style.margin = 0;
      ul.style.padding = 0;
      ul.style.border = 0;

      var measureRows = function() {
        var rows = {}
        var longestRow = 0
        var rowLength
        var rowOffsetTops = []

        $("#gigaRaft ul li").each(function() {
          var yKey = this.offsetTop.toString()
          if (!rows[yKey])
            rows[yKey] = 1
          else
            rows[yKey]++
        })

        var rowKeys = []
        for(key in rows) {
          if (rows.hasOwnProperty(key))
            rowKeys.push(key)
        }

        if (rowKeys <= 1) {
          viewModel.setRowLength(6)
        } else {
          longestRow = 0

          rowKeys.forEach(function(key) {
            rowLength = rows[key]
            if (rowLength > longestRow)
              longestRow = rowLength

            rowOffsetTops.push(key)
          })

          rowOffsetTops.sort()

          var firstRowPosition = parseInt(rowOffsetTops[0]);
          var secondRowPosition = parseInt(rowOffsetTops[1]);
          var distance = secondRowPosition - firstRowPosition;

          viewModel.setRowHeight(distance)
          viewModel.setRowLength(longestRow)
        }

      }

      var throttlingHandle;
      var measureRowsThrottled = function() {
        clearTimeout(throttlingHandle)
        throttlingHandle = setTimeout(measureRows, 1000)
      }

      var measureRowsHandle;
      var onListItemInserted = function(e) {

        if(e.target.nodeName !== "LI") {
          return;
        }

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

      var measureStuff = function() {
        measureRowsThrottled()
        viewModel.setViewPortHeight(viewPort.offsetHeight);
      }
      measureStuff();
      window.addEventListener('resize', measureStuff);

      viewModel.setRowHeight(200);

      return { controlsDescendantBindings: true };

    }
  };
})();