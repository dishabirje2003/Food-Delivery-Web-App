// Admin Dashboard JavaScript

// API_BASE_URL is already declared in utils.js
// If it's not available (shouldn't happen since utils.js loads first), use default
const ADMIN_API_BASE_URL = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : "http://localhost:5000";

document.addEventListener('DOMContentLoaded', async () => {
    // Check admin authentication
    const user = Storage.getUser();

    // Check for admin credentials (supports both admin@gmail.com and Admin)
    const isAdmin = user && user.isAdmin && (user.email === 'Admin' || user.email === 'admin@gmail.com');
    if (!isAdmin) {
        console.log('Admin check failed. User:', user);
        window.location.href = "login.html?admin=true";
        return;
    }
    
    console.log('Admin authenticated successfully');
    
    // Initialize admin navigation (profile dropdown)
    initializeAdminNavigation();
    
    await loadRestaurantsForSelect();
    await loadRestaurantsTable();
    await loadMenusTable();
    
    // Add restaurant form handler
    document.getElementById('addRestaurantForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const areas = formData.get('areas').split(',').map(area => area.trim()).filter(area => area);
        
        const restaurant = {
            name: formData.get('name'),
            cuisine: formData.get('cuisine'),
            rating: parseFloat(formData.get('rating')),
            deliveryTime: formData.get('deliveryTime'),
            image: formData.get('image'),
            description: formData.get('description'),
            deliveryFee: parseFloat(formData.get('deliveryFee')) || 2.99,
            minOrder: parseFloat(formData.get('minOrder')) || 0,
            areas: areas
        };
        
        try {
            console.log('Adding restaurant:', restaurant);
            
            // Check if backend is available
            let response;
            try {
                response = await fetch(`${ADMIN_API_BASE_URL}/api/restaurants`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(restaurant)
                });
            } catch (fetchError) {
                console.error('Fetch error:', fetchError);
                alert('Cannot connect to backend server. Please ensure:\n1. Backend server is running on port 5000\n2. Check browser console for details');
                return;
            }

            const data = await response.json();
            console.log('Response status:', response.status);
            console.log('Response data:', data);
            
            if (response.ok) {
                document.getElementById('restaurantSuccess').style.display = 'block';
                document.getElementById('restaurantSuccess').textContent = 'Restaurant added successfully!';
                e.target.reset();
                await loadRestaurantsForSelect();
                await loadRestaurantsTable();
                
                setTimeout(() => {
                    document.getElementById('restaurantSuccess').style.display = 'none';
                }, 3000);
            } else {
                console.error('Failed to add restaurant:', data);
                const errorMsg = data.message || data.error || 'Failed to add restaurant';
                alert(`${errorMsg}\n\nCheck:\n1. All required fields are filled\n2. MongoDB is connected\n3. Backend server logs for details`);
            }
        } catch (error) {
            console.error('Error adding restaurant:', error);
            alert(`Error: ${error.message}\n\nPlease check:\n1. Backend server is running on port 5000\n2. MongoDB connection is working\n3. Check browser console for details`);
        }
    });
    
    // Add menu item form handler
    document.getElementById('addMenuItemForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const restaurantId = formData.get('restaurantId');
        
        // Handle both ObjectId and string IDs
        let restaurantIdToUse = restaurantId;
        
        // Try to find restaurant to get proper ID format
        const restaurants = await Storage.getRestaurants();
        const restaurant = restaurants.find(r => 
            String(r._id) === restaurantId || String(r.id) === restaurantId
        );
        
        if (restaurant) {
            restaurantIdToUse = restaurant._id || restaurant.id;
        }
        
        const menuItem = {
            restaurantId: restaurantIdToUse,
            name: formData.get('name'),
            description: formData.get('description'),
            price: parseFloat(formData.get('price')),
            image: formData.get('image'),
            available: true
        };
        
        try {
            console.log('Adding menu item:', menuItem);
            
            // Check if backend is available
            let response;
            try {
                response = await fetch(`${ADMIN_API_BASE_URL}/api/menu`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(menuItem)
                });
            } catch (fetchError) {
                console.error('Fetch error:', fetchError);
                alert('Cannot connect to backend server. Please ensure:\n1. Backend server is running on port 5000\n2. Check browser console for details');
                return;
            }

            const data = await response.json();
            console.log('Response status:', response.status);
            console.log('Response data:', data);
            
            if (response.ok) {
                document.getElementById('menuItemSuccess').style.display = 'block';
                document.getElementById('menuItemSuccess').textContent = 'Food item added successfully!';
                e.target.reset();
                await loadMenusTable();
                
                setTimeout(() => {
                    document.getElementById('menuItemSuccess').style.display = 'none';
                }, 3000);
            } else {
                console.error('Failed to add menu item:', data);
                const errorMsg = data.message || data.error || 'Failed to add menu item';
                alert(`${errorMsg}\n\nCheck:\n1. Restaurant is selected\n2. All fields are filled\n3. MongoDB is connected\n4. Backend server logs for details`);
            }
        } catch (error) {
            console.error('Error adding menu item:', error);
            alert(`Error: ${error.message}\n\nPlease check:\n1. Backend server is running on port 5000\n2. MongoDB connection is working\n3. Check browser console for details`);
        }
    });

    // Edit restaurant form handler
    document.getElementById('editRestaurantForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editRestaurantId').value;
        const areas = document.getElementById('editRestaurantAreas').value.split(',').map(area => area.trim()).filter(area => area);
        
        const restaurant = {
            name: document.getElementById('editRestaurantName').value,
            cuisine: document.getElementById('editRestaurantCuisine').value,
            rating: parseFloat(document.getElementById('editRestaurantRating').value),
            deliveryTime: document.getElementById('editRestaurantDeliveryTime').value,
            image: document.getElementById('editRestaurantImage').value,
            description: document.getElementById('editRestaurantDescription').value,
            deliveryFee: parseFloat(document.getElementById('editRestaurantDeliveryFee').value),
            minOrder: parseFloat(document.getElementById('editRestaurantMinOrder').value),
            areas: areas
        };
        
        try {
            const response = await fetch(`${ADMIN_API_BASE_URL}/api/restaurants/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(restaurant)
            });

            const data = await response.json();
            
            if (response.ok) {
                closeEditRestaurantModal();
                await loadRestaurantsForSelect();
                await loadRestaurantsTable();
                alert('Restaurant updated successfully!');
            } else {
                alert(data.message || 'Failed to update restaurant');
            }
        } catch (error) {
            console.error('Error updating restaurant:', error);
            alert('Failed to update restaurant. Please try again.');
        }
    });

    // Edit menu form handler
    document.getElementById('editMenuForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editMenuId').value;
        
        const menuItem = {
            restaurantId: document.getElementById('editMenuRestaurantId').value,
            name: document.getElementById('editMenuName').value,
            description: document.getElementById('editMenuDescription').value,
            price: parseFloat(document.getElementById('editMenuPrice').value),
            image: document.getElementById('editMenuImage').value,
            available: document.getElementById('editMenuAvailable').value === 'true'
        };
        
        try {
            const response = await fetch(`${ADMIN_API_BASE_URL}/api/menu/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(menuItem)
            });

            const data = await response.json();
            
            if (response.ok) {
                closeEditMenuModal();
                await loadMenusTable();
                await loadRestaurantsForSelect(); // Reload for dropdown
                alert('Menu item updated successfully!');
            } else {
                alert(data.message || 'Failed to update menu item');
            }
        } catch (error) {
            console.error('Error updating menu item:', error);
            alert('Failed to update menu item. Please try again.');
        }
    });
});

// Define showTab function and make it globally accessible immediately
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.admin-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    const tabElement = document.getElementById(tabName);
    if (tabElement) {
        tabElement.classList.add('active');
    }
    
    // Activate the clicked button
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Reload data if viewing tables
    if (tabName === 'viewRestaurants') {
        loadRestaurantsTable();
    } else if (tabName === 'viewMenus') {
        loadMenusTable();
    }
}

// Make showTab globally accessible immediately
window.showTab = showTab;

async function loadRestaurantsForSelect() {
    try {
        // Try to fetch from API first
        let restaurants = [];
        try {
            console.log('Loading restaurants for select dropdown...');
            const response = await fetch(`${ADMIN_API_BASE_URL}/api/restaurants`);
            if (response.ok) {
                restaurants = await response.json();
                console.log(`✅ Loaded ${restaurants.length} restaurants for select`);
            } else {
                throw new Error(`API returned ${response.status}`);
            }
        } catch (apiError) {
            console.warn('⚠️ API not available, using fallback:', apiError.message);
            try {
                restaurants = await Storage.getRestaurants();
                console.log(`⚠️ Loaded ${restaurants.length} restaurants from fallback`);
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                restaurants = [];
            }
        }
        
        const select = document.getElementById('menuRestaurantId');
        const editSelect = document.getElementById('editMenuRestaurantId');
        
        if (select) {
            if (restaurants.length === 0) {
                select.innerHTML = '<option value="">No restaurants available. Add a restaurant first.</option>';
            } else {
                select.innerHTML = '<option value="">Select Restaurant</option>' + 
                    restaurants.map(r => `<option value="${r._id || r.id}">${r.name}</option>`).join('');
            }
        }
        
        if (editSelect) {
            if (restaurants.length === 0) {
                editSelect.innerHTML = '<option value="">No restaurants available</option>';
            } else {
                editSelect.innerHTML = '<option value="">Select Restaurant</option>' + 
                    restaurants.map(r => `<option value="${r._id || r.id}">${r.name}</option>`).join('');
            }
        }
    } catch (error) {
        console.error('Error loading restaurants for select:', error);
    }
}

async function loadRestaurantsTable() {
    const container = document.getElementById('restaurantsTableContainer');
    container.innerHTML = '<div class="spinner"></div>';
    
    try {
        // Try to fetch from API first
        let restaurants = [];
        try {
            console.log('Fetching restaurants from API...');
            const response = await fetch(`${ADMIN_API_BASE_URL}/api/restaurants`);
            console.log('API response status:', response.status);
            
            if (response.ok) {
                restaurants = await response.json();
                console.log(`✅ Loaded ${restaurants.length} restaurants from API`);
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('API error:', response.status, errorData);
                throw new Error(`API returned ${response.status}`);
            }
        } catch (apiError) {
            console.warn('⚠️ API not available, trying fallback:', apiError.message);
            // Fallback to Storage.getRestaurants()
            try {
                restaurants = await Storage.getRestaurants();
                console.log(`⚠️ Loaded ${restaurants.length} restaurants from fallback`);
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                restaurants = [];
            }
        }
        
        if (!restaurants || restaurants.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🍽️</div>
                    <h3>No restaurants available</h3>
                    <p>Add your first restaurant using the "Add Restaurant" tab.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div style="overflow-x: auto;">
                <table class="restaurants-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: var(--bg-light);">
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid var(--border-color);">Name</th>
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid var(--border-color);">Cuisine</th>
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid var(--border-color);">Rating</th>
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid var(--border-color);">Delivery Time</th>
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid var(--border-color);">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${restaurants.map(r => {
                            const restaurantId = r._id || r.id;
                            return `
                                <tr style="border-bottom: 1px solid var(--border-color);">
                                    <td style="padding: 1rem;"><strong>${r.name}</strong></td>
                                    <td style="padding: 1rem;">${r.cuisine}</td>
                                    <td style="padding: 1rem;">⭐ ${r.rating}</td>
                                    <td style="padding: 1rem;">${r.deliveryTime}</td>
                                    <td style="padding: 1rem;">
                                        <button onclick="editRestaurant('${restaurantId}')" class="btn" style="background: var(--primary-color); color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; margin-right: 0.5rem;">Edit</button>
                                        <button onclick="deleteRestaurant('${restaurantId}', '${r.name.replace(/'/g, "\\'")}')" class="btn" style="background: #ff6b6b; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">Delete</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Error loading restaurants:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <h3>Error loading restaurants</h3>
                <p>Please try again later.</p>
            </div>
        `;
    }
}

async function loadMenusTable() {
    const container = document.getElementById('menusTableContainer');
    container.innerHTML = '<div class="spinner"></div>';
    
    try {
        let menuItems = [];
        let restaurants = [];
        
        // Try to fetch from API
        try {
            console.log('Fetching menu items from API...');
            const menuResponse = await fetch(`${ADMIN_API_BASE_URL}/api/menu`);
            console.log('Menu API response status:', menuResponse.status);
            
            if (menuResponse.ok) {
                menuItems = await menuResponse.json();
                console.log(`✅ Loaded ${menuItems.length} menu items from API`);
            } else {
                const errorData = await menuResponse.json().catch(() => ({}));
                console.error('Menu API error:', menuResponse.status, errorData);
            }
            
            console.log('Fetching restaurants from API...');
            const restaurantResponse = await fetch(`${ADMIN_API_BASE_URL}/api/restaurants`);
            if (restaurantResponse.ok) {
                restaurants = await restaurantResponse.json();
                console.log(`✅ Loaded ${restaurants.length} restaurants from API`);
            } else {
                console.warn('Restaurant API failed, using fallback');
                restaurants = await Storage.getRestaurants();
            }
        } catch (apiError) {
            console.warn('⚠️ API not available:', apiError.message);
            try {
                restaurants = await Storage.getRestaurants();
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                restaurants = [];
            }
        }
        
        if (!menuItems || menuItems.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🍽️</div>
                    <h3>No menu items available</h3>
                    <p>Add your first menu item using the "Add Food Item" tab.</p>
                </div>
            `;
            return;
        }
        
        // Get restaurant names for display
        const restaurantMap = {};
        restaurants.forEach(r => {
            restaurantMap[r._id || r.id] = r.name;
        });
        
        container.innerHTML = `
            <div style="overflow-x: auto;">
                <table class="restaurants-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: var(--bg-light);">
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid var(--border-color);">Name</th>
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid var(--border-color);">Restaurant</th>
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid var(--border-color);">Price</th>
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid var(--border-color);">Available</th>
                            <th style="padding: 1rem; text-align: left; border-bottom: 2px solid var(--border-color);">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${menuItems.map(item => {
                            const itemId = item._id || item.id;
                            const restaurantName = restaurantMap[item.restaurantId] || 'Unknown';
                            return `
                                <tr style="border-bottom: 1px solid var(--border-color);">
                                    <td style="padding: 1rem;"><strong>${item.name}</strong></td>
                                    <td style="padding: 1rem;">${restaurantName}</td>
                                    <td style="padding: 1rem;">₹${item.price}</td>
                                    <td style="padding: 1rem;">${item.available !== false ? '✅ Yes' : '❌ No'}</td>
                                    <td style="padding: 1rem;">
                                        <button onclick="editMenu('${itemId}')" class="btn" style="background: var(--primary-color); color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; margin-right: 0.5rem;">Edit</button>
                                        <button onclick="deleteMenu('${itemId}', '${item.name.replace(/'/g, "\\'")}')" class="btn" style="background: #ff6b6b; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">Delete</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Error loading menus:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <h3>Error loading menu items</h3>
                <p>Please try again later.</p>
            </div>
        `;
    }
}

async function editRestaurant(id) {
    try {
        const restaurants = await Storage.getRestaurants();
        const restaurant = restaurants.find(r => String(r._id || r.id) === String(id));
        
        if (!restaurant) {
            alert('Restaurant not found');
            return;
        }
        
        // Populate edit form
        document.getElementById('editRestaurantId').value = restaurant._id || restaurant.id;
        document.getElementById('editRestaurantName').value = restaurant.name || '';
        document.getElementById('editRestaurantCuisine').value = restaurant.cuisine || '';
        document.getElementById('editRestaurantRating').value = restaurant.rating || 0;
        document.getElementById('editRestaurantDeliveryTime').value = restaurant.deliveryTime || '';
        document.getElementById('editRestaurantImage').value = restaurant.image || '';
        document.getElementById('editRestaurantDescription').value = restaurant.description || '';
        document.getElementById('editRestaurantDeliveryFee').value = restaurant.deliveryFee || 2.99;
        document.getElementById('editRestaurantMinOrder').value = restaurant.minOrder || 0;
        document.getElementById('editRestaurantAreas').value = Array.isArray(restaurant.areas) ? restaurant.areas.join(', ') : '';
        
        // Show modal
        document.getElementById('editRestaurantModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading restaurant for edit:', error);
        alert('Failed to load restaurant data');
    }
}

function closeEditRestaurantModal() {
    document.getElementById('editRestaurantModal').style.display = 'none';
}

async function deleteRestaurant(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${ADMIN_API_BASE_URL}/api/restaurants/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        
        if (response.ok) {
            alert('Restaurant deleted successfully!');
            await loadRestaurantsForSelect();
            await loadRestaurantsTable();
        } else {
            alert(data.message || 'Failed to delete restaurant');
        }
    } catch (error) {
        console.error('Error deleting restaurant:', error);
        alert('Failed to delete restaurant. Please try again.');
    }
}

async function editMenu(id) {
    try {
        const response = await fetch(`${ADMIN_API_BASE_URL}/api/menu/item/${id}`);
        const item = await response.ok ? await response.json() : null;
        
        if (!item) {
            alert('Menu item not found');
            return;
        }
        
        // Populate edit form
        document.getElementById('editMenuId').value = item._id || item.id;
        document.getElementById('editMenuRestaurantId').value = item.restaurantId || '';
        document.getElementById('editMenuName').value = item.name || '';
        document.getElementById('editMenuDescription').value = item.description || '';
        document.getElementById('editMenuPrice').value = item.price || 0;
        document.getElementById('editMenuImage').value = item.image || '';
        document.getElementById('editMenuAvailable').value = item.available !== false ? 'true' : 'false';
        
        // Reload restaurant select to ensure it's populated
        await loadRestaurantsForSelect();
        
        // Show modal
        document.getElementById('editMenuModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading menu item for edit:', error);
        alert('Failed to load menu item data');
    }
}

function closeEditMenuModal() {
    document.getElementById('editMenuModal').style.display = 'none';
}

async function deleteMenu(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${ADMIN_API_BASE_URL}/api/menu/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        
        if (response.ok) {
            alert('Menu item deleted successfully!');
            await loadMenusTable();
        } else {
            alert(data.message || 'Failed to delete menu item');
        }
    } catch (error) {
        console.error('Error deleting menu item:', error);
        alert('Failed to delete menu item. Please try again.');
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    const restaurantModal = document.getElementById('editRestaurantModal');
    const menuModal = document.getElementById('editMenuModal');
    
    if (event.target === restaurantModal) {
        closeEditRestaurantModal();
    }
    if (event.target === menuModal) {
        closeEditMenuModal();
    }
}

// Make functions globally accessible immediately
window.showTab = showTab;

// Make other functions globally accessible
window.editRestaurant = editRestaurant;
window.closeEditRestaurantModal = closeEditRestaurantModal;
window.deleteRestaurant = deleteRestaurant;
window.editMenu = editMenu;
window.closeEditMenuModal = closeEditMenuModal;
window.deleteMenu = deleteMenu;
