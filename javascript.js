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

      // 预测的开奖号码
      $scope.predictNums = [];

      $scope.data = [];

      /**
       * 算法一：预测一组号码
       * 从当前开奖号码与历史开奖号码概率最大的号码之间随机取一个号码
       */
      $scope.predictLotteryNumbers = function() {
        var fn = function() {
          return _.chain($scope.data).map(function(item) { return predictLotteryNum(item.data); }).uniq().value();
        };

        var loop = true;
        while(loop) {
          var result = fn();
          if (result.length == 7) { // 如果没有重复数字则结束
            $scope.predictNums = result;
            loop = false;
          }
        }
      };

      /**
       * 算法二：预测一组号码
       * 从历史数据找出当前开奖号码历史最大机率下一期开奖的号码
       */
      $scope.predictLotteryNumbers2 = function() {
        $scope.predictNums = _.map(dataStatFollow, function(item) {
          return item.stat[0].number;
        })
      };

      function handleData(arr, idx) {
        var result = signBoundary(arr);
        result = signNums(result, idx);
        result = _.sortBy(result, function(item) {
          return item.stat;
        });
        return result;
      }

      /**
       * 标志边界，即出现次数最小和最大值
       * @param arr
       * @returns {*}
       */
      function signBoundary(arr) {
        var minItem = _.min(arr, function(item) { return item.stat; });
        var maxItem = _.max(arr, function(item) { return item.stat; });
        minItem.min = true;
        maxItem.max = true;
        return arr;
      }

      /**
       * 标志最新的开奖号码
       * @param arr
       * @param idx
       * @returns {*}
       */
      function signNums(arr, idx) {
        var foundItem = _.find(arr, function(item) { return currentPeriodNums[idx] == item.num; });
        foundItem.match = true;
        return arr;
      }

      /**
       * 预测一个号码
       */
      function predictLotteryNum(arr) {
        // 找到最新开奖号码与出现次数最多的号码之间的号码，然后随时选中一个作为预测号码
        var startIdx = _.findIndex(arr, function(item) { return item.match; });
        var rangeList = _.chain(arr).drop(startIdx).map(function(item) { return parseInt(item.num); }).value();
        return rangeList[_.random(rangeList.length - 1)];
      }

      function _init() {

        $scope.data = _.map(window.data, function(val, key) {
          return {
            title: titleMap[key],
            data: handleData(val, indexMap[key])
          }
        });

        $scope.predictLotteryNumbers();

      }

      _init();

    }]);

})();
