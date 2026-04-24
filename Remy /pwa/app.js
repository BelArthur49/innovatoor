/* FlowCash – app.js */

/* ── DB ── */
const DB = {
  load() { try { return JSON.parse(localStorage.getItem('flowcash_db')) || {}; } catch { return {}; } },
  save(data) { localStorage.setItem('flowcash_db', JSON.stringify(data)); },
  get(key) { return this.load()[key]; },
  set(key, value) { const db = this.load(); db[key] = value; this.save(db); },
  getUsers() { return this.get('users') || []; },
  findUser(phone) { return this.getUsers().find(u => u.phone === phone.replace(/\s/g, '')); },
  saveUser(u) { this.set('users', this.getUsers().map(x => x.id === u.id ? u : x)); },
  getTxns() { return this.get('transactions') || []; },
  addTxn(txn) { const t = this.getTxns(); t.unshift({...txn, id:'tx'+Date.now(), date:new Date().toISOString()}); this.set('transactions', t); },
  getUserTxns(uid) { return this.getTxns().filter(t => t.userId === uid || t.toUserId === uid); },
  addRevenue(amt) { this.set('platformRevenue', (this.get('platformRevenue')||0) + amt); },
  seed() {
    if (this.get('seeded')) return;
    this.set('config', { transferFeePct:1.5, loanInterestPct:10, maxLoanAmount:50000 });
    this.set('users', [{
      id:'u001', name:'Demo User', phone:'0780000001', pin:'1234',
      provider:'MTN', balance:25000, creditScore:720, activeLoan:null, createdAt:Date.now()
    }]);
    this.set('transactions', []);
    this.set('platformRevenue', 0);
    this.set('seeded', true);
  },
};

/* ── CONFIG ── */

/* ──────────────────────────────────────────────────────────────
   PHONE VALIDATOR
   Validates Rwanda mobile money numbers for MTN, Airtel, Orange.
   Rwanda numbers: 07XXXXXXXX or +2507XXXXXXXX (10 digits local)
   MTN prefixes:   078, 079
   Airtel prefixes: 072, 073
   Orange prefixes: 075, 076
   ────────────────────────────────────────────────────────────── */
const PhoneValidator = {

  // All valid Rwandan mobile money prefixes
  PROVIDERS: {
    'MTN':    ['078', '079'],
    'Airtel': ['072', '073'],
    'Orange': ['075', '076'],
    'M-Pesa': ['071'],        // not active in RW but kept for future
  },

  // Clean a phone number — strip spaces, dashes, +250 prefix
  clean(phone) {
    let p = phone.replace(/[\s\-]/g, '');     // remove spaces and dashes
    if (p.startsWith('+250')) p = '0' + p.slice(4); // +2507XXXXXXXX → 07XXXXXXXX
    if (p.startsWith('250'))  p = '0' + p.slice(3);  // 2507XXXXXXXX  → 07XXXXXXXX
    return p;
  },

  // Validate format: must be 07XXXXXXXX (10 digits, starts with 07)
  isValid(phone) {
    const p = this.clean(phone);
    return /^07[2356789]\d{7}$/.test(p);
  },

  // Detect which provider a number belongs to
  detectProvider(phone) {
    const p = this.clean(phone);
    const prefix = p.slice(0, 3);
    for (const [provider, prefixes] of Object.entries(this.PROVIDERS)) {
      if (prefixes.includes(prefix)) return provider;
    }
    return null;
  },

  // Full validation with error message
  validate(phone) {
    const p = this.clean(phone);
    if (!p) return { valid: false, error: 'Phone number is required.' };
    if (!/^\d+$/.test(p)) return { valid: false, error: 'Phone number must contain only digits.' };
    if (p.length !== 10)   return { valid: false, error: 'Rwanda numbers must be 10 digits (e.g. 0781234567).' };
    if (!p.startsWith('07')) return { valid: false, error: 'Rwanda numbers must start with 07.' };
    if (!this.isValid(p))   return { valid: false, error: 'Invalid prefix. Valid: 072/073 (Airtel), 075/076 (Orange), 078/079 (MTN).' };
    return { valid: true, cleaned: p, provider: this.detectProvider(p) };
  },
};


const Config = {
  get() { return DB.get('config') || {transferFeePct:1.5, loanInterestPct:10, maxLoanAmount:50000}; },
  calcTransferFee(amt) { return Math.ceil(amt * this.get().transferFeePct / 100); },
  calcLoanInterest(p) { return Math.ceil(p * this.get().loanInterestPct / 100); },
};

/* ── AUTH ── */
const Auth = {
  currentUserId() { return sessionStorage.getItem('flowcash_uid'); },
  currentUser() { const id = this.currentUserId(); return id ? DB.getUsers().find(u=>u.id===id)||null : null; },

  login() {
    const rawPhone = document.getElementById('login-phone').value.trim();
    const pin      = document.getElementById('login-pin').value.trim();
    if (!rawPhone||!pin) { UI.toast('Fill in all fields.','error'); return; }

    const check = PhoneValidator.validate(rawPhone);
    if (!check.valid) { UI.toast(check.error,'error'); return; }

    const user = DB.findUser(check.cleaned);
    if (!user)            { UI.toast('Phone not registered.','error'); return; }
    if (user.pin !== pin) { UI.toast('Wrong PIN.','error'); return; }

    sessionStorage.setItem('flowcash_uid', user.id);
    document.getElementById('login-phone').value = '';
    document.getElementById('login-pin').value   = '';
    UI.toast('Welcome back, '+user.name.split(' ')[0]+'! 👋','success');
    Boot.showApp();
  },

  register() {
    const name     = document.getElementById('reg-name').value.trim();
    const rawPhone = document.getElementById('reg-phone').value.trim();
    const pin      = document.getElementById('reg-pin').value.trim();
    const provider = document.getElementById('reg-provider').value;

    if (!name||!rawPhone||!pin) { UI.toast('Fill in all fields.','error'); return; }
    if (pin.length < 4)         { UI.toast('PIN needs at least 4 digits.','error'); return; }
    if (!/^\d+$/.test(pin))    { UI.toast('PIN must contain digits only.','error'); return; }

    // Validate Rwanda phone number
    const check = PhoneValidator.validate(rawPhone);
    if (!check.valid) { UI.toast(check.error,'error'); return; }

    // Warn if provider doesn't match detected prefix
    const detected = check.provider;
    if (detected && detected !== provider) {
      UI.toast('⚠️ '+check.cleaned+' looks like '+detected+' but you selected '+provider+'. Please confirm.','info');
    }

    if (DB.findUser(check.cleaned)) { UI.toast('This number is already registered.','error'); return; }

    const newUser = {
      id:'u'+Date.now(), name, phone:check.cleaned, pin, provider,
      balance:0, creditScore:500, activeLoan:null, createdAt:Date.now()
    };
    const users = DB.getUsers(); users.push(newUser); DB.set('users',users);
    sessionStorage.setItem('flowcash_uid', newUser.id);
    UI.toast('Welcome, '+name.split(' ')[0]+'! 🎉','success');
    Boot.showApp();
  },

  logout() {
    sessionStorage.removeItem('flowcash_uid');
    Boot.showAuth();
  },
};

/* ── NAV ── */
const Nav = {
  stack: ['dashboard'],
  go(name, btn) {
    // Settings is now open to all users (fees are read-only for users)
    // Admin panel accessed via secret tap on version text
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    const page = document.getElementById('page-'+name);
    if (!page) return;
    page.classList.add('active');
    if (btn) btn.classList.add('active');
    else { const b=document.querySelector('.nav-btn[data-page="'+name+'"]'); if(b)b.classList.add('active'); }
    this.stack.push(name);
    if (name==='dashboard') Dashboard.render();
    if (name==='history')   History.render();
    if (name==='loan')      Loans.renderPage();
    if (name==='send')      Payments.renderSendPage();
    if (name==='settings')  Admin.renderSettings();
    if (name==='admin')      { /* admin panel - no auto-render needed */ }
  },
  back() { this.stack.pop(); this.go(this.stack[this.stack.length-1]||'dashboard'); },
};

/* ── DASHBOARD ── */
const Dashboard = {
  render() {
    const user=Auth.currentUser(); if(!user)return;
    const h=new Date().getHours();
    document.getElementById('greeting').textContent     = h<12?'Good morning':h<17?'Good afternoon':'Good evening';
    document.getElementById('dash-name').textContent    = user.name;
    document.getElementById('nav-username').textContent = user.phone;
    document.getElementById('dash-balance').innerHTML   = user.balance.toLocaleString()+' <span>RWF</span>';
    document.getElementById('dash-provider').textContent= user.provider+' · '+user.phone;
    const score=user.creditScore||500;
    document.getElementById('dash-credit').textContent  = score;
    const bar=document.getElementById('dash-credit-bar');
    bar.style.width=Math.min(100,Math.round(score/850*100))+'%';
    bar.style.background=score>=700?'var(--green)':score>=550?'var(--amber)':'var(--red)';
    document.getElementById('dash-credit-note').textContent=score>=700?'Excellent – eligible for higher loans':score>=550?'Good – standard loans available':'Keep transacting to improve score';
    const txns=DB.getUserTxns(user.id);
    document.getElementById('stat-sent').textContent     = txns.filter(t=>t.type==='send'&&t.userId===user.id).reduce((s,t)=>s+t.amount,0).toLocaleString();
    document.getElementById('stat-received').textContent = txns.filter(t=>t.type==='receive'&&t.toUserId===user.id).reduce((s,t)=>s+t.amount,0).toLocaleString();
    document.getElementById('stat-loans').textContent    = txns.filter(t=>t.type==='loan'&&t.userId===user.id).length;
    this.renderTxList('recent-list',txns.slice(0,5),user.id);
  },
  renderTxList(id, txns, uid) {
    const ul=document.getElementById(id);
    if (!txns.length) { ul.innerHTML='<li class="tx-empty">No transactions yet</li>'; return; }
    const icons={send:'↑',receive:'↓',loan:'⊕',repay:'↩',topup:'↓',fee:'⚙'};
    ul.innerHTML=txns.map(t=>{
      const credit=['receive','loan','topup'].includes(t.type)||(t.type==='send'&&t.toUserId===uid);
      const d=new Date(t.date).toLocaleDateString('en-RW',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
      return `<li class="tx-item">
        <div class="tx-icon ${t.type}">${icons[t.type]||'·'}</div>
        <div class="tx-meta"><div class="tx-desc">${t.description||t.type}</div><div class="tx-date">${d}</div></div>
        <div class="tx-amt ${credit?'pos':'neg'}">${credit?'+':'−'}${t.amount.toLocaleString()} RWF</div>
      </li>`;
    }).join('');
  },
};

/* ── PAYMENTS ── */
const Payments = {
  renderSendPage() {
    document.getElementById('info-send-fee').textContent = Config.get().transferFeePct+'%';
    const inp=document.getElementById('send-amount');
    inp.oninput=()=>{
      const amt=parseFloat(inp.value), cfg=Config.get();
      const p=document.getElementById('send-fee-preview');
      if (!amt||amt<100){p.textContent='Enter an amount to see fees';return;}
      const fee=Config.calcTransferFee(amt);
      p.innerHTML='Amount: <strong>'+amt.toLocaleString()+' RWF</strong>\nFee ('+cfg.transferFeePct+'%): <strong>'+fee.toLocaleString()+' RWF</strong>\nTotal deducted: <strong>'+(amt+fee).toLocaleString()+' RWF</strong>';
    };
  },
  send() {
    const user=Auth.currentUser();
    const rawRecip = document.getElementById('send-recipient').value.trim();
    const amt  = parseFloat(document.getElementById('send-amount').value);
    const note = document.getElementById('send-note').value.trim();
    if (!rawRecip||!amt) { UI.toast('Fill recipient and amount.','error'); return; }

    // Validate recipient phone
    const recipCheck = PhoneValidator.validate(rawRecip);
    if (!recipCheck.valid) { UI.toast('Recipient: '+recipCheck.error,'error'); return; }
    const recip = recipCheck.cleaned;

    if (amt<100) { UI.toast('Min 100 RWF.','error'); return; }
    if (recip===user.phone) { UI.toast("Can't send to yourself.",'error'); return; }
    const fee=Config.calcTransferFee(amt), total=amt+fee;
    if (user.balance<total){UI.toast('Need '+total.toLocaleString()+' RWF, have '+user.balance.toLocaleString(),'error');return;}
    const toUser=DB.findUser(recip);
    Modal.confirm('Send '+amt.toLocaleString()+' RWF to '+(toUser?toUser.name:recip)+'?\nFee: '+fee.toLocaleString()+' RWF\nTotal deducted: '+total.toLocaleString()+' RWF',()=>{
      user.balance-=total; user.creditScore=Math.min(850,(user.creditScore||500)+3); DB.saveUser(user);
      if (toUser){toUser.balance+=amt;toUser.creditScore=Math.min(850,(toUser.creditScore||500)+2);DB.saveUser(toUser);DB.addTxn({userId:toUser.id,toUserId:user.id,type:'receive',amount:amt,description:'Received from '+user.name+(note?' – '+note:'')});}
      DB.addTxn({userId:user.id,type:'send',amount:amt,description:'Sent to '+(toUser?toUser.name:recip)+(note?' – '+note:'')});
      DB.addTxn({userId:user.id,type:'fee',amount:fee,description:'Transfer fee'});
      DB.addRevenue(fee);
      document.getElementById('send-recipient').value='';
      document.getElementById('send-amount').value='';
      document.getElementById('send-note').value='';
      document.getElementById('send-fee-preview').textContent='Enter an amount to see fees';
      UI.toast('✅ Sent '+amt.toLocaleString()+' RWF!','success');
      Nav.go('dashboard');
    });
  },
  topup() {
    const amt=parseFloat(document.getElementById('topup-amount').value);
    if (!amt||amt<500){UI.toast('Min 500 RWF.','error');return;}
    Modal.confirm('Top up '+amt.toLocaleString()+' RWF to your wallet?',()=>{
      const user=Auth.currentUser();
      user.balance+=amt; user.creditScore=Math.min(850,(user.creditScore||500)+1); DB.saveUser(user);
      DB.addTxn({userId:user.id,type:'topup',amount:amt,description:'Wallet top-up via '+user.provider});
      document.getElementById('topup-amount').value='';
      UI.toast('✅ Topped up '+amt.toLocaleString()+' RWF!','success');
      Nav.go('dashboard');
    });
  },
};

/* ── LOANS ── */
const Loans = {
  renderPage() {
    const user=Auth.currentUser(), cfg=Config.get();
    document.getElementById('info-loan-rate').textContent=cfg.loanInterestPct+'%';
    const inp=document.getElementById('loan-amount');
    inp.oninput=()=>this._preview();
    document.getElementById('loan-term').onchange=()=>this._preview();
    if (user.activeLoan) {
      const loan=user.activeLoan, due=new Date(loan.dueDate).toLocaleDateString('en-RW',{day:'numeric',month:'short',year:'numeric'});
      document.getElementById('active-loan-detail').innerHTML='Principal: <strong>'+loan.principal.toLocaleString()+' RWF</strong><br>Interest: <strong>'+loan.interest.toLocaleString()+' RWF</strong><br>Total owed: <strong>'+loan.totalOwed.toLocaleString()+' RWF</strong><br>Due: <strong>'+due+'</strong>';
      document.getElementById('active-loan-notice').classList.remove('hidden');
      document.getElementById('loan-apply-form').classList.add('hidden');
    } else {
      document.getElementById('active-loan-notice').classList.add('hidden');
      document.getElementById('loan-apply-form').classList.remove('hidden');
    }
  },
  _preview() {
    const amt=parseFloat(document.getElementById('loan-amount').value);
    const days=parseInt(document.getElementById('loan-term').value);
    const cfg=Config.get(), p=document.getElementById('loan-fee-preview');
    if (!amt||amt<500){p.textContent='Enter an amount to see breakdown';return;}
    const interest=Config.calcLoanInterest(amt);
    const due=new Date(Date.now()+days*86400000).toLocaleDateString('en-RW',{day:'numeric',month:'short',year:'numeric'});
    p.innerHTML='Principal: <strong>'+amt.toLocaleString()+' RWF</strong>\nInterest ('+cfg.loanInterestPct+'%): <strong>'+interest.toLocaleString()+' RWF</strong>\nTotal to repay: <strong>'+(amt+interest).toLocaleString()+' RWF</strong>\nDue: <strong>'+due+'</strong>';
  },
  apply() {
    const user=Auth.currentUser(), amt=parseFloat(document.getElementById('loan-amount').value), days=parseInt(document.getElementById('loan-term').value), cfg=Config.get();
    if (!amt||amt<500){UI.toast('Min 500 RWF.','error');return;}
    if (amt>cfg.maxLoanAmount){UI.toast('Max loan is '+cfg.maxLoanAmount.toLocaleString()+' RWF.','error');return;}
    if (user.activeLoan){UI.toast('Repay current loan first.','error');return;}
    if ((user.creditScore||500)<450){UI.toast('Credit score too low (min 450).','error');return;}
    const scoreMax=Math.round((user.creditScore/850)*cfg.maxLoanAmount);
    if (amt>scoreMax){UI.toast('Your limit is '+scoreMax.toLocaleString()+' RWF based on credit score.','error');return;}
    const interest=Config.calcLoanInterest(amt), totalOwed=amt+interest, dueDate=new Date(Date.now()+days*86400000).toISOString();
    Modal.confirm('Borrow '+amt.toLocaleString()+' RWF?\nInterest: '+interest.toLocaleString()+' RWF\nRepay '+totalOwed.toLocaleString()+' RWF in '+days+' days',()=>{
      user.balance+=amt; user.activeLoan={principal:amt,interest,totalOwed,dueDate,takenAt:Date.now()}; DB.saveUser(user);
      DB.addTxn({userId:user.id,type:'loan',amount:amt,description:'Micro loan – '+days+' day term'});
      UI.toast('✅ '+amt.toLocaleString()+' RWF credited to your wallet!','success');
      Nav.go('dashboard');
    });
  },
  repay() {
    const user=Auth.currentUser(); if (!user.activeLoan){UI.toast('No active loan.','error');return;}
    const loan=user.activeLoan;
    if (user.balance<loan.totalOwed){UI.toast('Need '+loan.totalOwed.toLocaleString()+' RWF. Top up '+(loan.totalOwed-user.balance).toLocaleString()+' more.','error');return;}
    Modal.confirm('Repay '+loan.totalOwed.toLocaleString()+' RWF?',()=>{
      const onTime=Date.now()<new Date(loan.dueDate).getTime();
      user.balance-=loan.totalOwed; user.activeLoan=null;
      user.creditScore=Math.min(850,Math.max(300,(user.creditScore||500)+(onTime?20:-10)));
      DB.saveUser(user); DB.addRevenue(loan.interest);
      DB.addTxn({userId:user.id,type:'repay',amount:loan.totalOwed,description:'Loan repaid ('+(onTime?'on time ✓':'late')+')'});
      UI.toast('✅ Loan repaid! '+(onTime?'+20 credit score 🎉':'-10 credit score (late)'),'success');
      Nav.go('dashboard');
    });
  },
};

/* ── HISTORY ── */
const History = {
  render() { const u=Auth.currentUser(); Dashboard.renderTxList('full-tx-list',DB.getUserTxns(u.id),u.id); }
};

/* ── ADMIN ── */
const Admin = {

  // SECRET TAP: tap the version text at bottom of settings 7 times to open admin
  _tapCount: 0, _tapTimer: null,
  secretTap() {
    this._tapCount++;
    clearTimeout(this._tapTimer);
    this._tapTimer = setTimeout(()=>{ this._tapCount=0; }, 2000);
    if (this._tapCount >= 7) {
      this._tapCount = 0;
      document.getElementById('admin-login-form').classList.remove('hidden');
      document.getElementById('admin-controls').classList.add('hidden');
      document.getElementById('admin-password').value = '';
      Nav.go('admin');
    }
  },

  // CHANGE THIS before going live — this is YOUR operator password
  ADMIN_PASSWORD: 'flowcash-admin-2024',

  verifyPassword() {
    const input = document.getElementById('admin-password').value;
    if (input === this.ADMIN_PASSWORD) {
      document.getElementById('admin-login-form').classList.add('hidden');
      document.getElementById('admin-controls').classList.remove('hidden');
      const cfg = Config.get();
      document.getElementById('cfg-transfer-fee').value = cfg.transferFeePct;
      document.getElementById('cfg-loan-rate').value    = cfg.loanInterestPct;
      document.getElementById('cfg-max-loan').value     = cfg.maxLoanAmount;
      document.getElementById('admin-revenue').innerHTML = (DB.get('platformRevenue')||0).toLocaleString()+' <span>RWF</span>';
      document.getElementById('admin-password').value = '';
      UI.toast('Admin unlocked ✅', 'success');
    } else {
      UI.toast('Wrong password.', 'error');
      document.getElementById('admin-password').value = '';
    }
  },

  lock() {
    document.getElementById('admin-login-form').classList.remove('hidden');
    document.getElementById('admin-controls').classList.add('hidden');
    Nav.go('settings');
    UI.toast('Admin locked', 'info');
  },

  // User-facing settings — READ ONLY, no fee editing
  renderSettings() {
    const user = Auth.currentUser();
    const cfg  = Config.get();
    if (user) {
      document.getElementById('settings-name').textContent     = user.name;
      document.getElementById('settings-phone').textContent    = user.phone;
      document.getElementById('settings-provider').textContent = user.provider;
      document.getElementById('settings-score').textContent    = (user.creditScore||500) + ' / 850';
    }
    document.getElementById('settings-transfer-fee').textContent = cfg.transferFeePct + '%';
    document.getElementById('settings-loan-rate').textContent    = cfg.loanInterestPct + '%';
    document.getElementById('settings-max-loan').textContent     = cfg.maxLoanAmount.toLocaleString() + ' RWF';
  },

  saveConfig() {
    const fee  = parseFloat(document.getElementById('cfg-transfer-fee').value);
    const rate = parseFloat(document.getElementById('cfg-loan-rate').value);
    const max  = parseFloat(document.getElementById('cfg-max-loan').value);
    if (isNaN(fee)||isNaN(rate)||isNaN(max)) { UI.toast('Fill all fields.','error'); return; }
    DB.set('config', {transferFeePct:fee, loanInterestPct:rate, maxLoanAmount:max});
    UI.toast('✅ Fees updated!', 'success');
    // Refresh revenue display
    document.getElementById('admin-revenue').innerHTML = (DB.get('platformRevenue')||0).toLocaleString()+' <span>RWF</span>';
  },

  resetDemo() {
    Modal.confirm('Reset ALL demo data? This cannot be undone.', ()=>{
      localStorage.removeItem('flowcash_db');
      sessionStorage.removeItem('flowcash_uid');
      location.reload();
    });
  },

}

const UI = {
  toast(msg, type='info') {
    const el=document.createElement('div'); el.className='toast '+type; el.textContent=msg;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(()=>el.remove(),3200);
  }
};

const Modal = {
  confirm(msg, cb) {
    document.getElementById('modal-message').textContent=msg;
    document.getElementById('modal-overlay').classList.remove('hidden');
    const btn=document.getElementById('modal-confirm');
    const fresh=btn.cloneNode(true); btn.parentNode.replaceChild(fresh,btn);
    fresh.addEventListener('click',()=>{this.close();cb();});
  },
  close() { document.getElementById('modal-overlay').classList.add('hidden'); }
};

/* ── BOOT ── */
const Boot = {
  init() {
    DB.seed();

    // Auth tab switching
    document.querySelectorAll('.tab').forEach(tab=>{
      tab.addEventListener('click',()=>{
        document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('tab-'+tab.dataset.tab).classList.add('active');
      });
    });

    // Allow Enter key on admin password field
    const adminPwdField = document.getElementById('admin-password');
    if (adminPwdField) {
      adminPwdField.addEventListener('keydown', e=>{
        if (e.key==='Enter') Admin.verifyPassword();
      });
    }

    // Allow Enter key on login fields
    document.getElementById('login-pin').addEventListener('keydown', e=>{
      if (e.key==='Enter') Auth.login();
    });

    // Splash fade then show correct screen
    setTimeout(()=>{
      document.getElementById('splash').style.transition='opacity 0.4s';
      document.getElementById('splash').style.opacity='0';
      setTimeout(()=>{
        document.getElementById('splash').style.display='none';
        Auth.currentUserId() ? this.showApp() : this.showAuth();
      },400);
    },1500);

    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
  },

  showApp() {
    document.getElementById('auth-screen').style.display='none';
    document.body.style.overflow='hidden';
    const app = document.getElementById('app');
    app.style.display='flex';
    const u=Auth.currentUser();
    if (u) document.getElementById('nav-username').textContent=u.phone;
    Nav.go('dashboard');
  },

  showAuth() {
    document.getElementById('app').style.display='none';
    document.body.style.overflow='auto';
    document.getElementById('auth-screen').style.display='block';
  },
};

document.addEventListener('DOMContentLoaded', ()=>Boot.init());
