# nodeChat
一个Node+Express+socket.io+MySQL实现的实时聊天程序

socket.io官网简介：
>Socket.IO FEATURING THE FASTEST AND MOST RELIABLE REAL-TIME ENGINE；enables real-time bidirectional event-based communication.
It works on every platform, browser or device, focusing equally on reliability and speed.
它兼容不支持webSocket的低版本浏览器（使用长轮询）

因为聊天程序可能会有很高的并发量，必要时候要用Redis进行存储

PHP部分可以实现其他逻辑控制，比如：如果要求用户需要付费发言等可以进行相应控制
