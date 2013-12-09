var fs = require('fs'),
	mongo = require('mongoskin'),
	async = require('async'),
	crypto = require('crypto');

var db = require('./util').mongo.db();

function jobManager (agenda) {
	this.agenda = agenda;
}

jobManager.prototype.restartJobs = function() {
	var self = this;
	var jobCursor = db.collection('jobs').find();
	jobCursor.each(function(err,job){
		if(!job || err) return;
		self.addJob(job.data.url,job.data.interval,job.data.actions,job.data.title);
	});
};

//url,interval,actions,title
jobManager.prototype.addJob = function(url,interval,actions,title) {
	var jobname = this.defineJob(url,actions);
	this.agenda.every(interval, jobname, {
		interval:interval,
		actions:actions,
		url:url,
		title:title
	});
	// async.waterfall( waterfallCallbacks({url:url,job:jobname},parseActions(actions)),function(err) {
	// 	console.log(err,'first try done!');
	// });
}

jobManager.prototype.defineJob = function(url,actionConfig) {
	var actions = parseActions(actionConfig);
	var hash = crypto.createHash('md5').update(url+actionConfig.join(',')).digest("hex");
	var jobName = 'feed-'+hash;

	this.agenda.define(jobName, function(job, done) {
		async.waterfall( waterfallCallbacks({url:url,job:jobName},actions),function(err) {
			console.log(err,'done!');
			done();
		});
	});
	return jobName;
}

function parseActions(config) {
	var actions = [];
	config.forEach(function(action){
		if(action.indexOf('.')===-1) {
			actions.push(require('../action/'+action));
		}else{
			var arr = action.split('.');
			var module = arr[0], func = arr[1];
			actions.push(require('../action/'+module)[func]);
		}
	});
	return actions;
}

function waterfallCallbacks(firstParam,functions) {
	var callbacks = [];
	functions.forEach(function(func,index){
		if(index==0) {
			callbacks.push(functionWrap(func,function(callback){
				func(firstParam,function(result){
					callback(null,result);
				});
			}));
		}else {
			callbacks.push(functionWrap(func,function(data,callback){
				if(data&&!data.job) data.job = firstParam.job;
				func(data,function(result){
					callback(null,result);
				});
			}));
		}
	});
	return callbacks;
}

function functionWrap(func,wrapper) {
	return wrapper;
}

module.exports = jobManager;