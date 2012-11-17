function createFakeDatabase() {

  var _generateRandomNumber = function (len) {
    var i = 1,
        multiplier = 10;

    while (i < len) {
        multiplier = multiplier * 10;
        i++;
    }

    return Math.round(Math.random() * multiplier);
  };

  var _generateLargeData = function () {
    var arr = [],
        i = 0;

    var size = 500000;
    while (i < size) {
        arr.push({
          name: _generateRandomNumber(6)
        });

        i++;
    }

    return arr;
  };

  var _items = _generateLargeData();

  return {
    totalSize: _items.length,
    load: function(offset, count, callback) {
      setTimeout(function() {
        var items = _items.slice(offset, offset+count);
        callback(items);
      }, 2000);
    }
  };
}