(() => {
  const listEl = document.getElementById('cts-contacts-list');
  const tmpl = document.getElementById('contact-item-template');
  const searchInput = document.getElementById('cts-search');
  const listContainer = document.querySelector('.cts-list-container');
  const infoPanel = document.querySelector('.cts-center-contact-info-container');
  const infoAvatar = document.getElementById('cts-info-avatar');
  const infoTitle = document.getElementById('cts-info-title');
  const infoStatus = document.getElementById('cts-info-status');
  const nameInput = document.getElementById('cts-info-name');
  const phoneInput = document.getElementById('cts-info-phone');
  const emailInput = document.getElementById('cts-info-email');
  const editButton = document.getElementById('cts-edit-button');
  const editButtonText = document.getElementById('cts-edit-button-text');
  const editableFields = [nameInput, phoneInput, emailInput];
  const addButton = document.getElementById('cts-add-button');
  const popupOverlay = document.getElementById('cm-popup-overlay');
  const popupTitle = document.getElementById('cm-popup-title');
  const popupDescription = document.getElementById('cm-popup-description');
  const popupContent = document.getElementById('cm-popup-content');
  const popupForm = document.getElementById('cm-popup-form');
  const popupClose = document.getElementById('cm-popup-close');
  const popupCancel = document.getElementById('cm-popup-cancel');
  const popupSubmit = document.getElementById('cm-popup-submit');
  const addContactTemplate = document.getElementById('cm-add-contact-template');

  const PAGE_SIZE = 30;
  let page = 1;
  let query = '';
  let loading = false;
  let ended = false;
  let selectedId = null;
  let editing = false;
  let activePopup = null;

  // TODO(API): Replace local list with API-backed contacts data.
  const allData = [];

  const urlBase = 'https://contactmanager4331.xyz/';
  const extension = 'php';

  function readUserIdFromCookie() {
    let uid = -1;
    const parts = (document.cookie || '').split(';');
    for (const p of parts) {
      const [k, v] = p.trim().split('=');
      if (k === 'userId') uid = parseInt(v, 10);
    }
    return uid;
  }

  const userId = readUserIdFromCookie();
  if (!Number.isFinite(userId) || userId < 1) {
    window.location.href = 'index.html';
    return;
  }

  async function apiPost(endpoint, payload) {
    const res = await fetch(`${urlBase}/LAMPAPI/${endpoint}.${extension}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${endpoint}: ${text}`);
    }
    return res.json();
  }

  function splitName(full) {
    const parts = (full || '').trim().split(/\s+/).filter(Boolean);
    const firstName = parts.shift() || '';
    const lastName = parts.join(' ');
    return { firstName, lastName };
  }


  function getContactById(id) {
    return allData.find(contact => contact.id === id);
  }

  function getNextId() {
    if (!allData.length) return 1;
    return Math.max(...allData.map(contact => contact.id)) + 1;
  }

  function getInitials(name = '') {
    return name
      .trim()
      .split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  function setAvatar(avatarEl, contact) {
    if (!avatarEl || !contact) return;
    if (contact.avatarUrl) {
      avatarEl.style.backgroundImage = `url(${contact.avatarUrl})`;
      avatarEl.textContent = '';
    } else {
      avatarEl.style.backgroundImage = '';
      avatarEl.textContent = getInitials(contact.name) || '?';
    }
  }

  function updateInfoPanel(contact) {
    if (!contact) return;
    const displayName = contact.name || 'Unnamed Contact';
    if (infoTitle) infoTitle.textContent = displayName;
    if (nameInput) nameInput.value = contact.name || '';
    if (phoneInput) phoneInput.value = contact.phone || '';
    if (emailInput) emailInput.value = contact.email || '';
    setAvatar(infoAvatar, contact);
  }

  function setInfoStatus(message) {
    if (infoStatus) infoStatus.textContent = message;
  }

  function setEditing(state) {
    editing = state;
    if (infoPanel) infoPanel.classList.toggle('is-editing', editing);
    editableFields.forEach((field) => {
      if (!field) return;
      field.disabled = !editing;
    });
    if (editButtonText) editButtonText.textContent = editing ? 'Save' : 'Edit';
    if (!selectedId) {
      setInfoStatus('Select a contact to view details.');
    } else {
      setInfoStatus(editing ? 'Editing contact details.' : 'Viewing contact details.');
    }
  }

  function openPopup({ title, description, template, submitLabel, mode } = {}) {
    if (!popupOverlay) return;
    if (popupTitle) popupTitle.textContent = title || 'Details';
    if (popupDescription) popupDescription.textContent = description || '';
    if (popupSubmit) popupSubmit.textContent = submitLabel || 'Save';
    if (popupContent) {
      popupContent.innerHTML = '';
      if (template?.content) {
        popupContent.appendChild(template.content.cloneNode(true));
      }
    }
    activePopup = mode || null;
    popupOverlay.classList.add('is-open');
    popupOverlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cm-popup-open');
    const firstInput = popupOverlay.querySelector('input, select, textarea, button');
    if (firstInput) firstInput.focus();
  }

  function closePopup() {
    if (!popupOverlay) return;
    popupOverlay.classList.remove('is-open');
    popupOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cm-popup-open');
    activePopup = null;
    if (popupContent) popupContent.innerHTML = '';
  }

  function clearInfoPanel() {
    selectedId = null;
    if (infoTitle) infoTitle.textContent = 'Select a contact';
    if (nameInput) nameInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (emailInput) emailInput.value = '';
    if (infoAvatar) {
      infoAvatar.style.backgroundImage = '';
      infoAvatar.textContent = '?';
    }
    if (editButton) editButton.classList.add('is-disabled');
    setEditing(false);
  }

  function selectContact(id) {
    const contact = getContactById(id);
    if (!contact) {
      clearInfoPanel();
      return;
    }

    selectedId = contact.id;
    if (editButton) editButton.classList.remove('is-disabled');
    setEditing(false);
    updateInfoPanel(contact);

    const prev = listEl.querySelector('[aria-selected="true"]');
    if (prev) prev.removeAttribute('aria-selected');
    const current = listEl.querySelector(`.cts-contact-item[data-id="${contact.id}"]`);
    if (current) current.setAttribute('aria-selected', 'true');
  }

  async function fetchFromAPI({ search = '' } = {}) {
    const data = await apiPost('SearchContacts', { search, userId });

    if (data.error && data.error !== '') {
      return { items: [], total: 0, error: data.error };
    }

    const results = Array.isArray(data.results) ? data.results : [];
    const items = results.map((c) => ({
      id: Number(c.id),
      name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unnamed Contact',
      phone: c.phone || '',
      email: c.email || '',
      avatarUrl: null,
    }));

    return { items, total: items.length, error: '' };
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
      setAvatar(avatar, item);
      listEl.appendChild(node);
    }
  }

  function syncSelectionAfterRender(items) {
    if (!items.length) {
      clearInfoPanel();
      return;
    }

    const match = selectedId ? items.find(item => item.id === selectedId) : null;
    if (match) {
      const current = listEl.querySelector(`.cts-contact-item[data-id="${match.id}"]`);
      if (current) current.setAttribute('aria-selected', 'true');
      setEditing(false);
      updateInfoPanel(match);
      if (editButton) editButton.classList.remove('is-disabled');
      return;
    }

    selectContact(items[0].id);
  }

  function updateListItem(contact) {
    const itemEl = listEl.querySelector(`.cts-contact-item[data-id="${contact.id}"]`);
    if (!itemEl) return;
    itemEl.querySelector('.cts-contact-name').textContent = contact.name;
    itemEl.querySelector('.cts-contact-phone').textContent = contact.phone;
    setAvatar(itemEl.querySelector('.cts-small-contact-avatar'), contact);
  }

    async function saveEdits() {
    const contact = getContactById(selectedId);
    if (!contact) return;

    const updatedName = nameInput.value.trim();
    const { firstName, lastName } = splitName(updatedName);

    const phone = phoneInput.value.trim();
    const email = emailInput.value.trim();

    const res = await apiPost('UpdateContact', {
      id: selectedId,
      firstName,
      lastName,
      phone,
      email,
      userId
    });

    if (res.error && res.error !== '') {
      setInfoStatus(res.error);
      return;
    }

    await loadMore({ reset: true });
    setEditing(false);
    setInfoStatus('Saved.');
  }


  async function loadMore({ reset = false } = {}) {
    if (loading || (ended && !reset)) return;
    loading = true;

    try {
      if (reset) {
        page = 1;
        ended = false;
        listEl.innerHTML = '';
      }

      // refresh allData from DB when resetting (new search, initial load)
      if (reset) {
        const data = await fetchFromAPI({ search: query });

        allData.length = 0;
        allData.push(...data.items);

        if (data.error) setInfoStatus(data.error);
      }

      const start = (page - 1) * PAGE_SIZE;
      const chunk = allData.slice(start, start + PAGE_SIZE);

      renderContacts(chunk, { replace: reset });
      if (reset) syncSelectionAfterRender(chunk);

      if (chunk.length < PAGE_SIZE || start + chunk.length >= allData.length) ended = true;
      else page++;
    } catch (err) {
      console.error(err);
      setInfoStatus('Failed to load contacts.');
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
    if (editing) {
      setInfoStatus('Save changes before switching contacts.');
      return;
    }
    const item = e.target.closest('.cts-contact-item');
    if (!item) return;
    selectContact(Number(item.dataset.id));
  });

  listEl.addEventListener('keydown', (e) => {
    const item = e.target.closest('.cts-contact-item');
    if (!item) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    if (editing) {
      setInfoStatus('Save changes before switching contacts.');
      return;
    }
    selectContact(Number(item.dataset.id));
  });

  if (editButton) {
    editButton.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!selectedId || editButton.classList.contains('is-disabled')) return;
      if (!editing) {
        setEditing(true);
        if (nameInput) {
          nameInput.focus();
          nameInput.select();
        }
      } else {
        await saveEdits();
      }
    });
  }

  if (addButton) {
    addButton.addEventListener('click', (e) => {
      e.preventDefault();
      openPopup({
        title: 'Add Contact',
        description: 'Use this form to add a new contact.',
        template: addContactTemplate,
        submitLabel: 'Save',
        mode: 'add-contact'
      });
    });
  }


  const deleteButton = document.getElementById('cts-delete-button');

  if (deleteButton) {
    deleteButton.addEventListener('click', (e) => {
      e.preventDefault();

      if (!selectedId) {
        setInfoStatus('Select a contact to delete.');
        return;
      }

      // if (!confirm('Delete this contact?')) return;

      apiPost('DeleteContact', { id: selectedId, userId })
        .then((res) => {
          if (res.error && res.error !== '') {
            setInfoStatus(res.error);
            return;
          }

          selectedId = null;
          setInfoStatus('Deleted.');
          return loadMore({ reset: true });
        })
        .catch((err) => {
          console.error(err);
          setInfoStatus('Failed to delete contact.');
        });
    });
  }

  if (popupClose) {
    popupClose.addEventListener('click', () => closePopup());
  }

  if (popupCancel) {
    popupCancel.addEventListener('click', () => closePopup());
  }

  if (popupOverlay) {
    popupOverlay.addEventListener('click', (e) => {
      if (e.target === popupOverlay) closePopup();
    });
  }

  if (popupForm) {
    popupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (activePopup === 'add-contact') {
        const nameField = popupOverlay?.querySelector('#cm-contact-name');
        const phoneField = popupOverlay?.querySelector('#cm-contact-phone');
        const emailField = popupOverlay?.querySelector('#cm-contact-email');
        const nameValue = nameField?.value.trim() || '';
        const phoneValue = phoneField?.value.trim() || '';
        const emailValue = emailField?.value.trim() || '';

        if (!nameValue) {
          setInfoStatus('Name is required to add a contact.');
          if (nameField) {
            nameField.focus();
            nameField.select();
          }
          return;
        }

        const { firstName, lastName } = splitName(nameValue);

        const res = await apiPost('AddContact', {
          firstName,
          lastName,
          phone: phoneValue,
          email: emailValue,
          userId
        });

        if (res.error && res.error !== '') {
          setInfoStatus(res.error);
          return;
        }

        // reload from DB
        selectedId = Number(res.id) || null;
        query = '';
        if (searchInput) searchInput.value = '';
        await loadMore({ reset: true });
        setInfoStatus('Contact added.');

      }
      closePopup();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popupOverlay?.classList.contains('is-open')) {
      closePopup();
    }
  });

  if (nameInput) {
    nameInput.addEventListener('input', () => {
      if (!editing) return;
      const previewName = nameInput.value.trim() || 'Unnamed Contact';
      if (infoTitle) infoTitle.textContent = previewName;
      const contact = getContactById(selectedId);
      if (contact && !contact.avatarUrl) {
        if (infoAvatar) infoAvatar.textContent = getInitials(previewName) || '?';
      }
    });
  }

  // initial render
  clearInfoPanel();
  loadMore({ reset: true });
})();
