(function ($) {
  'use strict';

  var galleryFrame;
  var pdfFrame;

  function updateGalleryInput() {
    var ids = [];
    $('#studio-gallery-preview li').each(function () {
      ids.push($(this).data('id'));
    });
    $('#portfolio_gallery').val(ids.join(','));
  }

  $('#studio-upload-gallery').on('click', function (e) {
    e.preventDefault();

    if (galleryFrame) {
      galleryFrame.open();
      return;
    }

    galleryFrame = wp.media({
      title: 'Select Portfolio Images',
      button: { text: 'Add to Gallery' },
      multiple: true,
      library: { type: 'image' }
    });

    galleryFrame.on('select', function () {
      var selection = galleryFrame.state().get('selection');
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

    galleryFrame.open();
  });

  $(document).on('click', '.studio-remove-image', function () {
    $(this).closest('li').remove();
    updateGalleryInput();
  });

  $('#studio-gallery-preview').sortable({
    update: updateGalleryInput
  });

  /* PDF upload */
  $('#studio-upload-pdf').on('click', function (e) {
    e.preventDefault();

    if (pdfFrame) {
      pdfFrame.open();
      return;
    }

    pdfFrame = wp.media({
      title: 'Upload Project PDF',
      button: { text: 'Use this PDF' },
      multiple: false,
      library: { type: 'application/pdf' }
    });

    pdfFrame.on('select', function () {
      var attachment = pdfFrame.state().get('selection').first().toJSON();
      $('#portfolio_pdf').val(attachment.id);
      $('#studio-pdf-preview').html(
        '<a href="' + attachment.url + '" target="_blank" rel="noopener">' + attachment.filename + '</a> ' +
        '<button type="button" class="button studio-remove-pdf">Remove PDF</button>'
      );
    });

    pdfFrame.open();
  });

  $(document).on('click', '.studio-remove-pdf', function (e) {
    e.preventDefault();
    $('#portfolio_pdf').val('');
    $('#studio-pdf-preview').empty();
  });

  /* PDF cover thumbnail */
  var pdfCoverFrame;

  $('#studio-upload-pdf-cover').on('click', function (e) {
    e.preventDefault();

    if (pdfCoverFrame) {
      pdfCoverFrame.open();
      return;
    }

    pdfCoverFrame = wp.media({
      title: 'Upload PDF Preview Thumbnail',
      button: { text: 'Use this image' },
      multiple: false,
      library: { type: 'image' }
    });

    pdfCoverFrame.on('select', function () {
      var attachment = pdfCoverFrame.state().get('selection').first().toJSON();
      var thumb = attachment.sizes && attachment.sizes.medium
        ? attachment.sizes.medium.url
        : attachment.url;

      $('#portfolio_pdf_cover').val(attachment.id);
      $('#studio-pdf-cover-preview').html(
        '<img src="' + thumb + '" alt="" style="max-width:160px;height:auto;display:block;margin-bottom:8px;" />' +
        '<button type="button" class="button studio-remove-pdf-cover">Remove Thumbnail</button>'
      );
    });

    pdfCoverFrame.open();
  });

  $(document).on('click', '.studio-remove-pdf-cover', function (e) {
    e.preventDefault();
    $('#portfolio_pdf_cover').val('');
    $('#studio-pdf-cover-preview').empty();
  });
})(jQuery);
