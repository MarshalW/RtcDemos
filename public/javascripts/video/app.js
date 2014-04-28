require.config({
    paths: {
        jquery: '/bower_components/jquery/dist/jquery.min',
        'socket.io':'/socket.io/socket.io',
        'easyrtc':'/easyrtc/easyrtc',
        can: '/bower_components/canjs/amd/can',
        'can.fixture': '/bower_components/canjs/amd/can/util/fixture',
        'can.ejs': '/bower_components/canjs/amd/can/view/ejs'
    }
});



require(['can.ejs','can','socket.io','easyrtc'], function () {

	$('#callButton').attr('disabled',true);
	$('#callButton').on('click',function(){
		easyrtc.hangupAll();
		var successCB = function() {};
    	var failureCB = function() {};
    	easyrtc.call(otherCid, successCB, failureCB);
	});
	var isCall=false;
	var otherCid='';

	easyrtc.setRoomOccupantListener(function(roomName, data, isPrimary){
		for(var easyrtcid in data) {
			$('#callButton').attr('disabled',false);
			otherCid=easyrtcid;
			break;
		}
	});

	easyrtc.easyApp("easyrtc.audioVideo", "selfVideo", ["callerVideo"], 
		function(){
		}, 
		function(){
		});


});