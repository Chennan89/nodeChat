<?php
	header("Access-Control-Allow-Origin: http://192.168.15.105:3000");
	//一些其他业务逻辑处理，比如如果需求是用户需要金币才能发言，要查查用户金币是否充足
	echo json_encode(array('code'=>200));
	