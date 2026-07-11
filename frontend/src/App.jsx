import React, { useState, useEffect } from 'react';
import { 
  HashRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useNavigate, 
  useLocation 
} from 'react-router-dom';
import { 
  Wallet, 
  ArrowRightLeft, 
  ArrowUpRight, 
  ArrowDownLeft, 
  User, 
  ShieldAlert, 
  LogOut, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  Shield, 
  Home, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { 
  api, 
  getAppMode, 
  setAppMode, 
  getCurrentUser, 
  setCurrentUser, 
  logoutUser, 
  setAuthToken
} from './services/api';

// --- MAIN WRAPPER WITH DEV MODE ---
function DevModeToggle() {
  const mode = getAppMode();
  const isReal = mode === 'real';

  const toggleMode = () => {
    const newMode = isReal ? 'mock' : 'real';
    if (newMode === 'real') {
      const token = prompt('Enter Keycloak Bearer Token (optional for mock security bypass, leave empty to request directly):');
      if (token !== null) {
        setAuthToken(token);
      }
    }
    setAppMode(newMode);
  };

  return (
    <div 
      className="fixed bottom-6 right-6 bg-bg-secondary border-2 border-brand-cyan rounded-full px-4 py-2 flex items-center gap-3 shadow-[0_0_20px_rgba(0,242,254,0.3)] z-50 cursor-pointer hover:scale-105 transition-transform duration-200"
      onClick={toggleMode} 
      title="Click to toggle between Mock Database and Real Gateway APIs"
    >
      <span className={`w-2.5 h-2.5 rounded-full ${isReal ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-brand-cyan shadow-[0_0_8px_#00f2fe]'}`}></span>
      <span className="text-xs font-bold tracking-wider text-gray-200 uppercase">
        {isReal ? 'REAL API GATEWAY' : 'MOCK DATABASE'}
      </span>
    </div>
  );
}

// --- AUTHENTICATION GUARD ---
function RequireAuth({ children }) {
  const user = getCurrentUser();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// --- LAYOUT COMPONENT ---
function Layout({ children, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [dbUser, setDbUser] = useState(null);

  useEffect(() => {
    api.getUserById(user.userId)
      .then(setDbUser)
      .catch((err) => console.error('Error fetching user info', err));
  }, [user.userId]);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <Home size={18} /> },
    { name: 'Accounts', path: '/accounts', icon: <Wallet size={18} /> },
    { name: 'Transfer Funds', path: '/transfer', icon: <ArrowRightLeft size={18} /> },
    { name: 'Deposit / Withdraw', path: '/transaction', icon: <DollarSign size={18} /> },
    { name: 'Edit Profile', path: '/profile', icon: <User size={18} /> },
    { name: 'Admin Approvals', path: '/admin', icon: <Shield size={18} /> },
  ];

  return (
    <div className="flex min-h-screen bg-bg-primary text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-bg-secondary border-r border-white/5 flex flex-col fixed top-0 bottom-0 left-0 z-40 p-6">
        <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => navigate('/')}>
          <Sparkles className="text-brand-cyan" size={24} />
          <span className="text-lg font-black bg-gradient-to-r from-brand-cyan to-brand-blue bg-clip-text text-transparent">
            Apex Bank
          </span>
        </div>
        <nav className="flex flex-col gap-2 flex-grow">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 w-full text-left cursor-pointer ${
                  isActive 
                    ? 'bg-bg-tertiary text-white border-l-4 border-brand-cyan shadow-md' 
                    : 'text-gray-400 hover:bg-bg-tertiary/50 hover:text-gray-200'
                }`}
                onClick={() => navigate(item.path)}
              >
                {item.icon}
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
        <div className="mt-auto">
          <button 
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-bg-tertiary hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 text-gray-300 hover:text-red-400 font-semibold text-sm transition-all cursor-pointer" 
            onClick={logoutUser}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="ml-64 flex-grow flex flex-col min-h-screen">
        <header className="h-18 bg-bg-secondary/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-30">
          <h1 className="text-lg font-bold text-gray-200">
            {menuItems.find((m) => m.path === location.pathname)?.name || 'Apex Portal'}
          </h1>
          <div className="flex items-center gap-4">
            {dbUser && (
              <>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                  dbUser.status === 'APPROVED' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  Status: {dbUser.status}
                </span>
                <div className="bg-bg-tertiary px-4 py-1.5 rounded-full border border-white/5 flex items-center gap-2 text-sm font-semibold text-gray-300">
                  <User size={14} className="text-brand-cyan" />
                  <span>{dbUser.userProfile?.firstName} {dbUser.userProfile?.lastName}</span>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="p-8 max-w-6xl w-full mx-auto flex-grow">
          {children}
        </main>
      </div>
    </div>
  );
}

// --- LANDING & LOGIN PAGE ---
function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (getAppMode() === 'mock') {
        const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
        const matched = users.find((u) => u.emailId.toLowerCase() === email.toLowerCase());
        if (!matched) {
          setError('Invalid email credentials in Mock Database');
          return;
        }

        if (matched.status === 'PENDING') {
          setError('Your user registration is PENDING. Use the Admin Approvals panel to approve it.');
          return;
        }

        setCurrentUser(matched.emailId, matched.userId);
        navigate('/');
      } else {
        setError('Real API mode requires a Keycloak integration configured. To run locally, please toggle "Mock Database" mode in the bottom-right corner.');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(circle_at_10%_20%,rgba(15,21,36,0.8)_0%,rgba(8,12,20,1)_90.2%)]">
      <div className="w-full max-w-md glass-card rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 text-2xl font-black bg-gradient-to-r from-brand-cyan to-brand-blue bg-clip-text text-transparent mb-2">
            <Sparkles className="text-brand-cyan" size={32} />
            <span>Apex Bank</span>
          </div>
          <p className="text-gray-400 text-sm">Premium Digital Banking Portal</p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-sm mb-6">
            <ShieldAlert size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
            <input 
              type="email" 
              className="bg-bg-tertiary border border-white/5 rounded-xl px-4 py-3 text-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-brand-cyan focus:ring-3 focus:ring-brand-cyan/15 w-full" 
              placeholder="e.g. adamsanadi1234@gmail.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
            <input 
              type="password" 
              className="bg-bg-tertiary border border-white/5 rounded-xl px-4 py-3 text-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-brand-cyan focus:ring-3 focus:ring-brand-cyan/15 w-full" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-brand-cyan to-brand-blue text-[#080c14] py-3.5 rounded-xl font-bold shadow-lg shadow-brand-cyan/10 hover:opacity-95 active:scale-98 transition-all cursor-pointer mt-4">
            Sign In
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-400">
          Don't have an account?{' '}
          <button className="text-brand-cyan font-semibold hover:underline cursor-pointer" onClick={() => navigate('/register')}>
            Register Now
          </button>
        </div>
      </div>
    </div>
  );
}

// --- REGISTRATION PAGE ---
function RegisterPage() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailId, setEmailId] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.registerUser({
        firstName,
        lastName,
        emailId,
        contactNumber,
        password
      });

      setSuccess('Registration completed! Approval is pending from the Admin Panel.');
      
      // Clear fields
      setFirstName('');
      setLastName('');
      setEmailId('');
      setContactNumber('');
      setPassword('');
      
      setTimeout(() => {
        navigate('/login');
      }, 3500);
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(circle_at_10%_20%,rgba(15,21,36,0.8)_0%,rgba(8,12,20,1)_90.2%)]">
      <div className="w-full max-w-lg glass-card rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 text-2xl font-black bg-gradient-to-r from-brand-cyan to-brand-blue bg-clip-text text-transparent mb-2">
            <Sparkles className="text-brand-cyan" size={32} />
            <span>Apex Bank</span>
          </div>
          <p className="text-gray-400 text-sm">Create a Premium Digital Account</p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-sm mb-5">
            <ShieldAlert size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3 text-sm mb-5">
            <CheckCircle size={18} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">First Name</label>
              <input 
                type="text" 
                className="bg-bg-tertiary border border-white/5 rounded-xl px-4 py-2.5 text-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-brand-cyan w-full" 
                placeholder="e.g. Adam" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Last Name</label>
              <input 
                type="text" 
                className="bg-bg-tertiary border border-white/5 rounded-xl px-4 py-2.5 text-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-brand-cyan w-full" 
                placeholder="e.g. Sanadi" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
            <input 
              type="email" 
              className="bg-bg-tertiary border border-white/5 rounded-xl px-4 py-2.5 text-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-brand-cyan w-full" 
              placeholder="e.g. adamsanadi1234@gmail.com" 
              value={emailId}
              onChange={(e) => setEmailId(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Number</label>
            <input 
              type="text" 
              className="bg-bg-tertiary border border-white/5 rounded-xl px-4 py-2.5 text-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-brand-cyan w-full" 
              placeholder="e.g. 8547159267" 
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
            <input 
              type="password" 
              className="bg-bg-tertiary border border-white/5 rounded-xl px-4 py-2.5 text-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-brand-cyan w-full" 
              placeholder="Choose a strong password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-brand-cyan to-brand-blue text-[#080c14] py-3 rounded-xl font-bold shadow-lg shadow-brand-cyan/10 hover:opacity-95 active:scale-98 transition-all cursor-pointer mt-4">
            Create Account
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-400">
          Already have an account?{' '}
          <button className="text-brand-cyan font-semibold hover:underline cursor-pointer" onClick={() => navigate('/login')}>
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

// --- DASHBOARD PAGE ---
function DashboardPage({ user }) {
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const acc = await api.getAccountByUserId(user.userId);
        setAccount(acc);
        
        const txs = await api.getTransactionsByAccount(acc.accountNumber);
        setTransactions(txs.slice(0, 5));
      } catch (err) {
        setError(err.message || 'Create an account to begin using bank features.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.userId]);

  const deposits = transactions.filter(t => t.transactionType === 'DEPOSIT' || t.transactionType === 'TRANSFER_IN').reduce((acc, t) => acc + t.amount, 0);
  const withdrawals = transactions.filter(t => t.transactionType === 'WITHDRAWAL' || t.transactionType === 'TRANSFER_OUT').reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl p-5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3 text-sm font-semibold">
            <Wallet size={20} />
            <span>{error}</span>
          </div>
          <button onClick={() => window.location.hash = '/accounts'} className="bg-gradient-to-r from-brand-cyan to-brand-blue text-[#080c14] px-4 py-2 rounded-xl text-xs font-extrabold shadow shadow-brand-cyan/20 cursor-pointer">
            Create Account
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <RefreshCw size={36} className="animate-spin text-brand-cyan mb-4" />
          <p className="text-sm font-semibold">Loading Dashboard Analytics...</p>
        </div>
      ) : (
        <>
          {account && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card rounded-2xl p-6 shadow-lg">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Available Balance</p>
                <h3 className="text-3xl font-black bg-gradient-to-r from-brand-cyan to-brand-blue bg-clip-text text-transparent mb-2">
                  ${account.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-xs text-gray-500">
                  Account No: <strong className="text-gray-300">{account.accountNumber}</strong>
                </p>
              </div>

              <div className="glass-card rounded-2xl p-6 shadow-lg">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Deposits (Recent)</p>
                <h3 className="text-3xl font-black text-emerald-400 mb-2">
                  +${deposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-xs text-gray-500">
                  Sum of recent credited transaction volumes
                </p>
              </div>

              <div className="glass-card rounded-2xl p-6 shadow-lg">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Debits (Recent)</p>
                <h3 className="text-3xl font-black text-red-400 mb-2">
                  -${withdrawals.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-xs text-gray-500">
                  Sum of recent debited transaction volumes
                </p>
              </div>
            </div>
          )}

          {account && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Activity charts representation */}
              <div className="glass-card rounded-2xl p-6 shadow-lg">
                <h4 className="text-md font-bold text-gray-200 mb-4">Activity Statistics</h4>
                <div className="flex items-end justify-center gap-6 h-40 pt-4">
                  <div className="flex flex-col items-center flex-1 h-full justify-end">
                    <div className="w-full max-w-[36px] bg-emerald-500/80 rounded-t-lg transition-all duration-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" style={{ height: deposits > 0 ? '75%' : '10%' }}></div>
                    <span className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-wide">Deposits</span>
                  </div>
                  <div className="flex flex-col items-center flex-1 h-full justify-end">
                    <div className="w-full max-w-[36px] bg-red-500/80 rounded-t-lg transition-all duration-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]" style={{ height: withdrawals > 0 ? '55%' : '10%' }}></div>
                    <span className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-wide">Debits</span>
                  </div>
                  <div className="flex flex-col items-center flex-1 h-full justify-end">
                    <div className="w-full max-w-[36px] bg-brand-cyan/80 rounded-t-lg transition-all duration-500 shadow-[0_0_15px_rgba(0,242,254,0.3)]" style={{ height: '40%' }}></div>
                    <span className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-wide">Transfers</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center mt-5">
                  Visual metric represents account transactions weight inside the ledger.
                </p>
              </div>

              {/* Recent transactions list */}
              <div className="glass-card rounded-2xl p-6 shadow-lg flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-bold text-gray-200">Recent Transactions</h4>
                  <button onClick={() => window.location.hash = '/accounts'} className="text-xs text-brand-cyan hover:underline cursor-pointer font-bold">
                    View All
                  </button>
                </div>

                {transactions.length === 0 ? (
                  <p className="text-gray-500 text-sm my-auto text-center">No transaction records found.</p>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((tx, idx) => {
                      const isCredit = tx.transactionType === 'DEPOSIT' || tx.transactionType === 'TRANSFER_IN';
                      return (
                        <div key={idx} className="flex items-center justify-between pb-3 border-b border-white/5 last:border-0 last:pb-0">
                          <div>
                            <p className="text-sm font-semibold text-gray-200">{tx.description}</p>
                            <p className="text-[11px] text-gray-500">
                              {new Date(tx.timestamp).toLocaleDateString()} {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | Ref: {tx.transactionReference}
                            </p>
                          </div>
                          <span className={`text-sm font-extrabold ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isCredit ? '+' : '-'}${tx.amount.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// --- ACCOUNTS MANAGEMENT PAGE ---
function AccountsPage({ user }) {
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [accountType, setAccountType] = useState('SAVINGS_ACCOUNT');
  const [loading, setLoading] = useState(true);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAccountDetails = async () => {
    try {
      setLoading(true);
      const acc = await api.getAccountByUserId(user.userId);
      setAccount(acc);

      const txs = await api.getTransactionsByAccount(acc.accountNumber);
      setTransactions(txs);
    } catch (err) {
      setAccount(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountDetails();
  }, [user.userId]);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await api.createAccount({
        accountType,
        userId: user.userId
      });
      setSuccess(`Account ${res.accountNumber} successfully created!`);
      fetchAccountDetails();
    } catch (err) {
      setError(err.message || 'Failed to create account');
    }
  };

  const handleCloseAccount = async () => {
    if (!account) return;
    if (!confirm('Are you sure you want to close this account? Your current balance will be settled.')) return;
    
    setError('');
    setSuccess('');
    try {
      await api.closeAccount(account.accountNumber);
      setSuccess('Account closed successfully.');
      fetchAccountDetails();
    } catch (err) {
      setError(err.message || 'Failed to close account');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-sm">
          <ShieldAlert size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3 text-sm">
          <CheckCircle size={18} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20 text-brand-cyan">
          <RefreshCw className="animate-spin" size={32} />
        </div>
      ) : account ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Credit Card Visual */}
          <div className="glass-card rounded-3xl p-6 shadow-xl space-y-6">
            <h4 className="text-md font-bold text-gray-200">Linked Account Details</h4>
            
            {/* The Banking Debit Card Visual Layout */}
            <div className="bg-gradient-to-br from-slate-800 to-zinc-950 rounded-2xl p-6 h-48 flex flex-col justify-between border border-white/5 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-cyan/5 rounded-full filter blur-2xl"></div>
              <div className="flex justify-between items-start">
                <div className="w-12 h-9 bg-gradient-to-br from-amber-200 to-yellow-600 rounded-lg shadow-sm border border-yellow-700/20"></div>
                <Sparkles size={20} className="text-brand-cyan" />
              </div>
              <div className="text-lg font-mono tracking-widest text-gray-100">
                {account.accountNumber.replace(/(\d{4})/g, '$1 ')}
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Account Owner</p>
                  <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide">{user.emailId.split('@')[0]}</p>
                </div>
                <span className="text-xs font-bold italic text-gray-400">
                  {account.accountType === 'SAVINGS_ACCOUNT' ? 'SAVINGS' : 'CHECKING'}
                </span>
              </div>
            </div>

            <div className="space-y-3.5 border-t border-white/5 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Ledger Balance</span>
                <strong className="text-brand-cyan">${account.availableBalance.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Account Type</span>
                <span className="font-semibold text-gray-200">{account.accountType.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Service Status</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {account.accountStatus}
                </span>
              </div>
            </div>

            <button 
              className="w-full bg-red-600/80 hover:bg-red-600 border border-red-700/20 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-red-900/10 cursor-pointer"
              onClick={handleCloseAccount}
            >
              Close Account Request
            </button>
          </div>

          {/* Complete ledger entries table */}
          <div className="glass-card rounded-3xl p-6 shadow-xl space-y-4">
            <h4 className="text-md font-bold text-gray-200">Account Statement</h4>
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-sm py-10 text-center">No statements logged.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-bg-tertiary text-gray-400 text-[11px] uppercase tracking-wider">
                      <th className="p-3">Date</th>
                      <th className="p-3">Reference</th>
                      <th className="p-3">Remarks</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.map((t, idx) => {
                      const isCredit = t.transactionType === 'DEPOSIT' || t.transactionType === 'TRANSFER_IN';
                      return (
                        <tr key={idx} className="hover:bg-white/2">
                          <td className="p-3 text-gray-300">{new Date(t.timestamp).toLocaleDateString()}</td>
                          <td className="p-3 font-mono text-xs text-gray-400">{t.transactionReference}</td>
                          <td className="p-3 text-gray-300">{t.description}</td>
                          <td className={`p-3 text-right font-extrabold ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isCredit ? '+' : '-'}${t.amount.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-8 shadow-xl max-w-md mx-auto space-y-6">
          <h4 className="text-lg font-bold text-gray-100">Setup Active Bank Account</h4>
          <p className="text-sm text-gray-400">
            You do not currently have any active account initialized. Choose an option below to set up your primary banking account.
          </p>
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account Option</label>
              <select 
                className="bg-bg-tertiary border border-white/5 rounded-xl px-4 py-3 text-gray-200 text-sm focus:outline-none focus:border-brand-cyan w-full cursor-pointer" 
                value={accountType} 
                onChange={(e) => setAccountType(e.target.value)}
              >
                <option value="SAVINGS_ACCOUNT">Savings Account (Standard Yield)</option>
                <option value="CHECKING_ACCOUNT">Checking Account (Zero Fees)</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-brand-cyan to-brand-blue text-[#080c14] py-3.5 rounded-xl font-bold shadow-lg shadow-brand-cyan/10 hover:opacity-95 transition-all cursor-pointer mt-4">
              Create Account
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// --- ATM DEPOSIT & WITHDRAWAL TRANSACTIONS ---
function TransactionPage({ user }) {
  const [account, setAccount] = useState(null);
  const [transactionType, setTransactionType] = useState('DEPOSIT');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.getAccountByUserId(user.userId)
      .then((acc) => {
        setAccount(acc);
        setLoading(false);
      })
      .catch(() => {
        setAccount(null);
        setLoading(false);
      });
  }, [user.userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!account) {
      setError('You need an active account to make transactions.');
      return;
    }

    try {
      const amtVal = parseFloat(amount);
      if (isNaN(amtVal) || amtVal <= 0) {
        setError('Please enter a valid positive amount.');
        return;
      }

      await api.makeDepositOrWithdrawal({
        accountId: account.accountNumber,
        transactionType,
        amount: amtVal,
        description: description || `${transactionType} of $${amtVal}`
      });

      setSuccess('Transaction completed successfully!');
      setAmount('');
      setDescription('');
      
      const updatedAcc = await api.getAccountByUserId(user.userId);
      setAccount(updatedAcc);
    } catch (err) {
      setError(err.message || 'Transaction execution failed');
    }
  };

  if (loading) return <div className="flex justify-center py-20 text-brand-cyan"><RefreshCw className="animate-spin" size={32} /></div>;

  return (
    <div className="max-w-md mx-auto">
      {error && (
        <div className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-sm mb-5">
          <ShieldAlert size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3 text-sm mb-5">
          <CheckCircle size={18} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {!account ? (
        <div className="glass-card rounded-3xl p-8 shadow-xl text-center space-y-4">
          <Wallet size={36} className="text-gray-500 mx-auto" />
          <h4 className="text-md font-bold text-gray-200">No Active Account Linked</h4>
          <p className="text-sm text-gray-400">
            Please navigate to the Accounts tab and initialize a primary savings or checking account first.
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-8 shadow-xl space-y-6">
          <h4 className="text-lg font-bold text-gray-200">ATM Simulator</h4>
          
          <div className="bg-bg-tertiary p-5 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Available Balance</span>
            <div className="text-2xl font-black text-brand-cyan">
              ${account.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-gray-500">Account: {account.accountNumber}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Transaction Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm cursor-pointer transition-all border ${
                    transactionType === 'DEPOSIT' 
                      ? 'bg-gradient-to-r from-brand-cyan to-brand-blue text-[#080c14] border-transparent' 
                      : 'bg-bg-tertiary text-gray-400 border-white/5 hover:bg-white/2 hover:text-gray-200'
                  }`}
                  onClick={() => setTransactionType('DEPOSIT')}
                >
                  <ArrowDownLeft size={16} />
                  <span>Deposit</span>
                </button>
                <button
                  type="button"
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm cursor-pointer transition-all border ${
                    transactionType === 'WITHDRAWAL' 
                      ? 'bg-gradient-to-r from-brand-cyan to-brand-blue text-[#080c14] border-transparent' 
                      : 'bg-bg-tertiary text-gray-400 border-white/5 hover:bg-white/2 hover:text-gray-200'
                  }`}
                  onClick={() => setTransactionType('WITHDRAWAL')}
                >
                  <ArrowUpRight size={16} />
                  <span>Withdrawal</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                className="bg-bg-tertiary border border-white/5 rounded-xl px-4 py-3 text-gray-200 text-sm focus:outline-none focus:border-brand-cyan w-full"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Memo / Details</label>
              <input
                type="text"
                className="bg-bg-tertiary border border-white/5 rounded-xl px-4 py-3 text-gray-200 text-sm focus:outline-none focus:border-brand-cyan w-full"
                placeholder="e.g. Cash Deposit, Grocery Store"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-brand-cyan to-brand-blue text-[#080c14] py-3.5 rounded-xl font-bold shadow-lg shadow-brand-cyan/10 hover:opacity-95 active:scale-98 transition-all cursor-pointer mt-4">
              Execute {transactionType === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// --- TRANSFER FUNDS PAGE ---
function TransferPage({ user }) {
  const [account, setAccount] = useState(null);
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.getAccountByUserId(user.userId)
      .then((acc) => {
        setAccount(acc);
        setLoading(false);
      })
      .catch(() => {
        setAccount(null);
        setLoading(false);
      });
  }, [user.userId]);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!account) {
      setError('You need an active account to make transactions.');
      return;
    }

    try {
      const amtVal = parseFloat(amount);
      if (isNaN(amtVal) || amtVal <= 0) {
        setError('Please enter a valid positive amount.');
        return;
      }

      const res = await api.transferFunds({
        fromAccount: account.accountNumber,
        toAccount,
        amount: amtVal
      });

      setSuccess(`Fund transfer successful! Reference: ${res.referenceId}`);
      setAmount('');
      setToAccount('');

      const updatedAcc = await api.getAccountByUserId(user.userId);
      setAccount(updatedAcc);
    } catch (err) {
      setError(err.message || 'Transfer execution failed');
    }
  };

  if (loading) return <div className="flex justify-center py-20 text-brand-cyan"><RefreshCw className="animate-spin" size={32} /></div>;

  return (
    <div className="max-w-md mx-auto">
      {error && (
        <div className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-sm mb-5">
          <ShieldAlert size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3 text-sm mb-5">
          <CheckCircle size={18} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {!account ? (
        <div className="glass-card rounded-3xl p-8 shadow-xl text-center space-y-4">
          <Wallet size={36} className="text-gray-500 mx-auto" />
          <h4 className="text-md font-bold text-gray-200">No Active Account Linked</h4>
          <p className="text-sm text-gray-400">
            Please navigate to the Accounts tab and initialize a primary savings or checking account first.
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-8 shadow-xl space-y-6">
          <h4 className="text-lg font-bold text-gray-200">Fund Transfer System</h4>
          
          <div className="bg-bg-tertiary p-5 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">From Account Balance</span>
            <div className="text-2xl font-black text-brand-cyan">
              ${account.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-gray-500">Sender Account: {account.accountNumber}</p>
          </div>

          <form onSubmit={handleTransfer} className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Beneficiary Account Number</label>
              <input
                type="text"
                className="bg-bg-tertiary border border-white/5 rounded-xl px-4 py-3 text-gray-200 text-sm focus:outline-none focus:border-brand-cyan w-full"
                placeholder="e.g. 0600140000002"
                value={toAccount}
                onChange={(e) => setToAccount(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                className="bg-bg-tertiary border border-white/5 rounded-xl px-4 py-3 text-gray-200 text-sm focus:outline-none focus:border-brand-cyan w-full"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-brand-cyan to-brand-blue text-[#080c14] py-3.5 rounded-xl font-bold shadow-lg shadow-brand-cyan/10 hover:opacity-95 active:scale-98 transition-all cursor-pointer mt-4">
              Confirm Transfer
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// --- PROFILE EDIT PAGE ---
function ProfilePage({ user }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('Male');
  const [occupation, setOccupation] = useState('Student');
  const [martialStatus, setMartialStatus] = useState('Single');
  const [nationality, setNationality] = useState('Indian');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.getUserById(user.userId)
      .then((dbUser) => {
        setFirstName(dbUser.userProfile?.firstName || '');
        setLastName(dbUser.userProfile?.lastName || '');
        setContactNo(dbUser.contactNo || '');
        setAddress(dbUser.userProfile?.address || '');
        setGender(dbUser.userProfile?.gender || 'Male');
        setOccupation(dbUser.userProfile?.occupation || 'Student');
        setMartialStatus(dbUser.userProfile?.martialStatus || 'Single');
        setNationality(dbUser.userProfile?.nationality || 'Indian');
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load profile information');
        setLoading(false);
      });
  }, [user.userId]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.updateUserProfile(user.userId, {
        firstName,
        lastName,
        contactNo,
        address,
        gender,
        occupation,
        martialStatus,
        nationality
      });
      setSuccess('Profile details successfully updated!');
    } catch (err) {
      setError(err.message || 'Profile update failed');
    }
  };

  if (loading) return <div className="flex justify-center py-20 text-brand-cyan"><RefreshCw className="animate-spin" size={32} /></div>;

  return (
    <div className="glass-card rounded-3xl p-8 shadow-xl max-w-xl mx-auto space-y-6">
      <h4 className="text-lg font-bold text-gray-200">Personal KYC Profile</h4>
      
      {error && (
        <div className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-sm">
          <ShieldAlert size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3 text-sm">
          <CheckCircle size={18} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleUpdate} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">First Name</label>
            <input
              type="text"
              className="bg-bg-tertiary border border-white/5 rounded-xl px-4 py-2.5 text-gray-200 text-sm focus:outline-none focus:border-brand-cyan"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Last Name</label>
            <input
              type="text"
              className="bg-bg-tertiary border border-white/5 rounded-xl px-4 py-2.5 text-gray-200 text-sm focus:outline-none focus:border-brand-cyan"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Number</label>
            <input
              type="text"
              className="bg-bg-tertiary border border-white/5 rounded-xl px-4 py-2.5 text-gray-200 text-sm focus:outline-none focus:border-brand-cyan"
              value={contactNo}
              onChange={(e) => setContactNo(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nationality</label>
            <input
              type="text"
              className="bg-bg-tertiary border border-white/5 rounded-xl px-4 py-2.5 text-gray-200 text-sm focus:outline-none focus:border-brand-cyan"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gender</label>
            <select className="bg-bg-tertiary border border-white/5 rounded-xl px-4 py-2.5 text-gray-200 text-sm focus:outline-none focus:border-brand-cyan cursor-pointer" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Marital Status</label>
            <select className="bg-bg-tertiary border border-white/5 rounded-xl px-4 py-2.5 text-gray-200 text-sm focus:outline-none focus:border-brand-cyan cursor-pointer" value={martialStatus} onChange={(e) => setMartialStatus(e.target.value)}>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Occupation</label>
            <input
              type="text"
              className="bg-bg-tertiary border border-white/5 rounded-xl px-4 py-2.5 text-gray-200 text-sm focus:outline-none focus:border-brand-cyan"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Address Details</label>
          <textarea
            className="bg-bg-tertiary border border-white/5 rounded-xl px-4 py-2.5 text-gray-200 text-sm focus:outline-none focus:border-brand-cyan"
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Write complete residential billing address details here..."
          />
        </div>

        <button type="submit" className="w-full bg-gradient-to-r from-brand-cyan to-brand-blue text-[#080c14] py-3.5 rounded-xl font-bold shadow-lg hover:opacity-95 transition-all cursor-pointer mt-4">
          Save Profile
        </button>
      </form>
    </div>
  );
}

// --- ADMIN APPROVALS PANEL ---
function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    api.getAllUsers()
      .then((res) => {
        setUsers(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to retrieve register list');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateStatus = async (userId, status) => {
    setError('');
    setSuccess('');
    try {
      await api.updateUserStatus(userId, status);
      setSuccess(`User status updated to ${status}`);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to change approval status');
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 shadow-xl space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-bold text-gray-200">Admin Control Center</h4>
        <button className="bg-bg-tertiary border border-white/5 hover:bg-white/2 hover:text-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-gray-400 cursor-pointer transition-all" onClick={fetchUsers}>
          <RefreshCw size={12} />
          <span>Refresh List</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-sm">
          <ShieldAlert size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3 text-sm">
          <CheckCircle size={18} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10 text-brand-cyan"><RefreshCw className="animate-spin" size={32} /></div>
      ) : users.length === 0 ? (
        <p className="text-gray-500 text-sm py-10 text-center">No registrants found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-bg-tertiary text-gray-400 text-[11px] uppercase tracking-wider">
                <th className="p-4">User ID</th>
                <th className="p-4">Owner Name</th>
                <th className="p-4">Registered Email</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Identification UUID</th>
                <th className="p-4">KYC Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.userId} className="hover:bg-white/2">
                  <td className="p-4 text-gray-300">{u.userId}</td>
                  <td className="p-4 text-gray-200 font-semibold">{u.userProfile?.firstName} {u.userProfile?.lastName}</td>
                  <td className="p-4 text-gray-300">{u.emailId}</td>
                  <td className="p-4 text-gray-300">{u.contactNo}</td>
                  <td className="p-4 font-mono text-xs text-gray-500">{u.identificationNumber}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      u.status === 'APPROVED' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : u.status === 'PENDING'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="p-4 text-right flex items-center justify-end gap-2">
                    {u.status !== 'APPROVED' && (
                      <button className="bg-emerald-500 text-[#080c14] font-bold px-3 py-1.5 rounded-lg text-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer" onClick={() => handleUpdateStatus(u.userId, 'APPROVED')}>
                        Approve
                      </button>
                    )}
                    {u.status !== 'REJECTED' && (
                      <button className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-[#080c14] font-semibold border border-red-500/30 hover:border-transparent px-3 py-1.5 rounded-lg text-xs active:scale-95 transition-all cursor-pointer" onClick={() => handleUpdateStatus(u.userId, 'REJECTED')}>
                        Reject
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// --- ROUTER ROOT ---
export default function App() {
  const user = getCurrentUser();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
        
        <Route path="/" element={
          <RequireAuth>
            <Layout user={user}>
              <DashboardPage user={user} />
            </Layout>
          </RequireAuth>
        } />

        <Route path="/accounts" element={
          <RequireAuth>
            <Layout user={user}>
              <AccountsPage user={user} />
            </Layout>
          </RequireAuth>
        } />

        <Route path="/transaction" element={
          <RequireAuth>
            <Layout user={user}>
              <TransactionPage user={user} />
            </Layout>
          </RequireAuth>
        } />

        <Route path="/transfer" element={
          <RequireAuth>
            <Layout user={user}>
              <TransferPage user={user} />
            </Layout>
          </RequireAuth>
        } />

        <Route path="/profile" element={
          <RequireAuth>
            <Layout user={user}>
              <ProfilePage user={user} />
            </Layout>
          </RequireAuth>
        } />

        <Route path="/admin" element={
          <RequireAuth>
            <Layout user={user}>
              <AdminPage />
            </Layout>
          </RequireAuth>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DevModeToggle />
    </Router>
  );
}
