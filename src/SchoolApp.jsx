import React, { useMemo, useState } from 'react';
import './school.css';

const navigation = [
  ['overview', '⌂', 'Muhtasari'],
  ['students', '♙', 'Wanafunzi'],
  ['attendance', '✓', 'Mahudhurio'],
  ['results', '▤', 'Matokeo'],
  ['boarding', '⌂', 'Bweni'],
  ['transport', '↗', 'Usafiri wa shule'],
  ['hostels', '⌂', 'Hosteli za nje'],
  ['parents', '♧', 'Wazazi'],
];
const demoStudents = [
  { id: 'ES-001', name: 'Amina Joseph', className: 'Form 2', gender: 'Msichana', status: 'Hai', guardian: 'Rehema Joseph' },
  { id: 'ES-002', name: 'Baraka Peter', className: 'Form 4', gender: 'Mvulana', status: 'Hai', guardian: 'Peter Mushi' },
  { id: 'ES-003', name: 'Neema Daniel', className: 'Form 1', gender: 'Msichana', status: 'Hai', guardian: 'Daniel John' },
  { id: 'ES-004', name: 'Hassan Ally', className: 'Form 3', gender: 'Mvulana', status: 'Hai', guardian: 'Asha Ally' },
  { id: 'ES-005', name: 'Grace Michael', className: 'Form 6', gender: 'Msichana', status: 'Hai', guardian: 'Michael George' },
];
const modules = {
  overview: { title: 'Muhtasari wa shule', subtitle: 'Muonekano wa shughuli muhimu za shule kwa siku hii.' },
  students: { title: 'Usajili wa wanafunzi', subtitle: 'Tafuta wanafunzi na uandae usajili wa kidijitali.' },
  attendance: { title: 'Mahudhurio', subtitle: 'Fuatilia mahudhurio ya darasa na taarifa za kutokuwepo.' },
  results: { title: 'Matokeo ya mitihani', subtitle: 'Panga matokeo kwa darasa, somo na muhula.' },
  boarding: { title: 'Bweni la shule', subtitle: 'Simamia nafasi na upangaji wa wanafunzi wa bweni.' },
  transport: { title: 'Usafiri wa shule', subtitle: 'Ratiba, njia za basi na orodha ya wanafunzi wanaotumia basi.' },
  hostels: { title: 'Hosteli za nje', subtitle: 'Hosteli zinazojitegemea zinazosimamiwa kwa uratibu wa shule.' },
  parents: { title: 'Portal ya wazazi', subtitle: 'Taarifa za maendeleo ya mwanafunzi na mawasiliano ya mzazi.' },
};
function IconMark({ children }) { return <span className="es-icon">{children}</span>; }

export default function SchoolApp() {
  const [active, setActive] = useState('overview');
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState(demoStudents);
  const [showRegistration, setShowRegistration] = useState(false);
  const [notice, setNotice] = useState('Unaangalia data za mfano. Database na akaunti bado hazijaunganishwa.');
  const [form, setForm] = useState({ name: '', className: 'Form 1', guardian: '', gender: 'Msichana' });
  const filteredStudents = useMemo(() => students.filter((s) => [s.id, s.name, s.className, s.guardian].some((v) => v.toLowerCase().includes(query.toLowerCase()))), [students, query]);
  const current = modules[active] || modules.overview;
  function registerStudent(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.guardian.trim()) { setNotice('Jaza jina la mwanafunzi na jina la mzazi/mlezi.'); return; }
    const next = { id: 'ES-' + String(students.length + 1).padStart(3, '0'), name: form.name.trim(), className: form.className, guardian: form.guardian.trim(), gender: form.gender, status: 'Rasimu' };
    setStudents((old) => [next, ...old]);
    setForm({ name: '', className: 'Form 1', guardian: '', gender: 'Msichana' });
    setShowRegistration(false);
    setNotice('Rekodi imeongezwa kwenye mfano wa ukurasa huu tu; haijahifadhiwa kwenye database.');
  }
  return <div className="es-app">
    <aside className="es-sidebar">
      <div className="es-brand"><div className="es-logo">E</div><div><strong>ElimuSmart</strong><small>SCHOOL MANAGEMENT</small></div></div>
      <div className="es-school-switch"><span className="es-school-avatar">🏫</span><span><b>Shule Yangu</b><small>Usimamizi wa shule</small></span><span className="es-chevron">⌄</span></div>
      <div className="es-nav-label">MENYU KUU</div>
      <nav className="es-nav">{navigation.map(([key, icon, label]) => <button key={key} className={active === key ? 'active' : ''} onClick={() => setActive(key)}><IconMark>{icon}</IconMark><span>{label}</span>{key === 'parents' && <i>•</i>}</button>)}</nav>
      <div className="es-sidebar-bottom"><div className="es-help-icon">?</div><div><b>Unahitaji msaada?</b><small>Jifunze kutumia mfumo</small></div><button aria-label="Msaada" onClick={() => setNotice('Mwongozo wa mfumo utaongezwa katika hatua inayofuata.')}>↗</button></div>
      <div className="es-profile"><div className="es-avatar">AD</div><div><b>School Admin</b><small>Msimamizi</small></div><button aria-label="Chaguo za akaunti" onClick={() => setNotice('Usimamizi wa akaunti utaunganishwa baada ya backend.')}>•••</button></div>
    </aside>
    <main className="es-main">
      <header className="es-topbar"><button className="es-mobile-menu" onClick={() => setNotice('Chagua sehemu kwenye menyu ya upande.')}>☰</button><div className="es-breadcrumb">ElimuSmart <span>/</span> {current.title}</div><div className="es-top-actions"><button className="es-icon-button" aria-label="Arifa" onClick={() => setNotice('Huna arifa mpya za mfano.')}>♧<i /></button><button className="es-help-button" onClick={() => setNotice('Msaada wa mfumo utaongezwa katika hatua inayofuata.')}>? <span>Msaada</span></button><div className="es-avatar">AD</div></div></header>
      <div className="es-content">
        <div className="es-welcome-row"><div><div className="es-eyebrow">ELIMUSMART · USIMAMIZI WA SHULE</div><h1>{current.title}</h1><p>{current.subtitle}</p></div><div className="es-date-pill"><span>▦</span> Muhula wa mfano · 2026</div></div>
        {notice && <div className="es-notice"><span>ⓘ</span><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Funga taarifa">×</button></div>}
        {active === 'overview' && <><div className="es-stats">
          <article><div className="es-stat-top"><span>Jumla ya wanafunzi</span><span className="es-stat-icon blue">♙</span></div><strong>{students.length.toLocaleString()}</strong><small><b className="es-positive">+12%</b> dhidi ya muhula uliopita</small><div className="es-spark blue-spark">▁▃▂▅▄▆▅▇</div></article>
          <article><div className="es-stat-top"><span>Mahudhurio leo</span><span className="es-stat-icon green">✓</span></div><strong>94.8%</strong><small><b className="es-positive">+2.4%</b> wiki hii</small><div className="es-spark green-spark">▂▃▅▄▆▅▇▆</div></article>
          <article><div className="es-stat-top"><span>Wanafunzi wa bweni</span><span className="es-stat-icon amber">⌂</span></div><strong>248</strong><small>Katika bweni la shule</small><div className="es-spark amber-spark">▁▂▄▃▅▆▅▇</div></article>
          <article><div className="es-stat-top"><span>Matokeo yameingizwa</span><span className="es-stat-icon violet">▤</span></div><strong>76%</strong><small>Kwa muhula wa mfano</small><div className="es-progress"><span style={{width:'76%'}} /></div></article>
        </div>
        <div className="es-dashboard-grid"><section className="es-panel es-chart-panel"><div className="es-panel-heading"><div><h2>Muhtasari wa mahudhurio</h2><p>Wastani wa mahudhurio kwa siku · data ya mfano</p></div><button onClick={() => setActive('attendance')}>Tazama ripoti ↗</button></div><div className="es-chart-legend"><span><i /> Waliohudhuria</span><span><i /> Hawakuhudhuria</span></div><div className="es-chart">{[['Jumatatu',84,16],['Jumanne',91,9],['Jumatano',87,13],['Alhamisi',95,5],['Ijumaa',89,11]].map(([day,present,absent]) => <div className="es-chart-column" key={day}><div className="es-bar-stack"><span style={{height:present+'%'}} /><i style={{height:absent+'%'}} /></div><small>{day}</small></div>)}</div></section>
        <section className="es-panel es-tasks"><div className="es-panel-heading"><div><h2>Shughuli za haraka</h2><p>Vitu vinavyohitaji umakini</p></div><span className="es-task-count">3</span></div>{[['♙','Usajili wa wanafunzi','Kagua taarifa mpya','students'],['▤','Kuingiza matokeo','Form 4 · Muhula wa mfano','results'],['↗','Ratiba za usafiri','Kagua njia za mabasi','transport']].map(([icon,title,desc,key])=><button className="es-task" key={key} onClick={() => setActive(key)}><span>{icon}</span><div><b>{title}</b><small>{desc}</small></div><strong>›</strong></button>)}</section></div>
        <section className="es-panel es-recent"><div className="es-panel-heading"><div><h2>Wanafunzi wa hivi karibuni</h2><p>Rekodi za mfano zilizopo kwenye skrini</p></div><button onClick={() => setActive('students')}>Wanafunzi wote ↗</button></div><StudentTable rows={students.slice(0,4)} /></section></>}
        {active === 'students' && <section className="es-panel es-students"><div className="es-panel-heading"><div><h2>Orodha ya wanafunzi</h2><p>Jumla ya {students.length} rekodi za mfano</p></div><button className="es-primary-button" onClick={() => setShowRegistration(true)}>＋ Sajili mwanafunzi</button></div><div className="es-table-tools"><label>⌕ <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tafuta jina, namba au darasa..." /></label><button onClick={() => setNotice('Kichujio cha darasa kitaunganishwa na data halisi.')}>☷ Chuja</button><button onClick={() => setNotice('Uhamishaji wa CSV utaongezwa baada ya backend.')}>⇩ Export</button></div><StudentTable rows={filteredStudents} /></section>}
        {active !== 'overview' && active !== 'students' && <ModulePanel active={active} setNotice={setNotice} setActive={setActive} />}
        <footer className="es-footer"><span>© 2026 ElimuSmartSystem</span><span>Imeundwa kwa shule za Tanzania <b>🇹🇿</b> · <a href="https://github.com/JMK-YERE/SOKORA" target="_blank" rel="noreferrer">Mfumo wa shule</a></span></footer>
      </div>
    </main>
    {showRegistration && <div className="es-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowRegistration(false); }}><form className="es-modal" onSubmit={registerStudent}><button type="button" className="es-modal-close" onClick={() => setShowRegistration(false)}>×</button><div className="es-eyebrow">USAJILI WA MWANAFUNZI</div><h2>Ongeza mwanafunzi</h2><p>Hii ni fomu ya awali ya kuonyesha mtiririko wa usajili.</p><label>Jina kamili<input autoFocus value={form.name} onChange={(e) => setForm({...form,name:e.target.value})} placeholder="Mf. Amina Joseph" /></label><div className="es-form-row"><label>Darasa<select value={form.className} onChange={(e) => setForm({...form,className:e.target.value})}>{['Form 1','Form 2','Form 3','Form 4','Form 5','Form 6'].map((x)=><option key={x}>{x}</option>)}</select></label><label>Jinsia<select value={form.gender} onChange={(e) => setForm({...form,gender:e.target.value})}><option>Msichana</option><option>Mvulana</option></select></label></div><label>Mzazi / mlezi<input value={form.guardian} onChange={(e) => setForm({...form,guardian:e.target.value})} placeholder="Jina la mzazi au mlezi" /></label><div className="es-modal-actions"><button type="button" className="es-secondary-button" onClick={() => setShowRegistration(false)}>Ghairi</button><button type="submit" className="es-primary-button">Ongeza rekodi</button></div><small className="es-form-note">Rekodi itabaki kwenye browser hii tu hadi database iunganishwe.</small></form></div>}
  </div>;
}
function StudentTable({ rows }) {
  if (!rows.length) return <div className="es-empty">Hakuna mwanafunzi aliyepatikana kwa utafutaji huu.</div>;
  return <div className="es-table-wrap"><table className="es-table"><thead><tr><th>NAMBA</th><th>MWANAFUNZI</th><th>DARASA</th><th>MZAZI / MLEZI</th><th>HALI</th><th></th></tr></thead><tbody>{rows.map((s) => <tr key={s.id}><td><span className="es-student-id">{s.id}</span></td><td><div className="es-student-cell"><span className="es-student-avatar">{s.name.split(' ').map((n)=>n[0]).slice(0,2).join('')}</span><b>{s.name}</b></div></td><td>{s.className}</td><td>{s.guardian}</td><td><span className={'es-status '+(s.status === 'Hai' ? 'good' : 'pending')}>{s.status}</span></td><td><button className="es-row-menu" aria-label={'Chaguo za '+s.name}>•••</button></td></tr>)}</tbody></table></div>;
}
function ModulePanel({ active, setNotice, setActive }) {
  const configs = {
    attendance: { icon:'✓', title:'Mahudhurio ya leo', desc:'Chagua darasa ili kuandaa orodha ya mahudhurio.', cards:[['Form 1','42 wanafunzi','Mahudhurio hayajaingizwa'],['Form 2','38 wanafunzi','Mahudhurio hayajaingizwa'],['Form 3','45 wanafunzi','Mahudhurio hayajaingizwa'],['Form 4','51 wanafunzi','Mahudhurio hayajaingizwa']] },
    results: { icon:'▤', title:'Usimamizi wa matokeo', desc:'Matokeo ya mfano kwa madarasa ya sekondari.', cards:[['Form 2','Muhula wa I','Rasimu'],['Form 4','Mock Examination','Inasubiri'],['Form 6','Muhula wa I','Rasimu']] },
    boarding: { icon:'⌂', title:'Nafasi za bweni la shule', desc:'Tenganisha bweni la shule na hosteli zinazosimamiwa nje.', cards:[['Bweni la wavulana','120 nafasi','84 zimechukuliwa'],['Bweni la wasichana','140 nafasi','112 zimechukuliwa'],['Bweni la ziada','30 nafasi','52% zimechukuliwa']] },
    transport: { icon:'↗', title:'Njia na ratiba za mabasi', desc:'GPS ni kipengele cha hiari; hatua ya kwanza ni njia na ratiba.', cards:[['Njia A · Mjini','06:30 · 16:00','Wanafunzi 34'],['Njia B · Nje ya mji','06:00 · 16:30','Wanafunzi 27'],['Njia C · Kaskazini','06:15 · 16:15','Wanafunzi 19']] },
    hostels: { icon:'⌂', title:'Hosteli za nje', desc:'Rekodi hosteli, msimamizi, uwezo na wanafunzi waliopangiwa.', cards:[['Hosteli ya Amani','Msimamizi: mfano','Nafasi 45'],['Hosteli ya Tumaini','Msimamizi: mfano','Nafasi 30']] },
    parents: { icon:'♧', title:'Mawasiliano ya wazazi', desc:'Portal na SMS zitawezesha shule kutuma taarifa kwa wazazi.', cards:[['Matokeo ya mwanafunzi','Portal ya mzazi','Inapangwa'],['Taarifa za mahudhurio','SMS / portal','Inapangwa'],['Taarifa za shule','Ujumbe wa jumla','Inapangwa']] },
  };
  const c = configs[active] || configs.attendance;
  return <section className="es-panel es-module-panel"><div className="es-module-banner"><span>{c.icon}</span><div><h2>{c.title}</h2><p>{c.desc}</p></div></div><div className="es-module-grid">{c.cards.map(([title,meta,status])=><article className="es-module-card" key={title}><div className="es-module-card-icon">{c.icon}</div><h3>{title}</h3><p>{meta}</p><span>{status}</span><button onClick={() => setNotice('Kipengele hiki ni muundo wa awali; kitahitaji API, ruhusa na data ya shule.')}>Fungua maelezo ↗</button></article>)}</div>{active === 'boarding' && <div className="es-inline-note">Shule zisizo na mabasi au bweni zinaweza kutumia moduli zinazowahusu pekee.</div>}{active === 'transport' && <div className="es-inline-note">Ramani ya GPS haitawashwa kwa chaguo-msingi; inaweza kuongezwa baadaye kwa idhini ya shule na wazazi.</div>}{active === 'results' && <button className="es-primary-button es-module-cta" onClick={() => setNotice('Fomu ya kuingiza alama itajengwa pamoja na kanuni za jumla na ripoti za matokeo.')}>＋ Andaa kuingiza matokeo</button>}{active === 'parents' && <button className="es-primary-button es-module-cta" onClick={() => setNotice('SMS itahitaji huduma ya mtoa huduma wa SMS na ruhusa za shule.')}>Andaa taarifa kwa wazazi</button>}</section>;
}
