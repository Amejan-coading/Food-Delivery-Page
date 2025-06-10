// Admin credentials
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

// Admin Auth
document.getElementById('adminLoginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        localStorage.setItem('adminToken', 'admin-dummy-token');
        showAdminDashboard();
    } else {
        alert('Invalid admin credentials');
    }
});

function showAdminDashboard() {
    document.getElementById('adminAuthScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    loadUsers();
    loadAdminOrders();
    loadAdminFoodItems();
}

function adminLogout() {
    localStorage.removeItem('adminToken');
    document.getElementById('adminAuthScreen').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
}

// Navigation
function showAdminSection(section) {
    const sections = ['users', 'orders', 'search', 'foodItems', 'addFood'];
    sections.forEach(s => {
        document.getElementById(s + 'Section').style.display = s === section ? 'block' : 'none';
        document.querySelector(`[onclick="showAdminSection('${s}')"]`).classList.toggle('active', s === section);
    });
}

// Users Management
function loadUsers(filter = 'all', searchQuery = '') {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const filteredUsers = users.filter(user => {
        const matchesFilter = filter === 'all' || user.status === filter;
        const matchesSearch = searchQuery === '' || 
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });
    
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = filteredUsers.map(user => `
        <div class="user-card">
            <div class="user-info">
                <h3>${user.name}</h3>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Phone:</strong> ${user.phone}</p>
                <p>
                    <span class="user-status status-${user.status || 'active'}">
                        ${user.status || 'active'}
                    </span>
                </p>
                <p><strong>Joined:</strong> ${new Date(user.joinDate || Date.now()).toLocaleDateString()}</p>
                <p><strong>Orders:</strong> ${getUserOrderCount(user.email)}</p>
            </div>
            <div class="user-actions">
                ${user.status === 'blocked' ? 
                    `<button class="unblock-btn" onclick="updateUserStatus('${user.email}', 'active')">
                        Unblock User
                    </button>` :
                    `<button class="block-btn" onclick="updateUserStatus('${user.email}', 'blocked')">
                        Block User
                    </button>`
                }
                <button class="delete-user-btn" onclick="deleteUser('${user.email}')">
                    Delete User
                </button>
            </div>
        </div>
    `).join('');
}

function getUserOrderCount(userEmail) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    return orders.filter(order => order.userId === userEmail).length;
}

function updateUserStatus(userEmail, newStatus) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(user => user.email === userEmail);
    
    if (userIndex !== -1) {
        users[userIndex].status = newStatus;
        localStorage.setItem('users', JSON.stringify(users));
        loadUsers(
            document.getElementById('userStatusFilter').value,
            document.getElementById('userSearchInput').value
        );
    }
}

function deleteUser(userEmail) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }
    
    // Delete user
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.filter(user => user.email !== userEmail);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Delete user's orders
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const updatedOrders = orders.filter(order => order.userId !== userEmail);
    localStorage.setItem('orders', JSON.stringify(updatedOrders));
    
    loadUsers(
        document.getElementById('userStatusFilter').value,
        document.getElementById('userSearchInput').value
    );
    loadAdminOrders();
}

// Add event listeners for user filtering and search
document.getElementById('userStatusFilter').addEventListener('change', function(e) {
    loadUsers(e.target.value, document.getElementById('userSearchInput').value);
});

document.getElementById('userSearchInput').addEventListener('input', function(e) {
    loadUsers(document.getElementById('userStatusFilter').value, e.target.value);
});

// Orders Management
function loadAdminOrders(filter = 'all', searchQuery = '') {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]')
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const filteredOrders = orders.filter(order => {
        const matchesFilter = filter === 'all' || order.status === filter;
        const matchesSearch = searchQuery === '' || 
            order.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    // Update order statistics
    document.getElementById('adminTotalOrders').textContent = orders.length;
    document.getElementById('adminPendingOrders').textContent = orders.filter(o => o.status === 'pending').length;
    document.getElementById('adminCompletedOrders').textContent = orders.filter(o => o.status === 'completed').length;

    const ordersList = document.getElementById('adminOrdersList');
    ordersList.innerHTML = filteredOrders.map(order => `
        <div class="order-item" data-order-id="${order.id}">
            <div class="order-info">
                <h3>
                    <span class="order-status status-${order.status}"></span>
                    Order #${order.id}
                </h3>
                <p class="order-customer"><strong>Customer:</strong> ${order.name}</p>
                <p><strong>Food Item:</strong> ${order.food.name}</p>
                <p><strong>Price:</strong> $${order.food.price}</p>
                <p><strong>Delivery Address:</strong> ${order.address}</p>
                <p><strong>Contact:</strong> ${order.phone}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                <p class="order-timestamp">
                    <strong>Ordered:</strong> ${new Date(order.date).toLocaleString()}
                    ${order.lastUpdated ? 
                        `<br><small>Last Updated: ${new Date(order.lastUpdated).toLocaleString()}</small>` 
                        : ''}
                    ${order.completedAt ? 
                        `<br><small>Completed: ${new Date(order.completedAt).toLocaleString()}</small>` 
                        : ''}
                </p>
            </div>
            <div class="order-actions">
                <button class="action-btn edit-btn" onclick="openEditOrderModal(${order.id})" title="Edit Order">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteOrder(${order.id})" title="Delete Order">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    // Notify about order status changes
    notifyOrderStatusChange(orders);
}

function completeOrder(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const orderIndex = orders.findIndex(order => order.id === orderId);
    
    if (orderIndex !== -1) {
        orders[orderIndex].status = 'completed';
        orders[orderIndex].completedAt = new Date().toISOString();
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // Reload orders with current filters
        loadAdminOrders(
            document.getElementById('orderStatusFilter').value,
            document.getElementById('orderSearchInput').value
        );
    }
}

// Edit Order Functions
function openEditOrderModal(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.id === orderId);
    
    if (!order) return;
    
    document.getElementById('editOrderId').value = order.id;
    document.getElementById('editOrderName').value = order.name;
    document.getElementById('editOrderPhone').value = order.phone;
    document.getElementById('editOrderAddress').value = order.address;
    document.getElementById('editOrderStatus').value = order.status;
    
    document.getElementById('editOrderModal').style.display = 'block';
}

function closeEditOrderModal() {
    document.getElementById('editOrderModal').style.display = 'none';
    document.getElementById('editOrderForm').reset();
}

document.getElementById('editOrderForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const orderId = parseInt(document.getElementById('editOrderId').value);
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) return;
    
    const updatedOrder = {
        ...orders[orderIndex],
        name: document.getElementById('editOrderName').value,
        phone: document.getElementById('editOrderPhone').value,
        address: document.getElementById('editOrderAddress').value,
        status: document.getElementById('editOrderStatus').value,
        lastUpdated: new Date().toISOString()
    };
    
    if (updatedOrder.status === 'completed' && orders[orderIndex].status === 'pending') {
        updatedOrder.completedAt = new Date().toISOString();
    }
    
    orders[orderIndex] = updatedOrder;
    localStorage.setItem('orders', JSON.stringify(orders));
    
    closeEditOrderModal();
    loadAdminOrders(
        document.getElementById('orderStatusFilter').value,
        document.getElementById('orderSearchInput').value
    );
    
    // Notify user about order update
    notifyOrderStatusChange([updatedOrder]);
});

// Delete Order Function
function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
        return;
    }
    
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const updatedOrders = orders.filter(order => order.id !== orderId);
    localStorage.setItem('orders', JSON.stringify(updatedOrders));
    
    loadAdminOrders(
        document.getElementById('orderStatusFilter').value,
        document.getElementById('orderSearchInput').value
    );
}

// Add event listeners for order filtering and search
document.getElementById('orderStatusFilter').addEventListener('change', function(e) {
    loadAdminOrders(e.target.value, document.getElementById('orderSearchInput').value);
});

document.getElementById('orderSearchInput').addEventListener('input', function(e) {
    loadAdminOrders(document.getElementById('orderStatusFilter').value, e.target.value);
});

// Function to notify users about order status changes
function notifyOrderStatusChange(orders) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    orders.forEach(order => {
        const user = users.find(u => u.email === order.userId);
        if (user && user.preferences && user.preferences.orderUpdates) {
            // In a real app, this would send notifications to the user
            console.log(`Notification for ${user.name}: Your order #${order.id} is ${order.status}`);
        }
    });
}

// Food Items Management
function loadAdminFoodItems(category = 'all') {
    const foodItems = JSON.parse(localStorage.getItem('foodItems') || '[]');
    const filteredItems = category === 'all' 
        ? foodItems 
        : foodItems.filter(item => item.category === category);
    
    const foodGrid = document.getElementById('adminFoodGrid');
    foodGrid.innerHTML = filteredItems.map(item => `
        <div class="food-card">
            <img src="${item.image}" alt="${item.name}">
            <div class="food-card-content">
                <h3>${item.name}</h3>
                <p>$${item.price}</p>
                <div class="food-card-actions">
                    <button class="edit-btn" onclick="showEditFoodModal(${item.id})">Edit</button>
                    <button class="delete-btn" onclick="deleteFood(${item.id})">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

function filterAdminCategory(category) {
    document.querySelectorAll('.categories button').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(category));
    });
    loadAdminFoodItems(category);
}

// Add Food
document.getElementById('addFoodForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const newFood = {
        id: Date.now(),
        name: document.getElementById('foodName').value,
        price: parseFloat(document.getElementById('foodPrice').value),
        category: document.getElementById('foodCategory').value,
        image: document.getElementById('foodImage').value
    };
    
    const foodItems = JSON.parse(localStorage.getItem('foodItems') || '[]');
    foodItems.push(newFood);
    localStorage.setItem('foodItems', JSON.stringify(foodItems));
    
    this.reset();
    showAdminSection('foodItems');
    loadAdminFoodItems();
});

// Edit Food
function showEditFoodModal(foodId) {
    const foodItems = JSON.parse(localStorage.getItem('foodItems') || '[]');
    const food = foodItems.find(item => item.id === foodId);
    
    if (food) {
        document.getElementById('editFoodId').value = food.id;
        document.getElementById('editFoodName').value = food.name;
        document.getElementById('editFoodPrice').value = food.price;
        document.getElementById('editFoodCategory').value = food.category;
        document.getElementById('editFoodImage').value = food.image;
        
        document.getElementById('editFoodModal').style.display = 'block';
    }
}

document.querySelector('#editFoodModal .close').addEventListener('click', () => {
    document.getElementById('editFoodModal').style.display = 'none';
});

document.getElementById('editFoodForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const foodId = parseInt(document.getElementById('editFoodId').value);
    const foodItems = JSON.parse(localStorage.getItem('foodItems') || '[]');
    const foodIndex = foodItems.findIndex(item => item.id === foodId);
    
    if (foodIndex !== -1) {
        foodItems[foodIndex] = {
            id: foodId,
            name: document.getElementById('editFoodName').value,
            price: parseFloat(document.getElementById('editFoodPrice').value),
            category: document.getElementById('editFoodCategory').value,
            image: document.getElementById('editFoodImage').value
        };
        
        localStorage.setItem('foodItems', JSON.stringify(foodItems));
        document.getElementById('editFoodModal').style.display = 'none';
        loadAdminFoodItems();
    }
});

// Delete Food
function deleteFood(foodId) {
    if (confirm('Are you sure you want to delete this food item?')) {
        const foodItems = JSON.parse(localStorage.getItem('foodItems') || '[]');
        const updatedItems = foodItems.filter(item => item.id !== foodId);
        localStorage.setItem('foodItems', JSON.stringify(updatedItems));
        loadAdminFoodItems();
    }
}

// Search
document.getElementById('adminSearchInput').addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase();
    const foodItems = JSON.parse(localStorage.getItem('foodItems') || '[]');
    const results = foodItems.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
    
    const searchResults = document.getElementById('adminSearchResults');
    searchResults.innerHTML = results.map(item => `
        <div class="food-card">
            <img src="${item.image}" alt="${item.name}">
            <div class="food-card-content">
                <h3>${item.name}</h3>
                <p>$${item.price}</p>
                <div class="food-card-actions">
                    <button class="edit-btn" onclick="showEditFoodModal(${item.id})">Edit</button>
                    <button class="delete-btn" onclick="deleteFood(${item.id})">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
});

// Check for existing admin session
window.addEventListener('load', function() {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
        showAdminDashboard();
    }
});
