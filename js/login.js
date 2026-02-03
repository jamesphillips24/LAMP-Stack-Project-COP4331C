(() => {
  const signupButton = document.getElementById('login-signup-button');
  const popupOverlay = document.getElementById('cm-popup-overlay');
  const popupTitle = document.getElementById('cm-popup-title');
  const popupDescription = document.getElementById('cm-popup-description');
  const popupContent = document.getElementById('cm-popup-content');
  const popupForm = document.getElementById('cm-popup-form');
  const popupClose = document.getElementById('cm-popup-close');
  const popupCancel = document.getElementById('cm-popup-cancel');
  const popupSubmit = document.getElementById('cm-popup-submit');
  const signupTemplate = document.getElementById('cm-signup-template');
  let activePopup = null;

  function openPopup() {
    if (!popupOverlay) return;
    if (popupTitle) popupTitle.textContent = 'Sign Up';
    if (popupDescription) popupDescription.textContent = 'Create an account to save your contacts.';
    if (popupSubmit) popupSubmit.textContent = 'Create Account';
    if (popupContent) {
      popupContent.innerHTML = '';
      if (signupTemplate?.content) {
        popupContent.appendChild(signupTemplate.content.cloneNode(true));
      }
    }
    activePopup = 'signup';
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

  if (signupButton) {
    signupButton.addEventListener('click', (e) => {
      e.preventDefault();
      openPopup();
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
    popupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (activePopup === 'signup') {
        // TODO(API): Wire signup submission to backend and handle errors.
      }
      closePopup();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popupOverlay?.classList.contains('is-open')) {
      closePopup();
    }
  });
})();
