var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var url = require('url');
var io = require('socket.io')(http);

/*------------------------------------------常量定义模块---------------------------------------------------------*/
//注册ejs模板为html页。简单的讲，就是原来以.ejs为后缀的模板页，现在的后缀名可以//是.html了
app.engine('.html', require('ejs').__express);
//设置视图模板的默认后缀名为.html,避免了每次res.Render("xx.html")的尴尬
app.set('view engine', 'html');
//设置模板文件文件夹,__dirname为全局变量,表示网站根目录
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
/*------------------------------------------常量定义模块---------------------------------------------------------*/

/*
var db = require('./db/redis');

var schedule = require("node-schedule");  
var rule     = new schedule.RecurrenceRule();  
//每隔一小時清空redis中數據  
rule.minute  = 59;//每小時的59分執行一次 清空redis中數據
schedule.scheduleJob(rule, function(){
	db.clearData();
});  */

//在线用户
var onlineUsers = {};
//当前在线人数
var onlineCount = 0;
var itemsPerPage=10;//每页加载条数

md5 = require('js-md5');

/*------------------------------------------Router模块---------------------------------------------------------*/
app.get('/', function(req, res){
	//res.send('<h1>Welcome Realtime Server</h1>');
	//向页面模板传递参数，可以传递字符串和对象，注意格式
	var params = url.parse(req.url, true).query;


	var pic=parseInt(params.pic.substring(1))%48;
	var sec=params.sec,
	username=params.name,
	userid=params.id,
	picname='P'+pic,
	itemsPerPage=itemsPerPage,
	level=params.level;
	//jsonwebtoken可以使用 jsonwebtoken来验证用户的合法性
	//如果不合法给出提示 否则Render页面

    res.render('chatRoom', {
        username: username,
        userid: userid,
        picname: picname,
        host: req.headers.host,
        itemsPerPage: itemsPerPage,
        level: level
    });
});
/*------------------------------------------Router模块---------------------------------------------------------*/


var express = require('express');
var router = express.Router();
// 导入MySQL模块
var mysql = require('mysql');
var dbConfig = require('./db/dbConfig');
var userSQL = require('./db/usersql');
// 使用dbConfig.js的配置信息创建一个MySQL连接池
var pool = mysql.createPool(dbConfig.mysql);

io.on('connection', function(socket){
	console.log('a user connected');
	//监听新用户加入 或 用户重连
	socket.on('login', function(obj){
		// 从连接池获取连接 
		// 建立连接 增加一个用户信息
		// 从连接池获取连接 
		pool.getConnection(function(err, connection) {

		  	connection.query(userSQL.getLastMsgID, [], function(err, result){
			    if(result.length!=0){
			    	//console.log(result[0].lastMsgID);
			    	var lastMsgID=result[0].lastMsgID;//目前产生的所有数据的最后一条的ID
			    	connection.query(userSQL.addUser, [obj.userid,lastMsgID,1,obj.username,obj.picName], function(err, result){
			    		//console.log(userSQL.addUser)
						if(result.length!=0){
					    	connection.query(userSQL.queryChats, ['ios','zh',0,itemsPerPage], function(err, result){
						      //发送给本人数据
						      io.emit('loadData'+obj.userid, {result:result});
						    });
					    }
					});
			    }
			});
		  	// 释放连接  
			connection.release();
		});

		//将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
		socket.name = obj.userid;
		//检查在线列表，如果不在里面就加入
		if(!onlineUsers.hasOwnProperty(obj.userid)) {
			onlineUsers[obj.userid] = obj.username;
			//在线人数+1
			onlineCount++;
		}else{
			//socket.emit('nickExisted');
			//说明是断线重连。。。
            return;
		}
		//向所有客户端广播用户加入
		//io.emit('login', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:obj});
		console.log(obj.username+'加入了聊天室');
	});

	socket.on('getDataByPage', function(obj){
		console.log(obj);
		start=obj.page*10;
		// 从连接池获取连接 
		pool.getConnection(function(err, connection) {
			connection.query(userSQL.queryChats, ['ios','zh',start,itemsPerPage], function(err, result){
			    //发送给本人数据
				io.emit('getDataByPage'+obj.userid, {result:result});
		    });
		  	// 释放连接  
			connection.release();
		});
	});
	
	//监听用户退出
	socket.on('disconnect', function(){
		//将退出的用户从在线列表中删除
		if(onlineUsers.hasOwnProperty(socket.name)) {
			//退出用户的信息
			var obj = {userid:socket.name, username:onlineUsers[socket.name]};
			//删除
			delete onlineUsers[socket.name];
			//在线人数-1
			onlineCount--;
			
			//向所有客户端广播用户退出
			//io.emit('logout', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:obj});
			console.log(obj.username+'XXXXXXXXX退出了聊天室');
		}
	});
	
	//监听用户发布聊天内容
	socket.on('message', function(obj){
		client.select('5', function(error){
            if(error) {
                console.log(error);
            } else {
            	var exist=false;
                client.LRANGE(obj.userid,0,-1, function(err,result){
                    if (err) {  
                        console.log(err);  
                        return;  
                    }
                    if(result.length==0){
                    	//db.push(obj.userid,obj.contentSave);
                    	//向所有客户端广播发布的消息
                    }else{
                    	//查询是否存在一样内容， 如果存在就不插入，如果不存在就插入
                    	for(var i in result){
                    		//console.log(result[i].split("!&*&*!")+"#########");
                    		var sendTime=result[i].split("!&*&*!")[1];
                    		var timestamp = Date.parse(new Date());
                    		if(result[i].split("!&*&*!")[0]==obj.contentSave){
                    			if((timestamp-sendTime)/1000 < 3*60){
	                    			console.log("三分內");
                    				exist=true;
		                    		//触发弹窗，提示3分钟内不能有重复内容
	                    			io.emit('contentRepeat'+obj.userid);
	                    			break;
	                    		}
                    		}
                    	}                		
                    }
                    if(exist==false){
        			var timestamp = Date.parse(new Date()); 
        			db.push(obj.userid,obj.contentSave+"!&*&*!"+timestamp);//加上當前的時間戳，判斷3分鐘內是否存在相同內容
        			//向所有客户端广播发布的消息
				io.emit('message', obj);
				console.log(obj.username+'说：'+obj.content);
				// 从连接池获取连接 
				pool.getConnection(function(err, connection){
					//connection.query(userSQL.insertChat, [obj.userid,obj.picName,obj.username,0,0,'',obj.content,'ios','zh'], function(err, result){
					connection.query(userSQL.insertChat, [obj.userid,obj.picName,obj.username,0,0,'',obj.contentSave,'ios','zh'], function(err, result){
					    if(result){
					    	console.log("成功");
					    }else{
					    	console.log(err);
					    }
					});
				  	// 释放连接  
					connection.release();
				});
        			return;
        		}
                });
            }
        });
	});
  
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});
