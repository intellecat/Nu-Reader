var Mailgun = require('Mailgun').Mailgun
	mailconf = require('../config/main.json').mail;

exports.send = function (data,callback) {
	if(!data.items.length){
		callback(data);
		return;
	}
	var content = '';
	data.items.forEach(function(item){
		content += item.title + '  '+item.link+'\n';
	});
	var mailgun = new Mailgun('key-76-q11u-srygaaw61-s2a5-bygexu8y1');
	mailgun.sendText(
		mailconf.sender, 
		mailconf.recipients, 
		mailconf.subject,
		content,
		function(err) { err && console.log(err); }
	);
	// console.log(content);
	callback(data);
};