var ws = new WebSocket('ws://localhost:8888', 'echo-protocol');
function sendMessage(){
    var message = document.getElementById('message').value;
    ws.send(message);
}
ws.addEventListener("message", function(e) {
    // The data is simply the message that we're sending back
    var msgString = e.data;
    var msgData = JSON.parse(e.data);
    // Append the message
    console.log(msgData);
    if (msgData[0] === "_USER__DATA__") {
      initList(msgData);
      //get data for user and pass back to client
    }
    else {
      document.getElementById('chatlog').innerHTML += '<br>' + msgString;
    }
});

var waitForConnection = function (interval, callback) {
    if (ws.readyState === 1) {
        callback();
    } else {
        setTimeout(function () {
            waitForConnection(interval,callback);
        }, interval);
    }
};


var sendIt = function() {
  ws.send("__GET__USER__DATA__marc.g.underwood@gmail.com");
}


var initList = function(userData) {
  $("#t1").text(userData[1].title);
  var d = new Date(userData[1].eventTime);
  $("#timer1").countdown(d, function(event) {
    $(this).text(
      event.strftime('%D days %H:%M:%S')
    );
  });
  $("#like1").data(userData[1]);
  $("#like1").on('click', function(){
    // console.log($("#like1").data("_id"));
    $("#like1").css("display", "none");
    strMsg = "__LIKE__" + $("#like1").data("_id")
    console.log(strMsg);
    ws.send(strMsg);
  });


  $("#t2").text(userData[2].title);
  var d = new Date(userData[2].eventTime);

  $("#timer2").countdown(d, function(event) {
    $(this).text(
      event.strftime('%D days %H:%M:%S')
    );
  });
  $("#like2").data(userData[2]);
  $("#like2").on('click', function(){
    $("#like2").css("display", "none");
    // console.log($("#like1").data("_id"));
    strMsg = "__LIKE__" + $("#like2").data("_id")
    console.log(strMsg);
    ws.send(strMsg);
  });

  $("#t3").text(userData[3].title);
  var d = new Date(userData[3].eventTime);
  $("#timer3").countdown(d, function(event) {
    $(this).text(
      event.strftime('%D days %H:%M:%S')
    );
  });
  $("#like3").data(userData[3]);
  $("#like3").on('click', function(){
    $("#like3").css("display", "none");

    // console.log($("#like1").data("_id"));
    strMsg = "__LIKE__" + $("#like3").data("_id")
    console.log(strMsg);
    ws.send(strMsg);
  });

  $("#t4").text(userData[4].title);
  var d = new Date(userData[4].eventTime);
  $("#timer4").countdown(d, function(event) {
    $(this).text(
      event.strftime('%D days %H:%M:%S')
    );
  });
  $("#like4").data(userData[4]);
  $("#like4").on('click', function(){
    $("#like4").css("display", "none");

    // console.log($("#like1").data("_id"));
    strMsg = "__LIKE__" + $("#like4").data("_id")
    console.log(strMsg);
    ws.send(strMsg);
  });

  $("#t5").text(userData[5].title);
  var d = new Date(userData[5].eventTime);
  $("#timer5").countdown(d, function(event) {
    $(this).text(
      event.strftime('%D days %H:%M:%S')
    );
  });
  $("#like5").data(userData[5]);
  $("#like5").on('click', function(){
    $("#like5").css("display", "none");

    // console.log($("#like1").data("_id"));
    strMsg = "__LIKE__" + $("#like5").data("_id")
    console.log(strMsg);
    ws.send(strMsg);
  });


}


$(document).ready(function() {
  $(".mainC").hide().fadeIn( 3000);
  $("#eventForm").css("display", "none");

  waitForConnection(100, sendIt);
  $('#eventTime').datetimepicker({dateFormat: 'yy-mm-dd',timeFormat: 'hh:mm tt z'});
});




function handleSubmit() {
      var data = new FormData();
      data.append('email',document.formSubmit.email.value );
      data.append('passWord',document.formSubmit.passWord.value );
      // document.getElementById("sent").innerHTML = jsonString;
      document.getElementById("results").innerHTML = "";
      $.ajax({
        url: '/login',
        data:data,
        cache:false,
        processData:false,
        contentType:false,
        type:'POST',
        success:function (data, status, req) {
            console.log("Logged in");
            $("#loginForm").css("display", "none");
            $("#eventForm").show();

            $("#loginStatus").text("logged in as: "+document.formSubmit.email.value);

            // handleResults(req);
        },
        error:function (req, status, error) {
            console.log("not logged in");
            // handleResults(req);
        }
    });
  }

  function handleNewEvent() {
        var data = new FormData();
        data.append('title',document.eventForm.title.value );
        data.append('description',document.eventForm.description.value );
        data.append('eventTime',document.eventForm.eventTime.value );
        console.log($("#loginStatus").text());
        var tmp =$("#loginStatus").text();
        tmp = tmp.slice("logged in as: ".length);
        data.append('email',tmp);
        $.ajax({
          url: '/newEvent',
          data:data,
          cache:false,
          processData:false,
          contentType:false,
          type:'POST',
          success:function (data, status, req) {
            if ( status >= 200 && status < 300 || status === 304 ) {
              $("#title").val('');
              $("#description").val('');
              $("#eventTime").val('');
            }

              // handleResults(req);
          },
          error:function (req, status, error) {
              // handleResults(req);
          }
      });
    }
