//提供增删改操作的sql语句
//登陆的时候就往chatLastRec中插入记录，所以后面updateLastRead就只需要update就可以，无需insert
var limit=10;
var days=10;//保留多少天以前的数据
var UserSQL = {
	//insertUser:'INSERT INTO chatUsers (userID,nickName,picName) VALUES (?,?,?)',//用户上线后添加数据，如果已经存在，就修改onLine=1
	//用户上线后添加数据，如果已经存在，就修改onLine=1
	addUser:'REPLACE INTO chatLastRec SET userID=?,lastMsgID=?,updateTime=unix_timestamp(now()),onLine=?,nickName=?,picName=?',//某个上线时候用
	updateLastRead:'UPDATE chatLastRec SET lastMsgID=?,updateTime=unix_timestamp(now()) WHERE onLine=1',//有新消息时候用，更新所有在线用户的lastMsgID
	setLogout:'UPDATE chatLastRec SET onLine=0 WHERE userID=?',//某用户退出的时候用

	insertChat:'INSERT INTO chatRec(sendUID,sendPicName,sendNick,receiveUID,receivePicName,receiveNick,msg,sendTime,plat,lang) VALUES(?,?,?,?,?,?,?,unix_timestamp(now()),?,?)',//有新消息的时候用户
	queryChats:'SELECT t.*,i.nickName,i.picName FROM (SELECT sendUID,sendNick,msg,sendTime,sendPicName FROM chatRec WHERE plat=? AND lang=? AND sendTime>unix_timestamp(now())-3600*24*'+days+' ORDER BY sendTime DESC LIMIT ?,?) t,chatLastRec i WHERE i.userID=t.sendUID ORDER BY t.sendTime ASC',//某平台、某语言、24小时之内留言  
	getLastMsgID:'SELECT id AS lastMsgID FROM chatRec ORDER BY id DESC LIMIT 1',//最新的一条消息的ID
	getUsrLastMsgID:'SELECT lastMsgID FROM chatLastRec WHERE userID=?',//某用户读取过的最后的一条消息的ID
	//getUserById:'SELECT * FROM User WHERE uid = ? ',
};
module.exports = UserSQL;

//登录后 chatLastRec(修改lastMsgID=最后一条值getLastMsgID，onLine=1)
//有新消息 修改chatLastRec -->updateLastRead, chatRec添加数据-->insertChat
//用户退出 修改最后一条读的消息 chatLastRec set onLine=0
//每隔5分钟 或者 退出时 记录最后一条读的msgID