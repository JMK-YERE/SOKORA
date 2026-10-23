import { useMemo, useState } from 'react';

const roles = [
  { id: 'admin', label: 'System Administrator', short: 'System Admin' },
  { id: 'school', label: 'School Administrator / Headteacher', short: 'School Admin' },
  { id: 'teacher', label: 'Teacher', short: 'Teacher' },
  { id: 'student', label: 'Student', short: 'Student' },
  { id: 'parent', label: 'Parent / Guardian', short: 'Parent' },
  { id: 'accountant', label: 'Accountant', short: 'Accountant' },
  { id: 'transport', label: 'Transport Manager', short: 'Transport' },
  { id: 'boarding', label: 'Boarding Manager', short: 'Boarding' },
];

const navItems = [
  { id: 'overview', label: 'Dashboard', icon: '▦', roles: ['admin', 'school', 'teacher', 'student', 'parent', 'accountant', 'transport', 'boarding'] },
  { id: 'students', label: 'Students', icon: '♙', roles: ['admin', 'school', 'teacher'] },
  { id: 'academics', label: 'Academics & Results', icon: '▤', roles: ['admin', 'school', 'teacher', 'student', 'parent'] },
  { id: 'attendance', label: 'Attendance', icon: '◷', roles: ['admin', 'school', 'teacher', 'student', 'parent'] },
  { id: 'teachers', label: 'Teachers & Classes', icon: '♧', roles: ['admin', 'school', 'teacher'] },
  { id: 'fees', label: 'Fees & Finance', icon: 'TSh', roles: ['admin', 'school', 'accountant', 'parent'] },
  { id: 'transport', label: 'Transport & Routes', icon: '▰', roles: ['admin', 'school', 'transport', 'parent'] },
  { id: 'boarding', label: 'Boarding & Hostels', icon: '⌂', roles: ['admin', 'school', 'boarding', 'parent'] },
  { id: 'announcements', label: 'Announcements', icon: '◉', roles: ['admin', 'school', 'teacher', 'student', 'parent'] },
  { id: 'reports', label: 'Reports', icon: '▥', roles: ['admin', 'school', 'teacher', 'accountant', 'transport', 'boarding'] },
  { id: 'settings', label: 'Settings', icon: '⚙', roles: ['admin', 'school'] },
];

const sampleStudents = [
  { id: 'ES-2026-001', name: 'Amina Juma', level: 'Standard 7', gender: 'Female', attendance: 'Present', average: '82%' },
  { id: 'ES-2026-002', name: 'Baraka Peter', level: 'Form 2', gender: 'Male', attendance: 'Present', average: '76%' },
  { id: 'ES-2026-003', name: 'Neema Joseph', level: 'Form 4', gender: 'Female', attendance: 'Absent', average: '89%' },
  { id: 'ES-2026-004', name: 'Daniel Michael', level: 'Standard 5', gender: 'Male', attendance: 'Present', average: '71%' },
];

const moduleDetails = {
  students: { title: 'Student Records', subtitle: 'Manage admissions, student profiles, guardians and class placement.', action: 'Register student', stats: [['Registered students', '—'], ['New admissions', '—'], ['Transfers pending', '—']], note: 'Student records will appear here after the school database and authentication are connected.' },
  academics: { title: 'Academics & Results', subtitle: 'Set up classes, subjects, examinations, grading and report cards.', action: 'Create examination', stats: [['Active classes', '—'], ['Examinations', '—'], ['Reports ready', '—']], note: 'Marks, grading rules and report cards must be connected to the real academic database.' },
  attendance: { title: 'Attendance Management', subtitle: 'Record daily attendance and follow up student absences.', action: 'Record attendance', stats: [['Today present', '—'], ['Absent today', '—'], ['Awaiting review', '—']], note: 'Live attendance is not connected yet. No attendance records have been saved.' },
  teachers: { title: 'Teachers & Classes', subtitle: 'Manage staff profiles, subjects, streams and class assignments.', action: 'Add teacher', stats: [['Teachers', '—'], ['Classes', '—'], ['Subjects', '—']], note: 'Teacher and class information will load after backend integration.' },
  fees: { title: 'Fees & Finance', subtitle: 'Track fee structures, invoices, receipts and outstanding balances.', action: 'Create fee invoice', stats: [['Collected this term', '—'], ['Outstanding', '—'], ['Receipts issued', '—']], note: 'No payments are processed or recorded in this preview. Connect and test a payment workflow before use.' },
  transport: { title: 'Transport & Routes', subtitle: 'Organise buses, drivers, stops, pickup schedules and assigned students.', action: 'Add bus route', stats: [['Registered buses', '—'], ['Active routes', '—'], ['Students assigned', '—']], note: 'Bus routes are not live. GPS tracking is a future optional integration.' },
  boarding: { title: 'Boarding & Hostels', subtitle: 'Manage dormitories, room capacity, bed allocation and boarding records.', action: 'Add dormitory', stats: [['Dormitories', '—'], ['Occupied beds', '—'], ['Available beds', '—']], note: 'Enable this module only for schools with boarding. External hostels remain a separate optional module.' },
  announcements: { title: 'Announcements', subtitle: 'Share school notices, calendars, events and important updates.', action: 'Create announcement', stats: [['Published notices', '—'], ['Scheduled', '—'], ['SMS status', 'Not connected']], note: 'SMS sending is not enabled. Connect an SMS provider and test delivery before announcing that alerts are operational.' },
  reports: { title: 'Reports & Analytics', subtitle: 'Review academic, attendance, finance and school operations reports.', action: 'Prepare report', stats: [['Academic reports', '—'], ['Finance reports', '—'], ['Exports', 'PDF / Excel ready to connect']], note: 'Reports will use verified school data after backend and database integration.' },
  settings: { title: 'School Settings', subtitle: 'Configure school profile, academic years, grading rules and permissions.', action: 'Edit school profile', stats: [['School profile', 'Not configured'], ['Academic year', 'Not configured'], ['Data protection', 'Setup required']], note: 'Configure roles, school boundaries and access controls before adding real student information.' },
};

function Icon({ children }) { return <span className="ui-icon" aria-hidden="true">{children}</span>; }

export default function App() {
  const [view, setView] = useState('home');
  const [activeNav, setActiveNav] = useState('overview');
  const [role, setRole] = useState('school');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState('');
  const [toast, setToast] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);

  const roleInfo = roles.find((item) => item.id === role) || roles[1];
  const visibleNav = navItems.filter((item) => item.roles.includes(role));
  const filteredStudents = useMemo(() => sampleStudents.filter((student) => [student.id, student.name, student.level].join(' ').toLowerCase().includes(search.toLowerCase())), [search]);

  function showMessage(message) {
    setToast(message);
    window.setTimeout(() => setToast(''), 3200);
  }

  function openModule(id) {
    setActiveNav(id);
    setView('dashboard');
    setMobileMenu(false);
    if (id !== 'overview' && !moduleDetails[id]) showMessage('Sehemu hii inaandaliwa.');
  }

  function requestAction(label) {
    setModal(label);
  }

  const activeModule = moduleDetails[activeNav];

  return (
    <div className="site-shell">
      {view === 'home' ? (
        <>
          <header className="public-header">
            <a className="brand" href="#home" onClick={(event) => { event.preventDefault(); setView('home'); }}><span className="brand-mark">E</span><span><strong>ElimuSmart</strong><small>SCHOOL MANAGEMENT SYSTEM</small></span></a>
            <nav className="public-nav"><a href="#features">Features</a><a href="#how-it-works">How it works</a><a href="#about">About</a></nav>
            <div className="public-actions"><button className="btn btn-outline" onClick={() => setModal('Login')}>Log in</button><button className="btn btn-primary" onClick={() => setModal('Register your school')}>Register school <span>↗</span></button></div>
          </header>
          <main className="public-main" id="home">
            <section className="hero">
              <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot" /> BUILT FOR TANZANIAN SCHOOLS</div><h1>One school.<br /><span>One smart system.</span></h1><p>Manage students, academic results, fees, attendance and parent communication in one simple platform built for schools across Tanzania.</p><div className="hero-actions"><button className="btn btn-primary btn-large" onClick={() => setModal('Register your school')}>Get started <span>→</span></button><button className="btn btn-outline btn-large" onClick={() => { setView('dashboard'); setActiveNav('overview'); }}>Explore dashboard <span>↗</span></button></div><div className="hero-proof"><span className="proof-icon">✓</span><span>Primary to Form 6</span><i /> <span>Mobile friendly</span><i /> <span>Role-based access</span></div></div>
              <div className="hero-visual"><div className="visual-glow" /><div className="preview-window"><div className="preview-top"><div className="mini-brand"><span className="brand-mark mini">E</span><span><b>ElimuSmart</b><small>School dashboard</small></span></div><span className="preview-status"><i /> Preview</span></div><div className="preview-welcome"><span><small>MONDAY, 26 OCTOBER 2026</small><b>Good morning, School Admin</b></span><span className="preview-avatar">SA</span></div><div className="preview-stats"><div><small>Total students</small><b>1,248</b><span>Illustrative preview</span></div><div><small>Attendance</small><b>94.8%</b><span>Illustrative preview</span></div></div><div className="preview-chart"><div className="chart-title"><b>Academic overview</b><small>Sample visual only</small></div><div className="chart-bars">{[35,52,42,70,58,83,64,92,73,80,61,96].map((height, index) => <span key={index} style={{ height: height + '%' }} />)}</div><div className="chart-labels"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span></div></div><div className="preview-foot"><span><i className="dot-blue" /> Student management</span><span><i className="dot-gold" /> Academic records</span></div></div><div className="floating-note"><span className="floating-icon">✓</span><span><b>Designed for schools</b><small>Primary to Form 6</small></span></div></div>
            </section>
            <section className="trust-strip"><span>ONE PLATFORM FOR EVERY SCHOOL TEAM</span><div><b>Administration</b><i /><b>Teachers</b><i /><b>Parents</b><i /><b>Students</b><i /><b>School operations</b></div></section>
            <section className="features-section" id="features"><div className="section-intro"><div className="eyebrow">THE ELIMUSMART PLATFORM</div><h2>Everything your school needs.<br /><span>Connected in one place.</span></h2><p>Start with the essentials and enable additional modules as your school grows.</p></div><div className="feature-grid">{[
              ['♙','Student records','Admissions, student profiles, guardians, classes and academic history.'],
              ['▤','Academics & results','Examinations, configurable grading, attendance and report cards.'],
              ['TSh','Fees & finance','Fee structures, balances, receipts and financial summaries.'],
              ['◉','Parent communication','Parent portal, school notices and SMS integration when configured.'],
              ['▰','Transport management','Bus registration, routes, pickup stops and daily schedules.'],
              ['⌂','Boarding & hostels','Dormitories, room allocation and optional external hostel records.'],
            ].map(([icon, title, text]) => <article className="feature-card" key={title}><div className="feature-icon"><Icon>{icon}</Icon></div><h3>{title}</h3><p>{text}</p><button onClick={() => { setView('dashboard'); setActiveNav(({ 'Student records':'students','Academics & results':'academics','Fees & finance':'fees','Parent communication':'announcements','Transport management':'transport','Boarding & hostels':'boarding' })[title] || 'overview'); }}>Explore module <span>→</span></button></article>)}</div></section>
            <section className="how-section" id="how-it-works"><div><div className="eyebrow">SIMPLE TO GET STARTED</div><h2>Built around the way<br />schools actually work.</h2><p>ElimuSmart is planned for public and private schools, with access tailored to each person's responsibilities.</p><button className="btn btn-primary" onClick={() => setModal('Register your school')}>Register your school <span>→</span></button></div><div className="steps-list"><div><span>01</span><section><b>Set up your school</b><p>Configure school details, academic years, classes and subjects.</p></section></div><div><span>02</span><section><b>Invite your team</b><p>Give administrators, teachers and accountants the right permissions.</p></section></div><div><span>03</span><section><b>Connect families</b><p>Help parents access academic updates and school announcements.</p></section></div></div></section>
            <section className="cta-section" id="about"><div><div className="eyebrow">EDUCATION, CONNECTED</div><h2>Make school administration<br />simpler and clearer.</h2><p>ElimuSmartSystem — designed for Tanzanian education, from primary school to Form 6.</p></div><button className="btn btn-light" onClick={() => setModal('Register your school')}>Get started <span>→</span></button></section>
          </main>
          <footer className="public-footer"><a className="brand" href="#home"><span className="brand-mark">E</span><span><strong>ElimuSmart</strong><small>SCHOOL MANAGEMENT SYSTEM</small></span></a><p>Helping schools manage learning and operations with clarity.</p><span>© {new Date().getFullYear()} ElimuSmartSystem. All rights reserved.</span></footer>
        </>
      ) : (
        <div className="dashboard-layout">
          <aside className={'sidebar ' + (mobileMenu ? 'sidebar-open' : '')}><a className="brand sidebar-brand" href="#dashboard" onClick={(event) => { event.preventDefault(); setView('home'); }}><span className="brand-mark">E</span><span><strong>ElimuSmart</strong><small>SCHOOL PLATFORM</small></span></a><div className="school-switch"><span className="school-crest">ES</span><span><b>Demo School</b><small>School workspace</small></span><span className="chevron">⌄</span></div><div className="nav-caption">WORKSPACE</div><nav className="side-nav">{visibleNav.map((item) => <button key={item.id} className={activeNav === item.id ? 'side-link active' : 'side-link'} onClick={() => openModule(item.id)}><Icon>{item.icon}</Icon><span>{item.label}</span>{item.id === 'announcements' && <i className="nav-dot" />}</button>)}</nav><div className="sidebar-bottom"><div className="help-card"><span>?</span><b>Need help?</b><small>Get guidance setting up your school.</small><button onClick={() => setModal('Contact support')}>Contact support →</button></div><button className="back-home" onClick={() => setView('home')}>← Back to website</button></div></aside>
          <div className="dashboard-main"><header className="dashboard-header"><button className="mobile-menu-btn" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle navigation">☰</button><div className="breadcrumb">Workspace <span>/</span> {activeNav === 'overview' ? 'Dashboard' : navItems.find((item) => item.id === activeNav)?.label}</div><div className="dashboard-header-actions"><label className="dashboard-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search this page..." /></label><button className="icon-btn" aria-label="Notifications" onClick={() => openModule('announcements')}>♧<i /></button><div className="user-chip"><span className="user-avatar">SA</span><span><b>School Admin</b><small>{roleInfo.short}</small></span></div></div></header>
            <main className="dashboard-content"><div className="demo-banner"><span>i</span><div><b>Preview mode — sample interface</b><p>Numbers and student names shown here are illustrative only. This preview is not connected to a live school database.</p></div><button onClick={() => setModal('About preview mode')} aria-label="About preview">×</button></div><div className="dashboard-title-row"><div><div className="eyebrow">SCHOOL WORKSPACE</div><h1>{activeNav === 'overview' ? 'School overview' : activeModule?.title || 'School workspace'}</h1><p>{activeNav === 'overview' ? 'A clear view of your school operations and academic activity.' : activeModule?.subtitle || 'Manage your school operations from one place.'}</p></div><div className="title-actions"><label className="role-select"><span>Preview role</span><select value={role} onChange={(event) => { setRole(event.target.value); setActiveNav('overview'); }} aria-label="Preview dashboard role">{roles.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><button className="btn btn-primary" onClick={() => requestAction(activeNav === 'overview' ? 'Quick action' : activeModule?.action || 'Quick action')}>＋ {activeNav === 'overview' ? 'Quick action' : activeModule?.action || 'Quick action'}</button></div></div>
              {activeNav === 'overview' ? <><div className="metric-grid"><article className="metric-card"><div className="metric-label"><span>Total students</span><i className="metric-icon blue">♙</i></div><b>1,248</b><small className="metric-foot">Illustrative sample <span>↗</span></small></article><article className="metric-card"><div className="metric-label"><span>Attendance today</span><i className="metric-icon green">◷</i></div><b>94.8%</b><small className="metric-foot">Illustrative sample</small></article><article className="metric-card"><div className="metric-label"><span>Fee collection</span><i className="metric-icon gold">TSh</i></div><b>—</b><small className="metric-foot">Connect finance module</small></article><article className="metric-card"><div className="metric-label"><span>Pending tasks</span><i className="metric-icon purple">✓</i></div><b>—</b><small className="metric-foot">Live tasks not connected</small></article></div><div className="dashboard-grid"><section className="panel student-panel"><div className="panel-heading"><div><h2>Student directory</h2><p>Sample records for interface preview</p></div><button className="subtle-action" onClick={() => openModule('students')}>View students →</button></div><div className="table-scroll"><table><thead><tr><th>STUDENT</th><th>CLASS</th><th>ATTENDANCE</th><th>AVERAGE</th></tr></thead><tbody>{filteredStudents.map((student) => <tr key={student.id}><td><span className="student-avatar">{student.name.split(' ').map((part) => part[0]).join('').slice(0,2)}</span><span className="student-name"><b>{student.name}</b><small>{student.id}</small></span></td><td>{student.level}</td><td><span className={student.attendance === 'Present' ? 'status status-good' : 'status status-warn'}>{student.attendance}</span></td><td><b>{student.average}</b></td></tr>)}</tbody></table></div><div className="panel-note">Demo data only. Real student records will be loaded from the school database after integration.</div></section><section className="panel quick-panel"><div className="panel-heading"><div><h2>Quick access</h2><p>Common school tasks</p></div></div><div className="quick-actions">{[['♙','Register student','students'],['▤','Enter examination results','academics'],['◷','Record attendance','attendance'],['TSh','Review school fees','fees'],['◉','Send announcement','announcements'],['▥','View reports','reports']].map(([icon, label, target]) => <button key={target} onClick={() => { if (target === 'announcements') setActiveNav(target); else setActiveNav(target); }}><span className="quick-icon"><Icon>{icon}</Icon></span><b>{label}</b><span className="quick-arrow">↗</span></button>)}</div></section></div><section className="panel setup-panel"><div className="panel-heading"><div><h2>Get your school ready</h2><p>Suggested setup sequence before adding real student information</p></div><span className="setup-count">0 of 5 connected</span></div><div className="setup-steps">{[['01','School profile','Add the official school details'],['02','Academic year & classes','Configure classes, streams and subjects'],['03','User access','Create roles and secure logins'],['04','Student records','Connect registration and guardian records'],['05','Results & reports','Set grading rules and report cards']].map(([num,title,desc]) => <button key={num} onClick={() => requestAction(title)}><span className="step-num">{num}</span><span><b>{title}</b><small>{desc}</small></span><span className="step-arrow">→</span></button>)}</div></section></> : activeModule ? <section className="panel module-panel"><div className="module-banner"><span className="module-symbol"><Icon>{navItems.find((item) => item.id === activeNav)?.icon}</Icon></span><div><h2>{activeModule.title}</h2><p>{activeModule.subtitle}</p></div></div><div className="metric-grid module-metrics">{activeModule.stats.map(([label, value]) => <article className="metric-card" key={label}><div className="metric-label"><span>{label}</span></div><b>{value}</b></article>)}</div><div className="module-empty"><span>▤</span><h3>{activeNav === 'students' ? 'Student directory will appear here' : 'Connect this module to continue'}</h3><p>{activeModule.note}</p><button className="btn btn-primary" onClick={() => requestAction(activeModule.action)}>{activeModule.action} <span>→</span></button></div></section> : <section className="panel module-panel"><h2>{navItems.find((item) => item.id === activeNav)?.label || 'Workspace'}</h2><p>This workspace is part of the ElimuSmartSystem roadmap.</p></section>}
              <footer className="dashboard-footer"><span>ElimuSmartSystem · Tanzania</span><span>Preview interface · No live school data connected</span></footer>
            </main>
          </div>
        </div>
      )}
      {modal && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(''); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="modal-close" onClick={() => setModal('')} aria-label="Close">×</button><div className="modal-logo"><span className="brand-mark">E</span></div><div className="eyebrow">ELIMUSMARTSYSTEM</div><h2 id="modal-title">{modal}</h2><p>This preview currently demonstrates the user interface only. Real school accounts, student records, SMS, fee payments and report exports must be connected to a secure backend before production use.</p>{modal.toLowerCase().includes('login') || modal.toLowerCase().includes('register') ? <form onSubmit={(event) => { event.preventDefault(); setModal(''); showMessage('Hii ni preview tu. Authentication halijaunganishwa bado.'); }}><label className="form-label">{modal.toLowerCase().includes('register') ? 'School name' : 'Email or username'}<input required placeholder={modal.toLowerCase().includes('register') ? 'Enter official school name' : 'Enter email or username'} /></label>{modal.toLowerCase().includes('register') && <label className="form-label">Contact email<input type="email" required placeholder="school@example.co.tz" /></label>}<label className="form-label">Password<input type="password" required placeholder="Enter password" /></label><button className="btn btn-primary modal-submit" type="submit">{modal.toLowerCase().includes('register') ? 'Continue registration' : 'Sign in'} <span>→</span></button></form> : <div className="modal-info"><b>What happens next?</b><span>1. Confirm the module requirements.</span><span>2. Connect secure authentication and the database.</span><span>3. Test the workflow before using real school data.</span><button className="btn btn-primary" onClick={() => { setModal(''); showMessage('Maelezo yamefungwa. Hakuna data iliyohifadhiwa.'); }}>Understood</button></div>}</section></div>}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
