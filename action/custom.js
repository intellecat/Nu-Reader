exports.shanghai = function(data,callback) {
	data.items = data.items.filter(function(item){
		return item.title.search('上海')!==-1;
	});
	callback(data);
}