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
        setTimeout(function() {
          callback(itemsLoaded, numberOfServerItems);
        }, 25);

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
          { name: 'Walternate' },

          { name: 'Ninja' },
          { name: 'Johanna' },
          { name: 'Martin' },
          { name: 'Kalle' },
          { name: 'Hogga' },

          { name: 'Nisse' },
          { name: 'Göran' },
          { name: 'Kerstin' },
          { name: 'Amanda' },
          { name: 'Ludde' }
        ];
      })


      describe('when viewPortHeight and elementHeight is assigned', function() {
        beforeEach(function() {
          vm.setViewPortHeight(800);
          vm.setElementHeight(80);
          vm.visibleItems();
        })

        it('should request one screenheight worth', function() {
          indexRequested.should.equal(0);
          lengthRequested.should.equal(20);
        });

        it('should display the items', function(done) {
          setTimeout(function() {
            vm.visibleItems();
            vm.visibleItems()[2].name.should.equal('Olivia');
            vm.visibleItems()[9].name.should.equal('Walternate');

            done();
          }, 60);

        })

        it('should calculate the size of the gigaDiv', function(done) {
          setTimeout(function() {
            vm.gigaDivHeight().should.equal(8000000);
            done();
          }, 60)
        });

        describe('when scrolling down pretty far', function() {
          beforeEach(function() {
            vm.setScrollPosition(8000);
            vm.visibleItems();
          })

          it('should start loading from one viewport above', function() {
            expect(indexRequested, 'index').to.equal(100-10);
          })
          it('should end loading one viewport below', function() {
            expect(lengthRequested, 'length').to.equal(10*3);
          })

          it('should reposition the list', function() {
            vm.offsetTop().should.equal(8000);
          });

          describe('scrolling back up', function (done) {
            beforeEach(function(done) {
              setTimeout(function () {
                vm.setScrollPosition(8000-400); // half a viewport height
                done();
              }, 60); // Wait for prior load to complete
            });

            it('loads one screenheight up', function() {
              indexRequested.should.equal(100-10-5);
            });

            it('stops loading from where we have cached items', function() {
              lengthRequested.should.equal(5);
            })

          })

        });

        describe('when scrolling just a little bit', function () {
          beforeEach(function(done) {
            setTimeout(function() {
              vm.setScrollPosition(1200); // 1.5 viewports
              done();
            }, 60); // <- wait for prior load to finish
          })

          it('immediately moves the list', function() {
            vm.visibleItems()[0].name.should.equal('Nisse');
          })

          it('empties the unloaded items (first)', function() {
            expect(vm.visibleItems()[15]).to.equal(undefined)
          })

          it('empties the unloaded items (last)', function() {
            expect(vm.visibleItems()[9]).to.equal(undefined)
          })

          it('returns the full length even if not loaded', function() {
            vm.visibleItems().length.should.equal(10);
          })

          it('loads only the necessary items (index)', function() {
            vm.visibleItems();
            indexRequested.should.equal(20);
          })

          it('loads only the necessary items (length)', function() {
            vm.visibleItems();
            lengthRequested.should.equal(15)
          })

          describe('when scrolling back up', function() {
            beforeEach(function() {
              vm.setScrollPosition(0);
            })

            it('doesnt request new load', function() {
              vm.visibleItems();
              indexRequested.should.not.equal(0)
            })

            it('uses cached items', function() {
              vm.visibleItems()[0].name.should.equal("John");
            })
          })
        })

        describe('when scrolling a TINY bit', function() {
          beforeEach(function() {
            vm.setScrollPosition(40); // half an item
          });

          it('doesnt move the offset', function() {
            vm.offsetTop().should.equal(0);
          })
        })

      })


      describe('when uneven viewPortHeight and elementHeight are assigned', function (){
        beforeEach(function() {
          vm.setViewPortHeight(714);
          vm.setElementHeight(71);
        });

        it('rounds upwards', function() {
          vm.visibleItems().length.should.equal(11)
        })
      })




    })

  })

});


