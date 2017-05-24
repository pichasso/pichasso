$('#compress').slider({
  formatter: function (value) {
    return 'Current value: ' + value;
  }
});

function updateImageUrl() {
  var values = $('#configure-form').serialize();
  console.log(values);
  $('#result-image').attr('src', '/image?' + values);
}

$(document).ready(function(){
  $('#configure-form').submit(function (e) {
    e.preventDefault();
    updateImageUrl();
  });

  $('#update-button').click(function (e) {
    e.preventDefault();
    updateImageUrl();
  });
});
