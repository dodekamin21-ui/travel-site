(function () {
  var items = document.querySelectorAll('.timeline-item[data-cat]');
  if (!items.length) return;

  var buttons = document.querySelectorAll('.filter-btn');
  var hashtags = document.querySelectorAll('.hashtag');
  var status = document.querySelector('.filter-status');
  var statusText = document.querySelector('.filter-status-text');
  var clearBtn = document.querySelector('.filter-clear');
  var state = { cat: 'all', tag: null };

  function apply() {
    var shown = 0;
    items.forEach(function (item) {
      var cats = (item.getAttribute('data-cat') || '').split(' ');
      var tags = (item.getAttribute('data-tags') || '').split('|');
      var okCat = state.cat === 'all' || cats.indexOf(state.cat) > -1;
      var okTag = !state.tag || tags.indexOf(state.tag) > -1;
      item.hidden = !(okCat && okTag);
      if (!item.hidden) shown++;
    });

    buttons.forEach(function (b) {
      var active = b.getAttribute('data-filter') === state.cat;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    hashtags.forEach(function (h) {
      h.classList.toggle('is-active', !!state.tag && h.getAttribute('data-tag') === state.tag);
    });

    if (status) {
      var parts = [];
      if (state.tag) parts.push('#' + state.tag);
      if (state.cat !== 'all') {
        var label = document.querySelector('.filter-btn[data-filter="' + state.cat + '"]');
        if (label) parts.push(label.textContent);
      }
      status.hidden = parts.length === 0;
      if (statusText) statusText.textContent = parts.join(' × ') + ' で絞り込み中（' + shown + '件）';
    }
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      state.cat = b.getAttribute('data-filter');
      apply();
    });
  });

  hashtags.forEach(function (h) {
    h.addEventListener('click', function () {
      var tag = h.getAttribute('data-tag');
      state.tag = state.tag === tag ? null : tag;
      apply();
    });
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      state.cat = 'all';
      state.tag = null;
      apply();
    });
  }
})();
