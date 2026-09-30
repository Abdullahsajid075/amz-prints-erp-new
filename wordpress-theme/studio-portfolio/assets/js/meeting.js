/**
 * Schedule Meeting — send form to WhatsApp
 */
(function () {
  'use strict';

  var form = document.getElementById('studio-meeting-form');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var whatsapp = document.getElementById('schedule_whatsapp');
    var number = whatsapp ? whatsapp.value.replace(/\D+/g, '') : '923471136415';
    if (!number) return;

    var name = form.querySelector('[name="name"]').value.trim();
    var email = form.querySelector('[name="email"]').value.trim();
    var phone = form.querySelector('[name="phone"]').value.trim();
    var date = form.querySelector('[name="date"]').value;
    var time = form.querySelector('[name="time"]').value;
    var platform = form.querySelector('[name="platform"]').value;
    var message = form.querySelector('[name="message"]').value.trim();

    if (!name || !email || !phone || !date || !time || !platform || !message) {
      alert('Please fill in all required fields.');
      return;
    }

    var text = [
      '*New Meeting Request*',
      '',
      '*Name:* ' + name,
      '*Email:* ' + email,
      '*Phone:* ' + phone,
      '*Date:* ' + date,
      '*Time:* ' + time,
      '*Platform:* ' + platform,
      '',
      '*Message:*',
      message
    ].join('\n');

    var url = 'https://wa.me/' + number + '?text=' + encodeURIComponent(text);
    window.open(url, '_blank');

    var success = document.getElementById('schedule-form-success');
    if (success) {
      success.style.display = 'block';
    }
  });
})();
