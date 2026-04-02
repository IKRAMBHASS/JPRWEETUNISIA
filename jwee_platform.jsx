import { useState, useEffect, useRef } from "react";

const COLORS = {
  green: "#2e8b3a", greenDark: "#1a5c24", greenLight: "#e8f5e9",
  orange: "#e55b13", orangeLight: "#fff3ee",
  blue: "#1565c0", blueLight: "#e3f0ff",
  purple: "#7b1fa2", border: "#d0e4d0",
  surface: "#eef4ee", text: "#1a2e1a", muted: "#5a7060"
};

const AGENCIES_META = [
  { name: "FAO", color: "#0d47a1", bg: "#e3f2fd", icon: "🌾" },
  { name: "IFAD", color: "#1b5e20", bg: "#e8f5e9", icon: "🏡" },
  { name: "UN Women", color: "#880e4f", bg: "#fce4ec", icon: "♀" },
  { name: "WFP", color: "#e65100", bg: "#fff8e1", icon: "🍽" }
];

const INT_TYPES = ["Formation","Appui technique","Subvention / Intrants","Renforcement capacites","Acces au credit","Mise en marche","Infrastructure","Nutrition","Autre"];

// ── Mini Bar Chart ──────────────────────────────────────────────
function BarChart({ data, colors }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 160, padding: "0 8px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: colors[i % colors.length] }}>{d.value}</span>
          <div style={{ width: "100%", background: "#f0f0f0", borderRadius: 6, height: 120, display: "flex", alignItems: "flex-end" }}>
            <div style={{ width: "100%", background: colors[i % colors.length], borderRadius: 6, height: `${Math.max((d.value / max) * 100, 4)}%`, transition: "height 0.5s" }} />
          </div>
          <span style={{ fontSize: 9, color: COLORS.muted, textAlign: "center", fontWeight: 600 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Donut Chart ─────────────────────────────────────────────────
function DonutChart({ data, colors }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div style={{ textAlign: "center", padding: 40, color: COLORS.muted, fontSize: 13 }}>Aucune donnee</div>;
  let offset = 0;
  const r = 60, cx = 80, cy = 80, circumference = 2 * Math.PI * r;
  const slices = data.map((d, i) => {
    const pct = d.value / total;
    const dash = pct * circumference;
    const slice = { dash, offset: circumference - offset, color: colors[i], label: d.label, value: d.value };
    offset += dash;
    return slice;
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg width={160} height={160} viewBox="0 0 160 160">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0f0f0" strokeWidth={22} />
        {slices.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={22}
            strokeDasharray={`${s.dash} ${circumference - s.dash}`}
            strokeDashoffset={s.offset} style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "all 0.5s" }} />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={20} fontWeight={700} fill={COLORS.text}>{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={9} fill={COLORS.muted}>Total</text>
      </svg>
      <div style={{ flex: 1 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: colors[i], flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: COLORS.text, flex: 1 }}>{d.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: colors[i] }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Simple Map with SVG pins ─────────────────────────────────────
function MapView({ opas, interventions, filter }) {
  const filtered = filter === "all" ? opas : opas.filter(o => o.region === filter);
  const withGPS = filtered.filter(o => o.lat && o.lng);

  // Tunisia bounding box approx: lat 30-38, lng 7-12
  const toX = lng => ((lng - 7) / 5) * 340 + 30;
  const toY = lat => ((38 - lat) / 8) * 260 + 20;

  return (
    <div style={{ position: "relative" }}>
      <svg width="100%" viewBox="0 0 400 300" style={{ background: "#e8f4f8", borderRadius: 10, border: `2px solid ${COLORS.border}` }}>
        {/* Tunisia outline simplified */}
        <path d="M180,20 L220,25 L240,40 L250,60 L245,80 L260,100 L265,130 L255,160 L240,190 L220,220 L200,260 L185,275 L170,260 L155,230 L145,200 L140,170 L145,140 L155,110 L160,80 L165,50 Z"
          fill="#c8e6c9" stroke="#2e8b3a" strokeWidth={1.5} opacity={0.7} />
        {/* Region labels */}
        <text x={175} y={85} fontSize={9} fill="#1a5c24" fontWeight={600}>Jendouba</text>
        <text x={185} y={160} fontSize={9} fill="#e55b13" fontWeight={600}>Kairouan</text>
        {/* Markers */}
        {withGPS.map((o, i) => {
          const x = toX(o.lng);
          const y = toY(o.lat);
          const color = o.region === "Jendouba" ? COLORS.blue : COLORS.orange;
          const ic = interventions.filter(iv => iv.opaId === o.id).length;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={8} fill={color} stroke="#fff" strokeWidth={2} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))", cursor: "pointer" }} />
              {ic > 0 && <text x={x} y={y + 4} textAnchor="middle" fontSize={7} fill="#fff" fontWeight={700}>{ic}</text>}
              <title>{o.nom} — {o.region}{o.delegation ? ` (${o.delegation})` : ""} — {ic} intervention(s)</title>
            </g>
          );
        })}
        {withGPS.length === 0 && (
          <text x={200} y={150} textAnchor="middle" fontSize={12} fill={COLORS.muted}>Ajoutez des coordonnees GPS aux OPA pour les voir ici</text>
        )}
      </svg>
      <div style={{ marginTop: 10, display: "flex", gap: 16, fontSize: 12, color: COLORS.muted }}>
        <span>● <span style={{ color: COLORS.blue }}>Jendouba</span></span>
        <span>● <span style={{ color: COLORS.orange }}>Kairouan</span></span>
        <span style={{ marginLeft: "auto" }}>{withGPS.length} OPA localisee(s) sur {filtered.length}</span>
      </div>
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────
function Modal({ open, title, onClose, children, accentColor }) {
  if (!open) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(26,92,36,0.22)", backdropFilter: "blur(3px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 28, width: 560, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 16px 60px rgba(0,0,0,0.22)", borderTop: `5px solid ${accentColor || COLORS.green}` }}>
        <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1.15rem", color: COLORS.greenDark, marginBottom: 18 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

// ── Form Field ───────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.greenDark }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = { padding: "8px 10px", borderRadius: 7, border: `1.5px solid ${COLORS.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%" };

// ── Tag ─────────────────────────────────────────────────────────
function Tag({ region }) {
  const isJ = region === "Jendouba";
  return <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: isJ ? COLORS.blueLight : COLORS.orangeLight, color: isJ ? COLORS.blue : COLORS.orange }}>{region}</span>;
}

function Chip({ label, type }) {
  const styles = { ok: ["#e8f5e9","#1b5e20"], wa: ["#fff8e1","#e65100"], in: ["#e3f2fd","#0d47a1"] };
  const [bg, color] = styles[type] || styles.in;
  return <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: bg, color }}>{label}</span>;
}

// ── Btn ─────────────────────────────────────────────────────────
function Btn({ children, onClick, color = COLORS.green, small }) {
  return (
    <button onClick={onClick} style={{ padding: small ? "4px 10px" : "8px 16px", borderRadius: 7, border: "none", background: color, color: "#fff", fontFamily: "inherit", fontSize: small ? 12 : 13, fontWeight: 700, cursor: "pointer" }}>
      {children}
    </button>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────
function KpiCard({ icon, label, value, color }) {
  return (
    <div style={{ background: "#fff", borderRadius: 10, padding: "16px 18px", boxShadow: "0 2px 10px rgba(46,139,58,0.1)", border: `1px solid ${COLORS.border}`, borderTop: `4px solid ${color}` }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: "Georgia, serif", margin: "3px 0" }}>{value}</div>
    </div>
  );
}

// ── Panel ────────────────────────────────────────────────────────
function Panel({ title, action, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: 10, border: `1px solid ${COLORS.border}`, boxShadow: "0 2px 10px rgba(46,139,58,0.1)", overflow: "hidden", marginBottom: 18 }}>
      <div style={{ padding: "10px 16px", borderBottom: `2px solid ${COLORS.greenLight}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: COLORS.surface }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: COLORS.greenDark, fontFamily: "Georgia, serif" }}>{title}</h3>
        {action}
      </div>
      <div>{children}</div>
    </div>
  );
}

// ── Table ────────────────────────────────────────────────────────
function THead({ cols }) {
  return (
    <thead>
      <tr>{cols.map((c, i) => <th key={i} style={{ background: COLORS.surface, color: COLORS.greenDark, fontWeight: 700, padding: "8px 12px", textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em" }}>{c}</th>)}</tr>
    </thead>
  );
}

// ── Toast ────────────────────────────────────────────────────────
function Toast({ message, error }) {
  if (!message) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: error ? "#c62828" : COLORS.green, color: "#fff", padding: "11px 18px", borderRadius: 9, fontSize: 13, fontWeight: 700, boxShadow: "0 4px 18px rgba(0,0,0,0.2)" }}>
      {message}
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [opas, setOpas] = useState(() => { try { return JSON.parse(localStorage.getItem("jwee_opas") || "[]"); } catch { return []; } });
  const [interventions, setIntvs] = useState(() => { try { return JSON.parse(localStorage.getItem("jwee_ints") || "[]"); } catch { return []; } });
  const [toast, setToast] = useState(null);
  const [mapFilter, setMapFilter] = useState("all");

  // OPA modal state
  const [opaModal, setOpaModal] = useState(false);
  const [editOPA, setEditOPA] = useState(null);
  const [opaForm, setOpaForm] = useState({ nom:"", region:"", delegation:"", type:"", membres:"", femmes:"", lat:"", lng:"", notes:"" });
  const [opaFilter, setOpaFilter] = useState("all");

  // Intervention modal state
  const [intModal, setIntModal] = useState(false);
  const [editInt, setEditInt] = useState(null);
  const [intForm, setIntForm] = useState({ opaId:"", agency:"", type:"", date:"", beneficiaires:"", statut:"En cours", description:"" });
  const [intFilterA, setIntFilterA] = useState("all");
  const [intFilterR, setIntFilterR] = useState("all");

  function showToast(msg, err) {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 3000);
  }

  function saveOpas(arr) { setOpas(arr); try { localStorage.setItem("jwee_opas", JSON.stringify(arr)); } catch {} }
  function saveIntvs(arr) { setIntvs(arr); try { localStorage.setItem("jwee_ints", JSON.stringify(arr)); } catch {} }

  // OPA CRUD
  function openOpaModal(opa) {
    if (opa) { setEditOPA(opa.id); setOpaForm({ nom: opa.nom, region: opa.region, delegation: opa.delegation||"", type: opa.type||"", membres: opa.membres||"", femmes: opa.femmes||"", lat: opa.lat||"", lng: opa.lng||"", notes: opa.notes||"" }); }
    else { setEditOPA(null); setOpaForm({ nom:"", region:"", delegation:"", type:"", membres:"", femmes:"", lat:"", lng:"", notes:"" }); }
    setOpaModal(true);
  }
  function submitOPA() {
    if (!opaForm.nom.trim() || !opaForm.region) { showToast("Nom et region obligatoires", true); return; }
    const opa = { id: editOPA || String(Date.now()), ...opaForm, membres: parseInt(opaForm.membres)||0, femmes: parseInt(opaForm.femmes)||0, lat: parseFloat(opaForm.lat)||null, lng: parseFloat(opaForm.lng)||null };
    if (editOPA) { saveOpas(opas.map(o => o.id === editOPA ? opa : o)); showToast("OPA mise a jour"); }
    else { saveOpas([...opas, opa]); showToast("OPA ajoutee"); }
    setOpaModal(false);
  }
  function deleteOPA(id) {
    if (!confirm("Supprimer cette OPA?")) return;
    saveOpas(opas.filter(o => o.id !== id));
    saveIntvs(interventions.filter(i => i.opaId !== id));
    showToast("OPA supprimee");
  }

  // INT CRUD
  function openIntModal(it) {
    if (it) { setEditInt(it.id); setIntForm({ opaId: it.opaId, agency: it.agency, type: it.type, date: it.date||"", beneficiaires: it.beneficiaires||"", statut: it.statut||"En cours", description: it.description||"" }); }
    else { setEditInt(null); setIntForm({ opaId:"", agency:"", type:"", date:"", beneficiaires:"", statut:"En cours", description:"" }); }
    setIntModal(true);
  }
  function submitInt() {
    if (!intForm.opaId || !intForm.agency || !intForm.type) { showToast("OPA, agence et type obligatoires", true); return; }
    const opaObj = opas.find(o => o.id === intForm.opaId);
    const item = { id: editInt || String(Date.now()), ...intForm, opaName: opaObj?.nom||"", region: opaObj?.region||"", beneficiaires: parseInt(intForm.beneficiaires)||0 };
    if (editInt) { saveIntvs(interventions.map(i => i.id === editInt ? item : i)); showToast("Intervention mise a jour"); }
    else { saveIntvs([...interventions, item]); showToast("Intervention ajoutee"); }
    setIntModal(false);
  }
  function deleteInt(id) {
    if (!confirm("Supprimer?")) return;
    saveIntvs(interventions.filter(i => i.id !== id));
    showToast("Intervention supprimee");
  }

  const filteredOpas = opaFilter === "all" ? opas : opas.filter(o => o.region === opaFilter);
  const filteredInts = interventions.filter(i => (intFilterA === "all" || i.agency === intFilterA) && (intFilterR === "all" || i.region === intFilterR));
  const totalBen = interventions.reduce((s, i) => s + (i.beneficiaires||0), 0);

  const nav = [
    { id: "dashboard", label: "Tableau de bord", icon: "📊" },
    { id: "map", label: "Carte des OPA", icon: "🗺" },
    { id: "opas", label: "Gestion des OPA", icon: "🌾" },
    { id: "interventions", label: "Interventions", icon: "📋" },
    { id: "agencies", label: "Agences", icon: "🏛" },
    { id: "stats", label: "Statistiques", icon: "📈" }
  ];

  const select = (v, st) => <select value={v} onChange={e => st(e.target.value)} style={inputStyle}>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Open Sans', sans-serif", fontSize: 13, background: "#f5f7f5" }}>
      {/* SIDEBAR */}
      <div style={{ width: 230, background: COLORS.greenDark, display: "flex", flexDirection: "column", flexShrink: 0, boxShadow: "3px 0 16px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "10px 14px 12px", background: COLORS.green, borderBottom: "3px solid #e55b13" }}>
          <div style={{ fontFamily: "Georgia, serif", color: "#fff", fontSize: 13, fontWeight: 700 }}>JP RWEE — Plateforme</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 3, textTransform: "uppercase" }}>🇹🇳 Jendouba &amp; Kairouan</div>
        </div>
        <nav style={{ flex: 1, padding: "8px 0" }}>
          <div style={{ padding: "8px 14px 3px", fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>Navigation</div>
          {nav.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", width: "100%", border: "none", background: page === n.id ? "rgba(229,91,19,0.22)" : "transparent", borderLeft: page === n.id ? "3px solid #e55b13" : "3px solid transparent", color: page === n.id ? "#fff" : "rgba(255,255,255,0.72)", fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
              <span>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.18)" }}>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 5 }}>
            {[["FAO","#1565c0"],["IFAD","#2e7d32"],["UNW","#880e4f"],["WFP","#e65100"]].map(([l,c]) => (
              <span key={l} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 10, fontWeight: 700, color: "#fff", background: c }}>{l}</span>
            ))}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.32)" }}>Tunisie v1.0 · PMU Tunisie</div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* TOPBAR */}
        <div style={{ background: "#fff", borderBottom: `3px solid ${COLORS.green}`, padding: "0 22px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(46,139,58,0.1)", flexShrink: 0 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 16, color: COLORS.greenDark, fontWeight: 700 }}>
            {nav.find(n => n.id === page)?.label}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: COLORS.blueLight, color: COLORS.blue }}>● Jendouba</span>
            <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: COLORS.orangeLight, color: COLORS.orange }}>● Kairouan</span>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, padding: 22, overflowY: "auto" }}>

          {/* ── DASHBOARD ── */}
          {page === "dashboard" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
                <KpiCard icon="🌾" label="Total OPA" value={opas.length} color={COLORS.green} />
                <KpiCard icon="📋" label="Interventions" value={interventions.length} color={COLORS.orange} />
                <KpiCard icon="👩‍🌾" label="Beneficiaires" value={totalBen.toLocaleString("fr")} color={COLORS.blue} />
                <KpiCard icon="🏛" label="Agences actives" value={4} color={COLORS.purple} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
                <Panel title="OPA par region">
                  <div style={{ padding: 16 }}>
                    <DonutChart data={[{ label: "Jendouba", value: opas.filter(o=>o.region==="Jendouba").length }, { label: "Kairouan", value: opas.filter(o=>o.region==="Kairouan").length }]} colors={[COLORS.blue, COLORS.orange]} />
                  </div>
                </Panel>
                <Panel title="Interventions par agence">
                  <div style={{ padding: 16 }}>
                    <BarChart data={["FAO","IFAD","UN Women","WFP"].map(a => ({ label: a, value: interventions.filter(i=>i.agency===a).length }))} colors={["#1565c0","#2e8b3a","#880e4f","#e65100"]} />
                  </div>
                </Panel>
              </div>
              <Panel title="Dernieres OPA" action={<Btn small onClick={() => setPage("opas")} color={COLORS.green}>Voir tout</Btn>}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <THead cols={["OPA","Region","Delegation","Interventions","Beneficiaires"]} />
                  <tbody>
                    {opas.length === 0 && <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: COLORS.muted }}>Aucune OPA enregistree</td></tr>}
                    {[...opas].slice(-5).reverse().map(o => (
                      <tr key={o.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        <td style={{ padding: "8px 12px", fontWeight: 600 }}>{o.nom}</td>
                        <td style={{ padding: "8px 12px" }}><Tag region={o.region} /></td>
                        <td style={{ padding: "8px 12px" }}>{o.delegation || "-"}</td>
                        <td style={{ padding: "8px 12px" }}>{interventions.filter(i=>i.opaId===o.id).length}</td>
                        <td style={{ padding: "8px 12px" }}>{interventions.filter(i=>i.opaId===o.id).reduce((s,i)=>s+(i.beneficiaires||0),0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
            </div>
          )}

          {/* ── CARTE ── */}
          {page === "map" && (
            <div>
              <div style={{ marginBottom: 12 }}>
                <select value={mapFilter} onChange={e => setMapFilter(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
                  <option value="all">Toutes les regions</option>
                  <option value="Jendouba">Jendouba</option>
                  <option value="Kairouan">Kairouan</option>
                </select>
              </div>
              <MapView opas={opas} interventions={interventions} filter={mapFilter} />
              <div style={{ marginTop: 14, background: "#fff3e0", border: "1px solid #ffe0b2", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#e65100" }}>
                💡 Pour localiser une OPA sur la carte, ajoutez ses coordonnees GPS lors de la saisie (Latitude / Longitude). Ex: Jendouba = 36.5023, 8.7797 — Kairouan = 35.6781, 10.0963
              </div>
            </div>
          )}

          {/* ── OPA ── */}
          {page === "opas" && (
            <div>
              <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
                <Btn onClick={() => openOpaModal(null)} color={COLORS.green}>+ Nouvelle OPA</Btn>
                <select value={opaFilter} onChange={e => setOpaFilter(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
                  <option value="all">Toutes les regions</option>
                  <option value="Jendouba">Jendouba</option>
                  <option value="Kairouan">Kairouan</option>
                </select>
              </div>
              <Panel title={`OPA (${filteredOpas.length})`}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <THead cols={["Nom OPA","Region","Delegation","Type","Membres","% Femmes","GPS","Actions"]} />
                  <tbody>
                    {filteredOpas.length === 0 && <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: COLORS.muted }}>Aucune OPA — Cliquez Nouvelle OPA</td></tr>}
                    {filteredOpas.map(o => (
                      <tr key={o.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        <td style={{ padding: "8px 12px", fontWeight: 600 }}>{o.nom}</td>
                        <td style={{ padding: "8px 12px" }}><Tag region={o.region} /></td>
                        <td style={{ padding: "8px 12px" }}>{o.delegation || "-"}</td>
                        <td style={{ padding: "8px 12px" }}>{o.type || "-"}</td>
                        <td style={{ padding: "8px 12px" }}>{o.membres || 0}</td>
                        <td style={{ padding: "8px 12px" }}>{o.femmes ? o.femmes + "%" : "-"}</td>
                        <td style={{ padding: "8px 12px", fontSize: 11, fontFamily: "monospace" }}>{o.lat && o.lng ? `${o.lat}, ${o.lng}` : "-"}</td>
                        <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
                          <Btn small onClick={() => openOpaModal(o)} color={COLORS.muted}>✏</Btn>{" "}
                          <Btn small onClick={() => deleteOPA(o.id)} color="#c62828">🗑</Btn>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
            </div>
          )}

          {/* ── INTERVENTIONS ── */}
          {page === "interventions" && (
            <div>
              <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
                <Btn onClick={() => openIntModal(null)} color={COLORS.orange}>+ Nouvelle intervention</Btn>
                <select value={intFilterA} onChange={e => setIntFilterA(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
                  <option value="all">Toutes les agences</option>
                  {["FAO","IFAD","UN Women","WFP"].map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select value={intFilterR} onChange={e => setIntFilterR(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
                  <option value="all">Toutes les regions</option>
                  <option value="Jendouba">Jendouba</option>
                  <option value="Kairouan">Kairouan</option>
                </select>
              </div>
              <Panel title={`Interventions (${filteredInts.length})`}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <THead cols={["OPA","Region","Agence","Type","Date","Beneficiaires","Statut","Actions"]} />
                  <tbody>
                    {filteredInts.length === 0 && <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: COLORS.muted }}>Aucune intervention</td></tr>}
                    {filteredInts.map(it => (
                      <tr key={it.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        <td style={{ padding: "8px 12px", fontWeight: 600 }}>{it.opaName || "-"}</td>
                        <td style={{ padding: "8px 12px" }}><Tag region={it.region || "?"} /></td>
                        <td style={{ padding: "8px 12px", fontWeight: 700 }}>{it.agency}</td>
                        <td style={{ padding: "8px 12px" }}>{it.type}</td>
                        <td style={{ padding: "8px 12px" }}>{it.date ? new Date(it.date + "T00:00:00").toLocaleDateString("fr-FR") : "-"}</td>
                        <td style={{ padding: "8px 12px" }}>{it.beneficiaires || 0}</td>
                        <td style={{ padding: "8px 12px" }}><Chip label={it.statut} type={it.statut === "Terminee" ? "ok" : it.statut === "En cours" ? "wa" : "in"} /></td>
                        <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
                          <Btn small onClick={() => openIntModal(it)} color={COLORS.muted}>✏</Btn>{" "}
                          <Btn small onClick={() => deleteInt(it.id)} color="#c62828">🗑</Btn>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
            </div>
          )}

          {/* ── AGENCES ── */}
          {page === "agencies" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
              {AGENCIES_META.map(ag => {
                const ai = interventions.filter(i => i.agency === ag.name);
                const ben = ai.reduce((s, i) => s + (i.beneficiaires||0), 0);
                const jI = ai.filter(i => i.region === "Jendouba").length;
                const kI = ai.filter(i => i.region === "Kairouan").length;
                const opaC = new Set(ai.map(i => i.opaId)).size;
                return (
                  <div key={ag.name} style={{ background: "#fff", borderRadius: 10, border: `1px solid ${COLORS.border}`, overflow: "hidden", boxShadow: "0 2px 10px rgba(46,139,58,0.08)" }}>
                    <div style={{ padding: "14px 16px", background: ag.bg, display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${COLORS.border}` }}>
                      <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{ag.icon}</div>
                      <div>
                        <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, color: ag.color, fontSize: 15 }}>{ag.name}</div>
                        <div style={{ fontSize: 11, color: COLORS.muted }}>{ai.length} intervention(s)</div>
                      </div>
                    </div>
                    <div style={{ padding: 16 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                        {[["Interventions", ai.length], ["Beneficiaires", ben]].map(([l, v]) => (
                          <div key={l} style={{ background: COLORS.surface, borderRadius: 7, padding: 10, textAlign: "center" }}>
                            <div style={{ fontSize: 20, fontWeight: 700, color: ag.color, fontFamily: "Georgia, serif" }}>{v}</div>
                            <div style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase", fontWeight: 700 }}>{l}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <Chip label={`Jendouba: ${jI}`} type="in" />
                        <Chip label={`Kairouan: ${kI}`} type="wa" />
                        <Chip label={`${opaC} OPA`} type="ok" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── STATS ── */}
          {page === "stats" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
                <Panel title="Interventions par type">
                  <div style={{ padding: 16 }}>
                    {(() => {
                      const types = {};
                      interventions.forEach(i => { types[i.type] = (types[i.type]||0) + 1; });
                      const data = Object.entries(types).map(([label, value]) => ({ label, value }));
                      return data.length ? <BarChart data={data} colors={["#1565c0","#2e8b3a","#880e4f","#e65100","#6a1b9a","#00838f","#f57c00","#4e342e"]} /> : <div style={{ textAlign: "center", padding: 40, color: COLORS.muted }}>Aucune donnee</div>;
                    })()}
                  </div>
                </Panel>
                <Panel title="Beneficiaires par region">
                  <div style={{ padding: 16 }}>
                    <BarChart data={["Jendouba","Kairouan"].map(r => ({ label: r, value: interventions.filter(i=>i.region===r).reduce((s,i)=>s+(i.beneficiaires||0),0) }))} colors={[COLORS.blue, COLORS.orange]} />
                  </div>
                </Panel>
              </div>
              <Panel title="Couverture par OPA (beneficiaires)">
                <div style={{ padding: 16 }}>
                  {opas.length === 0 && <div style={{ textAlign: "center", padding: 32, color: COLORS.muted }}>Aucune OPA enregistree</div>}
                  {opas.map(o => {
                    const b = interventions.filter(i=>i.opaId===o.id).reduce((s,i)=>s+(i.beneficiaires||0),0);
                    const max = Math.max(...opas.map(ox => interventions.filter(i=>i.opaId===ox.id).reduce((s,i)=>s+(i.beneficiaires||0),0)), 1);
                    const pct = Math.round(b / max * 100);
                    return (
                      <div key={o.id} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{o.nom} <Tag region={o.region} /></span>
                          <span style={{ fontSize: 12, color: COLORS.muted }}>{b} beneficiaires</span>
                        </div>
                        <div style={{ background: COLORS.greenLight, borderRadius: 5, height: 8 }}>
                          <div style={{ height: "100%", borderRadius: 5, background: o.region === "Kairouan" ? COLORS.orange : COLORS.green, width: `${pct}%`, transition: "width 0.5s" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            </div>
          )}
        </div>
      </div>

      {/* MODAL OPA */}
      <Modal open={opaModal} title={editOPA ? "Modifier OPA" : "Nouvelle OPA"} onClose={() => setOpaModal(false)}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <Field label="Nom de l'OPA *"><input style={inputStyle} value={opaForm.nom} onChange={e => setOpaForm({...opaForm, nom: e.target.value})} placeholder="ex: GDA Femmes de Bou Salem" /></Field>
          </div>
          <Field label="Region *">
            <select style={inputStyle} value={opaForm.region} onChange={e => setOpaForm({...opaForm, region: e.target.value})}>
              <option value="">-- Choisir --</option>
              <option value="Jendouba">Jendouba</option>
              <option value="Kairouan">Kairouan</option>
            </select>
          </Field>
          <Field label="Delegation"><input style={inputStyle} value={opaForm.delegation} onChange={e => setOpaForm({...opaForm, delegation: e.target.value})} placeholder="ex: Jendouba Nord" /></Field>
          <Field label="Type d'OPA">
            <select style={inputStyle} value={opaForm.type} onChange={e => setOpaForm({...opaForm, type: e.target.value})}>
              <option value="">-- Choisir --</option>
              {["GDA","SMSA","Association","Cooperative","Autre"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Membres"><input style={inputStyle} type="number" value={opaForm.membres} onChange={e => setOpaForm({...opaForm, membres: e.target.value})} placeholder="0" /></Field>
          <Field label="% Femmes"><input style={inputStyle} type="number" value={opaForm.femmes} onChange={e => setOpaForm({...opaForm, femmes: e.target.value})} placeholder="0" min="0" max="100" /></Field>
          <Field label="Latitude GPS"><input style={inputStyle} type="number" value={opaForm.lat} onChange={e => setOpaForm({...opaForm, lat: e.target.value})} placeholder="ex: 36.5023" step="0.0001" /></Field>
          <Field label="Longitude GPS"><input style={inputStyle} type="number" value={opaForm.lng} onChange={e => setOpaForm({...opaForm, lng: e.target.value})} placeholder="ex: 8.7797" step="0.0001" /></Field>
          <div style={{ gridColumn: "1/-1" }}>
            <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 65, resize: "vertical" }} value={opaForm.notes} onChange={e => setOpaForm({...opaForm, notes: e.target.value})} placeholder="Informations complementaires..." /></Field>
          </div>
        </div>
        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end", marginTop: 18, paddingTop: 14, borderTop: `1px solid ${COLORS.border}` }}>
          <Btn onClick={() => setOpaModal(false)} color={COLORS.muted}>Annuler</Btn>
          <Btn onClick={submitOPA} color={COLORS.green}>Enregistrer</Btn>
        </div>
      </Modal>

      {/* MODAL INTERVENTION */}
      <Modal open={intModal} title={editInt ? "Modifier intervention" : "Nouvelle intervention"} onClose={() => setIntModal(false)} accentColor={COLORS.orange}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <Field label="OPA concernee *">
              <select style={inputStyle} value={intForm.opaId} onChange={e => setIntForm({...intForm, opaId: e.target.value})}>
                <option value="">-- Choisir une OPA --</option>
                {opas.map(o => <option key={o.id} value={o.id}>{o.nom} ({o.region})</option>)}
              </select>
            </Field>
          </div>
          <Field label="Agence *">
            <select style={inputStyle} value={intForm.agency} onChange={e => setIntForm({...intForm, agency: e.target.value})}>
              <option value="">-- Choisir --</option>
              {["FAO","IFAD","UN Women","WFP"].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Type d'intervention *">
            <select style={inputStyle} value={intForm.type} onChange={e => setIntForm({...intForm, type: e.target.value})}>
              <option value="">-- Choisir --</option>
              {INT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Date"><input style={inputStyle} type="date" value={intForm.date} onChange={e => setIntForm({...intForm, date: e.target.value})} /></Field>
          <Field label="Beneficiaires"><input style={inputStyle} type="number" value={intForm.beneficiaires} onChange={e => setIntForm({...intForm, beneficiaires: e.target.value})} placeholder="0" /></Field>
          <Field label="Statut">
            <select style={inputStyle} value={intForm.statut} onChange={e => setIntForm({...intForm, statut: e.target.value})}>
              <option value="En cours">En cours</option>
              <option value="Terminee">Terminee</option>
              <option value="Planifiee">Planifiee</option>
            </select>
          </Field>
          <div style={{ gridColumn: "1/-1" }}>
            <Field label="Description"><textarea style={{ ...inputStyle, minHeight: 65, resize: "vertical" }} value={intForm.description} onChange={e => setIntForm({...intForm, description: e.target.value})} placeholder="Details..." /></Field>
          </div>
        </div>
        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end", marginTop: 18, paddingTop: 14, borderTop: `1px solid ${COLORS.border}` }}>
          <Btn onClick={() => setIntModal(false)} color={COLORS.muted}>Annuler</Btn>
          <Btn onClick={submitInt} color={COLORS.orange}>Enregistrer</Btn>
        </div>
      </Modal>

      {/* TOAST */}
      {toast && <Toast message={toast.msg} error={toast.err} />}
    </div>
  );
}
