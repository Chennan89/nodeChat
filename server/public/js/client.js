(function () {
	var d = document,
	w = window,
	p = parseInt,
	dd = d.documentElement,
	db = d.body,
	dc = d.compatMode == 'CSS1Compat',
	dx = dc ? dd: db,
	ec = encodeURIComponent;
	var blockWords=['fuck','艹'];//自定义屏蔽词
	var xmlHttp; 
	w.CHAT = {
		msgObj:d.getElementById("message"),
		screenheight:w.innerHeight ? w.innerHeight : dx.clientHeight,
		username:null,
		userid:null,
		picname:null,
		socket:null,
		htmlEscape:function(text){  
		        return text.replace(/[<>"&]/g, function(match, pos, orginalText){  
		            switch(match){  
		                case "<":  
		                    return "&lt;";  
		                case ">":  
		                    return "&gt;";  
		                //case "&":  
		                //    return "&amp;";  
		                case "\"":  
		                    return "&quot;";  
		            }  
		        })  
	    },
		showCharge:function(){
			$("#popContent").text("只有升級成為VIP用戶才能在公共頻道留言");
			$("#popup,#mask").show();
			$("#content,#faceIcon,#faceList,.action").removeClass("top").addClass("btm");
			$("#mask").height($(document).height());
		},
		hideCharge:function(){
			$("#popup,#mask").hide();
		},
		//让浏览器滚动条保持在最低部
		scrollToBottom:function(){
			//w.scrollTo(0, this.msgObj.clientHeight);
			$("#chat").scrollTop($("#message").height());
		},
		createxmlHttpRequest:function() { 
			if (window.XMLHttpRequest) { //all modern browsers have this method
				xmlHttp = new XMLHttpRequest();
			}else if (window.ActiveXObject) { 
				xmlHttp = new ActiveXObject("Microsoft.XMLHTTP"); 
			} 
		},
		doPost:function(url, data, obj){
			// 注意在传参数值的时候最好使用encodeURI处理一下，以防出现乱码 
			CHAT.createxmlHttpRequest(); 
			xmlHttp.open("POST",url,true);//false表示同步，true表示异步
			//xmlHttp.responseType = "json";
			//xmlHttp.crossDomain=true;
			xmlHttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded"); 
			xmlHttp.send(data); 
			xmlHttp.onreadystatechange = function() {
				if ((xmlHttp.readyState == 4) && (xmlHttp.status == 200)) {
					var response = "";
					if(xmlHttp.response != undefined){
						response = xmlHttp.response;
					}else{
						response = xmlHttp.responseText;//for IE
					}
					//console.log(response);
					var res = eval("("+response+")");
					if(res.code==400){
						//金币不足提醒
						$("#popContent").html("抱歉 您的"+goldTag+"不足");
						$("#popup,#mask").show();
						$("#content,#faceIcon,#faceList,.action").removeClass("top").addClass("btm");
						$("#mask").height($(document).height());
						return res.code;
					}else{
						CHAT.socket.emit('message', obj);
						$("#content p").html('');
						$("#faceList").hide();
						return res.code;
					}					
				} else {
				}
			}
		},
		//退出，本例只是一个简单的刷新
		logout:function(){
			this.socket.disconnect();
			window.location.href="uniwebview://return?back=hall";
		},
		//提交聊天消息内容
		submit:function(){
			//var content = d.getElementById("content").value;
			if(parseInt($("#level").val())<3){
				CHAT.showCharge();
				return;
			}

			var reg = /(&nbsp;)+/g;
			var content=$("#content p").html().replace(reg,' ');
			content = $.trim(content);

			if(content == ''){
				$("#popContent").html("内容不能为空");
				$("#popup,#mask").show();
				$("#content,#faceIcon,#faceList,.action").removeClass("top").addClass("btm");
				$("#mask").height($(document).height());
			}

			var result;
			
			var reg = /<img src="\/images\/faces\/(\w+)\.png" title="(\w+)">/g;
			var contentSave=content.replace(reg,"{:$2:}");
			
			var available=getStrLength(contentSave,150);

			if(!available){
				$("#popContent").html("中文不能超過50字<br/>英文不超過150字母");
				$("#popup,#mask").show();
				$("#content,#faceIcon,#faceList,.action").removeClass("top").addClass("btm");
				$("#mask").height($(document).height());
				return;
			}
			for(var i in blockWords){
				if(content.indexOf(blockWords[i])!=-1){
					//alert('請注意文明用語');
					$("#popContent").html("抱歉 發送文字中帶有淫穢詞句");
					$("#popup,#mask").show();
					$("#content,#faceIcon,#faceList,.action").removeClass("top").addClass("btm");
					$("#mask").height($(document).height());
					return;
				}
			}
			
			if(content != ''){
				var obj = {
					userid: this.userid,
					username: this.username,
					picName: this.picName,
					content: content,
					contentSave:contentSave
				};
				var hostWithPort=d.getElementById("host").value;
				//var code=CHAT.doPost('http://192.168.15.105/nodeChat/server/business.php','pid='+userid);
				var host=hostWithPort.substr(0,hostWithPort.indexOf(':'));//192.168.15.105
				$("#content,#faceIcon,#faceList,.action").removeClass("top").addClass("btm");
				$("#mask").hide();
				//var code=CHAT.doPost('http://'+host+'/nodeChat/server/business.php','pid='+userid+'&host=http://'+hostWithPort,obj);
				var code=CHAT.doPost('http://'+host+':8088/nodeChat/server/business.php','pid='+userid+'&host=http://'+hostWithPort,obj);
			}
			return false;
		},
		genUid:function(){
			return new Date().getTime()+""+Math.floor(Math.random()*899+100);
		},
		//更新系统消息，本例中在用户加入、退出的时候调用
		updateSysMsg:function(o, action){
			//当前在线用户列表
			var onlineUsers = o.onlineUsers;
			//当前在线人数
			var onlineCount = o.onlineCount;
			//新加入用户的信息
			var user = o.user;
				
			//更新在线人数
			var userhtml = '';
			var separator = '';
			for(key in onlineUsers) {
		        if(onlineUsers.hasOwnProperty(key)){
					userhtml += separator+onlineUsers[key];
					separator = '、';
				}
		    }
			d.getElementById("onlinecount").innerHTML = '当前共有 '+onlineCount+' 人在线，在线列表：'+userhtml;
			
			//添加系统消息
			var html = '';
			html += '<div class="msg-system">';
			html += user.username;
			html += (action == 'login') ? ' 加入了聊天室' : ' 退出了聊天室';
			html += '</div>';
			var section = d.createElement('section');
			section.className = 'system J-mjrlinkWrap J-cutMsg';
			section.innerHTML = html;
			this.msgObj.appendChild(section);
			this.scrollToBottom();
		},
		//第一个界面用户提交用户名
		usernameSubmit:function(){
			var username = d.getElementById("username").value;
			console.log(username)
			this.init(username);
		},
		loadData:function(obj, type){
			var isme = (obj.sendUID == CHAT.userid) ? true : false;
			var uname = '<p class="uname">'+obj.nickName+'</p>';
			
			var reg=/{:(\w+):}/g;
			var content=obj.msg.replace(reg,'<img src="/images/faces/$1.png" title="$1">');

			var content = '<div>'+content+'</div>';

			var usernameDiv = '<span>'+obj.nickName+'</span>';
			var picDiv = '<span><img style="height:50px;" src="https://www.gold-rush-casino.com/figure/image/face/'+obj.picName+'.png" /></span>';
			var timeSpan = '<p class="msgTime" style="display:inline-block;color:#999;font-size:0.6em;">'+obj.sendTime+'</p>';
			
			var section = d.createElement('section');
			if(isme){
				section.className = 'user';
				//section.innerHTML = usernameDiv+timeSpan+contentDiv+picDiv;
				section.innerHTML = uname+content+timeSpan+picDiv;
			} else {
				section.className = 'service';
				//section.innerHTML = usernameDiv+contentDiv+picDiv+timeSpan;
				section.innerHTML = uname+content+picDiv+timeSpan;
			}
			if(type=='before'){
				$("#message").prepend(section);
			}else{
				CHAT.msgObj.appendChild(section);
				CHAT.scrollToBottom();
			}
		},
		init:function(username){
			/*
			客户端根据时间和随机数生成uid,这样使得聊天室用户名称可以重复。
			实际项目中，如果是需要用户登录，那么直接采用用户的uid来做标识就可以
			*/
			//this.userid = this.genUid();
			this.userid = userid = d.getElementById("userid").value;
			this.username = username;
			this.picName = picname = d.getElementById("picname").value;
			document.cookie="name="+username;
			d.getElementById("showusername").innerHTML = this.username;
			//this.msgObj.style.minHeight = (this.screenheight - db.clientHeight + this.msgObj.clientHeight) + "px";
			this.scrollToBottom();

			//连接websocket后端服务器
			//this.socket = io.connect('ws://realtime.plhwin.com');
			var hostWithPort=d.getElementById("host").value;
			this.socket = io.connect('ws://'+hostWithPort);
			//this.socket = io.connect('ws://192.168.15.105:3000');
			//告诉服务器端有用户登录
			this.socket.emit('login', {userid:this.userid, username:this.username, picName:this.picName});
			
			//监听新用户登录
			this.socket.on('login', function(o){
				//创建session
				CHAT.updateSysMsg(o, 'login');	
			});
			
			//监听用户退出
			this.socket.on('logout', function(o){
				CHAT.updateSysMsg(o, 'logout');
			});

			this.socket.on('loadData'+this.userid,function(o){
				var childs = CHAT.msgObj.childNodes; 
				for(var i = childs.length - 1; i >= 0; i--) { 
				  CHAT.msgObj.removeChild(childs[i]); 
				}
				var result=o.result;
				for(var i in result){
					result[i].sendTime=new Date(result[i].sendTime*1000).toLocaleTimeString();
					CHAT.loadData(result[i]);
				}
			});

			//下拉刷新
			this.socket.on('getDataByPage'+this.userid,function(o){
				var result=o.result;
				var len=result.length;
				for(var i=len-1;i>=0;i--){
					result[i].sendTime=new Date(result[i].sendTime*1000).toLocaleTimeString();
					CHAT.loadData(result[i], 'before');
				}
				if(len<$("#itemsPerPage").val() || len==0){
					//说明已经加载到了最后一条 需要提示 已经没有更多数据
					$.setDestroy(true);
				}
				$.reset();
			});

			//发的内容跟3分钟内发布内容有重复
			this.socket.on('contentRepeat'+this.userid,function(){
				//$("#popContent").html("3分鐘內容不能發佈重複內容！");
				$("#popContent").html("抱歉 操作錯誤");
				$("#popup,#mask").show();
				$("#content,#faceIcon,#faceList,.action").removeClass("top").addClass("btm");
				$("#mask").height($(document).height());
				return;
			});

			//监听消息发送
			this.socket.on('message', function(obj){
				var isme = (obj.userid == CHAT.userid) ? true : false;
				var uname = '<p class="uname">'+obj.username+'</p>';
				/*var content = '<div>'+obj.content+'</div>';*/
				var reg=/{:(\w+):}/g;
				//var reg = /<img src="\/(\w+)\/(\w+)\/(\w+)\.png" title="(\w+)">/;
				var content=obj.content.replace(reg,'<img src="/images/faces/$1.png" title="$1">');

				var content = '<div>'+content+'</div>';
				var usernameDiv = '<span>'+obj.username+'</span>';
				//var picDiv = '<span><img style="height:36px;" src="https://www.gold-rush-casino.com/figure/image/face/'+obj.sendPicName+'.png" /></span>';
				var picDiv = '<span><img style="height:50px;" src="https://www.gold-rush-casino.com/figure/image/face/'+obj.picName+'.png" /></span>';
				var timeSpan = '<p class="msgTime" style="display:inline-block;color:#999;font-size:0.6em;">'+new Date().toLocaleTimeString()+'</p>';
				
				var section = d.createElement('section');
				if(isme){
					section.className = 'user';
					section.innerHTML = uname+content+timeSpan+picDiv;
				} else {
					section.className = 'service';
					section.innerHTML = uname+content+picDiv+timeSpan;
				}
				CHAT.msgObj.appendChild(section);
				CHAT.scrollToBottom();	
			});

			 this.socket.on('disconnect',function(object){
				//this.socket.on('connect',function(){
				this.on('connect',function(){
					this.emit('login', {userid:userid, username:username, picName:picname, reconn:'reconn'});
					//this.emit('login', {userid:userid, username:username, reconn:'reconn'});
				})
			});

		}
	};
	//通过“回车”提交信息
	//现在回车需要换行
	d.getElementById("content").onkeydown = function(e) {
		e = e || event;
		if (e.keyCode === 13) {
			//禁止回车换行
			e.cancelBubble=true;
			e.preventDefault();
			e.stopPropagation();
			//CHAT.submit();
		}
	};
	
	if(isAndroid){
		$("#content p").focus(function(){
			setTimeout(function(){
				$("#faceList").hide();
				$("#content,#faceIcon,#faceList,.action").removeClass("btm").addClass("top");
				$("#mask").show();
				$("#mask").height($(document).height());
			},200);
		})

		$("#mask").click(function(){
			$("#content").removeClass("contentTop").addClass("contentBtm");
			$("#content,#faceIcon,#faceList,.action").removeClass("top").addClass("btm");
			$("#mask").hide();
		});
	}
	String.prototype.stripHTML = function() {
        var reTag = /<(?:.|\s)*?>/g;  
        return this.replace(reTag,"");  
    }

	$("#content").on('paste', function(e){
		var lenOld=$("#content p").html().length;
		var contentOld=$("#content p").html();
		var lenNew=0;
		
	    var sTest = "<b>this would be bold</b><img src='a.jpg' />";  
		setTimeout(function(){
			lenNew=$("#content p").html().length;
			var contentNew=$("#content p").html().substring(lenOld).stripHTML();
			console.log(contentOld+contentNew);
			$("#content p").html('').html(contentOld+contentNew).focus();
		},200);

	})

	CHAT.usernameSubmit();	
})();
