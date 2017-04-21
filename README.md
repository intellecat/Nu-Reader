 ![image](http://ww4.sinaimg.cn/large/7308e346gw1ebdumqaiusj20620160sj.jpg)  
 
Nu-Reader是一个可扩展的可定制的订阅/采集程序

***注意！当前版本只是一个简单粗陋、bug百出的试验/预览版本，主要用以验证想法的可行性***

## 系统需求

*	Node
*	MongoDB

## 启动
```
cd {project_dir}
npm install
node app.js
```
使用浏览器打开 http://127.0.0.1:3000


## 原理介绍
传统RSS Reader的内核本质上是抓取RSS源-解析RSS-更新内容-呈现内容的程序。实际上这样的过程不仅仅适用于RSS。在强调语义化网络和mushup(混搭)的今天，数据以传统html、语义化标签、api、webservice等各种方式传播，传统RSS Reader不再能满足大家的需求。

Nu-Reader提供了信息处理的统一流程和简单的扩展机制，只要编写少量代码和简单的配置就可以拓展新的功能。

#### 多种订阅方式
在Nu-Reader里可以定义不同的订阅方式（Action）。如图：
![Actions界面](http://ww2.sinaimg.cn/large/7308e346gw1ebdya5ka7dj20ot0by0ud.jpg)  
RSS订阅是最基本的方式，其他预置的订阅方式由读取既有的API、解析HTML、改变RSS原有内容等方法实现。新的订阅方式（Action）是简单轻量的，可以利用既有的基础

#### 管道结构的处理流程
每种订阅方式由一到多个子动作组成（管道），以最基本的RSS订阅为例：feed.fetch -> feed.removeDuplicate -> feed.update，即RSS采集 -> 去重 -> 更新内容。（注意上图中的items列）

为什么要分成一个个子动作呢？想象每种订阅方式是一节节组成的水管，某段管子不合适，我们就可以换掉这一段，中间还可以加上净水器、加热器、水表等等。这种方式提高了复用性和灵活性。比如我们只想在V2EX招聘的RSS中订阅有关上海的条目，我可以新建一个Action名为“RSS filter 上海”，在RSS basic的基础上加入一个简单的[自定义子动作custom.shanghai](https://github.com/chuck911/Nu-Reader/blob/master/action/custom.js)

```
exports.shanghai = function(data,callback) {
	data.items = data.items.filter(function(item){
		return item.title.search('上海')!==-1;
	});
	callback(data);
}
```
这样我们在订阅时选择“RSS filter 上海”，获得的内容就是过滤过的。  
在自带的其他实例action里，Zhuhu Daily针对json数据源，赶集租房和Github Trending针对html页面。RSS - mail启用了一个mail子动作，可以讲获得的最新内容发到的邮箱中，实际上mail子动作可以放在任意一种Action的末尾

## 界面介绍
主界面：  
![主界面](http://ww1.sinaimg.cn/large/7308e346gw1ebdxblizpoj20oz0gowgh.jpg)
订阅管理界面：
![订阅管理界面](http://ww2.sinaimg.cn/large/7308e346gw1ebdxci4wujj20p00gomyo.jpg)

## API
##### /rss/:job_id
再生成当前频道的RSS

##### /api/posts
获取所有文章, 附加参数: size,offset,job

##### /api/post/:post_id
获取某篇文章

##### /api/jobs
获取所有任务（订阅）

##### /api/addjob
添加任务（订阅）

##### /api/job/:job_id/remove
删除任务（订阅）

##### /api/actions
所有动作（订阅方式）

##### /api/addaction
添加一个动作

##### /api/action/:action_id/remove
删除一个动作

##### /api/start
开启后台进程

##### /api/stop
关闭后台进程