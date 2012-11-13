mocha.setup('bdd');
chai.should();
var expect = chai.expect;

var vm = null;
var numberOfServerItems = null;
var indexRequested = null;
var lengthRequested = null;


describe('viewModel', function() {
  describe('when initialized', function () {
    beforeEach(function() {
      vm = new GigaScrollViewModel();
      vm.getItemsMissing = function(index, length, callback) {
        console.log("getItemsMissing", index,length)
        indexRequested = index;
        lengthRequested = length;
        callback([], numberOfServerItems);
      }
    })

    it('should have an empty visibleItems', function() {
      vm.visibleItems().length.should.equal(0);
    })

    it('should not request anything', function() {
      expect(indexRequested, 'index').to.equal(null);
      expect(lengthRequested, 'length').to.equal(null);
    })

    describe('when there is 100000 items on the server', function() {
      numberOfServerItems = 100000;

      describe('when viewPortHeight and elementHeight is assigned', function() {
        beforeEach(function() {
          vm.setViewPortHeight(800);
          vm.setElementHeight(80);
        })

        it('should request the first ten items', function() {
          indexRequested.should.equal(0);
          lengthRequested.should.equal(10);
        });

        it('should calculate the size of the gigaDiv', function() {
          vm.gigaDivHeight().should.equal(8000000);
        });

        describe('when scrolling down a bit', function() {
          beforeEach(function() {
            vm.setScrollPosition(8000);
          })

          it('should request items from further down', function(done) {
            vm.visibleItems();
            setTimeout(function() {
              expect(indexRequested, 'index').to.equal(100);
              expect(lengthRequested, 'length').to.equal(10);
              done();
            }, 0);
          })

        });




      })

    })


  })

});


