var config = require('../config/main.json');

function convertMS(ms) {
	var d, h, m, s;
	s = Math.floor(ms / 1000);
	m = Math.floor(s / 60);
	s = s % 60;
	h = Math.floor(m / 60);
	m = m % 60;
	d = Math.floor(h / 24);
	h = h % 24;
	return { d: d, h: h, m: m, s: s };
};

exports.convertMS = convertMS;

var mongo = (function(){
	var instance,
		mongo = require('mongoskin');
	return {
		db:function(){
			if(instance==null) {
				instance = mongo.db(config.mongo+'?auto_reconnect',{safe: true});
			}
			return instance;
		}
	}
})();

exports.mongo = mongo;

exports.savePosts = function(data,callback){
	// var meta = data.meta;
	var size = data.items.length;
	if(!size) {
		callback(data);
		return;
	}
	var db = mongo.db();
	var posts_collection = db.collection('posts');
	data.items.forEach(function(item){
		if(data.meta) item.meta = {title:data.meta.title};
		item.job = data.job;
		item.new = true;
		posts_collection.insert(item,function(err, result){
			if(--size===0) callback(data);
		});
	});
};

exports.initData = function(db) {
	db.collection('actions').count(function(error,count){
		if(count) return;
		var actions = [
			{name:'RSS basic',items:['feed.fetch','feed.removeDuplicate','feed.update']},
			{name:'Zhihu Daily',items:['zhihudaily.fetch','zhihudaily.update']},
			{name:'赶集租房',items:['ganji_zufang.fetch','feed.removeDuplicate','ganji_zufang.update']},
			{name:'Github Trending',items:['github_trending.fetch','feed.removeDuplicate','feed.update']},
			{name:'RSS filter 上海',items:['feed.fetch','custom.shanghai','feed.removeDuplicate','feed.update']},
			{name:'RSS - mail',items:['feed.fetch','feed.removeDuplicate','feed.update','mail.send']}
		];
		actions.forEach(function(action){
			db.collection('actions').insert(action,function(err,result){
				if(err) throw err;
			});
		});
	});
};