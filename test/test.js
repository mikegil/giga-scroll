var chai = require('chai');
var should = chai.should();

var GigaScrollViewModel = require('../viewModel');

var vm = null;

describe('viewModel', function() {
  describe('when initialized', function () {
    beforeEach(function() {
      vm = new GigaScrollViewModel();
    })

    it('should have an empty visibleItems', function() {
      vm.visibleItems().length.should.equal(0);
    })
  })

});