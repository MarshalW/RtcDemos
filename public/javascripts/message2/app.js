require.config({
    paths: {
        jquery: '/bower_components/jquery/dist/jquery.min',
        'socket.io':'/socket.io/socket.io',
        'easyrtc':'/easyrtc/easyrtc',
        can: '/bower_components/canjs/amd/can',
        // 'can.Map.delegate':'/bower_components/canjs/amd/can/map/delegate',
        'can.fixture': '/bower_components/canjs/amd/can/util/fixture',
        'can.ejs': '/bower_components/canjs/amd/can/view/ejs'
    }
});

require(['can.ejs','can','socket.io','easyrtc'], function () {
	easyrtc.enableDebug(false);
    easyrtc.enableDataChannels(true);
    easyrtc.enableVideo(false);
    easyrtc.enableAudio(false);
    easyrtc.enableVideoReceive(false);
    easyrtc.enableAudioReceive(false);

    easyrtc.setDataChannelOpenListener(function(otherCid){
    	// console.log('data channel opened, otherCid: '+otherCid);
    	$('#'+otherCid+' button').first().text('挂断');
    	chatItemsMap.attr(otherCid,{});
    });

    easyrtc.setDataChannelCloseListener(function(otherCid){
		$('#'+otherCid+' button').first().text('呼叫');
		var widget=chatItemsMap.attr(otherCid);
		if(widget.element){
			widget.element.empty();	
		}
		widget.destroy();	
		chatItemsMap.removeAttr(otherCid);
    });

    easyrtc.setPeerListener(function(who, msgType, content){
    	// console.log('who: '+who+' , '+content);
    	var chatItems=chatItemsMap.attr(who).chatItems;
    	chatItems.push({who:who,message:content})
    });

    easyrtc.setRoomOccupantListener(
    	function(roomName, occupantList, isPrimary){
    		occupantListWidget.options.occupants=occupantList;
    		occupantListWidget.render();
    	}
	);

	var myCid;

    easyrtc.connect("easyrtc.dataMessaging", 
    	function(cid){
    		console.log('connect success, cid: '+cid);
    		$('#myCid').html(cid);
    		myCid=cid;
    	}, 
    	function(){
    		console.log('connect failure.');
    });

	var chatItemsMap=new  can.Map();

	var OccupantChatWidget=can.Control({
		init:function(){
			this.render();
			this.chatItems=new can.List();
			var self=this;
			this.chatItems.bind('change',function(event, attr, how, newVal, oldVal){
				// console.log('>>>list, how: '+how);
				if(how=='add'){
					var who='我';
					if(newVal[0].who!=myCid){
						who=newVal[0].who;
					}
					$('#chat_messages_'+self.options.cid).append('<div>'+who+ ':&nbsp;&nbsp;'+newVal[0].message+'</div>');
				}
			});
		},
		render:function(){
			this.element.html(
				can.view('../../views/occupant_chat.ejs', {cid:this.options.cid})
				);
		},
		'button click':function(el){
			// console.log('to cid: '+this.options.cid);
			this.sendMessage();
		},
		'input keyup':function(el, event){
			if(event.keyCode==13){
				// console.log('>>>>>>key enter');	
				this.sendMessage();
			}
		},
		sendMessage:function(){
			var messageEl=$('#chat_input_'+this.options.cid);
			easyrtc.sendDataP2P(this.options.cid, 'msg', messageEl.val());
			this.chatItems.push({message:messageEl.val(),who:myCid});
			messageEl.val('');
		}
	});

	var OccupantListWidget=can.Control({
		init: function () {
			chatItemsMap.bind('change',function(event, attr, how, newVal, oldVal){
				if(how=='add'){
					var chatWidget=new OccupantChatWidget('#'+attr+'_chat',{cid:attr});
					chatItemsMap.attr(attr, chatWidget);
				}else if(how=='remove'){
					// $('#'+attr+'_chat').empty();
				}
			});
		},
		render:function(){
			this.element.html(
				can.view('../../views/occupants.ejs', this.options.occupants)
				);
		},
		'button click':function(el){
			var cid=el.parent().attr('id');
			if(el.text()=='呼叫'){
				easyrtc.call(cid,
				    function(caller, media) { // success callback
				    },
				    function(errText) {
				      console.log('call error: '+errText);  
				    },
				    function(wasAccepted) {
				    	// console.log('call accept: '+wasAccepted);
				    }
				);
			}else{
				easyrtc.hangup(cid);
			}
		}

	});

	var occupantListWidget=new OccupantListWidget('#otherCids',{occupants:{}});

});