// --- Theme ---
const themeToggle = document.querySelector('.theme-toggle');
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  setTheme(current === 'dark' ? 'light' : 'dark');
}
themeToggle.addEventListener('click', toggleTheme);
setTheme(localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

// --- Data Model ---
function getData() {
  return JSON.parse(localStorage.getItem('vaultData') || '{"sections":[],"sectionContents":{}}');
}
function setData(data) {
  localStorage.setItem('vaultData', JSON.stringify(data));
}
function genId() {
  return '_' + Math.random().toString(36).slice(2, 10);
}

// --- State ---
let state = {
  selectedSection: null,
};

// --- UI Rendering ---
function renderSectionsBar() {
  const { sections } = getData();
  const bar = document.getElementById('sectionsBar');
  bar.innerHTML = '';
  sections.forEach(section => {
    const btn = document.createElement('button');
    btn.className = 'section-btn' + (state.selectedSection === section.id ? ' active' : '');
    btn.textContent = section.name;
    btn.onclick = () => {
      state.selectedSection = section.id;
      renderSectionsBar();
      renderSectionPage();
    };
    btn.oncontextmenu = e => {
      e.preventDefault();
      showSectionMenu(section);
    };
    bar.appendChild(btn);
  });
  const addBtn = document.createElement('button');
  addBtn.className = 'add-section-btn';
  addBtn.innerHTML = '+ Section';
  addBtn.onclick = () => addSection();
  bar.appendChild(addBtn);
}

function renderSectionPage() {
  const { sections, sectionContents } = getData();
  const page = document.getElementById('sectionPage');
  page.innerHTML = '';
  if (!state.selectedSection) {
    page.innerHTML = '<div style="opacity:0.7;font-size:1.1rem;padding:2rem;text-align:center;">Select or create a section to start writing.</div>';
    return;
  }
  const section = sections.find(s => s.id === state.selectedSection);
  if (!section) return;
  // Heading
  const heading = document.createElement('div');
  heading.className = 'section-heading';
  heading.textContent = section.name;
  page.appendChild(heading);
  // Editable area
  const textarea = document.createElement('textarea');
  textarea.className = 'section-content-area';
  textarea.value = sectionContents && sectionContents[section.id] ? sectionContents[section.id] : '';
  textarea.placeholder = 'Write your notes, code, or project info here...';
  textarea.oninput = () => {
    const data = getData();
    if (!data.sectionContents) data.sectionContents = {};
    data.sectionContents[section.id] = textarea.value;
    setData(data);
  };
  page.appendChild(textarea);
}

// --- Section Management ---
function addSection() {
  const name = prompt('Enter section name:');
  if (!name) return;
  const data = getData();
  const id = genId();
  data.sections.push({ id, name });
  if (!data.sectionContents) data.sectionContents = {};
  data.sectionContents[id] = '';
  setData(data);
  state.selectedSection = id;
  renderSectionsBar();
  renderSectionPage();
}
function showSectionMenu(section) {
  // Context menu: edit or delete
  showModal({
    title: 'Section Options',
    fields: [],
    onSave: null,
    customActions: [
      { label: 'Rename Section', action: () => renameSection(section) },
      { label: 'Delete Section', action: () => deleteSection(section), style: 'color:#e11d48;font-weight:700;' },
    ],
  });
}
function renameSection(section) {
  const name = prompt('Enter new section name:', section.name);
  if (!name) return;
  const data = getData();
  const idx = data.sections.findIndex(s => s.id === section.id);
  if (idx !== -1) data.sections[idx].name = name;
  setData(data);
  renderSectionsBar();
  renderSectionPage();
}
function deleteSection(section) {
  if (!confirm('Delete this section and its content?')) return;
  const data = getData();
  data.sections = data.sections.filter(s => s.id !== section.id);
  if (data.sectionContents) delete data.sectionContents[section.id];
  if (state.selectedSection === section.id) state.selectedSection = data.sections.length ? data.sections[0].id : null;
  setData(data);
  renderSectionsBar();
  renderSectionPage();
}

// --- Modal (for section menu) ---
function showModal({ title, fields, onSave, onDelete, customActions }) {
  const root = document.getElementById('modalRoot');
  root.innerHTML = '';
  const modal = document.createElement('div');
  modal.className = 'modal';
  const content = document.createElement('div');
  content.className = 'modal-content';
  // Title
  const h2 = document.createElement('h2');
  h2.textContent = title;
  h2.style.margin = '0 0 0.7rem 0';
  content.appendChild(h2);
  // Actions
  const actions = document.createElement('div');
  actions.className = 'modal-actions';
  if (customActions) {
    customActions.forEach(a => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = a.label;
      if (a.style) btn.style = a.style;
      btn.onclick = () => {
        a.action();
        root.innerHTML = '';
      };
      actions.appendChild(btn);
    });
  }
  // Cancel
  const cancel = document.createElement('button');
  cancel.className = 'cancel';
  cancel.type = 'button';
  cancel.textContent = 'Cancel';
  cancel.onclick = () => { root.innerHTML = ''; };
  actions.appendChild(cancel);
  content.appendChild(actions);
  modal.appendChild(content);
  root.appendChild(modal);
}

// --- Initial Render ---
function init() {
  const data = getData();
  if (!data.sections.length) {
    // Add a default section
    const id = genId();
    data.sections.push({ id, name: 'My Projects' });
    if (!data.sectionContents) data.sectionContents = {};
    data.sectionContents[id] = '';
    setData(data);
    state.selectedSection = id;
  } else if (!state.selectedSection) {
    state.selectedSection = data.sections[0].id;
  }
  renderSectionsBar();
  renderSectionPage();
}
window.addEventListener('DOMContentLoaded', init); 