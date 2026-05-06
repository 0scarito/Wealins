// ── CHECKLIST DEFINITIONS ────────────────────────────────────────────────────

const PRELIM = [
  { id: "p1", label: "Contrat Wealins ouvert" },
  { id: "p2", label: "Mandat tripartite établi (Indosuez / Wealins / Chamfeuil)" },
  { id: "p3", label: "Mandat envoyé à Indosuez — rattachement plateforme" },
  { id: "p4", label: "Avis de virement envoyé à Wealins" },
];

const STEPS = {
  "structuré": [
    { id: "s1", label: "Term Sheet envoyée sur e-Wealins (Vos Investissements)", note: "Joindre DIC" },
    { id: "s2", label: "Code ISIN renseigné dans la demande" },
    { id: "s3", label: "Éligibilité FAS validée par Wealins" },
    { id: "s4", label: "Questionnaire de connaissance client envoyé par Wealins" },
    { id: "s5", label: "Questionnaire complété par le client" },
    { id: "s6", label: "Avenant signé (courtier + client)" },
    { id: "s7", label: "Avenant validé par Wealins" },
    { id: "s8", label: "Ordre transmis par e-mail à Indosuez (compte + quantité + ISIN)", note: "Obligatoire" },
  ],
  ucits: [
    { id: "u1", label: "Investissement initié sur e-Wealins" },
    { id: "u2", label: "Ordre passé sur MyIndosuez" },
    { id: "u3", label: "Confirmation reçue" },
  ],
  alternatif: [
    { id: "a1", label: "E-mail envoyé à Wealins (contrat(s) + montants)" },
    { id: "a2", label: "Confirmation d'éligibilité reçue de Wealins" },
    { id: "a3", label: "Investissement réalisé sur e-Wealins" },
    { id: "a4", label: "Ordre passé sur MyIndosuez" },
    { id: "a5", label: "Confirmation reçue" },
  ],
};

const TYPE_LBL = { "structuré": "Structuré", ucits: "UCITS", alternatif: "Alternatif" };
const TYPE_CLS = { "structuré": "pb-s", ucits: "pb-u", alternatif: "pb-a" };

// ── STATE ────────────────────────────────────────────────────────────────────

let data = [];
let expContrat = {};
let expProd = {};
const STORAGE_KEY = 'wcc_data_v2';
const LEGACY_KEY = 'wcc_data';

// ── PERSISTENCE ──────────────────────────────────────────────────────────────

function save() {
  setSaveState('saving');
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 2,
      savedAt: new Date().toISOString(),
      data
    }));
    setTimeout(() => setSaveState('saved'), 250);
  } catch (e) {
    setSaveState('error');
    toast('Erreur de sauvegarde — stockage plein ?', 'error');
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      data = parsed.data || [];
      return;
    }
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      data = JSON.parse(legacy);
      save();
      return;
    }
    initData();
  } catch (e) {
    initData();
  }
}

function initData() {
  data = [
    {
      id: 1, client: "Martin & Associés", num: "WL-2024-001", banque: "Indosuez Luxembourg",
      notes: "", createdAt: Date.now(),
      prelim: { p1: true, p2: true, p3: true, p4: true },
      produits: [
        { id: 11, name: "Phoenix Memory Cash Plus", isin: "FR0014008LM5", type: "structuré", montant: "250 000 €", notes: "", checks: { s1: true, s2: true, s3: true, s4: true, s5: false, s6: false, s7: false, s8: false } },
        { id: 12, name: "Amundi MSCI World ETF", isin: "LU1681043599", type: "ucits", montant: "100 000 €", notes: "", checks: { u1: true, u2: true, u3: true } },
      ]
    },
    {
      id: 2, client: "Famille Dubois", num: "WL-2024-002", banque: "Indosuez Luxembourg",
      notes: "", createdAt: Date.now(),
      prelim: { p1: true, p2: false, p3: false, p4: false },
      produits: []
    },
  ];
}

function setSaveState(state) {
  const ind = document.getElementById('save-indicator');
  const txt = document.getElementById('save-text');
  if (!ind || !txt) return;
  ind.classList.remove('saving', 'error');
  if (state === 'saving') { ind.classList.add('saving'); txt.textContent = 'Sauvegarde...'; }
  else if (state === 'error') { ind.classList.add('error'); txt.textContent = 'Erreur'; }
  else { txt.textContent = 'Sauvegardé'; }
}

// ── TOASTS ───────────────────────────────────────────────────────────────────

function toast(msg, kind = 'info') {
  const wrap = document.getElementById('toasts');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  const ico = kind === 'success' ? 'circle-check' : kind === 'error' ? 'alert-circle' : 'info-circle';
  el.innerHTML = `<i class="ti ti-${ico}" aria-hidden="true"></i><span></span>`;
  el.querySelector('span').textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => { el.classList.add('fading'); setTimeout(() => el.remove(), 250); }, 2600);
}

// ── HELPERS ──────────────────────────────────────────────────────────────────

function escapeHTML(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function initials(name) {
  return (name || '?').split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function parseMoney(s) {
  if (!s) return 0;
  const cleaned = String(s).replace(/[^\d,.-]/g, '').replace(/\s/g, '');
  // FR format: "250 000,50" → handle comma as decimal
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  let normalized = cleaned;
  if (lastComma > lastDot) normalized = cleaned.replace(/\./g, '').replace(',', '.');
  else if (lastDot > -1) normalized = cleaned.replace(/,/g, '');
  const n = parseFloat(normalized);
  return isNaN(n) ? 0 : n;
}

function formatMoney(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function prelimProgress(c) {
  const done = PRELIM.filter(s => c.prelim?.[s.id]).length;
  return { done, total: PRELIM.length, pct: Math.round(done / PRELIM.length * 100) };
}

function prodProgress(p) {
  const steps = STEPS[p.type] || [];
  const done = steps.filter(s => p.checks?.[s.id]).length;
  return { done, total: steps.length, pct: steps.length ? Math.round(done / steps.length * 100) : 0 };
}

function contratStatus(c) {
  const pp = prelimProgress(c);
  if (pp.done === 0 && c.produits.every(p => prodProgress(p).done === 0)) return "new";
  const allDone = pp.done === pp.total && c.produits.length > 0 && c.produits.every(p => {
    const pr = prodProgress(p);
    return pr.total > 0 && pr.done === pr.total;
  });
  return allDone ? "done" : "in-progress";
}

function globalPct(c) {
  const pp = prelimProgress(c);
  let totalSteps = pp.total, doneSteps = pp.done;
  c.produits.forEach(p => { const pr = prodProgress(p); totalSteps += pr.total; doneSteps += pr.done; });
  return totalSteps ? Math.round(doneSteps / totalSteps * 100) : 0;
}

function statusPill(s) {
  if (s === "done") return ['Complété', 'pill-done'];
  if (s === "in-progress") return ['En cours', 'pill-prog'];
  return ['Non démarré', 'pill-new'];
}

// ── STATS ────────────────────────────────────────────────────────────────────

function updateStats() {
  const contrats = data.length;
  const invs = data.reduce((a, c) => a + c.produits.length, 0);
  let done = 0, prog = 0, total = 0;
  data.forEach(c => {
    c.produits.forEach(p => {
      const pr = prodProgress(p);
      if (pr.total > 0 && pr.done === pr.total) done++;
      else if (pr.done > 0) prog++;
      total += parseMoney(p.montant);
    });
  });
  document.getElementById('s-c').textContent = contrats;
  document.getElementById('s-i').textContent = invs;
  document.getElementById('s-d').textContent = done;
  document.getElementById('s-p').textContent = prog;
  document.getElementById('s-total').textContent = formatMoney(total);
  document.getElementById('date-lbl').textContent = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── RENDER ───────────────────────────────────────────────────────────────────

function render() {
  const search = document.getElementById('search').value.toLowerCase();
  const fst = document.getElementById('fst').value;
  const sortBy = document.getElementById('sort').value;
  updateStats();

  let list = data.filter(c => {
    if (search) {
      const hay = `${c.client} ${c.num} ${c.produits.map(p => p.name + ' ' + p.isin).join(' ')}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    if (fst && contratStatus(c) !== fst) return false;
    return true;
  });

  if (sortBy === 'name') list.sort((a, b) => a.client.localeCompare(b.client, 'fr'));
  else if (sortBy === 'progress') list.sort((a, b) => globalPct(b) - globalPct(a));
  else list.sort((a, b) => (b.createdAt || b.id) - (a.createdAt || a.id));

  const el = document.getElementById('list');
  if (!list.length) {
    el.innerHTML = `<div class="empty">
      <i class="ti ti-mood-empty" aria-hidden="true"></i>
      <div class="empty-title">Aucun contrat trouvé</div>
      <div>Modifiez votre recherche ou créez un nouveau contrat.</div>
    </div>`;
    return;
  }

  el.innerHTML = list.map(c => {
    const status = contratStatus(c);
    const pct = globalPct(c);
    const [slbl, scls] = statusPill(status);
    const isOpen = expContrat[c.id];
    const pp = prelimProgress(c);

    const prelimHTML = `
      <div class="prelim-section">
        <div class="section-title">Étapes préliminaires <span class="section-count">${pp.done}/${pp.total}</span></div>
        ${PRELIM.map(s => `
          <div class="step-row">
            <div class="chk ${c.prelim[s.id] ? 'on' : ''}" onclick="togglePrelim(${c.id},'${s.id}')" role="checkbox" aria-checked="${!!c.prelim[s.id]}" aria-label="${escapeHTML(s.label)}">
              <i class="ti ti-check" aria-hidden="true"></i>
            </div>
            <span class="step-lbl ${c.prelim[s.id] ? 'struck' : ''}">${escapeHTML(s.label)}</span>
          </div>`).join('')}
      </div>`;

    const produitsHTML = `
      <div class="produits-section">
        <div class="prod-list-head">
          <div class="section-title" style="flex:1;margin-bottom:0;">Investissements <span class="section-count">${c.produits.length}</span></div>
          <button class="btn-add-prod" onclick="openProdModal(${c.id})"><i class="ti ti-plus" aria-hidden="true"></i>Ajouter</button>
        </div>
        ${c.produits.length === 0
          ? `<div style="font-size:13px;color:var(--text-2);padding:10px 0;">Aucun investissement — cliquez sur Ajouter</div>`
          : c.produits.map(p => {
              const pr = prodProgress(p);
              const isProdOpen = expProd[c.id + '-' + p.id];
              const steps = STEPS[p.type] || [];
              return `<div class="prod-card">
                <div class="prod-header-row" onclick="toggleProd(${c.id},${p.id})">
                  <span class="prod-badge ${TYPE_CLS[p.type] || 'pb-a'}">${TYPE_LBL[p.type] || p.type}</span>
                  <span class="prod-name">${escapeHTML(p.name)}</span>
                  <span class="prod-isin">${escapeHTML(p.isin)}</span>
                  ${p.montant && p.montant !== '—' ? `<span class="prod-montant">${escapeHTML(p.montant)}</span>` : ''}
                  <span class="prod-pct">${pr.pct}%</span>
                  <button class="btn-action" onclick="event.stopPropagation();openProdModal(${c.id},${p.id})" aria-label="Modifier"><i class="ti ti-pencil" aria-hidden="true"></i></button>
                  <button class="btn-action danger" onclick="deleteProd(event,${c.id},${p.id})" aria-label="Supprimer"><i class="ti ti-trash" aria-hidden="true"></i></button>
                  <i class="ti ti-chevron-down prod-chevron ${isProdOpen ? 'open' : ''}" aria-hidden="true"></i>
                </div>
                <div class="prod-prog"><div class="prod-prog-fill ${pr.pct === 100 && pr.total > 0 ? 'full' : ''}" style="width:${pr.pct}%"></div></div>
                ${isProdOpen ? `${p.notes ? `<div class="prod-notes">${escapeHTML(p.notes)}</div>` : ''}<div class="prod-steps">${steps.map(s => `
                  <div class="step-row">
                    <div class="chk ${p.checks[s.id] ? 'on' : ''}" onclick="toggleProd_step(${c.id},${p.id},'${s.id}')" role="checkbox" aria-checked="${!!p.checks[s.id]}" aria-label="${escapeHTML(s.label)}">
                      <i class="ti ti-check" aria-hidden="true"></i>
                    </div>
                    <span class="step-lbl ${p.checks[s.id] ? 'struck' : ''}">${escapeHTML(s.label)}</span>
                    ${s.note ? `<span class="step-note">${escapeHTML(s.note)}</span>` : ''}
                  </div>`).join('')}</div>` : ''}
              </div>`;
            }).join('')}
      </div>`;

    return `<div class="contrat-card ${status}" id="cc-${c.id}">
      <div class="contrat-header" onclick="toggleContrat(${c.id})">
        <div class="contrat-avatar">${escapeHTML(initials(c.client))}</div>
        <div class="contrat-info">
          <div class="contrat-name">${escapeHTML(c.client)}</div>
          <div class="contrat-meta">
            <span><i class="ti ti-hash" aria-hidden="true"></i>${escapeHTML(c.num)}</span>
            <span><i class="ti ti-building-bank" aria-hidden="true"></i>${escapeHTML(c.banque)}</span>
            <span><i class="ti ti-coin" aria-hidden="true"></i>${c.produits.length} investissement${c.produits.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div class="contrat-right">
          <span class="pill ${scls}">${slbl}</span>
          <span class="pct-txt">${pct}%</span>
          <button class="btn-action" onclick="event.stopPropagation();openContratModal(${c.id})" aria-label="Modifier contrat"><i class="ti ti-pencil" aria-hidden="true"></i></button>
          <button class="btn-action danger" onclick="deleteContrat(event,${c.id})" aria-label="Supprimer contrat"><i class="ti ti-trash" aria-hidden="true"></i></button>
          <i class="ti ti-chevron-down chevron ${isOpen ? 'open' : ''}" aria-hidden="true"></i>
        </div>
      </div>
      <div class="prog-bar"><div class="prog-fill ${pct === 100 ? 'full' : ''}" style="width:${pct}%"></div></div>
      ${isOpen ? `<div class="contrat-body">${c.notes ? `<div class="contrat-notes">${escapeHTML(c.notes)}</div>` : ''}${prelimHTML}${produitsHTML}</div>` : ''}
    </div>`;
  }).join('');
}

// ── TOGGLE ACTIONS ───────────────────────────────────────────────────────────

function toggleContrat(id) { expContrat[id] = !expContrat[id]; render(); }
function toggleProd(cid, pid) { const k = cid + '-' + pid; expProd[k] = !expProd[k]; render(); }

function togglePrelim(cid, sid) {
  const c = data.find(x => x.id === cid); if (!c) return;
  c.prelim[sid] = !c.prelim[sid]; save(); render();
}

function toggleProd_step(cid, pid, sid) {
  const c = data.find(x => x.id === cid); if (!c) return;
  const p = c.produits.find(x => x.id === pid); if (!p) return;
  p.checks[sid] = !p.checks[sid]; save(); render();
}

function deleteProd(e, cid, pid) {
  e.stopPropagation();
  if (!confirm('Supprimer cet investissement ?')) return;
  const c = data.find(x => x.id === cid); if (!c) return;
  c.produits = c.produits.filter(x => x.id !== pid); save(); render();
  toast('Investissement supprimé', 'info');
}

function deleteContrat(e, cid) {
  e.stopPropagation();
  if (!confirm('Supprimer ce contrat et tous ses investissements ?')) return;
  data = data.filter(x => x.id !== cid); save(); render();
  toast('Contrat supprimé', 'info');
}

// ── MODALS ───────────────────────────────────────────────────────────────────

function openContratModal(editId) {
  const c = editId ? data.find(x => x.id === editId) : null;
  const isEdit = !!c;
  document.getElementById('modals').innerHTML = `
    <div class="modal-wrap" onclick="closeModal(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-title"><i class="ti ti-${isEdit ? 'pencil' : 'file-plus'}" aria-hidden="true"></i>${isEdit ? 'Modifier le contrat' : 'Nouveau contrat'}</div>
        <div class="modal-body">
          <input type="hidden" id="m-eid" value="${isEdit ? c.id : ''}">
          <div class="fr"><label>Nom du client / titulaire</label><input id="m-client" type="text" placeholder="ex: Famille Martin" value="${isEdit ? escapeHTML(c.client) : ''}"></div>
          <div class="fr"><label>N° de contrat Wealins</label><input id="m-num" type="text" placeholder="ex: WL-2025-003" value="${isEdit ? escapeHTML(c.num) : ''}"></div>
          <div class="fr"><label>Banque dépositaire</label><input id="m-banque" type="text" placeholder="Indosuez Luxembourg" value="${isEdit ? escapeHTML(c.banque) : 'Indosuez Luxembourg'}"></div>
          <div class="fr"><label>Notes (optionnel)</label><textarea id="m-notes" placeholder="Remarques internes, échéances, contacts...">${isEdit ? escapeHTML(c.notes || '') : ''}</textarea></div>
        </div>
        <div class="mactions">
          <button class="btn-cancel" onclick="closeModal()">Annuler</button>
          <button class="btn-ok" onclick="saveContrat()">${isEdit ? 'Enregistrer' : 'Créer'}</button>
        </div>
      </div>
    </div>`;
  setTimeout(() => document.getElementById('m-client').focus(), 50);
}

function openProdModal(cid, editPid) {
  const c = data.find(x => x.id === cid); if (!c) return;
  const p = editPid ? c.produits.find(x => x.id === editPid) : null;
  const isEdit = !!p;
  document.getElementById('modals').innerHTML = `
    <div class="modal-wrap" onclick="closeModal(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-title"><i class="ti ti-${isEdit ? 'pencil' : 'plus'}" aria-hidden="true"></i>${isEdit ? "Modifier l'investissement" : 'Ajouter un investissement'}</div>
        <div class="modal-body">
          <input type="hidden" id="m-cid" value="${cid}">
          <input type="hidden" id="m-pid" value="${isEdit ? p.id : ''}">
          <div class="fr"><label>Nom du produit</label><input id="m-pname" type="text" placeholder="ex: Phoenix Memory Cash Plus" value="${isEdit ? escapeHTML(p.name) : ''}"></div>
          <div class="fr"><label>Code ISIN</label><input id="m-isin" type="text" placeholder="ex: FR0014008LM5" value="${isEdit ? escapeHTML(p.isin) : ''}"></div>
          <div class="fr"><label>Type de produit</label>
            <select id="m-type">
              <option value="structuré"${isEdit && p.type === 'structuré' ? ' selected' : ''}>Produit structuré</option>
              <option value="ucits"${isEdit && p.type === 'ucits' ? ' selected' : ''}>Fonds UCITS</option>
              <option value="alternatif"${isEdit && p.type === 'alternatif' ? ' selected' : ''}>Fonds alternatif</option>
            </select>
          </div>
          <div class="fr"><label>Montant</label><input id="m-montant" type="text" placeholder="ex: 150 000 €" value="${isEdit ? escapeHTML(p.montant) : ''}"></div>
          <div class="fr"><label>Notes (optionnel)</label><textarea id="m-pnotes" placeholder="Échéance, conditions particulières...">${isEdit ? escapeHTML(p.notes || '') : ''}</textarea></div>
        </div>
        <div class="mactions">
          <button class="btn-cancel" onclick="closeModal()">Annuler</button>
          <button class="btn-ok" onclick="saveProd()">${isEdit ? 'Enregistrer' : 'Ajouter'}</button>
        </div>
      </div>
    </div>`;
  setTimeout(() => document.getElementById('m-pname').focus(), 50);
}

function closeModal(e) {
  if (e && !e.target.classList.contains('modal-wrap')) return;
  document.getElementById('modals').innerHTML = '';
}

// ESC closes modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal({ target: { classList: { contains: () => true } } });
});

// ── SAVE ACTIONS ─────────────────────────────────────────────────────────────

function saveContrat() {
  const eid = document.getElementById('m-eid').value;
  const client = (document.getElementById('m-client').value || '').trim();
  const num = (document.getElementById('m-num').value || '').trim();
  const banque = (document.getElementById('m-banque').value || 'Indosuez Luxembourg').trim();
  const notes = (document.getElementById('m-notes').value || '').trim();
  if (!client) { toast('Le nom du client est requis', 'error'); return; }

  if (eid) {
    const c = data.find(x => x.id === parseInt(eid));
    if (c) { c.client = client; c.num = num || '—'; c.banque = banque; c.notes = notes; }
    toast('Contrat mis à jour', 'success');
  } else {
    const id = Date.now();
    data.unshift({ id, client, num: num || '—', banque, notes, createdAt: id, prelim: {}, produits: [] });
    expContrat[id] = true;
    toast('Contrat créé', 'success');
  }
  save(); closeModal({ target: { classList: { contains: () => true } } }); render();
}

function saveProd() {
  const cid = parseInt(document.getElementById('m-cid').value);
  const pid = document.getElementById('m-pid').value;
  const name = (document.getElementById('m-pname').value || '').trim();
  const isin = (document.getElementById('m-isin').value || '').trim();
  const type = document.getElementById('m-type').value;
  const montant = (document.getElementById('m-montant').value || '—').trim();
  const notes = (document.getElementById('m-pnotes').value || '').trim();
  if (!name) { toast('Le nom du produit est requis', 'error'); return; }
  const c = data.find(x => x.id === cid); if (!c) return;

  if (pid) {
    const p = c.produits.find(x => x.id === parseInt(pid));
    if (p) {
      const oldType = p.type;
      p.name = name; p.isin = isin || '—'; p.type = type; p.montant = montant; p.notes = notes;
      if (oldType !== type) p.checks = {};
    }
    toast('Investissement mis à jour', 'success');
  } else {
    const newPid = Date.now();
    c.produits.push({ id: newPid, name, isin: isin || '—', type, montant, notes, checks: {} });
    expProd[cid + '-' + newPid] = true;
    expContrat[cid] = true;
    toast('Investissement ajouté', 'success');
  }
  save(); closeModal({ target: { classList: { contains: () => true } } }); render();
}

// ── EXPORT / IMPORT ──────────────────────────────────────────────────────────

function exportData() {
  const payload = {
    app: 'wealins-chamfeuil',
    version: 2,
    exportedAt: new Date().toISOString(),
    data
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url; a.download = `wealins-export-${stamp}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  toast('Sauvegarde téléchargée', 'success');
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const parsed = JSON.parse(ev.target.result);
      const incoming = Array.isArray(parsed) ? parsed : parsed.data;
      if (!Array.isArray(incoming)) throw new Error('Format invalide');
      if (!confirm(`Importer ${incoming.length} contrat(s) ? Cela remplacera les données actuelles.`)) {
        e.target.value = ''; return;
      }
      data = incoming.map(c => ({
        id: c.id || Date.now() + Math.random(),
        client: c.client || '',
        num: c.num || '—',
        banque: c.banque || 'Indosuez Luxembourg',
        notes: c.notes || '',
        createdAt: c.createdAt || c.id || Date.now(),
        prelim: c.prelim || {},
        produits: (c.produits || []).map(p => ({
          id: p.id || Date.now() + Math.random(),
          name: p.name || '',
          isin: p.isin || '—',
          type: p.type || 'structuré',
          montant: p.montant || '—',
          notes: p.notes || '',
          checks: p.checks || {}
        }))
      }));
      save(); render();
      toast(`${data.length} contrat(s) importé(s)`, 'success');
    } catch (err) {
      toast('Fichier invalide : ' + err.message, 'error');
    }
    e.target.value = '';
  };
  reader.readAsText(file);
}

// ── INIT ─────────────────────────────────────────────────────────────────────

load();
render();
