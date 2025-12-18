// --- STATE MANAGEMENT ---
let transactions = JSON.parse(localStorage.getItem('wallet_wise_transactions')) || [];

// --- DOM ELEMENTS ---
const balanceAmount = document.getElementById('balance-amount');
const totalIncome = document.getElementById('total-income');
const totalExpenses = document.getElementById('total-expenses');
const transactionForm = document.getElementById('transaction-form');
const typeInput = document.getElementById('type');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const historyList = document.getElementById('history-list');
const themeToggle = document.getElementById('theme-toggle');

// Chart.js instance
let financeChart;

// --- UTILITY FUNCTIONS ---
function formatCurrency(value) {
    return `$${value.toFixed(2)}`;
}

// --- RENDER FUNCTIONS ---
function renderTransactions() {
    historyList.innerHTML = '';
    if (transactions.length === 0) {
        historyList.innerHTML = '<li class="empty-state">No transactions yet.</li>';
        return;
    }

    // Oxirgi tranzaksiyalarni tepada ko'rsatish uchun nusxasini aylantiramiz
    [...transactions].reverse().forEach((transaction, reversedIndex) => {
        const actualIndex = transactions.length - 1 - reversedIndex;
        const li = document.createElement('li');
        li.classList.add('transaction-item');
        li.innerHTML = `
            <div class="description">${transaction.description}</div>
            ${transaction.type === 'expense' && transaction.category !== 'none' ? `<span class="category">${transaction.category}</span>` : ''}
            <div class="amount ${transaction.type}">${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}</div>
            <button class="delete-transaction" onclick="deleteTransaction(${actualIndex})"><i class="fas fa-trash"></i></button>
        `;
        historyList.appendChild(li);
    });
}

function updateSummary() {
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;

    balanceAmount.textContent = formatCurrency(balance);
    totalIncome.textContent = formatCurrency(income);
    totalExpenses.textContent = formatCurrency(expenses);

    updateChart(); 
}

function updateChart() {
    const ctx = document.getElementById('expense-chart').getContext('2d');

    // Balans tarixini hisoblash (Line chart uchun ma'lumot)
    let currentBal = 0;
    const balanceHistory = transactions.map(t => {
        if (t.type === 'income') currentBal += t.amount;
        else currentBal -= t.amount;
        return currentBal;
    });

    // Agar tranzaksiya bo'lmasa 0 dan boshlaymiz
    const dataPoints = balanceHistory.length > 0 ? balanceHistory : [0];
    const labels = balanceHistory.length > 0 ? transactions.map((_, i) => `Step ${i + 1}`) : ['Start'];

    if (financeChart) {
        financeChart.destroy(); // Eski grafikni tozalash (xatolik bermasligi uchun)
    }

    financeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Balance Trend',
                data: dataPoints,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.4, // Egri chiziq effekti
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: '#2563eb'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                x: { display: false } // X o'qini toza saqlash uchun yashiramiz
            }
        }
    });

    // Legend qismini yangilash
    const chartLegend = document.getElementById('chart-legend');
    chartLegend.innerHTML = `
        <div class="legend-item">
            <div class="legend-color-box" style="background: #2563eb; height: 3px; width: 20px; border-radius: 0;"></div>
            <span>Balance Flow</span>
        </div>
    `;
}

// --- EVENT HANDLERS ---
transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const type = typeInput.value;
    const description = descriptionInput.value;
    const amount = parseFloat(amountInput.value);
    const category = categoryInput.value;

    if (isNaN(amount) || amount <= 0) return;

    const newTransaction = {
        id: Date.now(),
        type,
        description,
        amount,
        category: type === 'expense' ? category : 'none'
    };

    transactions.push(newTransaction);
    localStorage.setItem('wallet_wise_transactions', JSON.stringify(transactions));

    transactionForm.reset();
    renderTransactions();
    updateSummary();
});

typeInput.addEventListener('change', () => {
    categoryInput.parentElement.style.display = typeInput.value === 'expense' ? 'block' : 'none';
});

window.deleteTransaction = (index) => {
    transactions.splice(index, 1);
    localStorage.setItem('wallet_wise_transactions', JSON.stringify(transactions));
    renderTransactions();
    updateSummary();
};

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const icon = themeToggle.querySelector('i');
    icon.className = document.body.classList.contains('dark-mode') ? 'fas fa-sun' : 'fas fa-moon';
});

// --- INITIALIZATION ---
function init() {
    renderTransactions();
    updateSummary();
    if (typeInput.value !== 'expense') {
        categoryInput.parentElement.style.display = 'none';
    }
}

init();