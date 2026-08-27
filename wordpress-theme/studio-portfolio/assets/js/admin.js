(function ($) {
  'use strict';

  var frame;

  function updateGalleryInput() {
    var ids = [];
    $('#studio-gallery-preview li').each(function () {
      ids.push($(this).data('id'));
    });
    $('#portfolio_gallery').val(ids.join(','));
  }

  $('#studio-upload-gallery').on('click', function (e) {
    e.preventDefault();

    if (frame) {
      frame.open();
      return;
    }

    frame = wp.media({
      title: 'Select Portfolio Images',
      button: { text: 'Add to Gallery' },
      multiple: true,
      library: { type: 'image' }
    });

    frame.on('select', function () {
      var selection = frame.state().get('selection');
      selection.each(function (attachment) {
        attachment = attachment.toJSON();
        var exists = $('#studio-gallery-preview li[data-id="' + attachment.id + '"]').length;
        if (exists) return;

        var thumb = attachment.sizes && attachment.sizes.thumbnail
          ? attachment.sizes.thumbnail.url
          : attachment.url;

        var $li = $('<li>').attr('data-id', attachment.id).html(
          '<img src="' + thumb + '" alt="" />' +
          '<button type="button" class="studio-remove-image" title="Remove">&times;</button>'
        );
        $('#studio-gallery-preview').append($li);
      });
      updateGalleryInput();
    });

    frame.open();
  });

  $(document).on('click', '.studio-remove-image', function () {
    $(this).closest('li').remove();
    updateGalleryInput();
  });

  $('#studio-gallery-preview').sortable({
    update: updateGalleryInput
  });
})(jQuery);
