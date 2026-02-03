(() => {
  const listEl = document.getElementById('cts-contacts-list');
  const tmpl = document.getElementById('contact-item-template');
  const searchInput = document.getElementById('cts-search');
  const listContainer = document.querySelector('.cts-list-container');

  const PAGE_SIZE = 30;
  let page = 1;
  let query = '';
  let loading = false;
  let ended = false;

  // generate mock data
  const allData = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    name: `Person ${i + 1}`,
    phone: `(+1) 555-${(1000 + i).toString().padStart(4, '0')}`,
    avatarUrl: null
  }));

  function fetchMock({ page = 1, limit = PAGE_SIZE, search = '' } = {}) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const src = search
          ? allData.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
          : allData;
        const start = (page - 1) * limit;
        const items = src.slice(start, start + limit);
        resolve({ items, total: src.length });
      }, 120); // simulate small latency
    });
  }

  function renderContacts(items = [], { replace = false } = {}) {
    if (replace) {
      listEl.innerHTML = '';
      ended = false;
    }
    for (const item of items) {
      const node = tmpl.content.cloneNode(true);
      const root = node.querySelector('.cts-contact-item');
      root.dataset.id = item.id;
      root.querySelector('.cts-contact-name').textContent = item.name;
      root.querySelector('.cts-contact-phone').textContent = item.phone;
      const avatar = root.querySelector('.cts-small-contact-avatar');
      if (item.avatarUrl) {
        avatar.style.backgroundImage = `url(${item.avatarUrl})`;
        avatar.textContent = '';
      } else {
        const initials = (item.name || '').split(' ').map(s => s[0]).join('').slice(0,2).toUpperCase();
        avatar.textContent = initials || '?';
      }
      listEl.appendChild(node);
    }
  }

  async function loadMore({ reset = false } = {}) {
    if (loading || ended) return;
    loading = true;
    try {
      if (reset) page = 1;
      const data = await fetchMock({ page, limit: PAGE_SIZE, search: query });
      renderContacts(data.items, { replace: reset });
      if (data.items.length < PAGE_SIZE || (page * PAGE_SIZE) >= data.total) ended = true;
      else page++;
    } catch (err) {
      console.error('mock load error', err);
    } finally {
      loading = false;
    }
  }

  // debounce search
  let debounceTimer = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      query = searchInput.value.trim();
      ended = false;
      loadMore({ reset: true });
    }, 250);
  });

  // infinite scroll inside the list container
  listContainer.addEventListener('scroll', () => {
    const threshold = 150;
    if (listContainer.scrollTop + listContainer.clientHeight + threshold >= listContainer.scrollHeight) {
      loadMore();
    }
  });

  // selection (basic)
  listEl.addEventListener('click', (e) => {
    const item = e.target.closest('.cts-contact-item');
    if (!item) return;
    const prev = listEl.querySelector('[aria-selected="true"]');
    if (prev) prev.removeAttribute('aria-selected');
    item.setAttribute('aria-selected', 'true');
    console.log('selected id', item.dataset.id);
  });

  // initial render
  loadMore({ reset: true });
})();