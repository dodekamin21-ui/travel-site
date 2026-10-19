(function () {
  'use strict';

  var photos = Array.prototype.slice.call(document.querySelectorAll('.timeline-photo'));
  if (!photos.length) return;

  function urlOf(el) {
    var m = /url\(["']?([^"')]+)["']?\)/.exec(el.style.backgroundImage || '');
    return m ? m[1] : '';
  }

  // Photos in the same card form one gallery
  function groupOf(el) {
    var card = el.closest('.timeline-card');
    var list = card ? card.querySelectorAll('.timeline-photo') : [el];
    return Array.prototype.slice.call(list);
  }

  var box = document.createElement('div');
  box.className = 'lightbox';
  box.hidden = true;
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', '写真の拡大表示');
  box.innerHTML =
    '<button type="button" class="lightbox-close" aria-label="閉じる">&times;</button>' +
    '<button type="button" class="lightbox-nav lightbox-prev" aria-label="前の写真">&#8249;</button>' +
    '<figure class="lightbox-figure"><img class="lightbox-img" alt=""></figure>' +
    '<button type="button" class="lightbox-nav lightbox-next" aria-label="次の写真">&#8250;</button>' +
    '<p class="lightbox-count" aria-live="polite"></p>';
  document.body.appendChild(box);

  var img = box.querySelector('.lightbox-img');
  var count = box.querySelector('.lightbox-count');
  var prevBtn = box.querySelector('.lightbox-prev');
  var nextBtn = box.querySelector('.lightbox-next');

  var gallery = [];
  var index = 0;
  var opener = null;
  var isOpen = false;
  var pushed = false;

  function show(i) {
    index = (i + gallery.length) % gallery.length;
    img.src = urlOf(gallery[index]);
    count.textContent = gallery.length > 1 ? (index + 1) + ' / ' + gallery.length : '';
    var multi = gallery.length > 1;
    prevBtn.hidden = !multi;
    nextBtn.hidden = !multi;
  }

  function open(el) {
    gallery = groupOf(el);
    opener = el;
    show(gallery.indexOf(el));
    box.hidden = false;
    document.body.classList.add('lightbox-open');
    isOpen = true;
    // Let the phone's Back button close the viewer instead of leaving the article
    try {
      history.pushState({ lightbox: true }, '');
      pushed = true;
    } catch (e) {
      pushed = false;
    }
    box.querySelector('.lightbox-close').focus();
  }

  function finish() {
    if (!isOpen) return;
    isOpen = false;
    box.hidden = true;
    img.removeAttribute('src');
    document.body.classList.remove('lightbox-open');
    if (opener) opener.focus({ preventScroll: true });
  }

  function close() {
    if (!isOpen) return;
    if (pushed) {
      pushed = false;
      history.back(); // popstate handler calls finish()
    } else {
      finish();
    }
  }

  window.addEventListener('popstate', function () {
    if (isOpen) {
      pushed = false;
      finish();
    }
  });

  photos.forEach(function (el) {
    if (!urlOf(el)) return;
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', '写真を拡大して見る');
    el.classList.add('is-zoomable');
    el.addEventListener('click', function () { open(el); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(el);
      }
    });
  });

  box.addEventListener('click', function (e) {
    if (e.target === img) return;
    if (e.target.closest('.lightbox-nav')) return;
    close();
  });
  box.querySelector('.lightbox-close').addEventListener('click', close);
  prevBtn.addEventListener('click', function () { show(index - 1); });
  nextBtn.addEventListener('click', function () { show(index + 1); });

  document.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === 'ArrowRight') show(index + 1);
    else if (e.key === 'Tab') {
      // keep focus inside the viewer
      var f = Array.prototype.slice.call(box.querySelectorAll('button')).filter(function (b) { return !b.hidden; });
      var i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });

  // Swipe left / right on touch screens
  var startX = null;
  var startY = null;
  box.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) { startX = null; return; }
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });
  box.addEventListener('touchend', function (e) {
    if (startX === null || gallery.length < 2) return;
    var dx = e.changedTouches[0].clientX - startX;
    var dy = e.changedTouches[0].clientY - startY;
    startX = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(index + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();
