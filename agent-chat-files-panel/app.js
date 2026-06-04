const railButtons = Array.from(document.querySelectorAll('[data-view]'));
const panels = Array.from(document.querySelectorAll('[data-panel]'));

function setActiveView(view) {
  railButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.view === view);
    button.classList.toggle('active', button.dataset.view === view);
  });
  panels.forEach((panel) => {
    panel.classList.toggle('is-active', panel.dataset.panel === view);
  });
}

railButtons.forEach((button) => {
  button.addEventListener('click', () => setActiveView(button.dataset.view));
});

document.getElementById('layoutToggle')?.addEventListener('click', (event) => {
  const button = event.currentTarget;
  button.classList.toggle('active');
});

setActiveView('dora');
