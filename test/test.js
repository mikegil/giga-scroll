mocha.setup('bdd');
chai.should();
var expect = chai.expect;

var vm;
var numberOfLoadsRequested;
var indexRequested;
var lengthRequested;
var fakeItems;

var mockLoadHandle = null

var when = {}
var and = when

when.itemsOnServer = function(num, fn) {
  describe('when there are ' + num + ' items on the server', function() {
    beforeEach(function() {
      while(fakeItems.length < num) {
        fakeItems.push({ name: "name" + fakeItems.length })
      }
    })
    fn()
  })
}


when.sampling = function(num, fn) {
  describe('and we sample ' + num + ' items', function() {
    beforeEach(function() {
      vm.sample(num)
      vm.visibleItems()
    })
    fn()
  })
}

when.viewPortHeight = function(height, fn) {
  describe('when viewport height is ' + height, function() {
    beforeEach(function() {
      vm.setViewPortHeight(height)
    })
    fn()
  })
}

when.rowHeight = function(height, fn) {
  describe('when row height is ' + height, function() {
    beforeEach(function() {
      vm.setRowHeight(height)
    })
    fn()
  })
}

when.visibleItemsUpdated = function(fn) {
  describe('visibleItemsUpdated', function() {
    beforeEach(function(done) {
      vm.visibleItems()
      setTimeout(done, 400)
    })
    fn()
  })
}



describe('viewModel', function() {
  describe('when initialized', function () {
    beforeEach(function() {

      // Clear "globals" to keep tests from polluting eachother
      numberOfLoadsRequested = 0;
      indexRequested = null
      lengthRequested = null
      fakeItems = [];
      clearTimeout(mockLoadHandle)

      vm = new GigaScrollViewModel({
        load: function(index, length, callback) {
          numberOfLoadsRequested++;
          indexRequested = index;
          lengthRequested = length;
          mockLoadHandle = setTimeout(function() {
            callback(fakeItems.slice(index, index+length), fakeItems.length);
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

    when.itemsOnServer(100000, function() {

      describe('setting row height before sample', function() {
        var testCase

        beforeEach(function() {
          testCase = function() {
            vm.setRowHeight(1)
          }
        })

        it('should throw an error', function() {
          testCase.should.throw('Call sample and then render and measure the resulting ' +
                                'visibleItems before calling setRowHeight.')
        })
      })

      describe('setting view port height before sample', function() {
        var testCase

        beforeEach(function() {
          testCase = function() {
            vm.setViewPortHeight(1)
          }
        })

        it('should throw an error', function() {
          testCase.should.throw('Call sample and then render and measure the resulting ' +
                                'visibleItems before calling setViewPortHeight.')
        })
      })

      describe('setting row length height before sample', function() {
        var testCase

        beforeEach(function() {
          testCase = function() {
            vm.setRowLength(1)
          }
        })

        it('should throw an error', function() {
          testCase.should.throw('Call sample and then render and measure the resulting ' +
                                'visibleItems before calling setRowLength.')
        })
      })

      describe('when is deactivated', function() {
        beforeEach(function() {
          vm.setActive(false)
        })

        describe('and sample is called', function() {
          beforeEach(function(done) {
            vm.sample(5)
            vm.visibleItems()
            setTimeout(done, 300)
          })

          it('should not load anything', function() {
            vm.visibleItems().length.should.equal(0)
          })
        })
      })


      describe('when sample is called', function() {
        beforeEach(function(done) {
          vm.sample(5)
          vm.visibleItems()
          setTimeout(done, 500)
        })

        it('should load sample*3 items', function() {
          indexRequested.should.equal(0)
          lengthRequested.should.equal(15)
          // TODO: Since we want the API to be predictable and
          // the first load to be fast, this should probably be
          // the same as same. It complicated the code bit though,
          // so I'm holding off until I can find a simple solution
          // to deal with it.
        })

        describe('waits a while', function() {
          beforeEach(function(done) {
            setTimeout(done, 251)
          })

          it('should have updated visibleItems', function() {
            vm.visibleItems().length.should.equal(5)
          })
        })

        describe('when viewPortHeight assigned', function() {
          beforeEach(function() {
            vm.setViewPortHeight(800);
          })

          describe('and rowHeight assigned', function() {
            beforeEach(function() {
              vm.setRowHeight(80);
              vm.visibleItems();
            })

            it('should NOT immediately update visibleItems', function() {
              vm.visibleItems().length.should.equal(5) // not 800 / 80 = 10
            })

            describe('after a very short while', function() {
              beforeEach(function(done) { setTimeout(done, 10) })

              describe('rowHeight is updated again', function() {
                beforeEach(function() {
                  vm.setRowHeight(10)
                })

                it('should not update immediately either', function() {
                  vm.visibleItems().length.should.equal(5) // not 800 / 10 = 80
                })

                describe('rowHeight updated again', function() {
                  beforeEach(function() {
                    vm.setRowHeight(40)
                  })

                  describe('waiting a small while, a frame', function() {
                    beforeEach(function(done) { setTimeout(done, 17) })

                    it('should finally update visibleItems', function() {
                      vm.visibleItems().length.should.equal(20) // 800 / 40 = 20
                    })
                  })
                })
              })
            })


            describe('after a while', function() {
              beforeEach(function(done) { setTimeout(done, 300) })

              it('should have gone back to normal, non-sample layout', function() {
                vm.visibleItems().length.should.equal(10)
              })

              it('should request three screenheights worth', function() {
                indexRequested.should.equal(15);
                lengthRequested.should.equal(15);
              });

              it('should display the items', function(done) {
                setTimeout(function() {
                  vm.visibleItems();
                  vm.visibleItems()[2].name.should.equal('name2');
                  vm.visibleItems()[9].name.should.equal('name9');

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
                    vm.setScrollPosition(2000); // 2.5 viewports
                    vm.visibleItems();
                    setTimeout(done, 251);
                  }, 60); // <- wait for prior load to finish
                })

                it('immediately moves the list', function() {
                  vm.visibleItems()[0].name.should.equal('name25');
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
                      vm.visibleItems()[0].name.should.equal("name0");
                    })
                  })


                })


              })

              describe('when scrolling a TINY bit', function() {
                beforeEach(function(done) {
                  vm.setScrollPosition(40); // half an item
                  setTimeout(done, 100)
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
                  setTimeout(done, 251);
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
                    setTimeout(done, 750); // FIXME: the throttling of load makes this very long :()
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
            })
          })
        });


        describe('when uneven viewPortHeight and rowHeight are assigned', function (){
          beforeEach(function(done) {
            vm.setViewPortHeight(714);
            vm.setRowHeight(71);
            setTimeout(done, 17)
          });

          it('rounds upwards', function() {
            vm.visibleItems().length.should.equal(11)
          })
        });

      })

    })

    when.itemsOnServer(3, function() {
      when.sampling(20, function() {
        when.visibleItemsUpdated(function() {

          it('should display 3 items (length)', function() {
            vm.visibleItems().length.should.equal(3)
          })

          it('should display 3 items (content)', function() {
            vm.visibleItems()[2].name.should.equal("name2")
          })

          when.viewPortHeight(800, function() {
            when.rowHeight(40, function() {
              when.visibleItemsUpdated(function() {

                it('should display 3 items (length)', function() {
                  vm.visibleItems().length.should.equal(3)
                })

                it('should display 3 items (content)', function() {
                  vm.visibleItems()[2].name.should.equal("name2")
                })

                it('should not have re-requested anything (index)', function() {
                  indexRequested.should.equal(0)
                })

                it('should not have re-requested anything (length)', function() {
                  lengthRequested.should.equal(60)
                })

                it('should not have re-requested anything (number of)', function() {
                  numberOfLoadsRequested.should.equal(1)
                })
              })
            })
          })
        })
      })
    })

    when.itemsOnServer(40, function() {
      when.sampling(10, function() {
        when.visibleItemsUpdated(function() {

          it('should display the sample (length)', function() {
            vm.visibleItems().length.should.equal(10)
          })

          it('should have loaded 30 items', function() {
            lengthRequested.should.equal(30)
          })

          when.viewPortHeight(800, function() {
            when.rowHeight(10, function() {
              when.visibleItemsUpdated(function() {

                it('should display 40 items', function() {
                  vm.visibleItems().length.should.equal(40)
                })

                it('should display all items', function() {
                  vm.visibleItems()[39].name.should.equal('name39')
                })

                it('should have done it in two loads', function() {
                  numberOfLoadsRequested.should.equal(2)
                })

                it('should have completed the sample (index)', function() {
                  indexRequested.should.equal(30)
                })

                it('should have completed the sample (length)', function() {
                  lengthRequested.should.equal(10)
                })

              })
            })
          })
        })
      })
    })

  })
});

