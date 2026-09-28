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
  function looksLikeHtml(value) {
    return /<\/?[a-z][^>]*>/i.test(String(value || ''));
  }
  function sanitizeRich(html) {
    var root = document.createElement('div');
    root.innerHTML = String(html || '');
    var allowed = { B: 1, STRONG: 1, I: 1, EM: 1, U: 1, BR: 1, P: 1, DIV: 1, UL: 1, OL: 1, LI: 1, SPAN: 1, BLOCKQUOTE: 1 };
    function clean(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) return;
        if (child.nodeType !== 1 || !allowed[child.tagName]) {
          if (child.nodeType === 1) {
            while (child.firstChild) node.insertBefore(child.firstChild, child);
          }
          if (child.parentNode === node) node.removeChild(child);
          return;
        }
        var tag = child.tagName;
        var styleIn = (child.getAttribute('style') || '').toLowerCase();
        var align = '';
        var indent = '';
        var list = '';
        var alignMatch = styleIn.match(/text-align\s*:\s*(left|center|right|justify)/);
        if (alignMatch && (tag === 'P' || tag === 'DIV' || tag === 'LI' || tag === 'BLOCKQUOTE')) align = alignMatch[1];
        var indentMatch = styleIn.match(/margin-left\s*:\s*(\d+(?:\.\d+)?)(px|em)/);
        if (indentMatch) {
          var px = parseFloat(indentMatch[1]);
          if (indentMatch[2] === 'em') px *= 16;
          px = Math.max(0, Math.min(160, Math.round(px / 24) * 24));
          if (px) indent = px + 'px';
        }
        if (tag === 'BLOCKQUOTE' && !indent) indent = '24px';
        var listMatch = styleIn.match(/list-style-type\s*:\s*(disc|circle|square|decimal|lower-alpha|upper-alpha|lower-roman|upper-roman)/);
        if (listMatch && (tag === 'UL' || tag === 'OL')) list = listMatch[1];
        while (child.attributes.length) child.removeAttribute(child.attributes[0].name);
        var style = '';
        if (align) style += 'text-align:' + align + ';';
        if (indent) style += 'margin-left:' + indent + ';';
        if (list) style += 'list-style-type:' + list + ';';
        if (style) child.setAttribute('style', style);
        if (tag === 'BLOCKQUOTE') {
          var div = document.createElement('div');
          if (style) div.setAttribute('style', style);
          while (child.firstChild) div.appendChild(child.firstChild);
          node.replaceChild(div, child);
          clean(div);
          return;
        }
        clean(child);
      });
    }
    clean(root);
    return root.innerHTML;
  }
  function richBlock(text) {
    if (!looksLikeHtml(text)) return '';
    var clean = sanitizeRich(text);
    var probe = document.createElement('div');
    probe.innerHTML = clean;
    if (!probe.textContent || !String(probe.textContent).trim()) return '';
    return '<div class="cv-rich">' + clean + '</div>';
  }
  function plainArea(path, label, ph) {
    return '<label class="cv-field"><span>' + esc(label) + '</span><textarea data-path="' + esc(path) + '" placeholder="' + esc(ph || '') + '">' + esc(val(path) || '') + '</textarea></label>';
  }
  function area(path, label, ph) {
    var raw = String(val(path) || '');
    var inner = looksLikeHtml(raw) ? sanitizeRich(raw) : esc(raw).replace(/\n/g, '<br>');
    return '<label class="cv-field cv-field--rich"><span>' + esc(label) + '</span><div class="cv-rich-box" contenteditable="true" data-rich="1" data-path="' + esc(path) + '" data-placeholder="' + esc(ph || '') + '">' + inner + '</div></label>';
  }
  function toolbarHtml() {
    return '<div class="cv-toolbar" data-cv-toolbar>' +
      '<button type="button" data-cmd="bold" title="Bold"><b>B</b></button>' +
      '<button type="button" data-cmd="italic" title="Italic"><i>I</i></button>' +
      '<button type="button" data-cmd="underline" title="Underline"><u>U</u></button>' +
      '<span class="cv-toolbar__gap"></span>' +
      '<button type="button" data-align="left" title="Align left">Left</button>' +
      '<button type="button" data-align="center" title="Align center">Center</button>' +
      '<button type="button" data-align="right" title="Align right">Right</button>' +
      '<button type="button" data-align="justify" title="Justify">Justify</button>' +
      '<span class="cv-toolbar__gap"></span>' +
      '<button type="button" data-list-style="disc" title="Disc bullets">•</button>' +
      '<button type="button" data-list-style="circle" title="Circle bullets">◦</button>' +
      '<button type="button" data-list-style="square" title="Square bullets">▪</button>' +
      '<button type="button" data-list-style="decimal" title="Numbered list">1.</button>' +
      '<button type="button" data-list-style="lower-alpha" title="Letter list">a.</button>' +
      '<button type="button" data-list-style="lower-roman" title="Roman list">i.</button>' +
      '<span class="cv-toolbar__gap"></span>' +
      '<button type="button" data-cmd="outdent" title="Decrease indent">Outdent</button>' +
      '<button type="button" data-cmd="indent" title="Increase indent">Indent</button>' +
      '<p class="cv-toolbar__hint">Select text, then apply formatting. It stays on the preview, the saved CV, and the download.</p>' +
      '</div>';
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
    var html = toolbarHtml();
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
        html += plainArea(def.id, 'List items (comma or new line)', 'Excel, Photoshop, Teamwork');
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

  var lastRich = null;
  function richHost() {
    var active = document.activeElement;
    if (active && active.getAttribute && active.getAttribute('data-rich')) return active;
    return lastRich && document.body.contains(lastRich) ? lastRich : null;
  }
  function rangeInHost(host) {
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    var range = sel.getRangeAt(0);
    if (!host.contains(range.commonAncestorContainer)) return null;
    return range;
  }
  function blockForRange(host, range) {
    var node = range.startContainer;
    var el = node.nodeType === 1 ? node : node.parentElement;
    if (!el || !el.closest) return null;
    var block = el.closest('p,li');
    if (block && host.contains(block) && block !== host) return block;
    var div = el.closest('div');
    if (div && div !== host && host.contains(div)) return div;
    return null;
  }
  function ensureBlock(host, range) {
    var block = blockForRange(host, range);
    if (block) return block;
    if (range.collapsed) return null;
    var p = document.createElement('p');
    p.appendChild(range.extractContents());
    range.insertNode(p);
    return p;
  }
  function wrapSelection(host, tag) {
    var range = rangeInHost(host);
    if (!range || range.collapsed) return;
    var el = document.createElement(tag);
    try {
      range.surroundContents(el);
    } catch (err) {
      el.appendChild(range.extractContents());
      range.insertNode(el);
    }
  }
  function shiftIndent(host, dir) {
    var range = rangeInHost(host);
    if (!range) return;
    var block = ensureBlock(host, range);
    if (!block) return;
    var cur = parseInt(block.style.marginLeft || '0', 10) || 0;
    var next = Math.max(0, Math.min(160, cur + (dir * 24)));
    block.style.marginLeft = next ? (next + 'px') : '';
  }
  function applyListStyle(host, style) {
    var range = rangeInHost(host);
    if (!range) return;
    var ordered = style === 'decimal' || style === 'lower-alpha' || style === 'upper-alpha' || style === 'lower-roman' || style === 'upper-roman';
    var node = range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement;
    var existing = node && node.closest ? node.closest('ul,ol') : null;
    if (existing && host.contains(existing)) {
      var replacement = document.createElement(ordered ? 'ol' : 'ul');
      replacement.style.listStyleType = style;
      while (existing.firstChild) replacement.appendChild(existing.firstChild);
      existing.parentNode.replaceChild(replacement, existing);
      return;
    }
    var li = document.createElement('li');
    var list = document.createElement(ordered ? 'ol' : 'ul');
    list.style.listStyleType = style;
    if (range.collapsed) {
      var block = blockForRange(host, range);
      if (!block) return;
      li.innerHTML = block.innerHTML;
      list.appendChild(li);
      block.parentNode.replaceChild(list, block);
      return;
    }
    li.appendChild(range.extractContents());
    list.appendChild(li);
    range.insertNode(list);
  }
  function applyTool(btn) {
    var host = richHost();
    if (!host) return;
    var sel = window.getSelection();
    var range = (sel && sel.rangeCount) ? sel.getRangeAt(0).cloneRange() : null;
    host.focus();
    if (range && sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
    var cmd = btn.getAttribute('data-cmd');
    var align = btn.getAttribute('data-align');
    var list = btn.getAttribute('data-list-style');
    if (cmd === 'bold') wrapSelection(host, 'b');
    else if (cmd === 'italic') wrapSelection(host, 'i');
    else if (cmd === 'underline') wrapSelection(host, 'u');
    else if (cmd === 'indent' || cmd === 'outdent') shiftIndent(host, cmd === 'indent' ? 1 : -1);
    if (align) {
      var live = rangeInHost(host);
      if (live) {
        var block = ensureBlock(host, live);
        if (block) block.style.textAlign = align;
      }
    }
    if (list) applyListStyle(host, list);
    val(host.getAttribute('data-path'), sanitizeRich(host.innerHTML));
  }
  editor.addEventListener('focusin', function (e) {
    var rich = e.target.closest ? e.target.closest('[data-rich]') : null;
    if (rich) lastRich = rich;
  });
  editor.addEventListener('mousedown', function (e) {
    var tool = e.target.closest ? e.target.closest('[data-cv-toolbar] button') : null;
    if (!tool) return;
    e.preventDefault();
    applyTool(tool);
  });
  editor.addEventListener('input', function (e) {
    var t = e.target;
    var rich = t.closest ? t.closest('[data-rich]') : null;
    if (rich) {
      val(rich.getAttribute('data-path'), sanitizeRich(rich.innerHTML));
      return;
    }
    if (t.getAttribute && t.getAttribute('data-path')) {
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
    if (e.target.closest && e.target.closest('[data-cv-toolbar]')) return;
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

  function detailsHtml(text) {
    var rich = richBlock(text);
    if (rich) return rich;
    return bullets(text);
  }
  function jobHtml(row) {
    if (!row || !(row.title || row.org)) return '';
    var when = [row.start, row.current ? 'Present' : row.end].filter(Boolean).join(' – ');
    return '<div class="cv-item-cv"><strong>' + esc(row.title) + (row.org ? ' · ' + esc(row.org) : '') + '</strong>' +
      '<em>' + esc([row.place, when].filter(Boolean).join(' · ')) + '</em>' + detailsHtml(row.details) + '</div>';
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
    if (id === 'summary') {
      var summaryRich = richBlock(state.summary);
      if (summaryRich) return summaryRich;
      return state.summary ? '<p>' + esc(state.summary).replace(/\n/g, '<br>') + '</p>' : '';
    }
    if (id === 'hobbies') {
      var hobbyRich = richBlock(state.hobbies);
      if (hobbyRich) return hobbyRich;
      return state.hobbies ? '<p>' + esc(state.hobbies).replace(/\n/g, '<br>') + '</p>' : '';
    }
    if (id === 'skills' || id === 'professionalSkills' || id === 'technicalSkills') return chipHtml(state[id]);
    if (id === 'experience' || id === 'internships' || id === 'volunteer') {
      return (state[id] || []).map(jobHtml).join('');
    }
    if (id === 'education') return (state.education || []).map(function (row) {
      if (!row.title && !row.org) return '';
      return '<div class="cv-item-cv"><strong>' + esc(row.title) + (row.org ? ' · ' + esc(row.org) : '') + '</strong>' +
        '<em>' + esc([row.place, [row.start, row.end].filter(Boolean).join(' – ')].filter(Boolean).join(' · ')) + '</em>' + detailsHtml(row.details) + '</div>';
    }).join('');
    if (id === 'certifications' || id === 'courses' || id === 'awards' || id === 'publications') {
      return (state[id] || []).map(simpleHtml).join('');
    }
    if (id === 'projects') {
      return (state.projects || []).map(function (row) {
        if (!row.title) return '';
        return '<div class="cv-item-cv"><strong>' + esc(row.title) + '</strong><em>' + esc([row.org, row.year].filter(Boolean).join(' · ')) + '</em>' + detailsHtml(row.details) + '</div>';
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
        return '<div class="cv-item-cv"><strong>' + esc(r.title) + '</strong>' + (richBlock(r.body) || (r.body ? '<p>' + esc(r.body).replace(/\n/g, '<br>') + '</p>' : '')) + '</div>';
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

  function htmlToNode(html) {
    var holder = document.createElement('div');
    holder.innerHTML = html;
    return holder.firstElementChild;
  }
  function makePage(first) {
    var article = document.createElement('article');
    article.className = 'cv-page cv-tpl-' + state.template + (first ? '' : ' cv-page--continue');
    article.style.setProperty('--cv-accent', state.color);
    var rail = document.createElement('div');
    rail.className = 'cv-rail';
    if (first) rail.innerHTML = identityHtml();
    var main = document.createElement('div');
    main.className = 'cv-main';
    var foot = document.createElement('p');
    foot.className = 'cv-powered';
    foot.textContent = 'Powered by Amazon Printing Services | www.amzprints.com | 03276650001';
    article.appendChild(rail);
    article.appendChild(main);
    article.appendChild(foot);
    return article;
  }
  function pageTooTall(page) {
    return page.scrollHeight > page.clientHeight + 2;
  }
  function contentNodes(section) {
    return Array.prototype.filter.call(section.children, function (child) {
      return child.tagName !== 'H2';
    });
  }
  function wordUnits(el) {
    var units = [];
    function walk(node) {
      if (node.nodeType === 3) {
        String(node.textContent || '').split(/(\s+)/).forEach(function (part) {
          if (part) units.push({ kind: 'text', text: part });
        });
        return;
      }
      if (node.nodeType !== 1) return;
      if (node.tagName === 'BR') {
        units.push({ kind: 'br' });
        return;
      }
      if (/^(B|STRONG|I|EM|U|SPAN)$/.test(node.tagName)) {
        units.push({ kind: 'html', html: node.outerHTML });
        return;
      }
      Array.prototype.forEach.call(node.childNodes, walk);
    }
    Array.prototype.forEach.call(el.childNodes, walk);
    return units;
  }
  function unitsHtml(units) {
    return units.map(function (unit) {
      if (unit.kind === 'text') return esc(unit.text);
      if (unit.kind === 'br') return '<br>';
      return unit.html;
    }).join('');
  }
  function copyStyle(from, to) {
    var style = from && from.getAttribute ? from.getAttribute('style') : '';
    if (style) to.setAttribute('style', style);
    if (from && from.className) to.className = from.className;
  }
  function sliceNode(node, units, start, end, mode) {
    var slice = units.slice(start, end);
    if (mode === 'sec') {
      var sec = document.createElement('section');
      sec.className = 'cv-sec';
      var heading = node.querySelector('h2');
      if (heading) sec.appendChild(heading.cloneNode(true));
      slice.forEach(function (el) { sec.appendChild(el.cloneNode(true)); });
      return sec;
    }
    if (mode === 'item') {
      var item = document.createElement('div');
      item.className = 'cv-item-cv';
      Array.prototype.forEach.call(node.children, function (child) {
        if (child.tagName === 'STRONG' || child.tagName === 'EM') item.appendChild(child.cloneNode(true));
      });
      slice.forEach(function (el) { item.appendChild(el.cloneNode(true)); });
      return item;
    }
    if (mode === 'list') {
      var list = document.createElement(node.tagName.toLowerCase());
      copyStyle(node, list);
      slice.forEach(function (el) { list.appendChild(el.cloneNode(true)); });
      return list;
    }
    if (mode === 'rich-kids') {
      var rich = document.createElement('div');
      rich.className = 'cv-rich';
      slice.forEach(function (el) { rich.appendChild(el.cloneNode(true)); });
      return rich;
    }
    var blockEl = document.createElement(node.tagName === 'DIV' ? 'div' : (node.tagName === 'LI' ? 'li' : 'p'));
    copyStyle(node, blockEl);
    blockEl.innerHTML = unitsHtml(slice);
    if (mode === 'rich-words') {
      var wrap = document.createElement('div');
      wrap.className = 'cv-rich';
      wrap.appendChild(blockEl);
      return wrap;
    }
    if (mode === 'li-words') {
      var listWrap = document.createElement(node.tagName.toLowerCase());
      copyStyle(node, listWrap);
      if (blockEl.tagName !== 'LI') {
        var li = document.createElement('li');
        li.innerHTML = blockEl.innerHTML;
        listWrap.appendChild(li);
      } else {
        listWrap.appendChild(blockEl);
      }
      return listWrap;
    }
    return blockEl;
  }
  function splitUnits(page, container, node, units, mode) {
    if (!units || units.length < 2) return null;
    var best = 0;
    var lo = 1;
    var hi = units.length - 1;
    while (lo <= hi) {
      var mid = (lo + hi) >> 1;
      var head = sliceNode(node, units, 0, mid, mode);
      container.appendChild(head);
      var ok = !pageTooTall(page);
      container.removeChild(head);
      if (ok) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    if (!best) return null;
    container.appendChild(sliceNode(node, units, 0, best, mode));
    return sliceNode(node, units, best, units.length, mode);
  }
  function tryPlaceSplit(page, container, node) {
    if (!node || node.nodeType !== 1) return null;
    if (node.classList.contains('cv-sec')) {
      var bits = contentNodes(node);
      if (bits.length > 1) return splitUnits(page, container, node, bits, 'sec');
      if (bits.length === 1) {
        var shell = document.createElement('section');
        shell.className = 'cv-sec';
        var heading = node.querySelector('h2');
        if (heading) shell.appendChild(heading.cloneNode(true));
        container.appendChild(shell);
        var before = shell.childNodes.length;
        var innerTail = tryPlaceSplit(page, shell, bits[0].cloneNode(true));
        if (shell.childNodes.length <= before || pageTooTall(page)) {
          container.removeChild(shell);
          return null;
        }
        if (!innerTail) {
          container.removeChild(shell);
          return null;
        }
        var tailSec = document.createElement('section');
        tailSec.className = 'cv-sec';
        if (heading) tailSec.appendChild(heading.cloneNode(true));
        tailSec.appendChild(innerTail);
        return tailSec;
      }
      return null;
    }
    if (node.classList.contains('cv-item-cv')) {
      var details = Array.prototype.filter.call(node.children, function (child) {
        return child.tagName !== 'STRONG' && child.tagName !== 'EM';
      });
      if (details.length > 1) return splitUnits(page, container, node, details, 'item');
      if (details.length === 1) {
        var item = document.createElement('div');
        item.className = 'cv-item-cv';
        Array.prototype.forEach.call(node.children, function (child) {
          if (child.tagName === 'STRONG' || child.tagName === 'EM') item.appendChild(child.cloneNode(true));
        });
        container.appendChild(item);
        var itemBefore = item.childNodes.length;
        var detailTail = tryPlaceSplit(page, item, details[0].cloneNode(true));
        if (item.childNodes.length <= itemBefore || pageTooTall(page)) {
          container.removeChild(item);
          return null;
        }
        if (!detailTail) {
          container.removeChild(item);
          return null;
        }
        var tailItem = document.createElement('div');
        tailItem.className = 'cv-item-cv';
        Array.prototype.forEach.call(node.children, function (child) {
          if (child.tagName === 'STRONG' || child.tagName === 'EM') tailItem.appendChild(child.cloneNode(true));
        });
        tailItem.appendChild(detailTail);
        return tailItem;
      }
      return null;
    }
    if (node.classList.contains('cv-rich')) {
      var kids = Array.prototype.filter.call(node.children, function (child) { return child.tagName !== 'BR'; });
      if (kids.length > 1) return splitUnits(page, container, node, kids, 'rich-kids');
      var wordsFrom = kids[0] || node;
      if (wordsFrom.tagName === 'UL' || wordsFrom.tagName === 'OL') {
        return tryPlaceSplit(page, container, wordsFrom.cloneNode(true));
      }
      var richWords = wordUnits(wordsFrom);
      if (richWords.length > 1) return splitUnits(page, container, node, richWords, 'rich-words');
      return null;
    }
    if (node.tagName === 'UL' || node.tagName === 'OL') {
      var items = Array.prototype.slice.call(node.children);
      if (items.length > 1) return splitUnits(page, container, node, items, 'list');
      if (items.length === 1) {
        var liWords = wordUnits(items[0]);
        if (liWords.length > 1) return splitUnits(page, container, node, liWords, 'li-words');
      }
      return null;
    }
    if (node.tagName === 'P' || node.tagName === 'DIV' || node.tagName === 'LI') {
      var words = wordUnits(node);
      if (words.length > 1) return splitUnits(page, container, node, words, 'words');
    }
    return null;
  }
  function liftOrphanHeading(container, rest) {
    var last = container.lastElementChild;
    if (!last || !last.classList.contains('cv-sec')) return;
    if (contentNodes(last).length) return;
    container.removeChild(last);
    rest.unshift(last);
  }
  function fillFlow(page, container, nodes) {
    var rest = nodes.slice();
    var guard = 0;
    while (rest.length && guard < 200) {
      guard += 1;
      var node = rest[0];
      container.appendChild(node);
      if (!pageTooTall(page)) {
        rest.shift();
        continue;
      }
      container.removeChild(node);
      var tail = tryPlaceSplit(page, container, node);
      if (tail) {
        rest[0] = tail;
        continue;
      }
      if (!container.children.length) {
        container.appendChild(node);
        rest.shift();
        break;
      }
      liftOrphanHeading(container, rest);
      break;
    }
    return rest;
  }
  function renderPreview() {
    var sideIds = SIDE_SECTIONS[state.template] || [];
    var railNodes = [];
    var mainNodes = [];
    MAIN_ORDER.forEach(function (pair) {
      var html = sectionBody(pair[0]);
      if (!html) return;
      var node = htmlToNode(block(pair[1], html));
      if (!node) return;
      if (sideIds.indexOf(pair[0]) !== -1) railNodes.push(node);
      else mainNodes.push(node);
    });
    if (!mainNodes.length && !railNodes.length) {
      var empty = htmlToNode('<p class="cv-muted">Start typing on the left — your CV updates here instantly.</p>');
      if (empty) mainNodes.push(empty);
    }
    var themeName = (TEMPLATES.filter(function (t) { return t.id === state.template; })[0] || {}).name || state.template;
    pagesHost.innerHTML = '<p class="cv-theme-live">Theme: ' + esc(themeName) + '</p>';
    var page = makePage(true);
    pagesHost.appendChild(page);
    var railRest = fillFlow(page, page.querySelector('.cv-rail'), railNodes);
    var queue = fillFlow(page, page.querySelector('.cv-main'), railRest.concat(mainNodes));
    var guard = 0;
    while (queue.length && guard < 24) {
      guard += 1;
      var mark = queue.length + ':' + ((queue[0].textContent || '').length);
      var next = makePage(false);
      pagesHost.appendChild(next);
      queue = fillFlow(next, next.querySelector('.cv-main'), queue);
      var placed = next.querySelector('.cv-main').children.length;
      var nextMark = queue.length ? (queue.length + ':' + ((queue[0].textContent || '').length)) : '0';
      if (!placed || nextMark === mark) {
        if (!placed) next.remove();
        break;
      }
    }
    Array.prototype.forEach.call(pagesHost.querySelectorAll('.cv-page'), function (sheet) {
      var main = sheet.querySelector('.cv-main');
      var rail = sheet.querySelector('.cv-rail');
      var hasMain = main && main.children.length;
      var hasRail = rail && rail.querySelector('.cv-sec, .cv-photo, .cv-identity, .cv-contact-line');
      if (!hasMain && !hasRail) sheet.remove();
    });
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
    var label = pagesHost.querySelector('.cv-theme-live');
    var labelH = label ? (label.offsetHeight + 14) : 0;
    scaleEl.style.transformOrigin = 'top center';
    scaleEl.style.transform = 'scale(' + s + ')';
    scaleEl.style.height = (labelH + (pages * 1123 * s) + (Math.max(0, pages - 1) * 14 * s) + 28) + 'px';
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
