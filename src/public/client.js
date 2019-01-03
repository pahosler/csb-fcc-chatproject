// var currentUsers = 0
$(document).ready(function() {
  /*global io*/
  var socket = io()
  socket.on('user count', data => {
    // console.log(data + ' users')
  })
  socket.on('user', function(data) {
    $('#num-users').text(data.currentUsers + ' users online')
    var message = data.name
    if (data.connected) {
      message += ' has joined the chat.'
    } else {
      message += ' has left the chat.'
    }
    $('#messages').append($('<li>').html('<b>' + message + '</b>'))
  })

  // Form submittion with new message in field with id 'm'
  $('form').submit(function() {
    var messageToSend = $('#m').val()
    //send message to server here?
    socket.emit('chat message', messageToSend)
    $('#messages').val('')
    $('#m').val('')
    return false // prevent form submit from refreshing page
  })

  socket.on('chat message', function(msg) {
    let div = $('#messages')
    // console.log(msg)
    $('#messages').append($('<li>').html(msg))
    div.scrollTop(div.prop('scrollHeight'))
  })
})
