/**
 * Free CV Builder — live A4 preview, templates, colours, print/download
 */
(function () {
  'use strict';

  var root = document.querySelector('[data-cv-root]');
  if (!root) return;

  var STORAGE = 'amz_cv_builder_v1';
  var COLORS = ['#0747a3', '#ff6d00', '#0a2540', '#111111', '#7f1d1d', '#0f766e', '#4338ca', '#b45309'];
  var TEMPLATES = [
    { id: 'classic', name: 'Classic', blurb: 'Sidebar layout' },
    { id: 'modern', name: 'Modern', blurb: 'Bold header' },
    { id: 'elegant', name: 'Elegant', blurb: 'Centered serif' },
    { id: 'executive', name: 'Executive', blurb: 'Accent bar' },
    { id: 'minimal', name: 'Minimal', blurb: 'Clean single column' },
    { id: 'creative', name: 'Creative', blurb: 'Photo band' }
  ];
  var SIDE_SECTIONS = {
    classic: ['skills', 'professionalSkills', 'technicalSkills', 'languages', 'hobbies', 'links'],
    modern: [],
    elegant: [],
    executive: [],
    minimal: [],
    creative: ['skills', 'languages']
  };

  var SECTIONS = [
    { id: 'photo', label: 'Profile Picture', type: 'photo', on: true },
    { id: 'personal', label: 'Personal Information', type: 'personal', on: true, locked: true },
    { id: 'summary', label: 'Professional Summary', type: 'text', on: true, placeholder: 'A short career overview (3–5 lines).' },
    { id: 'contact', label: 'Contact Information', type: 'contact', on: true },
    { id: 'experience', label: 'Work Experience', type: 'job', on: true },
    { id: 'education', label: 'Education', type: 'edu', on: true },
    { id: 'skills', label: 'Skills', type: 'chips', on: true },
    { id: 'professionalSkills', label: 'Professional Skills', type: 'chips', on: false },
    { id: 'technicalSkills', label: 'Technical Skills', type: 'chips', on: false },
    { id: 'certifications', label: 'Certifications', type: 'simple', on: false, fields: ['title', 'issuer', 'year'] },
    { id: 'courses', label: 'Courses & Training', type: 'simple', on: false, fields: ['title', 'issuer', 'year'] },
    { id: 'projects', label: 'Projects', type: 'project', on: false },
    { id: 'internships', label: 'Internships', type: 'job', on: false },
    { id: 'languages', label: 'Languages', type: 'lang', on: false },
    { id: 'awards', label: 'Awards & Achievements', type: 'simple', on: false, fields: ['title', 'issuer', 'year'] },
    { id: 'publications', label: 'Publications', type: 'simple', on: false, fields: ['title', 'issuer', 'year'] },
    { id: 'volunteer', label: 'Volunteer Experience', type: 'job', on: false },
    { id: 'references', label: 'References', type: 'ref', on: false },
    { id: 'hobbies', label: 'Hobbies & Interests', type: 'text', on: false, placeholder: 'Photography, cricket, community work…' },
    { id: 'links', label: 'Social / Professional Links', type: 'link', on: false },
    { id: 'custom', label: 'Custom Section', type: 'custom', on: false }
  ];

  function emptyJob() {
    return { title: '', org: '', place: '', start: '', end: '', current: false, details: '' };
  }
  function emptyEdu() {
    return { title: '', org: '', place: '', start: '', end: '', details: '' };
  }
  function emptySimple() {
    return { title: '', issuer: '', year: '' };
  }

  function defaultState() {
    var enabled = {};
    SECTIONS.forEach(function (s) { enabled[s.id] = s.on; });
    return {
      template: 'classic',
      color: '#0747a3',
      photo: '',
      enabled: enabled,
      personal: { fullName: '', title: '', location: '', nationality: '' },
      summary: '',
      hobbies: '',
      contact: { email: '', phone: '', address: '', city: '', website: '' },
      experience: [emptyJob()],
      internships: [emptyJob()],
      volunteer: [emptyJob()],
      education: [emptyEdu()],
      skills: '',
      professionalSkills: '',
      technicalSkills: '',
      certifications: [emptySimple()],
      courses: [emptySimple()],
      awards: [emptySimple()],
      publications: [emptySimple()],
      projects: [{ title: '', org: '', year: '', details: '' }],
      languages: [{ name: '', level: 'Fluent' }],
      references: [{ name: '', title: '', org: '', phone: '', email: '' }],
      links: [{ label: '', url: '' }],
      custom: [{ title: '', body: '' }]
    };
  }

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function lines(text) {
    return String(text || '').split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean);
  }
  function chips(text) {
    return String(text || '').split(/[,|\n]/).map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function applySaved(saved) {
    if (!saved || typeof saved !== 'object') return;
    state = Object.assign(defaultState(), saved);
    state.enabled = Object.assign(defaultState().enabled, saved.enabled || {});
    state.personal = Object.assign(defaultState().personal, saved.personal || {});
    state.contact = Object.assign(defaultState().contact, saved.contact || {});
    if (saved.photo) state.photo = saved.photo;
  }

  var state = defaultState();
  try {
    applySaved(JSON.parse(localStorage.getItem(STORAGE) || 'null'));
  } catch (e) { /* ignore */ }
  try {
    var savedNode = document.getElementById('amz-cv-saved');
    if (savedNode && savedNode.textContent) applySaved(JSON.parse(savedNode.textContent));
  } catch (eSaved) { /* ignore */ }

  var editor = document.getElementById('cv-editor');
  var pagesHost = document.getElementById('cv-pages');
  var scaleEl = document.getElementById('cv-scale');
  var pageCountEl = document.querySelector('[data-cv-pagecount]');

  var allowServer = false;
  var saveTimer = null;
  var pendingPhoto = null;
  var pendingPhotoUrl = '';
  var photoSeq = 0;
  var photoRemoved = false;

  function httpPhoto(value) {
    return value && /^https?:\/\//i.test(value) ? value : '';
  }

  function releasePendingPhoto() {
    if (pendingPhotoUrl) {
      try { URL.revokeObjectURL(pendingPhotoUrl); } catch (err) { /* ignore */ }
    }
    pendingPhoto = null;
    pendingPhotoUrl = '';
  }

  function save() {
    try {
      var copy = JSON.parse(JSON.stringify(state));
      copy.photo = httpPhoto(state.photo);
      localStorage.setItem(STORAGE, JSON.stringify(copy));
      localStorage.removeItem(STORAGE + '_photo');
    } catch (e) { /* quota */ }
    if (allowServer) scheduleServerSave(false);
  }

  function setStatus(text) {
    var el = document.querySelector('[data-cv-status]');
    if (el) el.textContent = text;
  }

  function pagesHtml() {
    var html = '';
    if (!pagesHost) return html;
    Array.prototype.forEach.call(pagesHost.querySelectorAll('.cv-page'), function (page) {
      html += page.outerHTML;
    });
    return html.replace(/\ssrc="(?:blob:|data:)[^"]*"/g, ' src=""');
  }

  function scheduleServerSave(immediate) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { pushServer(false); }, immediate ? 0 : 900);
  }

  function pushServer(clearing) {
    if (!window.amzCv || !amzCv.ajaxUrl) return Promise.resolve(false);
    setStatus(clearing ? 'Clearing…' : 'Saving…');
    var seq = photoSeq;
    var payload = JSON.parse(JSON.stringify(state));
    payload.photo = httpPhoto(state.photo);
    var body = new FormData();
    body.append('action', 'amz_prints_save_cv');
    body.append('nonce', amzCv.nonce || '');
    body.append('state', JSON.stringify(payload));
    body.append('html', clearing ? '' : pagesHtml());
    if (clearing) body.append('clear', '1');
    if (!clearing && photoRemoved) body.append('remove_photo', '1');
    if (!clearing && pendingPhoto) body.append('photo', pendingPhoto, 'cv-photo.jpg');
    return fetch(amzCv.ajaxUrl, { method: 'POST', credentials: 'same-origin', body: body })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (seq !== photoSeq) return false;
        if (res && res.success) {
          if (!clearing && photoRemoved) {
            photoRemoved = false;
            releasePendingPhoto();
            state.photo = '';
          } else if (!clearing && res.data && res.data.photoUrl && (pendingPhoto || !httpPhoto(state.photo))) {
            releasePendingPhoto();
            state.photo = res.data.photoUrl;
            renderForm();
            renderPreview();
          }
          if (!clearing) photoRemoved = false;
          if (!clearing && res.data && res.data.photoUrl && httpPhoto(state.photo)) {
            try {
              var copy = JSON.parse(JSON.stringify(state));
              copy.photo = state.photo;
              localStorage.setItem(STORAGE, JSON.stringify(copy));
              localStorage.removeItem(STORAGE + '_photo');
            } catch (err) { /* ignore */ }
          }
          setStatus(clearing ? 'Cleared' : 'Saved on your account');
          return true;
        }
        setStatus((res && res.data && res.data.message) ? res.data.message : 'Could not save');
        return false;
      })
      .catch(function () {
        setStatus('Could not save the photo. Try again.');
        return false;
      });
  }
  try {
    var ph = localStorage.getItem(STORAGE + '_photo');
    if (ph && !state.photo) state.photo = ph;
  } catch (e2) { /* ignore */ }

  function val(path, value) {
    var parts = path.split('.');
    var cur = state;
    for (var i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
    var last = parts[parts.length - 1];
    if (arguments.length === 1) return cur[last];
    cur[last] = value;
    save();
    renderPreview();
  }

  function input(path, label, type, extra) {
    type = type || 'text';
    extra = extra || '';
    return '<label class="cv-field"><span>' + esc(label) + '</span><input type="' + type + '" data-path="' + esc(path) + '" value="' + esc(val(path) || '') + '" ' + extra + '></label>';
  }
  function area(path, label, ph) {
    return '<label class="cv-field"><span>' + esc(label) + '</span><textarea data-path="' + esc(path) + '" placeholder="' + esc(ph || '') + '">' + esc(val(path) || '') + '</textarea></label>';
  }

  function sectionHead(def) {
    var tog = def.locked
      ? '<span class="cv-toggle">Always on</span>'
      : '<label class="cv-toggle"><input type="checkbox" data-enable="' + def.id + '"' + (state.enabled[def.id] ? ' checked' : '') + '> ' + (def.id === 'photo' ? 'Show on CV' : 'Include') + '</label>';
    return '<div class="cv-editor-head"><h3>' + esc(def.label) + '</h3>' + tog + '</div>';
  }

  function itemChrome(list, idx, label) {
    return '<div class="cv-item" data-list="' + list + '" data-idx="' + idx + '"><div class="cv-item__top"><span>' + esc(label) + ' ' + (idx + 1) + '</span>' +
      (state[list].length > 1 ? '<button type="button" class="cv-linkish cv-linkish--danger" data-remove-item="' + list + ':' + idx + '">Remove</button>' : '') +
      '</div>';
  }

  function renderForm() {
    var html = '';
    html += '<div class="cv-editor-block"><div class="cv-editor-head"><h3>CV design</h3></div>';
    html += '<div class="cv-templates">';
    TEMPLATES.forEach(function (t) {
      html += '<button type="button" class="cv-tpl-btn' + (state.template === t.id ? ' is-active' : '') + '" data-template="' + t.id + '">';
      html += '<div class="cv-tpl-mini cv-tpl-mini--' + t.id + '"></div><strong>' + esc(t.name) + '</strong><span>' + esc(t.blurb) + '</span></button>';
    });
    html += '</div></div>';

    html += '<div class="cv-editor-block"><div class="cv-editor-head"><h3>Colour theme</h3><span style="font-size:.75rem;font-weight:800;color:var(--amz-accent)">FREE</span></div>';
    html += '<div class="cv-colors">';
    COLORS.forEach(function (c) {
      html += '<button type="button" class="cv-swatch' + (state.color.toLowerCase() === c ? ' is-active' : '') + '" data-color="' + c + '" style="background:' + c + '" aria-label="' + c + '"></button>';
    });
    html += '<input type="color" value="' + esc(state.color) + '" data-color-picker title="Custom colour"></div></div>';

    SECTIONS.forEach(function (def) {
      html += '<div class="cv-editor-block" data-sec="' + def.id + '">' + sectionHead(def);
      if (!state.enabled[def.id] && !def.locked) {
        html += '<p class="form-note" style="margin:0">' + (def.id === 'photo'
          ? 'Photo is hidden on this CV. Turn on Show on CV if you want a picture.'
          : 'Turn on to add this to your CV.') + '</p></div>';
        return;
      }
      if (def.type === 'photo') {
        html += '<div class="cv-photo-row" data-photo-drop>';
        html += state.photo
          ? '<img class="cv-photo-preview" alt="Profile" src="' + state.photo + '">'
          : '<div class="cv-photo-preview" aria-hidden="true"></div>';
        html += '<div class="cv-photo-actions"><label class="cv-field" style="margin:0"><span>Photo</span><input type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" data-photo="1" class="cv-file-input"></label>';
        if (state.photo) html += '<button type="button" class="btn btn--ghost btn--sm" data-photo-remove>Remove photo</button>';
        html += '<p class="form-note" style="margin:0">Choose a JPG, PNG, or WebP. Use Show on CV to keep the picture on the CV or hide it.</p></div></div>';
      } else if (def.type === 'personal') {
        html += input('personal.fullName', 'Full name');
        html += input('personal.title', 'Professional title', 'text', 'placeholder="e.g. Graphic Designer"');
        html += '<div class="cv-grid-2">' + input('personal.location', 'Location') + input('personal.nationality', 'Nationality (optional)') + '</div>';
      } else if (def.type === 'contact') {
        html += input('contact.email', 'Email', 'email');
        html += input('contact.phone', 'Phone', 'tel');
        html += input('contact.address', 'Address');
        html += '<div class="cv-grid-2">' + input('contact.city', 'City') + input('contact.website', 'Website / LinkedIn') + '</div>';
      } else if (def.type === 'text') {
        html += area(def.id === 'summary' ? 'summary' : 'hobbies', def.label, def.placeholder);
      } else if (def.type === 'chips') {
        html += area(def.id, 'List items (comma or new line)', 'Excel, Photoshop, Teamwork');
      } else if (def.type === 'job') {
        (state[def.id] || []).forEach(function (row, i) {
          html += itemChrome(def.id, i, def.label);
          html += input(def.id + '.' + i + '.title', 'Role / title');
          html += input(def.id + '.' + i + '.org', 'Company / organisation');
          html += '<div class="cv-grid-2">' + input(def.id + '.' + i + '.place', 'Location') + input(def.id + '.' + i + '.start', 'Start') + '</div>';
          html += '<div class="cv-grid-2">' + input(def.id + '.' + i + '.end', 'End') +
            '<label class="cv-field"><span>&nbsp;</span><label class="cv-toggle"><input type="checkbox" data-path="' + def.id + '.' + i + '.current"' + (row.current ? ' checked' : '') + '> Current</label></label></div>';
          html += area(def.id + '.' + i + '.details', 'Details (one point per line)');
          html += '</div>';
        });
        html += '<button type="button" class="cv-linkish cv-add" data-add="' + def.id + '">+ Add</button>';
      } else if (def.type === 'edu') {
        (state.education || []).forEach(function (row, i) {
          html += itemChrome('education', i, 'Education');
          html += input('education.' + i + '.title', 'Degree / qualification');
          html += input('education.' + i + '.org', 'School / university');
          html += '<div class="cv-grid-2">' + input('education.' + i + '.place', 'Location') + input('education.' + i + '.start', 'Start') + '</div>';
          html += input('education.' + i + '.end', 'End');
          html += area('education.' + i + '.details', 'Details (optional)');
          html += '</div>';
        });
        html += '<button type="button" class="cv-linkish cv-add" data-add="education">+ Add education</button>';
      } else if (def.type === 'simple') {
        (state[def.id] || []).forEach(function (row, i) {
          html += itemChrome(def.id, i, def.label);
          html += input(def.id + '.' + i + '.title', 'Title');
          html += '<div class="cv-grid-2">' + input(def.id + '.' + i + '.issuer', 'Issuer / organisation') + input(def.id + '.' + i + '.year', 'Year') + '</div>';
          html += '</div>';
        });
        html += '<button type="button" class="cv-linkish cv-add" data-add="' + def.id + '">+ Add</button>';
      } else if (def.type === 'project') {
        (state.projects || []).forEach(function (row, i) {
          html += itemChrome('projects', i, 'Project');
          html += input('projects.' + i + '.title', 'Project name');
          html += '<div class="cv-grid-2">' + input('projects.' + i + '.org', 'Client / org') + input('projects.' + i + '.year', 'Year') + '</div>';
          html += area('projects.' + i + '.details', 'Details');
          html += '</div>';
        });
        html += '<button type="button" class="cv-linkish cv-add" data-add="projects">+ Add project</button>';
      } else if (def.type === 'lang') {
        (state.languages || []).forEach(function (row, i) {
          html += itemChrome('languages', i, 'Language');
          html += input('languages.' + i + '.name', 'Language');
          html += '<label class="cv-field"><span>Level</span><select data-path="languages.' + i + '.level">' +
            ['Native', 'Fluent', 'Intermediate', 'Basic'].map(function (lv) {
              return '<option' + (row.level === lv ? ' selected' : '') + '>' + lv + '</option>';
            }).join('') + '</select></label></div>';
        });
        html += '<button type="button" class="cv-linkish cv-add" data-add="languages">+ Add language</button>';
      } else if (def.type === 'ref') {
        (state.references || []).forEach(function (row, i) {
          html += itemChrome('references', i, 'Reference');
          html += input('references.' + i + '.name', 'Name');
          html += '<div class="cv-grid-2">' + input('references.' + i + '.title', 'Title') + input('references.' + i + '.org', 'Organisation') + '</div>';
          html += '<div class="cv-grid-2">' + input('references.' + i + '.phone', 'Phone') + input('references.' + i + '.email', 'Email') + '</div>';
          html += '</div>';
        });
        html += '<button type="button" class="cv-linkish cv-add" data-add="references">+ Add reference</button>';
      } else if (def.type === 'link') {
        (state.links || []).forEach(function (row, i) {
          html += itemChrome('links', i, 'Link');
          html += '<div class="cv-grid-2">' + input('links.' + i + '.label', 'Label') + input('links.' + i + '.url', 'URL') + '</div></div>';
        });
        html += '<button type="button" class="cv-linkish cv-add" data-add="links">+ Add link</button>';
      } else if (def.type === 'custom') {
        (state.custom || []).forEach(function (row, i) {
          html += itemChrome('custom', i, 'Custom');
          html += input('custom.' + i + '.title', 'Section title');
          html += area('custom.' + i + '.body', 'Content');
          html += '</div>';
        });
        html += '<button type="button" class="cv-linkish cv-add" data-add="custom">+ Add custom block</button>';
      }
      html += '</div>';
    });
    editor.innerHTML = html;
  }

  function blankFor(list) {
    if (list === 'education') return emptyEdu();
    if (list === 'languages') return { name: '', level: 'Fluent' };
    if (list === 'references') return { name: '', title: '', org: '', phone: '', email: '' };
    if (list === 'links') return { label: '', url: '' };
    if (list === 'custom') return { title: '', body: '' };
    if (list === 'projects') return { title: '', org: '', year: '', details: '' };
    if (list === 'experience' || list === 'internships' || list === 'volunteer') return emptyJob();
    return emptySimple();
  }

  editor.addEventListener('input', function (e) {
    var t = e.target;
    if (t.getAttribute('data-path')) {
      if (t.type === 'checkbox') val(t.getAttribute('data-path'), t.checked);
      else val(t.getAttribute('data-path'), t.value);
    }
    if (t.getAttribute('data-color-picker') != null) {
      state.color = t.value;
      save();
      renderForm();
      renderPreview();
    }
  });
  editor.addEventListener('change', function (e) {
    var t = e.target;
    if (t.getAttribute('data-enable')) {
      state.enabled[t.getAttribute('data-enable')] = t.checked;
      save();
      renderForm();
      renderPreview();
    }
    if (t.hasAttribute('data-photo')) {
      var file = t.files && t.files[0];
      if (!file) return;
      setPhotoFromFile(file);
    }
  });
  editor.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-template],[data-color],[data-add],[data-remove-item],[data-photo-remove]');
    if (!btn) return;
    if (btn.getAttribute('data-template')) {
      state.template = btn.getAttribute('data-template');
      save(); renderForm(); renderPreview();
    }
    if (btn.getAttribute('data-color')) {
      state.color = btn.getAttribute('data-color');
      save(); renderForm(); renderPreview();
    }
    if (btn.getAttribute('data-add')) {
      var list = btn.getAttribute('data-add');
      state[list] = state[list] || [];
      state[list].push(blankFor(list));
      save(); renderForm(); renderPreview();
    }
    if (btn.getAttribute('data-remove-item')) {
      var parts = btn.getAttribute('data-remove-item').split(':');
      state[parts[0]].splice(parseInt(parts[1], 10), 1);
      save(); renderForm(); renderPreview();
    }
    if (btn.hasAttribute('data-photo-remove')) {
      photoSeq += 1;
      photoRemoved = true;
      releasePendingPhoto();
      state.photo = '';
      try { localStorage.removeItem(STORAGE + '_photo'); } catch (err) { /* ignore */ }
      save(); renderForm(); renderPreview();
    }
  });

  function on(id) { return !!state.enabled[id]; }

  function contactLines() {
    var c = state.contact;
    var p = state.personal;
    var out = [];
    if (c.phone) out.push(c.phone);
    if (c.email) out.push(c.email);
    if (c.website) out.push(c.website);
    if (c.address || c.city || p.location) out.push([c.address, c.city || p.location].filter(Boolean).join(', '));
    return out;
  }

  function bullets(text) {
    var arr = lines(text);
    if (!arr.length) return '';
    return '<ul>' + arr.map(function (b) { return '<li>' + esc(b.replace(/^[-•]\s*/, '')) + '</li>'; }).join('') + '</ul>';
  }

  function jobHtml(row) {
    if (!row || !(row.title || row.org)) return '';
    var when = [row.start, row.current ? 'Present' : row.end].filter(Boolean).join(' – ');
    return '<div class="cv-item-cv"><strong>' + esc(row.title) + (row.org ? ' · ' + esc(row.org) : '') + '</strong>' +
      '<em>' + esc([row.place, when].filter(Boolean).join(' · ')) + '</em>' + bullets(row.details) + '</div>';
  }

  function simpleHtml(row) {
    if (!row || !row.title) return '';
    return '<div class="cv-item-cv"><strong>' + esc(row.title) + '</strong><em>' + esc([row.issuer, row.year].filter(Boolean).join(' · ')) + '</em></div>';
  }

  function chipHtml(text) {
    var arr = chips(text);
    if (!arr.length) return '';
    return '<div class="cv-chips">' + arr.map(function (c) { return '<span class="cv-chip">' + esc(c) + '</span>'; }).join('') + '</div>';
  }

  function block(title, inner) {
    if (!inner) return '';
    return '<section class="cv-sec"><h2>' + esc(title) + '</h2>' + inner + '</section>';
  }

  function identityHtml() {
    var name = state.personal.fullName || 'Your Name';
    var title = state.personal.title || 'Professional title';
    var photo = (on('photo') && state.photo)
      ? '<img class="cv-photo" alt="" src="' + state.photo + '">'
      : '';
    var contacts = on('contact')
      ? '<div class="cv-contact-wrap">' + contactLines().map(function (l) { return '<div class="cv-contact-line">' + esc(l) + '</div>'; }).join('') + '</div>'
      : '';
    return photo + '<div class="cv-identity"><div class="cv-name">' + esc(name) + '</div><div class="cv-role">' + esc(title) + '</div></div>' + contacts;
  }

  function sectionBody(id) {
    if (!on(id)) return '';
    if (id === 'summary') return state.summary ? '<p>' + esc(state.summary).replace(/\n/g, '<br>') + '</p>' : '';
    if (id === 'hobbies') return state.hobbies ? '<p>' + esc(state.hobbies).replace(/\n/g, '<br>') + '</p>' : '';
    if (id === 'skills' || id === 'professionalSkills' || id === 'technicalSkills') return chipHtml(state[id]);
    if (id === 'experience' || id === 'internships' || id === 'volunteer') {
      return (state[id] || []).map(jobHtml).join('');
    }
    if (id === 'education') return (state.education || []).map(function (row) {
      if (!row.title && !row.org) return '';
      return '<div class="cv-item-cv"><strong>' + esc(row.title) + (row.org ? ' · ' + esc(row.org) : '') + '</strong>' +
        '<em>' + esc([row.place, [row.start, row.end].filter(Boolean).join(' – ')].filter(Boolean).join(' · ')) + '</em>' + bullets(row.details) + '</div>';
    }).join('');
    if (id === 'certifications' || id === 'courses' || id === 'awards' || id === 'publications') {
      return (state[id] || []).map(simpleHtml).join('');
    }
    if (id === 'projects') {
      return (state.projects || []).map(function (row) {
        if (!row.title) return '';
        return '<div class="cv-item-cv"><strong>' + esc(row.title) + '</strong><em>' + esc([row.org, row.year].filter(Boolean).join(' · ')) + '</em>' + bullets(row.details) + '</div>';
      }).join('');
    }
    if (id === 'languages') {
      return (state.languages || []).filter(function (r) { return r.name; }).map(function (r) {
        return '<div class="cv-item-cv"><strong>' + esc(r.name) + '</strong><em>' + esc(r.level) + '</em></div>';
      }).join('');
    }
    if (id === 'references') {
      return (state.references || []).filter(function (r) { return r.name; }).map(function (r) {
        return '<div class="cv-item-cv"><strong>' + esc(r.name) + '</strong><em>' + esc([r.title, r.org].filter(Boolean).join(' · ')) + '</em>' +
          '<p>' + esc([r.phone, r.email].filter(Boolean).join(' · ')) + '</p></div>';
      }).join('');
    }
    if (id === 'links') {
      return (state.links || []).filter(function (r) { return r.label || r.url; }).map(function (r) {
        return '<div class="cv-contact-line">' + esc(r.label || r.url) + (r.url && r.label ? ' — ' + esc(r.url) : '') + '</div>';
      }).join('');
    }
    if (id === 'custom') {
      return (state.custom || []).filter(function (r) { return r.title || r.body; }).map(function (r) {
        return '<div class="cv-item-cv"><strong>' + esc(r.title) + '</strong>' + (r.body ? '<p>' + esc(r.body).replace(/\n/g, '<br>') + '</p>' : '') + '</div>';
      }).join('');
    }
    return '';
  }

  var MAIN_ORDER = [
    ['summary', 'Professional Summary'],
    ['experience', 'Work Experience'],
    ['internships', 'Internships'],
    ['education', 'Education'],
    ['projects', 'Projects'],
    ['skills', 'Skills'],
    ['professionalSkills', 'Professional Skills'],
    ['technicalSkills', 'Technical Skills'],
    ['certifications', 'Certifications'],
    ['courses', 'Courses & Training'],
    ['volunteer', 'Volunteer Experience'],
    ['languages', 'Languages'],
    ['awards', 'Awards & Achievements'],
    ['publications', 'Publications'],
    ['references', 'References'],
    ['hobbies', 'Hobbies & Interests'],
    ['links', 'Links'],
    ['custom', 'Additional']
  ];

  function pageHtml(railExtra, mainHtml, compact) {
    var rail = identityHtml() + (railExtra || '');
    if (compact) {
      rail = '<div class="cv-identity"><div class="cv-name">' + esc(state.personal.fullName || 'Your Name') + '</div><div class="cv-role">' + esc(state.personal.title || '') + '</div></div>';
    }
    return '<article class="cv-page cv-tpl-' + esc(state.template) + '" style="--cv-accent:' + esc(state.color) + '">' +
      '<div class="cv-rail">' + rail + '</div>' +
      '<div class="cv-main">' + (compact ? '' : '<div class="cv-identity"><div class="cv-name">' + esc(state.personal.fullName || 'Your Name') + '</div></div>') +
      mainHtml + '</div>' +
      '<p class="cv-powered">Powered by Amazon Printing Services | www.amzprints.com | 03276650001</p></article>';
  }

  function renderPreview() {
    var sideIds = SIDE_SECTIONS[state.template] || [];
    var railExtra = '';
    var main = '';
    MAIN_ORDER.forEach(function (pair) {
      var html = sectionBody(pair[0]);
      if (!html) return;
      var wrapped = block(pair[1], html);
      if (sideIds.indexOf(pair[0]) !== -1) railExtra += wrapped;
      else main += wrapped;
    });
    if (!main) main = '<p class="cv-muted">Start typing on the left — your CV updates here instantly.</p>';

    var themeName = (TEMPLATES.filter(function (t) { return t.id === state.template; })[0] || {}).name || state.template;
    pagesHost.innerHTML = '<p class="cv-theme-live">Theme: ' + esc(themeName) + '</p>' + pageHtml(railExtra, main, false);
    var page1 = pagesHost.querySelector('.cv-page');
    var overflow = [];
    if (page1) {
      var flow = page1.querySelector('.cv-main');
      var guard = 0;
      while (page1.scrollHeight > page1.clientHeight + 2 && flow && flow.children.length > 1 && guard < 40) {
        var last = flow.lastElementChild;
        if (!last || last.classList.contains('cv-identity')) break;
        overflow.unshift(last);
        flow.removeChild(last);
        guard += 1;
      }
    }
    if (overflow.length) {
      var page2 = document.createElement('div');
      page2.innerHTML = pageHtml('', '', true);
      var main2 = page2.querySelector('.cv-main');
      overflow.forEach(function (n) { main2.appendChild(n); });
      pagesHost.appendChild(page2.firstElementChild);
    }

    var n = pagesHost.querySelectorAll('.cv-page').length;
    if (pageCountEl) pageCountEl.textContent = n === 1 ? '1 page' : n + ' pages';
    fitScale();
  }

  function fitScale() {
    if (!scaleEl || !pagesHost) return;
    var wrap = document.querySelector('.cv-portal__preview');
    if (!wrap) return;
    scaleEl.style.transform = 'none';
    scaleEl.style.height = 'auto';
    var avail = Math.max(280, wrap.clientWidth - 32);
    var s = Math.min(1, avail / 794);
    var pages = pagesHost.querySelectorAll('.cv-page').length || 1;
    scaleEl.style.transformOrigin = 'top center';
    scaleEl.style.transform = 'scale(' + s + ')';
    scaleEl.style.height = (pages * 1123 * s) + 'px';
  }

  function canvasToJpegBlob(canvas) {
    return new Promise(function (resolve) {
      if (canvas.toBlob) {
        canvas.toBlob(function (blob) { resolve(blob || null); }, 'image/jpeg', 0.86);
        return;
      }
      try {
        var data = canvas.toDataURL('image/jpeg', 0.86);
        var parts = data.split(',');
        var bin = atob(parts[1] || '');
        var bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        resolve(new Blob([bytes], { type: 'image/jpeg' }));
      } catch (err) {
        resolve(null);
      }
    });
  }

  function applyPhotoBitmap(bitmap) {
    var canvas = document.createElement('canvas');
    var size = 520;
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');
    var w = bitmap.width || bitmap.naturalWidth || size;
    var h = bitmap.height || bitmap.naturalHeight || size;
    var side = Math.min(w, h) || 1;
    var sx = (w - side) / 2;
    var sy = (h - side) / 2;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
    if (bitmap.close) bitmap.close();
    photoSeq += 1;
    var seq = photoSeq;
    canvasToJpegBlob(canvas).then(function (blob) {
      if (seq !== photoSeq) return;
      if (!blob) {
        alert('Could not process that image. Try another JPG or PNG.');
        return;
      }
      photoRemoved = false;
      releasePendingPhoto();
      pendingPhoto = blob;
      pendingPhotoUrl = URL.createObjectURL(blob);
      state.photo = pendingPhotoUrl;
      state.enabled.photo = true;
      save();
      renderForm();
      renderPreview();
    });
  }

  function readPhotoWithImage(file) {
    var img = new Image();
    var fr = new FileReader();
    fr.onerror = function () { alert('Could not read that image. Try a JPG or PNG.'); };
    fr.onload = function () {
      img.onload = function () {
        try { applyPhotoBitmap(img); }
        catch (err) { alert('Could not process that image. Try another JPG or PNG.'); }
      };
      img.onerror = function () { alert('That file is not a JPG, PNG, or WebP photo.'); };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  }

  function setPhotoFromFile(file) {
    if (!file) return;
    setStatus('Reading photo…');
    var name = String(file.name || '').toLowerCase();
    var type = String(file.type || '').toLowerCase();
    if (/heic|heif/.test(type) || /\.heic$|\.heif$/.test(name)) {
      alert('This photo is HEIC. Export it as JPG or PNG, then upload that file.');
      return;
    }
    if (type && type.indexOf('image/') !== 0) {
      alert('Choose a JPG, PNG, or WebP photo.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert('Please choose a photo under 8 MB.');
      return;
    }
    if (window.createImageBitmap) {
      var opts = { imageOrientation: 'from-image' };
      createImageBitmap(file, opts).then(applyPhotoBitmap).catch(function () {
        createImageBitmap(file).then(applyPhotoBitmap).catch(function () {
          readPhotoWithImage(file);
        });
      });
      return;
    }
    readPhotoWithImage(file);
  }

  editor.addEventListener('dragover', function (e) {
    if (!e.target.closest('[data-photo-drop]')) return;
    e.preventDefault();
  });
  editor.addEventListener('drop', function (e) {
    var drop = e.target.closest('[data-photo-drop]');
    if (!drop) return;
    e.preventDefault();
    var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) setPhotoFromFile(file);
  });

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[data-amz-lib="' + src + '"]')) { resolve(); return; }
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.setAttribute('data-amz-lib', src);
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Failed ' + src)); };
      document.head.appendChild(s);
    });
  }

  function doPrint() {
    var prev = document.title;
    var name = (state.personal && state.personal.fullName) ? state.personal.fullName : 'CV';
    document.title = name + ' — CV';
    document.body.classList.add('amz-print-cv');
    window.print();
    setTimeout(function () {
      document.body.classList.remove('amz-print-cv');
      document.title = prev;
    }, 400);
  }

  function doDownloadPdf() {
    var name = ((state.personal && state.personal.fullName) || 'CV').replace(/[^\w\- ]+/g, '').trim() || 'CV';
    var btn = document.querySelector('[data-cv-action="download"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Preparing PDF…'; }
    Promise.all([
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
    ]).then(function () {
      var pages = pagesHost.querySelectorAll('.cv-page');
      if (!pages.length) throw new Error('No CV pages');
      var stage = document.createElement('div');
      stage.setAttribute('aria-hidden', 'true');
      stage.style.cssText = 'position:fixed;left:-12000px;top:0;width:794px;background:#fff;z-index:-1;';
      Array.prototype.forEach.call(pages, function (page) {
        var clone = page.cloneNode(true);
        clone.style.transform = 'none';
        clone.style.width = '210mm';
        clone.style.height = '297mm';
        stage.appendChild(clone);
      });
      document.body.appendChild(stage);
      var shots = stage.querySelectorAll('.cv-page');
      var JsPDF = window.jspdf && window.jspdf.jsPDF;
      var pdf = new JsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
      var chain = Promise.resolve();
      Array.prototype.forEach.call(shots, function (page, idx) {
        chain = chain.then(function () {
          return html2canvas(page, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false
          }).then(function (canvas) {
            var img = canvas.toDataURL('image/jpeg', 0.92);
            if (idx > 0) pdf.addPage();
            pdf.addImage(img, 'JPEG', 0, 0, 595.28, 841.89);
          });
        });
      });
      return chain.then(function () {
        pdf.save(name + '-CV.pdf');
      }).finally(function () {
        if (stage.parentNode) stage.parentNode.removeChild(stage);
      });
    }).catch(function () {
      doPrint();
    }).finally(function () {
      if (btn) { btn.disabled = false; btn.textContent = 'Download CV'; }
    });
  }

  window.addEventListener('resize', fitScale);

  document.querySelectorAll('[data-cv-action]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var act = btn.getAttribute('data-cv-action');
      if (act === 'save') {
        pushServer(false);
      }
      if (act === 'print') {
        pushServer(false).then(function (ok) { if (ok) doPrint(); });
      }
      if (act === 'download') {
        pushServer(false).then(function (ok) { if (ok) doDownloadPdf(); });
      }
      if (act === 'preview') {
        var box = document.getElementById('cv-lightbox');
        var body = document.getElementById('cv-lightbox-body');
        if (!box || !body) return;
        body.innerHTML = pagesHost.innerHTML;
        box.hidden = false;
      }
      if (act === 'close-preview') {
        var box2 = document.getElementById('cv-lightbox');
        if (box2) box2.hidden = true;
      }
      if (act === 'reset') {
        if (!window.confirm('Clear this CV and start again? This cannot be undone.')) return;
        photoSeq += 1;
        releasePendingPhoto();
        state = defaultState();
        try {
          localStorage.removeItem(STORAGE);
          localStorage.removeItem(STORAGE + '_photo');
        } catch (err) { /* ignore */ }
        renderForm();
        renderPreview();
        pushServer(true);
      }
    });
  });
  var light = document.getElementById('cv-lightbox');
  if (light) {
    light.addEventListener('click', function (e) {
      if (e.target === light) light.hidden = true;
    });
  }

  renderForm();
  renderPreview();
  allowServer = true;
})();
