var util = require('./util'),
	JobManager = require('./jobManager');

var db = util.mongo.db();

exports.test = function(req,res) {
	res.send('api test ok');
};

exports.posts = function(req,res) {
	var size = 1*req.query.size||20;
	var offset = 1*req.query.offset||0;
	var criteria = {};
	if(req.query.job) criteria.job = req.query.job;
	db.collection('posts').find(criteria).sort({pubDate:-1}).limit(size).skip(offset).toArray(function(err,posts){
		res.jsonp(posts);
	});
};

exports.post = function(req,res) {
	db.collection('posts').findById(req.params.post_id,function(err,post){
		res.jsonp(post);
	});
};

exports.jobs = function(req,res) {
	db.collection('jobs').find().toArray(function(err,jobs){
		var jobsdata = jobs.map(function(job){
			var jobdata = job.data;
			jobdata._id = job._id;
			jobdata.name = job.name;
			return jobdata;
		});
		res.jsonp(jobsdata);
	});
};

exports.addjob = function(req,res) {
	db.collection('actions').findById(req.body.action,function(err,action){
		if(err) { res.json(500,{error:err}); return; }
		if(!action) { res.json(404,{error:'action not found'}); return; }
		jobManager.addJob(req.body.url,req.body.interval,action.items,req.body.title );
		res.json({status:'success'});
	});
};

exports.removejob = function(req,res) {
	db.collection('jobs').removeById(req.params.job_id,function(err){
		if(err) res.json(500,{error:err});
		else res.json(result);
	});
};

exports.actions = function(req,res) {
	db.collection('actions').find().sort({_id:1}).toArray(function(err,actions){
		res.jsonp(actions);
	});
};

exports.addaction = function(req,res) {
	db.collection('actions').insert({
		name:req.body.name,
		items:req.body.items.split(',')
	},function(err,result){
		if(err) res.json(500,{error:err});
		else res.json(result);
	});
};

exports.removeaction = function(req,res) {
	db.collection('actions').removeById(req.params.action_id,function(err){
		if(err) res.json(500,{error:err});
		else res.json(result);
	});
};