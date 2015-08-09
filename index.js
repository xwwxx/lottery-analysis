/**
 * Created by danielxiao on 15/8/8.
 */

var Promise = require("bluebird");
var request = Promise.promisify(require("request"));
var cheerio = require('cheerio');
var Datastore = require('nedb');
var fs = require("fs");
var _ = require('lodash');

db = {};
db.data = Promise.promisifyAll(new Datastore('data.db'));
db.stat = Promise.promisifyAll(new Datastore('stat.db'));

function ClientError(e) {
  return e.code >= 400 && e.code < 500;
}

/**
 * 统计的方法
 * @param field
 * @returns {bluebird}
 */
function statFn(field) {
  return new Promise(function (resolve, reject) {
    db.data.find({}).exec(function(err, docs) {
      var result =  _.chain(docs).groupBy(function(item) {
        return item[field];
      }).map(function(arr, val) {
        return {
          num: val,
          stat: arr.length
        }
      }).value();
      resolve(result);
    });
  })
}

/**
 * 分析区间的方法
 */
function analysisScopeFn(field, orderSign) {
  var orderOptions = {};
  orderOptions[field] = orderSign;
  return new Promise(function (resolve, reject) {
    db.data.find({}).sort(orderOptions).limit(1).exec(function(err, docs) {
      resolve(docs[0][field]);
    });
  })
}

/**
 * 取得数据的总页数
 * @returns {*}
 */
function fetchDataTotalPage() {
  return request('http://www.gdfc.org.cn/datas/history/twocolorball/history_1.html').then(function(response) {
    var contents = response[1];
    var $ = cheerio.load(contents);
    return parseInt($('#label-totalpage').text());
  });
}

/**
 * 抓数据
 */
function fetchData(pageNum) {
  request('http://www.gdfc.org.cn/datas/history/twocolorball/history_' + pageNum + '.html').then(function(response) {
    var contents = response[1];
    var $ = cheerio.load(contents);
    var trItems = $('div.play_R').find('table tr');
    _.each(trItems, function(item, idx) {
      if (idx != 0) { // 第一行是表头
        var tdItems = $(item).find('td');
        var result = {};

        result.issue = $(tdItems[0]).text();
        var luckyNos = _.chain($(tdItems[1]).attr('luckyno').replace(/(\d{2})/g, '$1,').split(',')).compact().value();
        result.blue = parseInt(luckyNos[6]);
        var redNos = _.chain(luckyNos).tap(function(array) {array.pop()}).sort().value();
        result.red_1 = parseInt(redNos[0]);
        result.red_2 = parseInt(redNos[1]);
        result.red_3 = parseInt(redNos[2]);
        result.red_4 = parseInt(redNos[3]);
        result.red_5 = parseInt(redNos[4]);
        result.red_6 = parseInt(redNos[5]);

        db.data.count({ issue: result.issue }, function (err, count) {
          if (err) {
            console.error(err);
            return;
          }
          if (count == 0) { // 已经插入过的数据不重复插入
            db.data.insert(result, function (err, newDoc) {
              if (err) {
                console.error(err);
                return;
              }

              console.log(newDoc);
            });
          }
        });

      }
    })
  }).catch(ClientError, function() {
    console.error(arguments);
  });
}

/**
 * 分析各个位置的数字区间
 * @returns {*}
 */
function analysisScope() {

  return Promise.props({
    minRed_1: analysisScopeFn('red_1', 1),
    maxRed_1: analysisScopeFn('red_1', -1),
    minRed_2: analysisScopeFn('red_2', 1),
    maxRed_2: analysisScopeFn('red_2', -1),
    minRed_3: analysisScopeFn('red_3', 1),
    maxRed_3: analysisScopeFn('red_3', -1),
    minRed_4: analysisScopeFn('red_4', 1),
    maxRed_4: analysisScopeFn('red_4', -1),
    minRed_5: analysisScopeFn('red_5', 1),
    maxRed_5: analysisScopeFn('red_5', -1),
    minRed_6: analysisScopeFn('red_6', 1),
    maxRed_6: analysisScopeFn('red_6', -1)
  }).then(function(data) {
    return {
      Red_1: {min: data.minRed_1, max: data.maxRed_1},
      Red_2: {min: data.minRed_2, max: data.maxRed_2},
      Red_3: {min: data.minRed_3, max: data.maxRed_3},
      Red_4: {min: data.minRed_4, max: data.maxRed_4},
      Red_5: {min: data.minRed_5, max: data.maxRed_5},
      Red_6: {min: data.minRed_6, max: data.maxRed_6}
    }
  });
}

/**
 * 统计出每个数字区间截至当前出现次数最低和最高的数字
 * @returns {*}
 */
function statFrequency() {
  return Promise.props({
    stat_red_1: statFn('red_1'),
    stat_red_2: statFn('red_2'),
    stat_red_3: statFn('red_3'),
    stat_red_4: statFn('red_4'),
    stat_red_5: statFn('red_5'),
    stat_red_6: statFn('red_6'),
    stat_blue: statFn('blue')
  });
}

/**
 * 更新数据
 */
function updateData() {

  db.data.loadDatabaseAsync().then(function() {
    return fetchDataTotalPage();
  }).then(function(totalPage) {
    for (var i = 1; i <= totalPage; i++) {
      fetchData(i);
    }
  });

}

/**
 * 分析
 */
function analysis() {
  db.data.loadDatabaseAsync().then(function() {
    return Promise.props({
      analysisScope: analysisScope(),
      statFrequency: statFrequency()
    });
  }).then(function(data) {
    console.log(data.analysisScope);

    // 保存成DB格式
    db.stat.loadDatabaseAsync().then(function() {
      return db.stat.removeAsync({}, { multi: true });
    }).then(function() {
      db.stat.insert(data.statFrequency);
    });
    // 保存成JS格式
    fs.writeFile(process.cwd() + '/data.js', 'var data = ' + JSON.stringify(data.statFrequency));
  });
}

/**
 * 取得当前开奖号码
 */
function getCurrrentLotteryNum() {
  return request('http://www.gdfc.org.cn/datas/history/twocolorball/history_1.html').then(function(response) {
    var contents = response[1];
    var $ = cheerio.load(contents);
    var trItems = $('div.play_R').find('table tr');
    var result = [];
    _.some(trItems, function(item, idx) {
      if (idx == 1) { // 第二行为最新的开奖结果
        var tdItems = $(item).find('td');
        var luckyNos = _.chain($(tdItems[1]).attr('luckyno').replace(/(\d{2})/g, '$1,').split(',')).compact().value();
        var blueNo = parseInt(luckyNos[6]);
        result = _.chain(luckyNos).tap(function(array) {array.pop()}).sort().map(_.parseInt).value();
        result.push(blueNo);
        console.log(result);
        fs.writeFile(process.cwd() + '/current-num.js', 'var currentPeriodNums = ' + JSON.stringify(result));
        return true;
      }
    });
    return result;
  });
}

/**
 * 是否存在重复记录
 */
function existDuplicateRecords() {
  db.data.loadDatabaseAsync().then(function() {
    return new Promise(function (resolve, reject) {
      db.data.find({}).exec(function(err, docs) {
        var result = _.chain(docs).groupBy(function(item) {
          return [item.red_1, item.red_2, item.red_3, item.red_4, item.red_5, item.red_6, item.blue].join('');
        }).filter(function(items) {
          return items.length > 1 }
        ).value();
        console.log('Result: ', result.length > 1);
        console.log(result);
        resolve(result.length > 1);
      });
    })
  });
}

/**
 * 判断该组号码是否出现过
 */
function isGroupNumberAppeared(groupNumber) {
  db.data.loadDatabaseAsync().then(function() {
    return new Promise(function (resolve, reject) {
      db.data.find({red_1: groupNumber[0], red_2: groupNumber[1], red_3: groupNumber[2], red_4: groupNumber[3], red_5: groupNumber[4], red_6: groupNumber[5], blue: groupNumber[6]}).exec(function(err, docs) {
        console.log('Result: ', docs.length > 0);
        console.log(docs);
        resolve(docs.length > 1);
      });
    })
  });
}

function main() {
  var command = process.argv[2];
  if (command == '-ud' || command == 'updateData') {
    console.log('run updateData');
    updateData();
  } else if (command == '-a' || command == 'analysis') {
    console.log('run analysis');
    analysis();
  } else if (command == '-cn' || command == 'currentNum') {
    console.log('run currentNum');
    getCurrrentLotteryNum();
  } else if (command == '-hdr' || command == 'historyDuplicateRecords') {
    console.log('run historyDuplicateRecords');
    existDuplicateRecords();
  } else if (command == '-ia' || command == 'isAppeared') {
    console.log('run isAppeared');
    var groupNumber = (process.argv[3] || '').split(',');
    if (groupNumber.length != 7) {
      console.log('provide group number pls, like this: node index.js -ia 3,6,12,18,23,52,11');
      return;
    }
    groupNumber = _.chain(groupNumber).map(_.parseInt).value();
    isGroupNumberAppeared(groupNumber);
  } else {
    console.log('example: node index.js -ud \n');
    console.log('  -ud  | updateData              ---- update data \n');
    console.log('  -a   | analysis                ---- analysis data \n');
    console.log('  -cn  | currentNum              ---- current number \n');
    console.log('  -hdr | historyDuplicateRecords ---- is history exist duplicate records \n');
    console.log('  -ia  | isAppeared groupNumber  ---- is group number appeared \n');
  }
}

main();





