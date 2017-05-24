$('#compress').slider({
  formatter: function (value) {
    return 'Current value: ' + value;
  }
});

function updateImageUrl() {
  var values = $('#configure-form').serialize();
  $('#result-image').attr('src', '/image?' + values);
}

$(document).ready(function () {
  $('#configure-form').submit(function (e) {
    e.preventDefault();
    updateImageUrl();
  });

  $('#update-button').click(function (e) {
    e.preventDefault();
    updateImageUrl();
  });

  var handle = $("#custom-compress-slider-handle");
  $("#compress-slider").slider({
    value: 1,
    step: 5,
    min: 0,
    max: 100,
    value: 80,
    slide: function (event, ui) {
      $("#compress").val(ui.value);
      handle.text(ui.value);
    },
    create: function () {
      handle.text($(this).slider("value"));
      $("#compress").val($(this).slider("value"));
    }
  });

});
