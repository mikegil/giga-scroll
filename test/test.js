mocha.setup('bdd');
chai.should();
var expect = chai.expect;

var vm = null;
var numberOfServerItems = null;
var numberOfLoadsRequested = 0;
var indexRequested = null;
var lengthRequested = null;
var fakeItems = [
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
          { name: 'Ludde' },

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
          { name: 'Ludde' },

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
          { name: 'Ludde' },

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
          { name: 'Ludde' },

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
          { name: 'Ludde' },

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


describe('viewModel', function() {
  describe('when initialized', function () {
    beforeEach(function() {
      numberOfLoadsRequested = 0;
      vm = new GigaScrollViewModel({
        load: function(index, length, callback) {
          console.log("*** load received", index, length)
          numberOfLoadsRequested++;
          indexRequested = index;
          lengthRequested = length;
          setTimeout(function() {
            callback(fakeItems.slice(0, length), numberOfServerItems);
          }, 25);
        }
      });
    })

    it('should have an empty visibleItems', function() {
      vm.visibleItems().length.should.equal(0);
    })

    it('should not request anything', function() {
      expect(indexRequested, 'index').to.equal(null);
      expect(lengthRequested, 'length').to.equal(null);
    })

    describe('when there are 100000 items on the server', function() {
      beforeEach(function() {
        numberOfServerItems = 100000;

      })


      describe('when viewPortHeight and rowHeight are assigned', function() {
        beforeEach(function(done) {
          vm.setViewPortHeight(800);
          vm.setRowHeight(80);
          vm.visibleItems();
          setTimeout(done, 251);
        })

        it('should request three screenheights worth', function() {
          indexRequested.should.equal(0);
          lengthRequested.should.equal(30);
        });

        it('should display the items', function(done) {
          setTimeout(function() {
            vm.visibleItems();
            vm.visibleItems()[2].name.should.equal('Olivia');
            vm.visibleItems()[9].name.should.equal('Walternate');

            done();
          }, 60);

        })

        it('should eventually calculate the size of the gigaDiv', function(done) {
          setTimeout(function() {
            vm.gigaDivHeight().should.equal(8000000);
            done();
          }, 60)
        });

        describe('when scrolling down pretty far', function() {
          beforeEach(function(done) {
            vm.setScrollPosition(8000);
            vm.visibleItems();
            setTimeout(done, 250+25+1);
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
                vm.visibleItems();
                setTimeout(done, 251);
              }, 150); // Wait for prior load to complete
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
              console.log("scrolling!")
              vm.setScrollPosition(2000); // 2.5 viewports
              vm.visibleItems();
              setTimeout(done, 50);
            }, 60); // <- wait for prior load to finish
          })

          it('immediately moves the list', function() {
            vm.visibleItems()[0].name.should.equal('Astrid');
          })

          it('empties the unloaded items (first)', function() {
            expect(vm.visibleItems()[6]).to.equal(undefined)
          })

          it('empties the unloaded items (last)', function() {
            expect(vm.visibleItems()[9]).to.equal(undefined)
          })

          it('returns the full length even if not loaded', function() {
            vm.visibleItems().length.should.equal(10);
          })

          describe('after a while', function() {
            beforeEach(function(done) {
              setTimeout(done, 251)
            })

            it('loaded only the necessary items (index)', function() {
              // Because two viewports worth of data has already been loaded
              indexRequested.should.equal(30);
            })

            it('loaded only the necessary items (length)', function() {
              vm.visibleItems();
              lengthRequested.should.equal(15)
            })

            describe('when scrolling back up', function() {
              beforeEach(function(done) {
                vm.setScrollPosition(0);
                setTimeout(done, 251);
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


        })

        describe('when scrolling a TINY bit', function() {
          beforeEach(function(done) {
            vm.setScrollPosition(40); // half an item
            setTimeout(done, 251)
          });

          it('doesnt move the offset', function() {
            vm.offsetTop().should.equal(0);
          })
        });

        describe('when scrolling two times quickly', function() {
          beforeEach(function(done) {
            setTimeout(function() {
              numberOfLoadsRequested = 0;
              vm.setScrollPosition(200);
              vm.visibleItems();
              setTimeout(function() {
                vm.setScrollPosition(1200);
                vm.visibleItems();
                setTimeout(done, 251);
              }, 25)
            }, 100); // wait for any prior load to finish
          })

          it('loads only one time', function () {
            numberOfLoadsRequested.should.equal(1);
          })

          it('loads the data for the latest scroll position', function () {
            indexRequested.should.equal(30);
          })

        });

        describe('when scrolling to the bottom', function() {
          beforeEach(function(done) {
            vm.setScrollPosition(7999200 + 100); // slightly more than
                                                 // one viewport before the end
            setTimeout(done, 200);
          })

          it('the list should not move past the end', function () {
            vm.offsetTop().should.equal(7999200);
          })

        })

        describe('when rowLength is set', function() {
          beforeEach(function(done) {
            vm.setRowLength(4);
            setTimeout(done, 251);
          })

          it('should recalculate height of the river', function() {
            vm.gigaDivHeight().should.equal(2000000);
          })

          describe('when scrolling down pretty far', function() {
            beforeEach(function(done) {
              vm.setScrollPosition(8000);
              vm.visibleItems();
              setTimeout(done, 251);
            })

            it('should start loading from one viewport above', function() {
              expect(indexRequested, 'index').to.equal(400-40);
            })

            it('should end loading one viewport below', function() {
              expect(lengthRequested, 'length').to.equal(40*3);
            })

            it('should reposition the list', function() {
              vm.offsetTop().should.equal(8000);
            });


            describe('scrolling back up', function (done) {
              beforeEach(function(done) {
                setTimeout(function () {
                  vm.setScrollPosition(8000-400); // half a viewport height
                  vm.visibleItems();
                  setTimeout(done, 251);
                }, 150); // Wait for prior load to complete
              });

              it('loads one screenheight up', function() {
                indexRequested.should.equal(400-40-20);
              });

              it('stops loading from where we have cached items', function() {
                lengthRequested.should.equal(40/2);
              })

            })

          });
        })

      });


      describe('when uneven viewPortHeight and rowHeight are assigned', function (){
        beforeEach(function() {
          vm.setViewPortHeight(714);
          vm.setRowHeight(71);
        });

        it('rounds upwards', function() {
          vm.visibleItems().length.should.equal(11)
        })
      });


    })

  })

});


