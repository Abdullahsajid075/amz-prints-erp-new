/**
 * Live preview bindings for WordPress Customizer
 */
(function ($) {
  'use strict';

  var bind = function (setting, selector, prop) {
    wp.customize(setting, function (value) {
      value.bind(function (newval) {
        var $el = $(selector);
        if (!$el.length) return;
        if (prop === 'html') {
          $el.html(newval);
        } else if (prop === 'text') {
          $el.text(newval);
        } else {
          $el.text(newval);
        }
      });
    });
  };

  bind('studio_hero_title_line1', '.hero-title-line1', 'text');
  bind('studio_hero_title_line2', '.hero-title-line2', 'text');
  bind('studio_hero_title_line3', '.hero-title-line3', 'text');
  bind('studio_hero_description', '.hero-desc', 'text');
  bind('studio_about_title', '.about-title', 'text');
  bind('studio_contact_title', '.contact-title', 'text');
})(jQuery);
