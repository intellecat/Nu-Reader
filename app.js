var fs = require('fs'),
	Agenda = require('agenda'),
	express = require('express'),
	mongo = require('mongoskin'),
	async = require('async'),
	JobManager = require('./lib/jobManager')
	util = require('./lib/util');

process.setMaxListeners(0);

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

var agenda = new Agenda({db: { address: 'localhost:27017/nu-reader',collection:'jobs'},processEvery:'5 seconds'});

var db = mongo.db('localhost:27017/nu-reader?auto_reconnect',{safe: true});

var jobManager = new JobManager(agenda);
jobManager.restartJobs();

app.get('/', function(req, res){
  res.render('index', { users: 'users are all here' });
});

app.get('/jobs',function(req,res){
	db.collection('jobs').find().toArray(function(err,jobs){
		if(err) throw err;
		db.collection('actions').find().toArray(function(err,actions){
			res.render('jobs/index',{jobs:jobs,actions:actions});
		});
	});
});

app.get('/posts',function(req,res){
	async.series([
		function(callback){
			db.collection('posts').find().sort({pubDate:-1}).toArray(function(err,posts){
				if(err) callback(err,null);
				else callback(null,posts);		
			});
		},
		getChannels
	],function(err,results){
		if(err) throw err;
		res.render('posts/index',{posts:results[0],channels:results[1]});
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
	],function(err,posts){
		if(err) callback(err,null);
		else callback(null,posts);		
	});
}

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
		res.render('posts/index',{posts:results[0],channels:results[1],count:results[2],page:page});
	});
});

app.get('/post/:post_id',function(req,res){
	db.collection('posts').findById(req.params.post_id,function(err,post){
		res.send(post.description||post.content);
	});
});

app.get('/start', function(req, res){
	agenda.start();
	res.send('agenda started');
});

app.get('/stop', function(req, res){
	agenda.stop();
	res.send('agenda stopped');
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
	db.collection('actions').find().toArray(function(err,actions){
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

app.get('/test',function(req,res){
	var d = util.convertMS(10000);
	console.log(d);
});


app.listen(3000);
console.log('Listening on port 3000');
agenda.start();