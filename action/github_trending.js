var request = require('request'),
	util = require('../lib/util'),
	cheerio = require('cheerio');

var db = util.mongo.db();

function fetch (param,callback) {
	var url = param.url||'https://github.com/trending';
	request(url,function (error, response, body) {
		var $ = cheerio.load(body);
		var repos = [];

		$('.repo-leaderboard-list-item').each(function(index){
			var item = $(this);
			var repo = {
				title : item.find('.repository-name').attr('href'),
				language : item.find('.title-meta').text(),
				description : item.find('.repo-leaderboard-description').text(),
				rank : item.find('.leaderboard-list-rank').text().substring(1),
			};
			repo.link = 'https://github.com'+repo.title;
			repo.guid = repo.link;
			repos.push(repo);
		});
		callback({items:repos});
	});
}

exports.fetch = fetch;