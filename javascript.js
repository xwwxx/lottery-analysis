/**
 * Created by danielxiao on 15/8/8.
 */

(function() {

  var ctrlModule = angular.module('controller', []);

  angular.module('app', ['controller']);

  ctrlModule.controller('AppCtrl', [ '$scope',

    function($scope) {

      // 当然开奖号码
      var currentPeriodNums = window.currentPeriodNums;

      var titleMap = {
        stat_red_1: '红球 1',
        stat_red_2: '红球 2',
        stat_red_3: '红球 3',
        stat_red_4: '红球 4',
        stat_red_5: '红球 5',
        stat_red_6: '红球 6',
        stat_blue: '蓝球'
      };

      var indexMap = {
        stat_red_1: 0,
        stat_red_2: 1,
        stat_red_3: 2,
        stat_red_4: 3,
        stat_red_5: 4,
        stat_red_6: 5,
        stat_blue: 6
      };

      $scope.data = _.map(window.data, function(val, key) {
        return {
          title: titleMap[key],
          data: handleData(val, indexMap[key])
        }
      });

      function handleData(arr, idx) {
        var result = signBoundary(arr);
        result = signNums(result, idx);
        return _.sortBy(result, function(item) {
          return item.stat;
        });
      }

      function signBoundary(arr) {
        var minItem = _.min(arr, function(item) { return item.stat; });
        var maxItem = _.max(arr, function(item) { return item.stat; });
        minItem.min = true;
        maxItem.max = true;
        return arr;
      }

      function signNums(arr, idx) {
        var foundItem = _.find(arr, function(item) { return currentPeriodNums[idx] == item.num; });
        foundItem.match = true;
        return arr;
      }

    }]);

})();
