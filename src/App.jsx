import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowDownLeft, ArrowDownUp, ArrowUpRight, Bell, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3, CreditCard, Download, Ellipsis, Eye, Filter, LayoutDashboard, ListFilter, MoreHorizontal, Search, Settings2, ShieldAlert, SlidersHorizontal, Sparkles, WalletCards, X } from 'lucide-react'

const todayLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const initialTransactions = [
  { id:'TXN-90841', initials:'JM', name:'Jordan Mitchell', card:'•••• 4829', merchant:'NORTHSTAR ELECTRONICS', category:'Electronics', amount:1284.60, currency:'USD', time:'10:42:18 AM', date:`Today, ${todayLabel}`, location:'Brooklyn, NY', status:'Needs review', type:'High value', color:'blue', rule:'Single purchase exceeded $1,000', note:'' },
  { id:'TXN-90839', initials:'AC', name:'Avery Chen', card:'•••• 1092', merchant:'CLOUDNINE TRAVEL', category:'Travel', amount:892.40, currency:'USD', time:'10:38:51 AM', date:`Today, ${todayLabel}`, location:'San Francisco, CA', status:'Needs review', type:'Velocity', color:'purple', rule:'4 transactions in 8 minutes', note:'' },
  { id:'TXN-90834', initials:'SK', name:'Sam Kim', card:'•••• 6610', merchant:'MORNING TIDE MARKET', category:'Groceries', amount:64.25, currency:'USD', time:'10:31:06 AM', date:`Today, ${todayLabel}`, location:'Portland, OR', status:'Reviewed', type:'Velocity', color:'orange', rule:'4 transactions in 9 minutes', note:'Expected recurring grocery run.' },
  { id:'TXN-90830', initials:'RP', name:'Riley Patel', card:'•••• 3271', merchant:'ATELIER FORM', category:'Shopping', amount:246.00, currency:'USD', time:'10:27:43 AM', date:`Today, ${todayLabel}`, location:'Austin, TX', status:'Clear', type:'No alerts', color:'green', rule:'No rules matched', note:'' },
  { id:'TXN-90827', initials:'TG', name:'Taylor Green', card:'•••• 7743', merchant:'METRO FUEL & GO', category:'Transport', amount:1184.75, currency:'USD', time:'10:19:12 AM', date:`Today, ${todayLabel}`, location:'Chicago, IL', status:'Needs review', type:'High value', color:'pink', rule:'Single purchase exceeded $1,000', note:'' },
  { id:'TXN-90821', initials:'MW', name:'Morgan Wells', card:'•••• 5204', merchant:'STUDIO PILATES CO', category:'Wellness', amount:38.00, currency:'USD', time:'10:14:09 AM', date:`Today, ${todayLabel}`, location:'Seattle, WA', status:'Clear', type:'No alerts', color:'teal', rule:'No rules matched', note:'' },
  { id:'TXN-90818', initials:'DL', name:'Drew Lewis', card:'•••• 0918', merchant:'PIXEL & PAPER', category:'Shopping', amount:1512.10, currency:'USD', time:'10:09:33 AM', date:`Today, ${todayLabel}`, location:'Denver, CO', status:'Reviewed', type:'High value', color:'yellow', rule:'Single purchase exceeded $1,000', note:'Confirmed with cardholder.' },
  { id:'TXN-90812', initials:'NP', name:'Noah Park', card:'•••• 4407', merchant:'EVERGREEN PHARMACY', category:'Health', amount:73.82, currency:'USD', time:'09:58:42 AM', date:`Today, ${todayLabel}`, location:'Boston, MA', status:'Clear', type:'No alerts', color:'indigo', rule:'No rules matched', note:'' },
  { id:'TXN-90808', initials:'EC', name:'Emerson Clark', card:'•••• 8136', merchant:'THE COMMONS CAFE', category:'Dining', amount:42.50, currency:'USD', time:'09:51:27 AM', date:`Today, ${todayLabel}`, location:'Brooklyn, NY', status:'Needs review', type:'Velocity', color:'lime', rule:'5 transactions in 10 minutes', note:'' },
]

const money = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const todayHeading = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()
function App() {
  const [transactions, setTransactions] = useState(initialTransactions)
  const [activeNav, setActiveNav] = useState('Overview')
  const [filter, setFilter] = useState('All transactions')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [toast, setToast] = useState('')
  const [range, setRange] = useState('Today')
  const [apiConnected, setApiConnected] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/transactions').then(response => {
      if (!response.ok) throw new Error('API unavailable')
      return response.json()
    }).then(data => {
      if (active && data.synthetic && Array.isArray(data.items)) {
        setTransactions(data.items)
        setApiConnected(true)
      }
    }).catch(() => {})
    return () => { active = false }
  }, [])

  const visible = useMemo(() => transactions.filter(t => {
    const matches = `${t.id} ${t.name} ${t.merchant} ${t.category}`.toLowerCase().includes(search.toLowerCase())
    const navMatch = activeNav === 'Review queue' ? t.status === 'Needs review' : true
    const filterMatch = filter === 'All transactions' || (filter === 'Needs review' ? t.status === 'Needs review' : filter === 'Reviewed' ? t.status === 'Reviewed' : t.type === filter)
    return matches && navMatch && filterMatch
  }), [transactions, search, filter, activeNav])
  const pending = transactions.filter(t => t.status === 'Needs review').length
  const selectedTransaction = selected && transactions.find(t => t.id === selected)

  async function markReviewed(id, text = '') {
    setTransactions(rows => rows.map(t => t.id === id ? { ...t, status:'Reviewed', note:text || t.note } : t))
    setSelected(null); setNote(''); setToast('Case marked as reviewed'); setTimeout(() => setToast(''), 2600)
    if (apiConnected) {
      try {
        const response = await fetch(`/api/transactions/${id}/review`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({note:text}) })
        if (!response.ok) throw new Error('Review could not be saved')
      } catch {
        setToast('Saved in this session; API could not be reached')
        setTimeout(() => setToast(''), 3000)
      }
    }
  }

  function exportCsv() {
    const columns = ['id', 'name', 'card', 'merchant', 'category', 'amount', 'currency', 'status', 'type', 'rule', 'note', 'date', 'time', 'location']
    const escape = value => `"${String(value ?? '').replaceAll('"', '""')}"`
    const csv = [columns.join(','), ...visible.map(row => columns.map(column => escape(row[column])).join(','))].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url; link.download = 'ledgerlens-transactions.csv'; link.click()
    URL.revokeObjectURL(url)
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><span></span><span></span><span></span></div><span>ledger<span className="brand-light">lens</span></span></div>
      <div className="workspace"><div className="workspace-icon">N</div><div className="workspace-copy"><strong>Northstar Studio</strong><small>Workspace</small></div><ChevronDown size={15} /></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>
        {[['Overview', LayoutDashboard], ['Transactions', CreditCard], ['Review queue', ShieldAlert]].map(([label, Icon]) => <button key={label} className={`nav-item ${activeNav === label ? 'active' : ''}`} onClick={() => setActiveNav(label)}><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{label === 'Review queue' && <b className="nav-count">{pending}</b>}</button>)}
      </nav>
      <div className="nav-label rules-label">MONITORING</div>
      <button className="nav-item" onClick={() => setToast('Rules are configured for this demo')}><ListFilter size={17} strokeWidth={1.8} /><span>Rules</span></button>
      <div className="sidebar-bottom">
        <div className="plan-card"><div className="plan-icon"><Sparkles size={15} /></div><div><strong>Demo workspace</strong><p>All data is synthetic</p></div><Ellipsis size={16} /></div>
        <div className="user-row"><div className="avatar avatar-user">JD</div><div className="user-copy"><strong>Jamie Davis</strong><small>Operations</small></div><MoreHorizontal size={18} /></div>
      </div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{activeNav}</strong></div><div className="top-actions"><span className="live-indicator"><i></i> {apiConnected ? 'API connected' : 'Demo data'}</span><button className="icon-button" aria-label="Help" onClick={() => setToast('Everything here uses generated demo data.')}><CircleHelp size={18} /></button><button className="icon-button notification" aria-label="Notifications" onClick={() => setActiveNav('Review queue')}><Bell size={18} /><i></i></button><div className="top-avatar">JD</div></div></header>
      <div className="page-content">
        <section className="page-heading"><div><div className="eyebrow">{todayHeading} <span className="eyebrow-dot">·</span> YOUR OPERATIONS SNAPSHOT</div><h1>{activeNav === 'Review queue' ? 'Review queue' : activeNav === 'Transactions' ? 'Transactions' : 'Good morning, Jamie'}<span className="wave">{activeNav === 'Overview' ? ' ✳' : ''}</span></h1><p>{activeNav === 'Overview' ? 'Here’s what’s happening with your transactions today.' : activeNav === 'Review queue' ? 'Triage flagged activity and leave a clear audit trail.' : 'Explore and filter your recent card activity.'}</p></div><div className="heading-actions"><button className="button button-secondary" onClick={exportCsv}><Download size={15} /> Export</button><button className="button button-dark" onClick={() => setToast('Rules engine is actively monitoring synthetic transactions.')}><Activity size={15} /> <span>Rules active</span><span className="button-live"></span></button></div></section>

        <section className="metric-grid">
          <Metric title="Total transactions" value="1,284" delta="12.8%" caption="vs. yesterday" icon={ArrowDownUp} color="blue" trend="up" chart="m1" />
          <Metric title="Flagged for review" value={String(pending).padStart(2,'0')} delta="3 new" caption="in the last hour" icon={ShieldAlert} color="amber" trend="warn" chart="m2" />
          <Metric title="Reviewed today" value="38" delta="+8" caption="vs. yesterday" icon={CheckCircle2} color="green" trend="up" chart="m3" />
          <Metric title="Flag rate" value="2.4%" delta="0.3%" caption="vs. 7-day average" icon={Activity} color="violet" trend="down" chart="m4" />
        </section>

        <section className="content-grid">
          <div className="panel transaction-panel">
            <div className="panel-heading"><div><div className="title-line"><h2>{activeNav === 'Review queue' ? 'Cases to review' : 'Recent transactions'}</h2><span className="count-pill">{visible.length}</span></div><p>A live view of card activity across your workspace</p></div><button className="range-select" onClick={() => setRange(range === 'Today' ? 'Last 7 days' : 'Today')}><Clock3 size={14} /> {range}<ChevronDown size={13} /></button></div>
            <div className="table-toolbar"><div className="filter-tabs">{['All transactions','Needs review','Reviewed'].map(f=><button key={f} className={filter===f?'selected':''} onClick={()=>setFilter(f)}>{f}{f==='Needs review'&&<span className="tab-count">{pending}</span>}</button>)}</div><div className="table-tools"><label className="search-box"><Search size={15} /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search transactions" /></label><button className="filter-button" onClick={()=>setFilter(filter==='Velocity'?'All transactions':'Velocity')}><SlidersHorizontal size={15} /><span>Filter</span><span className="filter-dot"></span></button></div></div>
            <div className="table-wrap"><table><thead><tr><th>TRANSACTION</th><th>MERCHANT</th><th>AMOUNT</th><th>STATUS</th><th>TIME</th><th></th></tr></thead><tbody>{visible.map(t=><tr key={t.id} onClick={()=>{setSelected(t.id);setNote(t.note)}} className="transaction-row"><td><div className="person-cell"><div className={`avatar avatar-${t.color}`}>{t.initials}</div><div><strong>{t.name}</strong><small>{t.id} <span>·</span> {t.card}</small></div></div></td><td><div className="merchant-cell"><strong>{t.merchant}</strong><small>{t.category}</small></div></td><td><strong className="amount">{money(t.amount)}</strong></td><td><Status status={t.status} /></td><td><span className="time-text">{t.time}</span></td><td><button className="row-more" onClick={e=>{e.stopPropagation();setSelected(t.id);setNote(t.note)}} aria-label="Open transaction"><MoreHorizontal size={17}/></button></td></tr>)}</tbody></table>{visible.length===0&&<div className="empty-state">No transactions match. Try changing your filters.</div>}</div>
            <div className="table-footer"><span>Showing <strong>{visible.length ? 1 : 0}–{visible.length}</strong> of <strong>{visible.length}</strong> transactions</span><div className="pagination"><button disabled><ChevronLeft size={15}/></button><button className="page-number">1</button><button disabled><ChevronRight size={15}/></button></div></div>
          </div>

          <aside className="right-column">
            <div className="panel queue-panel"><div className="side-panel-heading"><div><h2>Needs attention</h2><p>Cases waiting for review</p></div><button className="text-link" onClick={()=>setActiveNav('Review queue')}>View all <ChevronRight size={14}/></button></div><div className="queue-summary"><div className="queue-number">{String(pending).padStart(2,'0')}</div><div className="queue-summary-copy"><strong>Open cases</strong><span><span className="priority-dot"></span> 2 high priority</span></div><div className="queue-spark"><svg viewBox="0 0 72 28" preserveAspectRatio="none"><path d="M1 23 C10 22 11 13 20 16 S32 20 39 10 S51 18 57 8 S64 11 71 2" fill="none" stroke="#d99b43" strokeWidth="2"/></svg></div></div><div className="queue-list">{transactions.filter(t=>t.status==='Needs review').slice(0,3).map(t=><button className="queue-row" key={t.id} onClick={()=>{setSelected(t.id);setNote(t.note)}}><div className={`queue-icon ${t.type==='High value'?'q-amber':'q-purple'}`}>{t.type==='High value'?<ArrowUpRight size={16}/>:<Activity size={16}/>}</div><div className="queue-copy"><strong>{t.type} transaction</strong><small>{t.merchant} <span>·</span> {t.time}</small></div><span className="queue-amount">{money(t.amount)}</span><ChevronRight size={14} className="queue-chevron"/></button>)}</div><button className="queue-footer" onClick={()=>setActiveNav('Review queue')}>Open review queue <ArrowUpRight size={14}/></button></div>

            <div className="panel rules-panel"><div className="side-panel-heading"><div><div className="rules-title"><div className="rules-icon"><ListFilter size={15}/></div><h2>Active rules</h2></div><p>Monitoring in real time</p></div><button className="icon-button small" onClick={()=>setToast('Demo rules: high value and transaction velocity.')} aria-label="Rule settings"><Settings2 size={16}/></button></div><div className="rule-row"><div className="rule-icon rule-orange"><ArrowUpRight size={15}/></div><div className="rule-copy"><strong>Unusually large purchase</strong><small>Amount exceeds $1,000</small></div><span className="rule-enabled">On</span></div><div className="rule-row"><div className="rule-icon rule-purple"><Activity size={15}/></div><div className="rule-copy"><strong>Transaction velocity</strong><small>4+ transactions in 10 min</small></div><span className="rule-enabled">On</span></div><button className="manage-rules" onClick={()=>setToast('Rule configuration is coming soon.')}>Manage rules <ChevronRight size={14}/></button></div>

            <div className="demo-note"><div className="demo-note-icon"><Eye size={16}/></div><div><strong>Demo environment</strong><p>This workspace uses synthetic data. No real accounts or transactions are connected.</p></div></div>
          </aside>
        </section>
        <footer className="page-footer"><span><span className="footer-live"></span> Last synced just now</span><span>LedgerLens <span className="footer-sep">·</span> Local demo environment</span></footer>
      </div>
    </main>

    {selectedTransaction && <div className="modal-backdrop" onClick={()=>setSelected(null)}><section className="review-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="modal-eyebrow">TRANSACTION REVIEW</span><h2>Review case</h2></div><button className="icon-button" onClick={()=>setSelected(null)} aria-label="Close"><X size={18}/></button></div><div className="modal-transaction"><div className={`avatar avatar-${selectedTransaction.color}`}>{selectedTransaction.initials}</div><div className="modal-person"><strong>{selectedTransaction.name}</strong><small>{selectedTransaction.card} <span>·</span> {selectedTransaction.id}</small></div><strong className="modal-amount">{money(selectedTransaction.amount)}</strong></div><div className="alert-card"><div className="alert-icon"><ShieldAlert size={17}/></div><div><strong>{selectedTransaction.type} alert</strong><p>{selectedTransaction.rule}</p></div></div><div className="detail-grid"><div><small>MERCHANT</small><strong>{selectedTransaction.merchant}</strong></div><div><small>LOCATION</small><strong>{selectedTransaction.location}</strong></div><div><small>CATEGORY</small><strong>{selectedTransaction.category}</strong></div><div><small>TIME</small><strong>{selectedTransaction.time}</strong></div></div><label className="note-label" htmlFor="review-note">Reviewer note <span>Optional</span></label><textarea id="review-note" value={note} onChange={e=>setNote(e.target.value)} placeholder="Add context for the audit trail…" rows="3"/><div className="modal-actions"><button className="button button-secondary" onClick={()=>setSelected(null)}>Close</button>{selectedTransaction.status==='Reviewed'?<button className="button button-dark" onClick={()=>setSelected(null)}><Check size={15}/> Reviewed</button>:<button className="button button-dark" onClick={()=>markReviewed(selectedTransaction.id,note)}><Check size={15}/> Mark reviewed</button>}</div></section></div>}
    {toast&&<div className="toast"><CheckCircle2 size={16}/>{toast}</div>}
  </div>
}

function Metric({title,value,delta,caption,icon:Icon,color,chart,trend}){return <div className="metric-card"><div className="metric-top"><span>{title}</span><span className={`metric-icon icon-${color}`}><Icon size={16}/></span></div><div className="metric-value-row"><strong>{value}</strong><span className={`metric-delta delta-${trend}`}>{trend==='up'?<ArrowUpRight size={13}/>:trend==='down'?<ArrowDownLeft size={13}/>:<span className="delta-dot">•</span>}{delta}</span></div><div className="metric-bottom"><span>{caption}</span><svg className={`mini-chart ${chart}`} viewBox="0 0 78 27" preserveAspectRatio="none"><path d={chart==='m1'?'M1 21 C8 17 10 22 17 15 S28 19 35 12 S44 14 51 8 S60 14 68 4 S73 7 77 2':chart==='m2'?'M1 20 C9 18 11 22 18 17 S29 19 36 11 S45 18 54 10 S63 15 69 5 S74 7 77 3':chart==='m3'?'M1 22 C9 19 13 20 19 13 S30 18 36 12 S45 11 51 7 S61 15 68 6 S73 8 77 2':'M1 18 C9 19 11 11 18 16 S29 9 36 13 S45 17 52 9 S62 12 68 6 S74 9 77 4'} fill="none" stroke="currentColor" strokeWidth="2"/></svg></div></div>}
function Status({status}){return <span className={`status status-${status==='Needs review'?'review':status==='Reviewed'?'reviewed':'clear'}`}><i></i>{status}</span>}

export default App
