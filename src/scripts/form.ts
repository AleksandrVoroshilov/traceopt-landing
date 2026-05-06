// Contact form — placeholder submit feedback.

export function initForm() {
  const form = document.querySelector<HTMLFormElement>('.cta form');
  const btn  = document.querySelector<HTMLButtonElement>('.form-submit button');
  if (!form || !btn) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const orig = btn.innerHTML;
    btn.innerHTML = 'Sending…';
    btn.disabled  = true;
    setTimeout(() => {
      btn.style.background = '#90C4A0';
      btn.style.color      = 'var(--dark-bg)';
      btn.innerHTML        = '✓ Sent';
      setTimeout(() => {
        btn.innerHTML        = orig;
        btn.disabled         = false;
        btn.style.background = '';
        btn.style.color      = '';
      }, 3000);
    }, 700);
  });
}
