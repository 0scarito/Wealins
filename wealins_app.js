// ── CHECKLIST DEFINITIONS ────────────────────────────────────────────────────

const PRELIM = [
  { id: "p1", label: "Contrat Wealins ouvert" },
  { id: "p2", label: "Mandat tripartite établi (Indosuez / Wealins / Chamfeuil)" },
  { id: "p3", label: "Mandat envoyé à Indosuez — rattachement plateforme" },
  { id: "p4", label: "Avis de virement envoyé à Wealins" },
];

const STEPS = {
  structuré: [
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

// ── STATE ────────────────────────────────────────────────────────────────────

let data = [];
let expContrat = {};
let expProd = {};

// ── PERSISTENCE ──────────────────────────────────────────────────────────────

function save() {
  try { localStorage.setItem('wcc_data', JSON.stringify(data)); } catch (e) {}
}

function load() {
  try {
    const d = localStorage.getItem('wcc_data');
    if (d) data = JSON.parse(d);
    else initData();
  } catch (e) {
    initData();
  }
}

function initData() {
  data = [
    {
      id: 1, client: "Martin & Associés", num: "WL-2024-001", banque: "Indosuez LUX",
      prelim: { p1: true, p2: true, p3: true, p4: true },
      produits: [
        { id: 11, name: "Phoenix Memory Cash Plus", isin: "FR0014008LM5", type: "structuré", montant: "250 000 €", checks: { s1: true, s2: true, s3: true, s4: true, s5: false, s6: false, s7: false, s8: false } },
        { id: 12, name: "Amundi MSCI World ETF", isin: "LU1681043599", type: "ucits", montant: "100 000 €", checks: { u1: true, u2: true, u3: true } },
      ]
    },
    {
      id: 2, client: "Famille Dubois", num: "WL-2024-002", banque: "Indosuez LUX",
      prelim: { p1: true, p2: false, p3: false, p4: false },
      produits: []
    },
  ];
}

// ── HELPERS ──────────────────────────────────────────────────────────────────

function initials(name) {
  return name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function prelimProgress(c) {
  const done = PRELIM.filter(s => c.prelim[s.id]).length;
  return { done, total: PRELIM.length, pct: Math.round(done / PRELIM.length * 100) };
}

function prodProgress(p) {
  const steps = STEPS[p.type] || [];
  const done = steps.filter(s => p.checks[s.id]).length;
  return { done, total: steps.length, pct: steps.length ? Math.round(done / steps.length * 100) : 0 };
}

function contratStatus(c) {
  const pp = prelimProgress(c);
  if (pp.done === 0 && c.produits.every(p => prodProgress(p).done === 0)) return "new";
  const allDone = pp.done === pp.total && c.produits.length > 0 && c.produits.every(p => {
    const pr = prodProgress(p);
    return pr.done === pr.total;
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
  let done = 0, prog = 0;
  data.forEach(c => {
    c.produits.forEach(p => {
      const pr = prodProgress(p);
      if (pr.done === pr.total && pr.total > 0) done++;
      else if (pr.done > 0) prog++;
    });
  });
  document.getElementById('s-c').textContent = contrats;
  document.getElementById('s-i').textContent = invs;
  document.getElementById('s-d').textContent = done;
  document.getElementById('s-p').textContent = prog;
  document.getElementById('date-lbl').textContent = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── RENDER ───────────────────────────────────────────────────────────────────

function render() {
  const search = document.getElementById('search').value.toLowerCase();
  const fst = document.getElementById('fst').value;
  updateStats();

  let list = data.filter(c => {
    if (search && !c.client.toLowerCase().includes(search) && !c.num.toLowerCase().includes(search)) return false;
    if (fst && contratStatus(c) !== fst) return false;
    return true;
  });

  const el = document.getElementById('list');
  if (!list.length) {
    el.innerHTML = `<div class="empty"><i class="ti ti-mood-empty" style="font-size:26px;display:block;margin-bottom:8px;" aria-hidden="true"></i>Aucun contrat trouvé</div>`;
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
        <div class="section-title">Étapes préliminaires <span style="font-size:11px;font-weight:400;color:#6b7280;margin-left:4px;">${pp.done}/${pp.total}</span></div>
        ${PRELIM.map(s => `
          <div class="step-row">
            <div class="chk ${c.prelim[s.id] ? 'on' : ''}" onclick="togglePrelim(${c.id},'${s.id}')" role="checkbox" aria-checked="${!!c.prelim[s.id]}" aria-label="${s.label}">
              <i class="ti ti-check" aria-hidden="true"></i>
            </div>
            <span class="step-lbl ${c.prelim[s.id] ? 'struck' : ''}">${s.label}</span>
          </div>`).join('')}
      </div>`;

    const produitsHTML = `
      <div class="produits-section">
        <div class="prod-list-head">
          <div class="section-title" style="flex:1;margin-bottom:0;">Investissements <span style="font-size:11px;font-weight:400;color:#6b7280;margin-left:4px;">${c.produits.length}</span></div>
          <button class="btn-add-prod" onclick="openProdModal(${c.id})"><i class="ti ti-plus" aria-hidden="true"></i>Ajouter</button>
        </div>
        ${c.produits.length === 0
          ? `<div style="font-size:13px;color:#6b7280;padding:8px 0;">Aucun investissement — cliquez sur Ajouter</div>`
          : c.produits.map(p => {
              const pr = prodProgress(p);
              const isProdOpen = expProd[c.id + '-' + p.id];
              const steps = STEPS[p.type] || [];
              return `<div class="prod-card">
                <div class="prod-header-row" onclick="toggleProd(${c.id},${p.id})">
                  <span class="prod-badge ${p.type === 'structuré' ? 'pb-s' : p.type === 'ucits' ? 'pb-u' : 'pb-a'}">${p.type === 'structuré' ? 'Structuré' : p.type === 'ucits' ? 'UCITS' : 'Alternatif'}</span>
                  <span class="prod-name">${p.name}</span>
                  <span class="prod-isin">${p.isin}</span>
                  <span class="prod-pct">${pr.pct}%</span>
                  <button class="prod-del" onclick="deleteProd(event,${c.id},${p.id})" aria-label="Supprimer"><i class="ti ti-trash" aria-hidden="true"></i></button>
                  <i class="ti ti-chevron-down prod-chevron ${isProdOpen ? 'open' : ''}" aria-hidden="true"></i>
                </div>
                <div class="prod-prog"><div class="prod-prog-fill ${pr.pct === 100 ? 'full' : ''}" style="width:${pr.pct}%"></div></div>
                ${isProdOpen ? `<div class="prod-steps">${steps.map(s => `
                  <div class="step-row">
                    <div class="chk ${p.checks[s.id] ? 'on' : ''}" onclick="toggleProd_step(${c.id},${p.id},'${s.id}')" role="checkbox" aria-checked="${!!p.checks[s.id]}" aria-label="${s.label}">
                      <i class="ti ti-check" aria-hidden="true"></i>
                    </div>
                    <span class="step-lbl ${p.checks[s.id] ? 'struck' : ''}">${s.label}</span>
                    ${s.note ? `<span class="step-note">${s.note}</span>` : ''}
                  </div>`).join('')}</div>` : ''}
              </div>`;
            }).join('')}
      </div>`;

    return `<div class="contrat-card ${status === 'done' ? 'done' : status === 'in-progress' ? 'in-progress' : ''}" id="cc-${c.id}">
      <div class="contrat-header" onclick="toggleContrat(${c.id})">
        <div class="contrat-avatar">${initials(c.client)}</div>
        <div class="contrat-info">
          <div class="contrat-name">${c.client}</div>
          <div class="contrat-meta">${c.num} · ${c.banque} · ${c.produits.length} investissement${c.produits.length !== 1 ? 's' : ''}</div>
        </div>
        <div class="contrat-right">
          <span class="pill ${scls}">${slbl}</span>
          <span class="pct-txt">${pct}%</span>
          <button class="btn-del" onclick="deleteContrat(event,${c.id})" aria-label="Supprimer contrat"><i class="ti ti-trash" aria-hidden="true"></i></button>
          <i class="ti ti-chevron-down chevron ${isOpen ? 'open' : ''}" aria-hidden="true"></i>
        </div>
      </div>
      <div class="prog-bar"><div class="prog-fill ${pct === 100 ? 'full' : ''}" style="width:${pct}%"></div></div>
      ${isOpen ? `<div class="contrat-body">${prelimHTML}${produitsHTML}</div>` : ''}
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
}

function deleteContrat(e, cid) {
  e.stopPropagation();
  if (!confirm('Supprimer ce contrat et tous ses investissements ?')) return;
  data = data.filter(x => x.id !== cid); save(); render();
}

// ── MODALS ───────────────────────────────────────────────────────────────────

function openContratModal() {
  document.getElementById('modals').innerHTML = `
    <div class="modal-wrap" onclick="closeModal(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-title"><i class="ti ti-file-plus" aria-hidden="true" style="margin-right:6px;"></i>Nouveau contrat</div>
        <div class="fr"><label>Nom du client / titulaire</label><input id="m-client" type="text" placeholder="ex: Famille Martin"></div>
        <div class="fr"><label>N° de contrat Wealins</label><input id="m-num" type="text" placeholder="ex: WL-2025-003"></div>
        <div class="fr"><label>Banque dépositaire</label><input id="m-banque" type="text" placeholder="Indosuez Luxembourg" value="Indosuez Luxembourg"></div>
        <div class="mactions">
          <button class="btn-cancel" onclick="closeModal()">Annuler</button>
          <button class="btn-ok" onclick="addContrat()">Créer</button>
        </div>
      </div>
    </div>`;
}

function openProdModal(cid) {
  document.getElementById('modals').innerHTML = `
    <div class="modal-wrap" onclick="closeModal(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-title"><i class="ti ti-plus" aria-hidden="true" style="margin-right:6px;"></i>Ajouter un investissement</div>
        <input type="hidden" id="m-cid" value="${cid}">
        <div class="fr"><label>Nom du produit</label><input id="m-pname" type="text" placeholder="ex: Phoenix Memory Cash Plus"></div>
        <div class="fr"><label>Code ISIN</label><input id="m-isin" type="text" placeholder="ex: FR0014008LM5"></div>
        <div class="fr"><label>Type de produit</label>
          <select id="m-type">
            <option value="structuré">Produit structuré</option>
            <option value="ucits">Fonds UCITS</option>
            <option value="alternatif">Fonds alternatif</option>
          </select>
        </div>
        <div class="fr"><label>Montant</label><input id="m-montant" type="text" placeholder="ex: 150 000 €"></div>
        <div class="mactions">
          <button class="btn-cancel" onclick="closeModal()">Annuler</button>
          <button class="btn-ok" onclick="addProd()">Ajouter</button>
        </div>
      </div>
    </div>`;
}

function closeModal(e) {
  if (e && e.target.className !== 'modal-wrap') return;
  document.getElementById('modals').innerHTML = '';
}

// ── ADD ACTIONS ──────────────────────────────────────────────────────────────

function addContrat() {
  const client = (document.getElementById('m-client').value || '').trim();
  const num = (document.getElementById('m-num').value || '').trim();
  const banque = (document.getElementById('m-banque').value || 'Indosuez Luxembourg').trim();
  if (!client) { alert('Veuillez saisir le nom du client.'); return; }
  const id = Date.now();
  data.unshift({ id, client, num: num || '—', banque, prelim: {}, produits: [] });
  expContrat[id] = true;
  save(); document.getElementById('modals').innerHTML = ''; render();
}

function addProd() {
  const cid = parseInt(document.getElementById('m-cid').value);
  const name = (document.getElementById('m-pname').value || '').trim();
  const isin = (document.getElementById('m-isin').value || '').trim();
  const type = document.getElementById('m-type').value;
  const montant = (document.getElementById('m-montant').value || '—').trim();
  if (!name) { alert('Veuillez saisir le nom du produit.'); return; }
  const c = data.find(x => x.id === cid); if (!c) return;
  const pid = Date.now();
  c.produits.push({ id: pid, name, isin: isin || '—', type, montant, checks: {} });
  expProd[cid + '-' + pid] = true;
  save(); document.getElementById('modals').innerHTML = ''; render();
}

// ── INIT ─────────────────────────────────────────────────────────────────────

load();
render();
