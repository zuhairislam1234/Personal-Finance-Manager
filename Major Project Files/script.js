// Initialize data structures
let transactions = [];
let budgets = {};
let savingsGoal = null;
let recurringTransactions = [];
let isDarkMode = false;
let isLoading = true;

// Load data on startup
function loadData() {
    isLoading = true;
    
    try {
        // Load transactions
        const transData = localStorage.getItem('finance-transactions');
        if (transData) {
            transactions = JSON.parse(transData);
            console.log('Loaded transactions:', transactions.length);
        }

        // Load budgets
        const budgetData = localStorage.getItem('finance-budgets');
        if (budgetData) {
            budgets = JSON.parse(budgetData);
            console.log('Loaded budgets:', Object.keys(budgets).length);
        }

        // Load savings goal
        const goalData = localStorage.getItem('finance-savings-goal');
        if (goalData) {
            savingsGoal = JSON.parse(goalData);
            console.log('Loaded savings goal');
        }

        // Load recurring transactions
        const recurringData = localStorage.getItem('finance-recurring');
        if (recurringData) {
            recurringTransactions = JSON.parse(recurringData);
            console.log('Loaded recurring transactions:', recurringTransactions.length);
        }

        // Load theme preference
        const theme = localStorage.getItem('finance-theme');
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            isDarkMode = true;
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
    
    isLoading = false;
    updateDashboard();
}

// Save data functions
function saveTransactions() {
    try {
        localStorage.setItem('finance-transactions', JSON.stringify(transactions));
        console.log('Transactions saved:', transactions.length);
    } catch (error) {
        console.error('Error saving transactions:', error);
        showAlert('Error saving transactions', 'danger');
    }
}

function saveBudgets() {
    try {
        localStorage.setItem('finance-budgets', JSON.stringify(budgets));
        console.log('Budgets saved:', Object.keys(budgets).length);
    } catch (error) {
        console.error('Error saving budgets:', error);
        showAlert('Error saving budgets', 'danger');
    }
}

function saveSavingsGoal() {
    try {
        localStorage.setItem('finance-savings-goal', JSON.stringify(savingsGoal));
        console.log('Savings goal saved');
    } catch (error) {
        console.error('Error saving savings goal:', error);
        showAlert('Error saving savings goal', 'danger');
    }
}

function saveRecurring() {
    try {
        localStorage.setItem('finance-recurring', JSON.stringify(recurringTransactions));
        console.log('Recurring transactions saved:', recurringTransactions.length);
    } catch (error) {
        console.error('Error saving recurring transactions:', error);
        showAlert('Error saving recurring', 'danger');
    }
}

function saveTheme() {
    try {
        localStorage.setItem('finance-theme', isDarkMode ? 'dark' : 'light');
    } catch (error) {
        console.error('Error saving theme:', error);
    }
}

// Theme toggle
document.getElementById('themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    isDarkMode = !isDarkMode;
    saveTheme();
});

// Set today's date as default
document.getElementById('date').valueAsDate = new Date();

// Recurring transaction toggle
document.getElementById('isRecurring').addEventListener('change', (e) => {
    document.getElementById('recurringFrequencyGroup').style.display = 
        e.target.checked ? 'block' : 'none';
});

// Transaction form handling
document.getElementById('transactionForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const transaction = {
        id: Date.now(),
        type: document.getElementById('transactionType').value,
        category: document.getElementById('category').value,
        amount: parseFloat(document.getElementById('amount').value),
        date: document.getElementById('date').value,
        description: document.getElementById('description').value,
        isRecurring: document.getElementById('isRecurring').checked,
        recurringFrequency: document.getElementById('isRecurring').checked ? 
            document.getElementById('recurringFrequency').value : null
    };

    transactions.push(transaction);
    saveTransactions();
    
    if (transaction.isRecurring) {
        recurringTransactions.push({
            ...transaction,
            lastProcessed: transaction.date
        });
        saveRecurring();
    }
    
    checkBudgetAlerts();
    updateDashboard();
    e.target.reset();
    document.getElementById('date').valueAsDate = new Date();
    document.getElementById('recurringFrequencyGroup').style.display = 'none';
    
    showAlert('Transaction added successfully!', 'success');
});

// Budget form handling
document.getElementById('budgetForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const category = document.getElementById('budgetCategory').value;
    const amount = parseFloat(document.getElementById('budgetAmount').value);
    
    budgets[category] = amount;
    saveBudgets();
    updateBudgetDisplay();
    checkBudgetAlerts();
    e.target.reset();
    
    showAlert('Budget set successfully!', 'success');
});

// Savings goal form handling
document.getElementById('savingsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    savingsGoal = {
        amount: parseFloat(document.getElementById('goalAmount').value),
        date: document.getElementById('goalDate').value,
        name: document.getElementById('goalName').value || 'Savings Goal'
    };
    
    saveSavingsGoal();
    updateSavingsProgress();
    e.target.reset();
    
    showAlert('Savings goal set successfully!', 'success');
});

// Export functionality
document.getElementById('exportBtn').addEventListener('click', exportData);
document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
});
document.getElementById('importFile').addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        importData(e.target.files[0]);
    }
});

function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alert.style.marginBottom = '10px';
    alertContainer.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

function exportData() {
    const data = {
        transactions,
        budgets,
        savingsGoal,
        recurringTransactions
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showAlert('Data exported successfully!', 'success');
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            transactions = data.transactions || [];
            budgets = data.budgets || {};
            savingsGoal = data.savingsGoal || null;
            recurringTransactions = data.recurringTransactions || [];
            
            saveTransactions();
            saveBudgets();
            saveSavingsGoal();
            saveRecurring();
            
            updateDashboard();
            showAlert('Data imported successfully!', 'success');
        } catch (error) {
            showAlert('Error importing data. Please check the file format.', 'danger');
        }
    };
    reader.readAsText(file);
}

function checkBudgetAlerts() {
    Object.entries(budgets).forEach(([category, amount]) => {
        const spent = transactions
            .filter(t => t.type === 'expense' && t.category === category)
            .reduce((sum, t) => sum + t.amount, 0);
        
        const percentSpent = (spent/amount) * 100;
        
        if (percentSpent >= 100) {
            showAlert(`Alert: You've exceeded your ${category} budget by ${(percentSpent - 100).toFixed(1)}%!`, 'danger');
        } else if (percentSpent >= 80) {
            showAlert(`Warning: You've used ${percentSpent.toFixed(1)}% of your ${category} budget`, 'warning');
        }
    });
}

// Search and filter
document.getElementById('searchTransaction').addEventListener('input', filterTransactions);
document.getElementById('filterType').addEventListener('change', filterTransactions);
document.getElementById('filterCategory').addEventListener('change', filterTransactions);

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(tabName).classList.add('active');
        
        if (tabName === 'trend-chart') {
            updateTrendChart();
        } else if (tabName === 'comparison') {
            updateComparison();
        }
    });
});

function filterTransactions() {
    const searchText = document.getElementById('searchTransaction').value.toLowerCase();
    const filterType = document.getElementById('filterType').value;
    const filterCategory = document.getElementById('filterCategory').value;

    const filteredTransactions = transactions.filter(transaction => {
        const matchesSearch = transaction.description.toLowerCase().includes(searchText);
        const matchesType = filterType === 'all' || transaction.type === filterType;
        const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;
        return matchesSearch && matchesType && matchesCategory;
    });

    updateTransactionList(filteredTransactions);
}

function updateTransactionList(filteredTransactions) {
    const transactionList = document.getElementById('transactionList');
    transactionList.innerHTML = '';
    
    if (filteredTransactions.length === 0) {
        transactionList.innerHTML = '<p style="text-align: center; opacity: 0.6; padding: 20px;">No transactions found</p>';
        return;
    }

    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach(transaction => {
            const div = document.createElement('div');
            div.className = `transaction-item ${transaction.type}-transaction`;
            div.innerHTML = `
                <div>
                    <strong>${transaction.description}</strong>
                    ${transaction.isRecurring ? '<span class="recurring-badge">RECURRING</span>' : ''}
                    <div style="font-size: 0.9em; opacity: 0.8;">${transaction.category} - ${transaction.date}</div>
                </div>
                <div class="transaction-actions">
                    <span class="${transaction.type}-amount" style="font-weight: bold;">
                        ${transaction.type === 'income' ? '+' : '-'}₹${transaction.amount.toFixed(2)}
                    </span>
                    <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">×</button>
                </div>
            `;
            transactionList.appendChild(div);
        });
}

function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);
        recurringTransactions = recurringTransactions.filter(t => t.id !== id);
        saveTransactions();
        saveRecurring();
        updateDashboard();
        showAlert('Transaction deleted successfully!', 'success');
    }
}

function updateDashboard() {
    if (isLoading) return;
    processRecurringTransactions();
    updateBalanceSummary();
    updateMonthlySummary();
    filterTransactions();
    updateExpenseChart();
    updateSavingsProgress();
    updateBudgetDisplay();
    updateInsights();
}

function processRecurringTransactions() {
    const today = new Date();
    let updated = false;
    
    recurringTransactions.forEach(rt => {
        const lastProcessed = new Date(rt.lastProcessed);
        let shouldProcess = false;
        
        switch(rt.recurringFrequency) {
            case 'daily':
                shouldProcess = today.toDateString() !== lastProcessed.toDateString();
                break;
            case 'weekly':
                const weekDiff = Math.floor((today - lastProcessed) / (1000 * 60 * 60 * 24 * 7));
                shouldProcess = weekDiff >= 1;
                break;
            case 'monthly':
                shouldProcess = today.getMonth() !== lastProcessed.getMonth() || 
                              today.getFullYear() !== lastProcessed.getFullYear();
                break;
        }
        
        if (shouldProcess) {
            const newTransaction = {
                id: Date.now() + Math.random(),
                type: rt.type,
                category: rt.category,
                amount: rt.amount,
                date: today.toISOString().split('T')[0],
                description: rt.description,
                isRecurring: true,
                recurringFrequency: rt.recurringFrequency
            };
            transactions.push(newTransaction);
            rt.lastProcessed = today.toISOString().split('T')[0];
            updated = true;
        }
    });
    
    if (updated) {
        saveTransactions();
        saveRecurring();
    }
}

function updateBalanceSummary() {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpenses;
    
    document.getElementById('totalBalance').textContent = `₹${balance.toFixed(2)}`;
    document.getElementById('totalIncome').textContent = `₹${totalIncome.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `₹${totalExpenses.toFixed(2)}`;
}

function updateMonthlySummary() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('currentMonthName').textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const monthlyTransactions = transactions.filter(t => {
        const transDate = new Date(t.date);
        return transDate.getMonth() === currentMonth && 
               transDate.getFullYear() === currentYear;
    });

    const monthlyIncome = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const monthlySavings = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome * 100) : 0;

    document.getElementById('monthlyIncome').textContent = `₹${monthlyIncome.toFixed(2)}`;
    document.getElementById('monthlyExpenses').textContent = `₹${monthlyExpenses.toFixed(2)}`;
    document.getElementById('monthlySavings').textContent = `₹${monthlySavings.toFixed(2)}`;
    document.getElementById('savingsRate').textContent = `${savingsRate.toFixed(1)}%`;
}

function updateExpenseChart() {
    const expensesByCategory = {};
    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
        });

    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    if (window.expenseChartInstance) {
        window.expenseChartInstance.destroy();
    }

    // Handle empty data
    if (Object.keys(expensesByCategory).length === 0) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.font = '16px Arial';
        ctx.fillStyle = '#999';
        ctx.textAlign = 'center';
        ctx.fillText('No expense data available', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    window.expenseChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(expensesByCategory),
            datasets: [{
                data: Object.values(expensesByCategory),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateTrendChart() {
    const last6Months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        last6Months.push(date);
    }

    const monthlyData = last6Months.map(date => {
        const month = date.getMonth();
        const year = date.getFullYear();
        
        const monthTransactions = transactions.filter(t => {
            const transDate = new Date(t.date);
            return transDate.getMonth() === month && transDate.getFullYear() === year;
        });

        const income = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        return { month: date, income, expenses };
    });

    const ctx = document.getElementById('trendChart').getContext('2d');
    
    if (window.trendChartInstance) {
        window.trendChartInstance.destroy();
    }

    window.trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthlyData.map(d => d.month.toLocaleDateString('en-US', { month: 'short' })),
            datasets: [{
                label: 'Income',
                data: monthlyData.map(d => d.income),
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                tension: 0.4
            }, {
                label: 'Expenses',
                data: monthlyData.map(d => d.expenses),
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

function updateComparison() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const lastMonth = new Date(currentYear, currentMonth - 1, 1);
    
    const currentMonthTrans = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    const lastMonthTrans = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
    });

    const currentIncome = currentMonthTrans.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const currentExpenses = currentMonthTrans.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const lastIncome = lastMonthTrans.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const lastExpenses = lastMonthTrans.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const incomeChange = lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome * 100) : 0;
    const expenseChange = lastExpenses > 0 ? ((currentExpenses - lastExpenses) / lastExpenses * 100) : 0;

    document.getElementById('comparisonContent').innerHTML = `
        <div class="comparison-grid">
            <div class="comparison-card">
                <h4>This Month Income</h4>
                <p style="font-size: 1.5em; color: var(--success-color);">₹${currentIncome.toFixed(2)}</p>
                <span class="trend ${incomeChange >= 0 ? 'up' : 'down'}">
                    ${incomeChange >= 0 ? '↑' : '↓'} ${Math.abs(incomeChange).toFixed(1)}%
                </span>
            </div>
            <div class="comparison-card">
                <h4>This Month Expenses</h4>
                <p style="font-size: 1.5em; color: var(--danger-color);">₹${currentExpenses.toFixed(2)}</p>
                <span class="trend ${expenseChange <= 0 ? 'up' : 'down'}">
                    ${expenseChange >= 0 ? '↑' : '↓'} ${Math.abs(expenseChange).toFixed(1)}%
                </span>
            </div>
            <div class="comparison-card">
                <h4>Last Month Income</h4>
                <p style="font-size: 1.5em;">₹${lastIncome.toFixed(2)}</p>
            </div>
            <div class="comparison-card">
                <h4>Last Month Expenses</h4>
                <p style="font-size: 1.5em;">₹${lastExpenses.toFixed(2)}</p>
            </div>
        </div>
    `;
}

function updateSavingsProgress() {
    if (!savingsGoal) {
        document.getElementById('savingsStatus').textContent = 'No goal set';
        document.getElementById('progressFill').style.width = '0%';
        return;
    }

    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const currentSavings = totalIncome - totalExpenses;
    const progress = (currentSavings / savingsGoal.amount) * 100;
    
    document.getElementById('progressFill').style.width = `${Math.min(progress, 100)}%`;
    document.getElementById('savingsStatus').textContent = 
        `${savingsGoal.name}: ₹${currentSavings.toFixed(2)} of ₹${savingsGoal.amount.toFixed(2)} (${progress.toFixed(1)}%)`;
}

function updateBudgetDisplay() {
    const budgetList = document.getElementById('budgetList');
    budgetList.innerHTML = '';

    Object.entries(budgets).forEach(([category, budgetAmount]) => {
        const spent = transactions
            .filter(t => t.type === 'expense' && t.category === category)
            .reduce((sum, t) => sum + t.amount, 0);

        const percentage = (spent / budgetAmount) * 100;
        let progressColor;
        
        if (percentage >= 100) {
            progressColor = 'var(--danger-color)';
        } else if (percentage >= 80) {
            progressColor = 'var(--warning-color)';
        } else {
            progressColor = 'var(--success-color)';
        }

        const div = document.createElement('div');
        div.className = 'budget-item';
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <strong>${category.charAt(0).toUpperCase() + category.slice(1)}</strong>
                <span>₹${spent.toFixed(2)} / ₹${budgetAmount.toFixed(2)}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%; background-color: ${progressColor};"></div>
            </div>
        `;
        budgetList.appendChild(div);
    });

    if (Object.keys(budgets).length === 0) {
        budgetList.innerHTML = '<p style="text-align: center; opacity: 0.6;">No budgets set</p>';
    }
}

function updateInsights() {
    const insightsGrid = document.getElementById('insightsGrid');
    
    const avgTransaction = transactions.length > 0 
        ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length 
        : 0;

    const totalDays = transactions.length > 0 
        ? Math.ceil((new Date() - new Date(transactions[0].date)) / (1000 * 60 * 60 * 24)) 
        : 0;

    const avgDailySpending = totalDays > 0 
        ? transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) / totalDays 
        : 0;

    const topCategory = transactions.length > 0 
        ? Object.entries(
            transactions
                .filter(t => t.type === 'expense')
                .reduce((acc, t) => {
                    acc[t.category] = (acc[t.category] || 0) + t.amount;
                    return acc;
                }, {})
        ).sort((a, b) => b[1] - a[1])[0]
        : null;

    insightsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${transactions.length}</div>
            <div class="stat-label">Total Transactions</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">₹${avgTransaction.toFixed(2)}</div>
            <div class="stat-label">Avg Transaction</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">₹${avgDailySpending.toFixed(2)}</div>
            <div class="stat-label">Avg Daily Spending</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${topCategory ? topCategory[0] : 'N/A'}</div>
            <div class="stat-label">Top Expense Category</div>
        </div>
    `;
}

// Initialize on load
loadData();