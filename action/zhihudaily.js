var request = require('request'),
	util = require('../lib/util');

var db = util.mongo.db();

function getNews(param,callback) {
	var url = 'http://news.at.zhihu.com/api/1.2/news/latest';
	request(url,function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var data = JSON.parse(body);
			data.job = param.job;
			callback(data);
		}
	});
}

function updateNews(data,callback) {
	var size = data.news.length;
	data.news.forEach(function(item){
		request(item.url,function(error, response, body){
			var dataitem = JSON.parse(body);
			var result = {
				link:dataitem.share_url,
				guid:dataitem.share_url,
				title:dataitem.title,
				description:dataitem.body,
				job:data.job,
				new:true,
				meta:{title:'知乎日报'}
			};
			db.collection('posts').findOne({guid: result.link}, function (err, post) {
				if(post) {if(--size===0) callback(result); return;}
				db.collection('posts').insert(result,function(err, result){
					if(--size===0) callback(result);
				});
			});
		});
	});
}

exports.fetch = getNews;
exports.update = updateNews;