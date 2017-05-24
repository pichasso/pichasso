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

  var handle = $("#custom-quality-slider-handle");
  $("#quality-slider").slider({
    value: 1,
    step: 5,
    min: 0,
    max: 100,
    value: 80,
    slide: function (event, ui) {
      $("#quality").val(ui.value);
      handle.text(ui.value);
    },
    create: function () {
      handle.text($(this).slider("value"));
      $("#quality").val($(this).slider("value"));
    }
  });

});
