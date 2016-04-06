/**
 * Created by danielxiao on 16/4/6.
 */

var Promise = require("bluebird");
var request = Promise.promisify(require("request"));
var cheerio = require('cheerio');
var fs = require("fs");
var _ = require('lodash');


var siteConfig = [
  {
    title   : '百度彩票',
    type    : 'red',
    url     : 'http://trend.baidu.lecai.com/ssq/redKillTrend.action?onlyBody=false#chartTableWrapper',
    handleFn: function($) {
      var currentTdSign = $('.current_phase_kill_background');
      var currentTr = currentTdSign.parent();
      var text = currentTr.text();
      return _.chain(text.replace(/\s+/g, ',').match(/\d+/g)).map(_.parseInt).uniq().value();
    }
  },
  {
    title   : '彩经网',
    type    : 'red',
    url     : 'http://taobao.cjcp.com.cn/shdd/ssq-hq.html',
    handleFn: function($) {
      var issueListTds = $('.issue_list');
      var currentTdSign = issueListTds[issueListTds.length - 1];
      var currentTr = $(currentTdSign).parent();
      var tdItems = currentTr.find('.winning_red');
      return _.chain(tdItems).map(function(item) {
        return $(item).text();
      }).map(_.parseInt).compact().uniq().value();
    }
  },
  {
    title   : '澳客网-红球一码杀号',
    type    : 'red',
    url     : 'http://www.okooo.com/ajax/shahao/SSQ/20/FN/',
    json    : true,
    headers : {
      'Host'   : 'www.okooo.com',
      'Referer': 'http://www.okooo.com/shuangseqiu/ssqsh/fn/'
    },
    handleFn: function(data) {

      var result = _.chain(data)
        .map(function(item, key) {
          return {
            period: key,
            data  : item
          }
        })
        .sortByOrder(['period'], ['asc'])
        .pop()
        .get('data.KillNum')
        .map(function(item) {
          return _.parseInt(item.Num);
        })
        .uniq()
        .value();

      return result;
    }
  },
  {
    title   : '澳客网-红球二码杀号',
    type    : 'red',
    url     : 'http://www.okooo.com/ajax/shahao/SSQ/10/FN2/',
    json    : true,
    headers : {
      'Host'   : 'www.okooo.com',
      'Referer': 'http://www.okooo.com/shuangseqiu/ssqsh/fn2/'
    },
    handleFn: function(data) {

      var result = _.chain(data.l)
        .map(function(item, key) {
          return {
            period: key,
            data  : item
          }
        })
        .sortByOrder(['period'], ['asc'])
        .pop()
        .get('data.kn')
        .map(function(item) {
          return item.n;
        })
        .flatten()
        .map(function(item) {
          return _.parseInt(item[0]);
        })
        .uniq()
        .value();

      return result;
    }
  },
  {
    title   : '澳客网-红球三码杀号',
    type    : 'red',
    url     : 'http://www.okooo.com/ajax/shahao/SSQ/10/FN3/',
    json    : true,
    headers : {
      'Host'   : 'www.okooo.com',
      'Referer': 'http://www.okooo.com/shuangseqiu/ssqsh/fn3/'
    },
    handleFn: function(data) {

      var result = _.chain(data.l)
        .map(function(item, key) {
          return {
            period: key,
            data  : item
          }
        })
        .sortByOrder(['period'], ['asc'])
        .pop()
        .get('data.kn')
        .map(function(item) {
          return item.n;
        })
        .flatten()
        .map(function(item) {
          return _.parseInt(item[0]);
        })
        .uniq()
        .value();

      return result;
    }
  },
  {
    title   : '百度彩票',
    type    : 'blue',
    url     : 'http://trend.baidu.lecai.com/ssq/blueKillTrend.action?onlyBody=false#chartTableWrapper',
    handleFn: function($) {
      var currentTdSign = $('.current_phase_kill_background');
      var currentTr = currentTdSign.parent();
      var text = currentTr.text();
      return _.chain(text.replace(/\s+/g, ',').match(/\d+/g)).map(_.parseInt).uniq().value();
    }
  },
  {
    title   : '彩经网',
    type    : 'blue',
    url     : 'http://taobao.cjcp.com.cn/shdd/ssq-lq.html',
    handleFn: function($) {
      var issueListTds = $('.issue_list');
      var currentTdSign = issueListTds[issueListTds.length - 1];
      var currentTr = $(currentTdSign).parent();
      var tdItems = currentTr.find('.winning_red');
      return _.chain(tdItems).map(function(item) {
        return $(item).text();
      }).map(_.parseInt).compact().uniq().value();
    }
  },
  {
    title   : '澳客网-蓝球二码杀号',
    type    : 'blue',
    url     : 'http://www.okooo.com/ajax/shahao/SSQ/10/EN2/',
    json    : true,
    headers : {
      'Host'   : 'www.okooo.com',
      'Referer': 'http://www.okooo.com/shuangseqiu/ssqsh/en2/'
    },
    handleFn: function(data) {

      var result = _.chain(data.l)
        .map(function(item, key) {
          return {
            period: key,
            data  : item
          }
        })
        .sortByOrder(['period'], ['asc'])
        .pop()
        .get('data.kn')
        .map(function(item) {
          return item.n;
        })
        .flatten()
        .map(function(item) {
          return _.parseInt(item[0]);
        })
        .uniq()
        .value();

      return result;
    }
  },
  {
    title   : '澳客网-蓝球一码杀号',
    type    : 'blue',
    url     : 'http://www.okooo.com/ajax/shahao/SSQ/20/EN/',
    json    : true,
    headers : {
      'Host'   : 'www.okooo.com',
      'Referer': 'http://www.okooo.com/shuangseqiu/ssqsh/'
    },
    handleFn: function(data) {

      var result = _.chain(data)
        .map(function(item, key) {
          return {
            period: key,
            data  : item
          }
        })
        .sortByOrder(['period'], ['asc'])
        .pop()
        .get('data.KillNum')
        .map(function(item) {
          return _.parseInt(item.Num);
        })
        .uniq()
        .value();

      return result;
    }
  }

];

function fetchPage(item) {
  return request({
    url    : item.url,
    headers: item.headers || {}
  }).then(function(response) {
    var contents = response[1];
    var param;
    if (item.json) {
      param = JSON.parse(contents);
    } else {
      param = cheerio.load(contents);
    }

    return {
      title : item.title,
      type  : item.type,
      result: item.handleFn(param)
    };

  });
}

function main() {
  var promises = [];
  _.each(siteConfig, function(item, idx) {
    promises.push(fetchPage(item));
  });

  Promise.all(promises).then(function(data) {
    console.log(data);
    fs.writeFile(process.cwd() + '/data/kill-data.js', 'var killData = ' + JSON.stringify(data));
  })
}

main();


