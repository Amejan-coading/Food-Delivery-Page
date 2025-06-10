// Mock data for food items (in a real app, this would come from a backend)
let foodItems = JSON.parse(localStorage.getItem('foodItems') || '[]');

let orders = [];
let currentUser = null;

// Auth Functions
function showLogin() {
    document.getElementById('loginForm').style.display = 'flex';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('loginTab').classList.add('active');
    document.getElementById('signupTab').classList.remove('active');
}

function showSignup() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'flex';
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('signupTab').classList.add('active');
}

// Event Listeners for Auth Forms
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // In a real app, this would be an API call
    const userData = JSON.parse(localStorage.getItem('users') || '[]')
        .find(user => user.email === email && user.password === password);
    
    if (userData) {
        if (userData.status === 'blocked') {
            alert('Your account has been blocked. Please contact support.');
            return;
        }
        currentUser = userData;
        localStorage.setItem('userToken', 'dummy-token');
        localStorage.setItem('userData', JSON.stringify(userData));
        showMainApp();
    } else {
        alert('Invalid credentials');
    }
});

document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const phone = document.getElementById('signupPhone').value;
    const password = document.getElementById('signupPassword').value;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.some(user => user.email === email)) {
        alert('Email already exists');
        return;
    }
    
    const newUser = {
        name,
        email,
        phone,
        password,
        status: 'active',
        joinDate: Date.now()
    };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    currentUser = newUser;
    localStorage.setItem('userToken', 'dummy-token');
    localStorage.setItem('userData', JSON.stringify(newUser));
    showMainApp();
});

// Main App Functions
function showMainApp() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    loadFoodItems();
    loadOrders();
    updateProfile();
}

function logout() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    currentUser = null;
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

function showSection(section) {
    const sections = ['home', 'search', 'orders', 'profile'];
    sections.forEach(s => {
        document.getElementById(s + 'Section').style.display = s === section ? 'block' : 'none';
        document.querySelector(`[onclick="showSection('${s}')"]`).classList.toggle('active', s === section);
    });
}

// Food Items Functions
function loadFoodItems(category = 'all') {
    const filteredItems = category === 'all' 
        ? foodItems 
        : foodItems.filter(item => item.category === category);
    
    const foodGrid = document.getElementById('foodGrid');
    foodGrid.innerHTML = filteredItems.map(item => `
        <div class="food-card">
            <img src="${item.image}" alt="${item.name}">
            <div class="food-card-content">
                <h3>${item.name}</h3>
                <p>$${item.price}</p>
                <button onclick="showOrderModal(${item.id})">Order Now</button>
            </div>
        </div>
    `).join('');
}

function filterCategory(category) {
    document.querySelectorAll('.categories button').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(category));
    });
    loadFoodItems(category);
}

// Order Functions
function showOrderModal(foodId) {
    const food = foodItems.find(item => item.id === foodId);
    if (!food) return;
    
    const modal = document.getElementById('orderModal');
    const foodDetails = document.getElementById('orderFoodDetails');
    
    foodDetails.innerHTML = `
        <img src="${food.image}" alt="${food.name}">
        <div class="food-details">
            <h3>${food.name}</h3>
            <p class="food-price">$${food.price.toFixed(2)}</p>
            <p class="food-description">${food.description || ''}</p>
        </div>
    `;
    
    // Set food ID and update price
    foodDetails.dataset.foodId = foodId;
    document.getElementById('orderItemPrice').textContent = `$${food.price.toFixed(2)}`;
    updateOrderTotal(food.price);
    
    // Pre-fill user details if available
    document.getElementById('orderName').value = currentUser.name || '';
    document.getElementById('orderPhone').value = currentUser.phone || '';
    document.getElementById('orderEmail').value = currentUser.email || '';
    document.getElementById('orderAddress').value = currentUser.address || '';
    
    modal.style.display = 'block';
}

function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
    document.getElementById('orderForm').reset();
}

function closeSuccessModal() {
    document.getElementById('orderSuccessModal').style.display = 'none';
    showSection('orders');
}

function updateOrderTotal(itemPrice) {
    const deliveryFee = 2.00;
    const total = itemPrice + deliveryFee;
    document.getElementById('orderTotal').textContent = `$${total.toFixed(2)}`;
}

function generateOrderId() {
    return 'ORD' + Date.now().toString().slice(-6);
}

function calculateEstimatedDelivery() {
    const now = new Date();
    const estimatedTime = new Date(now.getTime() + (45 * 60000)); // 45 minutes from now
    return estimatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function viewOrder() {
    document.getElementById('orderSuccessModal').style.display = 'none';
    showSection('orders');
    loadOrders();
}

document.getElementById('orderForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const foodId = parseInt(document.getElementById('orderFoodDetails').dataset.foodId);
    const food = foodItems.find(item => item.id === foodId);
    
    if (!food) return;
    
    const orderId = generateOrderId();
    const order = {
        id: orderId,
        userId: currentUser.email,
        name: document.getElementById('orderName').value,
        email: document.getElementById('orderEmail').value,
        phone: document.getElementById('orderPhone').value,
        address: document.getElementById('orderAddress').value,
        notes: document.getElementById('orderNotes').value,
        food: {
            id: food.id,
            name: food.name,
            price: food.price,
            image: food.image
        },
        paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
        status: 'pending',
        date: new Date().toISOString(),
        total: food.price + 2.00 // Item price + delivery fee
    };
    
    // Save order
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Save address as default if not already saved
    if (!currentUser.address) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(user => user.email === currentUser.email);
        if (userIndex !== -1) {
            users[userIndex].address = order.address;
            localStorage.setItem('users', JSON.stringify(users));
            currentUser.address = order.address;
            localStorage.setItem('userData', JSON.stringify(currentUser));
        }
    }
    
    // Close order modal and show success modal
    closeOrderModal();
    
    // Show success modal with order details
    document.getElementById('successOrderId').textContent = orderId;
    document.getElementById('estimatedDelivery').textContent = calculateEstimatedDelivery();
    document.getElementById('orderSuccessModal').style.display = 'block';
    
    // Update orders list
    loadOrders();
});

// Close modals when clicking outside
window.onclick = function(event) {
    const orderModal = document.getElementById('orderModal');
    const successModal = document.getElementById('orderSuccessModal');
    
    if (event.target === orderModal) {
        closeOrderModal();
    } else if (event.target === successModal) {
        closeSuccessModal();
    }
};

function loadOrders() {
    const userOrders = JSON.parse(localStorage.getItem('orders') || '[]')
        .filter(order => order.userId === currentUser.email)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const ordersList = document.getElementById('ordersList');
    
    if (userOrders.length === 0) {
        ordersList.innerHTML = `
            <div class="no-orders">
                <h3>No Orders Yet</h3>
                <p>Your order history will appear here</p>
            </div>
        `;
        return;
    }
    
    ordersList.innerHTML = userOrders.map(order => `
        <div class="order-item">
            <div class="order-header">
                <span class="order-status status-${order.status}"></span>
                <h3>Order #${order.id}</h3>
                <span class="order-date">${new Date(order.date).toLocaleString()}</span>
            </div>
            <div class="order-content">
                <div class="order-food">
                    <img src="${order.food.image}" alt="${order.food.name}" class="order-food-image">
                    <div class="order-food-details">
                        <h4>${order.food.name}</h4>
                        <p class="food-price">$${order.food.price}</p>
                    </div>
                </div>
                <div class="order-info">
                    <p><strong>Delivery Address:</strong> ${order.address}</p>
                    <p><strong>Contact:</strong> ${order.phone}</p>
                    <p><strong>Status:</strong> 
                        <span class="status-text ${order.status}">${order.status}</span>
                        ${order.completedAt ? 
                            `<br><small>Completed on: ${new Date(order.completedAt).toLocaleString()}</small>` 
                            : ''}
                    </p>
                </div>
            </div>
        </div>
    `).join('');
}

// Profile Functions
function updateProfile() {
    document.getElementById('profileName').value = currentUser.name;
    document.getElementById('profileEmail').value = currentUser.email;
    document.getElementById('profilePhone').value = currentUser.phone;
    document.getElementById('profileAddress').value = currentUser.address || '';
    document.getElementById('profileStatus').textContent = currentUser.status || 'active';
    document.getElementById('profileAvatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=0D8ABC&color=fff`;
    
    updateOrderStats();
    loadProfileOrders();
}

function updateOrderStats() {
    const userOrders = JSON.parse(localStorage.getItem('orders') || '[]')
        .filter(order => order.userId === currentUser.email);
    
    document.getElementById('totalOrders').textContent = userOrders.length;
    document.getElementById('pendingOrders').textContent = userOrders.filter(order => order.status === 'pending').length;
    document.getElementById('completedOrders').textContent = userOrders.filter(order => order.status === 'completed').length;
}

function loadProfileOrders() {
    const userOrders = JSON.parse(localStorage.getItem('orders') || '[]')
        .filter(order => order.userId === currentUser.email)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const ordersList = document.getElementById('profileOrdersList');
    ordersList.innerHTML = userOrders.map(order => `
        <div class="order-item">
            <span class="order-status status-${order.status}"></span>
            <h3>${order.food.name}</h3>
            <p><strong>Delivery Address:</strong> ${order.address}</p>
            <p><strong>Contact:</strong> ${order.phone}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Date:</strong> ${new Date(order.date).toLocaleDateString()}</p>
        </div>
    `).join('');
}

function switchProfileTab(tab) {
    const tabs = ['info', 'orders', 'settings'];
    tabs.forEach(t => {
        document.getElementById(`${t}Tab`).classList.toggle('active', t === tab);
        document.getElementById(`${t}Tab-content`).style.display = t === tab ? 'block' : 'none';
    });
}

// Profile Form Submission
document.getElementById('profileForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(user => user.email === currentUser.email);
    
    if (userIndex !== -1) {
        const updatedUser = {
            ...users[userIndex],
            name: document.getElementById('profileName').value,
            phone: document.getElementById('profilePhone').value,
            address: document.getElementById('profileAddress').value
        };
        
        users[userIndex] = updatedUser;
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        currentUser = updatedUser;
        
        alert('Profile updated successfully!');
        updateProfile();
    }
});

// Password Change
document.getElementById('passwordForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (currentPassword !== currentUser.password) {
        alert('Current password is incorrect');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(user => user.email === currentUser.email);
    
    if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        localStorage.setItem('users', JSON.stringify(users));
        currentUser.password = newPassword;
        localStorage.setItem('userData', JSON.stringify(currentUser));
        
        alert('Password changed successfully!');
        this.reset();
    }
});

// Delete Account
function deleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.filter(user => user.email !== currentUser.email);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const updatedOrders = orders.filter(order => order.userId !== currentUser.email);
    localStorage.setItem('orders', JSON.stringify(updatedOrders));
    
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    window.location.reload();
}

// Save notification preferences
function saveNotificationPreferences() {
    const emailNotifs = document.getElementById('emailNotifications').checked;
    const orderUpdates = document.getElementById('orderUpdates').checked;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(user => user.email === currentUser.email);
    
    if (userIndex !== -1) {
        users[userIndex].preferences = {
            emailNotifications: emailNotifs,
            orderUpdates: orderUpdates
        };
        localStorage.setItem('users', JSON.stringify(users));
        currentUser.preferences = users[userIndex].preferences;
        localStorage.setItem('userData', JSON.stringify(currentUser));
    }
}

// Event listeners for notification toggles
document.getElementById('emailNotifications').addEventListener('change', saveNotificationPreferences);
document.getElementById('orderUpdates').addEventListener('change', saveNotificationPreferences);

// Search Functions
document.getElementById('searchInput').addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase();
    const results = foodItems.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
    
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = results.map(item => `
        <div class="food-card">
            <img src="${item.image}" alt="${item.name}">
            <div class="food-card-content">
                <h3>${item.name}</h3>
                <p>$${item.price}</p>
                <button onclick="showOrderModal(${item.id})">Order Now</button>
            </div>
        </div>
    `).join('');
});

// Check for existing session
window.addEventListener('load', function() {
    const userToken = localStorage.getItem('userToken');
    const userData = localStorage.getItem('userData');
    
    if (userToken && userData) {
        currentUser = JSON.parse(userData);
        showMainApp();
    }
});

// Add event listener for storage changes to update food items in real-time
window.addEventListener('storage', function(e) {
    if (e.key === 'foodItems') {
        foodItems = JSON.parse(e.newValue || '[]');
        if (document.getElementById('mainApp').style.display !== 'none') {
            loadFoodItems();
        }
    }
});

const newStyles = `
.order-preview {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
}

.order-food-image {
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 8px;
}

.order-food-details {
    flex: 1;
}

.food-price {
    color: #4CAF50;
    font-weight: bold;
    font-size: 1.2rem;
}

.order-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

.order-date {
    color: #666;
    font-size: 0.875rem;
    margin-left: auto;
}

.order-content {
    display: grid;
    gap: 1rem;
}

.order-food {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.status-text {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.875rem;
}

.status-text.pending {
    background-color: #fff3e0;
    color: #ff9800;
}

.status-text.completed {
    background-color: #e8f5e9;
    color: #4CAF50;
}

.no-orders {
    text-align: center;
    padding: 3rem;
    background: white;
    border-radius: 8px;
    color: #666;
}

.no-orders h3 {
    margin-bottom: 0.5rem;
    color: #333;
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = newStyles;
document.head.appendChild(styleSheet);
