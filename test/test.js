mocha.setup('bdd');
chai.should();
var expect = chai.expect;

var vm = null;
var numberOfServerItems = null;
var indexRequested = null;
var lengthRequested = null;
var itemsLoaded = [];


describe('viewModel', function() {
  describe('when initialized', function () {
    beforeEach(function() {
      vm = new GigaScrollViewModel();
      vm.getItemsMissing = function(index, length, callback) {
        indexRequested = index;
        lengthRequested = length;
        callback(itemsLoaded, numberOfServerItems);
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
      beforeEach(function() {
        numberOfServerItems = 100000;
        itemsLoaded = [
          { name: 'John' },
          { name: 'Priscilla' },
          { name: 'Olivia' },
          { name: 'Peter' },
          { name: 'Walter' },

          { name: 'Astrid' },
          { name: 'Newton' },
          { name: 'Broyles' },
          { name: 'William' },
          { name: 'Walternate' }
        ];
      })


      describe('when viewPortHeight and elementHeight is assigned', function() {
        beforeEach(function() {
          vm.setViewPortHeight(800);
          vm.setElementHeight(80);
        })

        it('should request the first ten items', function() {
          indexRequested.should.equal(0);
          lengthRequested.should.equal(10);
        });

        it('should display the items', function(done) {
          vm.visibleItems();
          setTimeout(function() {
            vm.visibleItems()[2].name.should.equal('Olivia');
            vm.visibleItems()[9].name.should.equal('Walternate');
            done();
          }, 0);
        })

        it('should calculate the size of the gigaDiv', function() {
          vm.gigaDivHeight().should.equal(8000000);
        });

        describe('when scrolling down a bit', function() {
          beforeEach(function() {
            vm.setScrollPosition(8000);
            vm.visibleItems();
          })

          it('should request items from further down', function() {
            expect(indexRequested, 'index').to.equal(100 );
            expect(lengthRequested, 'length').to.equal(10);
          })

          it('should reposition the list', function() {
            vm.offsetTop().should.equal(8000);
          });

        });




      })

    })


  })

});


