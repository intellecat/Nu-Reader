var fs = require('fs'),
	Agenda = require('agenda'),
	express = require('express'),
	mongo = require('mongoskin'),
	async = require('async'),
	JobManager = require('./lib/jobManager')
	util = require('./lib/util'),
	api = require('./lib/api'),
	config = require('./config/main.json');

var app = express();
app.use(express.bodyParser());
app.use(express.static(__dirname + '/public'));
app.use(express.errorHandler());

app.use(function(req, res, next){
  res.locals.currentUrl = req.path;
  next();
});

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

var agenda = new Agenda({db: { address: config.mongo,collection:'jobs'},processEvery:'5 seconds'});

var db = util.mongo.db();

util.initData(db);

var jobManager = new JobManager(agenda);
jobManager.restartJobs();

app.get('/jobs',function(req,res){
	db.collection('jobs').find().toArray(function(err,jobs){
		if(err) throw err;
		db.collection('actions').find().sort({_id:1}).toArray(function(err,actions){
			res.render('jobs/index',{jobs:jobs,actions:actions});
		});
	});
});

app.get('/',function(req,res){
	var page = req.query.page||1;
	async.series([
		function(callback){
			db.collection('posts').find().sort({pubDate:-1}).limit(20).skip((page-1)*20).toArray(function(err,posts){
				if(err) callback(err,null);
				else callback(null,posts);		
			});
		},
		getChannels,
		function(callback){
			db.collection('posts').count({},function(err,count){
				if(err) callback(err,null);
				else callback(null,count);	
			});
		}
	],function(err,results){
		if(err) throw err;
		res.render('posts/index',{posts:results[0],channels:results[1],channel:null,count:results[2],page:page});
	});
});

app.get('/channel/:channel/posts',function(req,res){
	// res.status(404).send('Not found');
	var page = req.query.page||1;
	async.series([
		function(callback){
			db.collection('posts').find({job:req.params.channel}).sort({pubDate:-1}).limit(20).skip((page-1)*20).toArray(function(err,posts){
				if(err) callback(err,null);
				else callback(null,posts);		
			});
		},
		getChannels,
		function(callback){
			db.collection('posts').count({job:req.params.channel},function(err,count){
				if(err) callback(err,null);
				else callback(null,count);	
			});
		}
	],function(err,results){
		if(err) throw err;
		var channel = results[1].filter(function(item){ return item.job===req.params.channel});
		channel = channel[0];
		res.render('posts/index',{posts:results[0],channels:results[1],channel:channel,count:results[2],page:page});
	});
});

function getChannels(callback){
	db.collection('posts').aggregate([
		{ $group: {
			_id: "$job",
			new: {$sum: {$cond : [ "$new", 1, 0 ]}},
			title: { $addToSet: "$meta.title" },
			job: { $addToSet: "$job" },
		}}
	],function(err,channels){
		db.collection('jobs').find().toArray(function(err,jobs){
			channels.map(function(channel){
				channel.job = channel.job[0];
				channel.title = channel.title[0];
				var job = getByName(jobs,channel.job);
				if(job) channel.title = job.data.title;
			});
			if(err) callback(err,null);
			else callback(null,channels);	
		});
	});
	function getByName(arr,name) {
		var filtered = arr.filter(function(item){
			return item.name === name;
		});
		return filtered.length>0 ? filtered[0] : null;
	}
}

app.get('/post/:post_id',function(req,res){
	db.collection('posts').findById(req.params.post_id,function(err,post){
		res.send(post.description||post.content);
		db.collection('posts').updateById(req.params.post_id,{$set:{new:false}},function(err,post){});
	});
});

app.post('/job/add',function(req,res){
	// var actions = req.body.actions.split(',');
	// if(!actions[0]) actions = ['feed.fetch','feed.update'];
	var interval = req.body.interval_num + ' ' + req.body.interval_type;
	db.collection('actions').findById(req.body.action,function(err,action){
		console.log(action,req.body.action);
		if(err) throw err;
		jobManager.addJob(req.body.url,interval,action.items,req.body.title );
		res.send(req.body.url+' job added');
	});
});

app.get('/actions',function(req,res){
	db.collection('actions').find().sort({_id:1}).toArray(function(err,actions){
		res.render('actions/index',{actions:actions});
	});
});

app.post('/action/add',function(req,res){
	db.collection('actions').insert({
		name:req.body.name,
		items:req.body.items.split(',')
	},function(err,result){
		if(!err) res.send(req.body.name+' action added');
	});
});

app.get('/api/test',api.test);
app.get('/api/posts',api.posts);
app.get('/api/post/:post_id',api.post);
app.get('/api/jobs',api.jobs);
app.post('/api/addjob',api.addjob);
app.post('/api/job/:job_id/remove',api.removejob);
app.get('/api/actions',api.actions);
app.post('/api/addaction',api.addaction);
app.post('/api/action/:action_id/remove',api.removeaction);
app.get('/api/start', function(req, res){
	agenda.start();
	res.json({status:'agenda started'});
});
app.get('/api/stop', function(req, res){
	agenda.stop();
	res.json({status:'agenda stopped'});
});
app.get('/rss/:job_id',api.rss);

app.listen(3000);
console.log('Listening on port 3000');
agenda.start();