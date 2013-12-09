var request = require('request'),
	util = require('../lib/util'),
	cheerio = require('cheerio');

var db = util.mongo.db();

function fetch(param,callback) {
	request(param.url,function (error, response, body) {
		var $ = cheerio.load(body);
		var items = [];
		$('.list-info-title').each(function(){
			var link = 'http://www.ganji.com'+$(this).attr('href');
			items.push({guid:link,link:link});
		});
		items = items.slice(0,20);
		callback({items:items});
	});
}

function update(data,callback) {
	var size = data.items.length;
	data.items.forEach(function(item){
		request(item.link,function(error, response, body){
			var $ = cheerio.load(body);
			item.title = $('h1').text();
			item.description = $('.summary-cont').html() + $('.cont-box.pics').html();
			item.new = true;
			item.meta = {title:'赶集租房'};
			item.job = data.job;
			db.collection('posts').insert(item,function(err, result){
				if(--size===0) callback(data);
			});
		});
	});
}

exports.fetch = fetch;
exports.update = update;