/**
 * Created by danielxiao on 15/8/8.
 */

(function() {

  var ctrlModule = angular.module('controller', []);

  angular.module('app', ['controller']);

  ctrlModule.controller('AppCtrl', [ '$scope',

    function($scope) {

      var titleMap = {
        stat_red_1: '红球 1',
        stat_red_2: '红球 2',
        stat_red_3: '红球 3',
        stat_red_4: '红球 4',
        stat_red_5: '红球 5',
        stat_red_6: '红球 6',
        stat_blue: '蓝球'
      };

      $scope.data = _.map(window.data, function(val, key) {
        return {
          title: titleMap[key],
          data: signBoundary(val)
        }
      });

      function signBoundary(arr) {
        var minItem = _.min(arr, function(item) { return item.stat; });
        var maxItem = _.max(arr, function(item) { return item.stat; });
        minItem.min = true;
        maxItem.max = true;
        return arr;
      }

    }]);

})();
