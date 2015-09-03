/**
 * Created by danielxiao on 15/9/2.
 */

var Promise = require("bluebird");
var Datastore = require('nedb');
var _ = require('lodash');
var fs = require("fs");
var currentNum = require('./data/current-num');

var db = {};
db.data = Promise.promisifyAll(new Datastore('data/data.db'));

module.exports = {
  testAllAFns: testAllAFns
};

function testAlgorithm(aFn) {
  return db.data.loadDatabaseAsync().then(function() {
    return new Promise(function(resolve) {
      db.data.find({}).sort({issue:1}).exec(function(err, docs) {
        var results = [];
        _.each(docs, function(item, idx) {
          var killRedNums = aFn(getRedNumbers(item));
          //console.log('killRedNums:', killRedNums);
          if (docs[idx + 1]) {
            var sharedVals = _.intersection(getRedNumbers(docs[idx + 1]).red, killRedNums);
            if (sharedVals.length > 0) {
              results.push(sharedVals.length);
            }
          }
        });

        var nearSuccessResult_1 = _.chain(results).filter(function(item) { return item < 2 }).value();
        var nearSuccessResult_2 = _.chain(results).filter(function(item) { return item < 3 }).value();

        var resultObj = {
          desc: aFn.desc,
          successRate: ((1 - results.length / docs.length) * 100).toFixed(2) + '%',
          nearSuccess1: ((1 - (results.length - nearSuccessResult_1.length) / docs.length) * 100).toFixed(2) + '%',
          nearSuccess2: ((1 - (results.length - nearSuccessResult_2.length) / docs.length) * 100).toFixed(2) + '%'
        };

        console.log('Desc:', aFn.desc);
        console.log('The success rate:', resultObj.successRate);
        console.log('The near success rate (==1 miss):', resultObj.nearSuccess1);
        console.log('The near success rate (<=2 miss):', resultObj.nearSuccess2);

        resolve(resultObj);

      });
    });

  });
}



/**
 * 算法1
 * 开奖号码加6，如大于33，则-33便是下一期的红球杀号
 * @param numbers
 */
function a1(numbers) {
  numbers = numbers.red;
  return _.chain(numbers).map(function(num) {
    num += 6;
    if (num > 33) {
      num -= 33;
    }
    return num;
  }).sort().value();
}
a1.desc = '算法1：开奖号码加6，如大于33，则-33便是下一期的红球杀号';

/**
 * 算法2
 * 开奖号码-6，如<=0，则+33，然后再+3，便是下一期的红球杀号
 * @param numbers
 */
function a2(numbers) {
  numbers = numbers.red;
  return _.chain(numbers).map(function(num) {
    num = num - 6;
    if (num <= 0) {
      num += 33;
    }
    num += 3;
    return num;
  }).sort().value();
}
a2.desc = '算法2：开奖号码-6，如<=0，则+33，然后再+3，便是下一期的红球杀号';

/**
 * 算法3
 * 上期开奖红球号码每两个号码相减的绝对值作为下一期开奖号码杀号
 * @param numbers
 */
function a3(numbers) {
  numbers = numbers.red;
  var results = [];
  _.each(numbers, function(num, idx) {
    if (numbers.length > idx + 1) {
      for (var i = idx + 1; i < numbers.length; i++) {
        results.push(Math.abs(num - numbers[i]));
      }
    }
  });
  return _.chain(results).uniq().sortBy().value();
}
a3.desc = '算法3：上期开奖红球号码每两个号码相减的绝对值作为下一期开奖号码杀号';

/**
 * 算法4
 * 开奖号码减去本期蓝球的绝对值作为下一期的开奖号码杀号
 * @param numbers
 */
function a4(numbers) {
  var reds = numbers.red;
  var blue = numbers.blue;
  return _.map(reds, function(num) {
    return Math.abs(num - blue) || 33;
  })
}
a4.desc = '算法4：开奖号码减去本期蓝球的绝对值作为下一期的开奖号码杀号';

/**
 * 算法5
 * 开奖号码减去当期尾数合值的拆分合值（如果差值相减为负数的话必须加上３３）作为下一期的开奖号码杀号
 *
 * 什么是当期尾数合值的拆分合值?
 * 举例：开奖号码１３、１６、１９、２０、２３、３３
 *      尾数和值为３＋６＋９＋０＋３＋３＝２４
 *      拆分合值为２＋４＝６
 */
function a5(numbers) {
  numbers = numbers.red;

  var breakUpSumValue = _.chain(numbers).map(function(num) {
    var mantissaNum = num + '';
    return _.parseInt(mantissaNum.charAt(mantissaNum.length - 1));
  }).sum().split('').sum().value();

  return _.map(numbers, function(num) {
    var result = num - breakUpSumValue;
    if (result <= 0) result += 33;
    return result;
  })
}
a5.desc = '算法5：开奖号码减去当期尾数合值的拆分合值（如果差值相减为负数的话必须加上３３）作为下一期的开奖号码杀号';

/**
 * 算法6
 * 开奖号码减去本期和值的拆分合值（如果差值相减为负数的话必须加上３３）作为下一期的开奖号码杀号
 *
 * 什么是本期和值的拆分合值？
 * 举例：开奖号码１３、１６、１９、２０、２３、３３
 *      合值为１２４，其拆分合值为１＋２＋４＝７
 */
function a6(numbers) {
  numbers = numbers.red;

  var breakUpSumValue = _.chain(numbers).sum().split('').sum().value();

  return _.map(numbers, function(num) {
    var result = num - breakUpSumValue;
    if (result <= 0) result += 33;
    return result;
  })
}
a6.desc = '算法6：开奖号码减去本期和值的拆分合值（如果差值相减为负数的话必须加上３３）作为下一期的开奖号码杀号';

/**
 * 算法7
 * 开奖号码减去本期ＡＣ值的绝对值作为下一期的开奖号码杀号
 *
 * 什么是AC值？
 * 举例：开奖号码为：03、04、05、16、20、30，正选数量为6
 *      在这6个开奖号码中计算得到任意两个数字之间的不相同的正差值的总个数为14，那么这组号码的AC值就是14-（6-1）=9
 */
function a7(numbers) {
  numbers = numbers.red;
  var results = [];
  _.each(numbers, function(num, idx) {
    if (numbers.length > idx + 1) {
      for (var i = idx + 1; i < numbers.length; i++) {
        results.push(Math.abs(num - numbers[i]));
      }
    }
  });

  var count = _.uniq(results).length;
  var acVal = count - (numbers.length - 1);

  return _.map(numbers, function(num) {
    return Math.abs(num - acVal) || 33;
  })
}
a7.desc = '算法7：开奖号码减去本期ＡＣ值的绝对值作为下一期的开奖号码杀号';

/**
 * 算法8
 * 当期开奖号码
 * @param numbers
 */
function a8(numbers) {
  return numbers.red;
}
a8.desc = '算法8：当期开奖号码';

function getRedNumbers(item) {
  return {
    red: [item.red_1, item.red_2, item.red_3, item.red_4, item.red_5, item.red_6],
    blue: item.blue
  }
}


//testAlgorithm(a8);

function testAllAFns() {
  var allAFns = [a1, a2, a4, a5, a6, a7, a8];
  var result = [];
  var currentRed = currentNum.splice(0, 6);
  var blue = currentNum;

  allAFns.reduce(function(chain, aFn) {
    return testAlgorithm(aFn).then(function(data) {
      data.killRedNums = _.sortBy(aFn({red: currentRed, blue: blue}));
      result.push(data);
    })
  }, Promise.resolve()).then(function() {
    fs.writeFile(process.cwd() + '/data/all-afns-test-result.js', 'var allAFnsTestResult = ' + JSON.stringify(result));
  });

}

testAllAFns();




