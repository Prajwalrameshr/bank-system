// API service layer for the Banking Microservices Application
// Supports Dual Mode: Mock (local storage) and Real (Spring Boot Gateway REST endpoints)

const GATEWAY_URL = 'http://localhost:8080';

// Check mode settings in localStorage, default to mock mode
const MODE_KEY = 'banking_app_mode';
export const getAppMode = () => {
  const mode = localStorage.getItem(MODE_KEY);
  return mode === 'real' ? 'real' : 'mock';
};

export const setAppMode = (mode) => {
  localStorage.setItem(MODE_KEY, mode);
  window.location.reload();
};

// --- MOCK DATABASE INITIALIZATION ---
const initMockDB = () => {
  if (!localStorage.getItem('mock_users')) {
    const defaultUsers = [
      {
        userId: 1,
        emailId: 'adamsanadi1234@gmail.com',
        contactNo: '8547159267',
        status: 'APPROVED',
        authId: 'auth-adam-123',
        identificationNumber: 'id-adam-555',
        userProfile: {
          firstName: 'Adam',
          lastName: 'Sanadi',
          gender: 'Male',
          occupation: 'Engineer',
          martialStatus: 'Married',
          nationality: 'Indian',
          address: '123 Tech Park, Bangalore',
        },
      },
      {
        userId: 2,
        emailId: 'kishankulkarni@gmail.com',
        contactNo: '9562148579',
        status: 'PENDING',
        authId: 'auth-kishan-456',
        identificationNumber: 'id-kishan-666',
        userProfile: {
          firstName: 'Kishan',
          lastName: 'Kulkarni',
        },
      },
    ];
    localStorage.setItem('mock_users', JSON.stringify(defaultUsers));
  }

  if (!localStorage.getItem('mock_accounts')) {
    const defaultAccounts = [
      {
        accountId: 1,
        accountNumber: '0600140000001',
        accountType: 'SAVINGS_ACCOUNT',
        accountStatus: 'ACTIVE',
        availableBalance: 12500.75,
        userId: 1,
      },
    ];
    localStorage.setItem('mock_accounts', JSON.stringify(defaultAccounts));
  }

  if (!localStorage.getItem('mock_transactions')) {
    const defaultTransactions = [
      {
        accountId: '0600140000001',
        transactionType: 'DEPOSIT',
        amount: 10000.0,
        description: 'Initial Deposit via Branch',
        transactionReference: 'tx-ref-1111',
        timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        accountId: '0600140000001',
        transactionType: 'DEPOSIT',
        amount: 2500.75,
        description: 'Online salary credit',
        transactionReference: 'tx-ref-2222',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ];
    localStorage.setItem('mock_transactions', JSON.stringify(defaultTransactions));
  }

  if (!localStorage.getItem('mock_transfers')) {
    localStorage.setItem('mock_transfers', JSON.stringify([]));
  }

  if (!localStorage.getItem('mock_current_user')) {
    // Logged in as Adam Sanadi by default in mock mode
    localStorage.setItem('mock_current_user', JSON.stringify({ emailId: 'adamsanadi1234@gmail.com', userId: 1 }));
  }
};

initMockDB();

// Helper to get from localstorage
const getMockData = (key) => {
  return JSON.parse(localStorage.getItem(key) || '[]');
};

const saveMockData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Helper for auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// --- API IMPLEMENTATION ---
export const api = {
  // --- USER API ---
  registerUser: async (data) => {
    if (getAppMode() === 'mock') {
      const users = getMockData('mock_users');
      const emailExists = users.some((u) => u.emailId.toLowerCase() === data.emailId.toLowerCase());
      if (emailExists) {
        throw new Error('This emailId is already registered as a user');
      }

      const newId = users.length + 1;
      const newUser = {
        userId: newId,
        emailId: data.emailId,
        contactNo: data.contactNumber,
        status: 'PENDING',
        authId: `auth-mock-${Date.now()}`,
        identificationNumber: `id-mock-${Math.floor(100000 + Math.random() * 900000)}`,
        userProfile: {
          firstName: data.firstName,
          lastName: data.lastName,
        },
      };

      users.push(newUser);
      saveMockData('mock_users', users);
      return { responseCode: '200', responseMessage: 'User created successfully' };
    } else {
      const res = await fetch(`${GATEWAY_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to register');
      }
      return res.json();
    }
  },

  getAllUsers: async () => {
    if (getAppMode() === 'mock') {
      return getMockData('mock_users');
    } else {
      const res = await fetch(`${GATEWAY_URL}/api/users`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    }
  },

  getUserById: async (userId) => {
    if (getAppMode() === 'mock') {
      const users = getMockData('mock_users');
      const user = users.find((u) => u.userId === userId);
      if (!user) throw new Error('User not found on the server');
      return user;
    } else {
      const res = await fetch(`${GATEWAY_URL}/api/users/${userId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('User not found on the server');
      return res.json();
    }
  },

  getUserByAccountId: async (accountId) => {
    if (getAppMode() === 'mock') {
      const accounts = getMockData('mock_accounts');
      const acc = accounts.find((a) => a.accountNumber === accountId);
      if (!acc) throw new Error('Account not found');
      return api.getUserById(acc.userId);
    } else {
      const res = await fetch(`${GATEWAY_URL}/api/users/accounts/${accountId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('User not found on the server');
      return res.json();
    }
  },

  updateUserStatus: async (userId, status) => {
    if (getAppMode() === 'mock') {
      const users = getMockData('mock_users');
      const userIdx = users.findIndex((u) => u.userId === userId);
      if (userIdx === -1) throw new Error('User not found');
      users[userIdx].status = status;
      saveMockData('mock_users', users);
      return { responseCode: '200', responseMessage: 'User status updated successfully' };
    } else {
      const res = await fetch(`${GATEWAY_URL}/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    }
  },

  updateUserProfile: async (userId, profileData) => {
    if (getAppMode() === 'mock') {
      const users = getMockData('mock_users');
      const userIdx = users.findIndex((u) => u.userId === userId);
      if (userIdx === -1) throw new Error('User not found');
      
      users[userIdx].contactNo = profileData.contactNo || users[userIdx].contactNo;
      users[userIdx].userProfile = {
        ...users[userIdx].userProfile,
        ...profileData,
      };
      
      saveMockData('mock_users', users);
      return { responseCode: '200', responseMessage: 'User profile updated successfully' };
    } else {
      const res = await fetch(`${GATEWAY_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(profileData),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      return res.json();
    }
  },

  // --- ACCOUNTS API ---
  createAccount: async (data) => {
    if (getAppMode() === 'mock') {
      const accounts = getMockData('mock_accounts');
      const seq = accounts.length + 1;
      const accountNumber = `060014000000${seq}`;
      
      const newAcc = {
        accountId: seq,
        accountNumber,
        accountType: data.accountType,
        accountStatus: 'ACTIVE',
        availableBalance: 0.0,
        userId: Number(data.userId),
      };

      accounts.push(newAcc);
      saveMockData('mock_accounts', accounts);
      return { responseCode: '200', responseMessage: 'Account created successfully', accountNumber };
    } else {
      const res = await fetch(`${GATEWAY_URL}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create account');
      return res.json();
    }
  },

  getAccountByUserId: async (userId) => {
    if (getAppMode() === 'mock') {
      const accounts = getMockData('mock_accounts');
      const acc = accounts.find((a) => a.userId === userId && a.accountStatus !== 'CLOSED');
      if (!acc) throw new Error('Account not found for this user');
      return acc;
    } else {
      const res = await fetch(`${GATEWAY_URL}/accounts/${userId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Account not found');
      return res.json();
    }
  },

  getAccountByNumber: async (accountNumber) => {
    if (getAppMode() === 'mock') {
      const accounts = getMockData('mock_accounts');
      const acc = accounts.find((a) => a.accountNumber === accountNumber);
      if (!acc) throw new Error('Account not found');
      return acc;
    } else {
      const res = await fetch(`${GATEWAY_URL}/accounts?accountNumber=${accountNumber}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Account not found');
      return res.json();
    }
  },

  updateAccountStatus: async (accountNumber, status) => {
    if (getAppMode() === 'mock') {
      const accounts = getMockData('mock_accounts');
      const idx = accounts.findIndex((a) => a.accountNumber === accountNumber);
      if (idx === -1) throw new Error('Account not found');
      accounts[idx].accountStatus = status;
      saveMockData('mock_accounts', accounts);
      return { responseMessage: 'Account status updated successfully' };
    } else {
      const res = await fetch(`${GATEWAY_URL}/accounts?accountNumber=${accountNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ accountStatus: status }),
      });
      if (!res.ok) throw new Error('Failed to update account status');
      return res.json();
    }
  },

  closeAccount: async (accountNumber) => {
    if (getAppMode() === 'mock') {
      const accounts = getMockData('mock_accounts');
      const idx = accounts.findIndex((a) => a.accountNumber === accountNumber);
      if (idx === -1) throw new Error('Account not found');
      accounts[idx].accountStatus = 'CLOSED';
      accounts[idx].availableBalance = 0;
      saveMockData('mock_accounts', accounts);
      return { responseMessage: 'Account closed successfully' };
    } else {
      const res = await fetch(`${GATEWAY_URL}/accounts/closure?accountNumber=${accountNumber}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to close account');
      return res.json();
    }
  },

  // --- TRANSACTIONS API ---
  makeDepositOrWithdrawal: async (data) => {
    if (getAppMode() === 'mock') {
      const accounts = getMockData('mock_accounts');
      const idx = accounts.findIndex((a) => a.accountNumber === data.accountId);
      if (idx === -1) throw new Error('Account not found');
      
      if (accounts[idx].accountStatus !== 'ACTIVE') {
        throw new Error('Account is inactive or closed');
      }

      const amt = Number(data.amount);
      if (data.transactionType === 'WITHDRAWAL' && accounts[idx].availableBalance < amt) {
        throw new Error('Insufficient funds');
      }

      if (data.transactionType === 'DEPOSIT') {
        accounts[idx].availableBalance += amt;
      } else {
        accounts[idx].availableBalance -= amt;
      }

      saveMockData('mock_accounts', accounts);

      const transactions = getMockData('mock_transactions');
      const newTx = {
        accountId: data.accountId,
        transactionType: data.transactionType,
        amount: amt,
        description: data.description,
        transactionReference: `tx-${Math.floor(100000 + Math.random() * 900000)}`,
        timestamp: new Date().toISOString(),
      };
      transactions.push(newTx);
      saveMockData('mock_transactions', transactions);

      return { responseMessage: 'Transaction completed successfully' };
    } else {
      const res = await fetch(`${GATEWAY_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Transaction failed');
      }
      return res.json();
    }
  },

  getTransactionsByAccount: async (accountNumber) => {
    if (getAppMode() === 'mock') {
      const transactions = getMockData('mock_transactions');
      return transactions
        .filter((t) => t.accountId === accountNumber)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else {
      const res = await fetch(`${GATEWAY_URL}/transactions?accountId=${accountNumber}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch transactions');
      return res.json();
    }
  },

  // --- FUND TRANSFERS API ---
  transferFunds: async (data) => {
    if (getAppMode() === 'mock') {
      const accounts = getMockData('mock_accounts');
      const fromIdx = accounts.findIndex((a) => a.accountNumber === data.fromAccount);
      const toIdx = accounts.findIndex((a) => a.accountNumber === data.toAccount);

      if (fromIdx === -1) throw new Error('Source account not found');
      if (toIdx === -1) throw new Error('Destination account not found');

      if (accounts[fromIdx].accountStatus !== 'ACTIVE') throw new Error('Source account is not active');
      if (accounts[toIdx].accountStatus !== 'ACTIVE') throw new Error('Destination account is not active');

      const amt = Number(data.amount);
      if (accounts[fromIdx].availableBalance < amt) throw new Error('Insufficient balance in source account');

      // Deduct and add
      accounts[fromIdx].availableBalance -= amt;
      accounts[toIdx].availableBalance += amt;
      saveMockData('mock_accounts', accounts);

      const refId = `tf-${Math.floor(100000 + Math.random() * 900000)}`;

      // Save transactions
      const transactions = getMockData('mock_transactions');
      transactions.push({
        accountId: data.fromAccount,
        transactionType: 'TRANSFER_OUT',
        amount: amt,
        description: `Fund Transfer to ${data.toAccount}`,
        transactionReference: refId,
        timestamp: new Date().toISOString(),
      });
      transactions.push({
        accountId: data.toAccount,
        transactionType: 'TRANSFER_IN',
        amount: amt,
        description: `Fund Transfer from ${data.fromAccount}`,
        transactionReference: refId,
        timestamp: new Date().toISOString(),
      });
      saveMockData('mock_transactions', transactions);

      // Save transfer record
      const transfers = getMockData('mock_transfers');
      transfers.push({
        transferId: transfers.length + 1,
        fromAccount: data.fromAccount,
        toAccount: data.toAccount,
        amount: amt,
        referenceId: refId,
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
      });
      saveMockData('mock_transfers', transfers);

      return {
        referenceId: refId,
        transactionStatus: 'SUCCESS',
        transactionMessage: 'Fund transfer executed successfully',
      };
    } else {
      const res = await fetch(`${GATEWAY_URL}/fund-transfers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Fund transfer failed');
      }
      return res.json();
    }
  },

  getFundTransfersByAccount: async (accountNumber) => {
    if (getAppMode() === 'mock') {
      const transfers = getMockData('mock_transfers');
      return transfers.filter((t) => t.fromAccount === accountNumber || t.toAccount === accountNumber);
    } else {
      const res = await fetch(`${GATEWAY_URL}/fund-transfers?accountId=${accountNumber}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch transfers');
      return res.json();
    }
  },
};

// --- AUTH UTILITIES ---
export const getCurrentUser = () => {
  const user = localStorage.getItem('mock_current_user');
  return user ? JSON.parse(user) : null;
};

export const setCurrentUser = (emailId, userId) => {
  localStorage.setItem('mock_current_user', JSON.stringify({ emailId, userId }));
};

export const logoutUser = () => {
  localStorage.removeItem('mock_current_user');
  localStorage.removeItem('banking_token');
  window.location.reload();
};

export const getAuthToken = () => {
  return localStorage.getItem('banking_token');
};

export const setAuthToken = (token) => {
  localStorage.setItem('banking_token', token);
};
