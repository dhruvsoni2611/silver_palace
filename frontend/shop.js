// shop.js - Handles Shop View rendering and logic

function renderShopView(category) {
    const shopView = document.getElementById('shop-view');
    
    shopView.innerHTML = `
        <div class="shop-page-container">
            <div class="shop-header">
                <h2>Our Collections</h2>
                <p>Explore our exquisite range of jewelry</p>
            </div>
            
            <div class="shop-content">
                <!-- Sidebar: only category buttons -->
                <div class="sidebar">
                    <p style="font-size:0.75rem; text-transform:uppercase; letter-spacing:2px; color:var(--accent-gold); font-weight:700; margin-bottom:1rem;">Category</p>
                    <button class="sidebar-btn" data-category="MEN" onclick="updateShopCategory('MEN')">MEN</button>
                    <button class="sidebar-btn" data-category="WOMEN" onclick="updateShopCategory('WOMEN')">WOMEN</button>
                    <button class="sidebar-btn" data-category="KIDS" onclick="updateShopCategory('KIDS')">KIDS</button>
                    <button class="sidebar-btn" data-category="IDOLS" onclick="updateShopCategory('IDOLS')">IDOLS</button>
                </div>
                
                <div class="main-shop-area" id="mainShopArea">
                    <h3 id="currentCategoryTitle" style="color: var(--primary-green); margin-bottom: 2rem; font-family:'Playfair Display',serif;"></h3>
                    <div class="sub-cat-grid" id="subCategoryGrid"></div>
                </div>
            </div>
        </div>
    `;

    updateShopCategory(category || 'MEN');
}

let _currentShopCategory = 'MEN';
let _currentSubCategory = '';

function updateShopCategory(category) {
    _currentShopCategory = category;
    _currentSubCategory = '';

    const sidebarBtns = document.querySelectorAll('#shop-view .sidebar-btn[data-category]');
    sidebarBtns.forEach(b => {
        b.classList.remove('active');
        if (b.getAttribute('data-category') === category) b.classList.add('active');
    });

    const title = document.getElementById('currentCategoryTitle');
    const grid = document.getElementById('subCategoryGrid');

    // Reset main area — remove any weight filter bar if present
    const filterBar = document.getElementById('weightFilterBar');
    if (filterBar) filterBar.remove();

    if (category === 'IDOLS') {
        title.textContent = 'IDOLS';
        grid.innerHTML = '<p style="color:#888; text-align:center; padding: 3rem;">Coming Soon...</p>';
        return;
    }

    title.textContent = category;
    const subCats = SUB_CATEGORIES[category] || [];
    grid.innerHTML = subCats.map(sub => `
        <a href="#" class="sub-cat-card" onclick="fetchProducts('${category}', '${sub}', '');return false;">${sub}</a>
    `).join('');
}

/**
 * Show weight filter chips above the product grid.
 * Called after a sub-category is selected.
 */
function renderWeightFilters(category, subCategory, activeWeight) {
    // Remove existing bar if any
    const existing = document.getElementById('weightFilterBar');
    if (existing) existing.remove();

    const title = document.getElementById('currentCategoryTitle');

    const bar = document.createElement('div');
    bar.id = 'weightFilterBar';
    bar.style.cssText = `
        display: flex; flex-wrap: wrap; gap: 0.7rem;
        align-items: center; margin-bottom: 2rem;
        padding: 1.2rem 1.5rem;
        background: #fff;
        border-radius: 12px;
        box-shadow: var(--shadow-sm);
        border: 1px solid #eee;
    `;

    bar.innerHTML = `
        <span style="font-size:0.8rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-right:0.5rem;">⚖ Filter by Weight:</span>
        <button onclick="fetchProducts('${category}','${subCategory}','')"
            style="padding:0.45rem 1.1rem; border-radius:50px; border:1px solid #ddd;
                   background:${activeWeight === '' ? 'var(--primary-green)' : '#fff'};
                   color:${activeWeight === '' ? 'var(--accent-gold)' : 'var(--text-muted)'};
                   font-family:'Outfit',sans-serif; font-weight:600; font-size:0.85rem; cursor:pointer; transition:all 0.2s;">
            All
        </button>
        ${WEIGHT_RANGES.map(w => `
            <button onclick="fetchProducts('${category}','${subCategory}','${w}')"
                style="padding:0.45rem 1.1rem; border-radius:50px; border:1px solid ${activeWeight === w ? 'var(--accent-gold)' : '#ddd'};
                       background:${activeWeight === w ? 'var(--primary-green)' : '#fff'};
                       color:${activeWeight === w ? 'var(--accent-gold)' : 'var(--text-muted)'};
                       font-family:'Outfit',sans-serif; font-weight:600; font-size:0.85rem; cursor:pointer; transition:all 0.2s;">
                ${w}
            </button>
        `).join('')}
    `;

    // Insert the filter bar between the title and the grid
    const grid = document.getElementById('subCategoryGrid');
    grid.parentNode.insertBefore(bar, grid);
}

// Fetch products from FastAPI backend
async function fetchProducts(category, subCategory, weightRange) {
    if (event) event.preventDefault();

    _currentSubCategory = subCategory;

    const title = document.getElementById('currentCategoryTitle');
    const grid  = document.getElementById('subCategoryGrid');

    // Update page title to show breadcrumb
    title.innerHTML = `
        <span style="font-size:1rem; color:var(--text-muted); font-family:'Outfit',sans-serif; cursor:pointer;" onclick="updateShopCategory('${category}')">
            ${category}
        </span>
        <span style="color:var(--accent-gold); margin:0 0.5rem;">›</span>
        ${subCategory}
    `;

    // Show weight filter chips
    renderWeightFilters(category, subCategory, weightRange || '');

    // Show loading
    grid.innerHTML = '<p style="color:#888; text-align:center; grid-column:1/-1; padding:3rem;">Loading products...</p>';

    try {
        const url = new URL(`${API_BASE_URL}/api/products`);
        if (category)    url.searchParams.append('category', category);
        if (subCategory) url.searchParams.append('sub_category', subCategory);
        if (weightRange) url.searchParams.append('weight_range', weightRange);

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Server responded with ${response.status}`);

        const products = await response.json();

        if (!Array.isArray(products) || products.length === 0) {
            grid.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:3rem;">
                    <p style="color:#888; font-size:1.1rem; margin-bottom:1.5rem;">
                        No products found${weightRange ? ` for <strong>${weightRange}</strong>` : ''}.
                    </p>
                </div>
            `;
            return;
        }

        grid.innerHTML = products.map(product => {
            const urls = product.image_url ? product.image_url.split(',') : ['https://via.placeholder.com/300'];
            const mainImg = urls[0];
            const thumbnailsHtml = urls.length > 1 ? `
                <div style="display:flex; gap:0.5rem; padding: 0.5rem; overflow-x:auto; background: #fff; border-bottom: 1px solid #f0f0f0;">
                    ${urls.map((u, i) => `
                        <img src="${u}" style="width:40px; height:40px; object-fit:cover; border-radius:4px; cursor:pointer; border: 1px solid #eee; padding: 2px; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onclick="document.getElementById('main-img-${product.code_no}').src='${u}'" onerror="this.style.display='none'">
                    `).join('')}
                </div>
            ` : '';

            return `
            <div class="card" style="position: relative;">
                <button onclick="deleteProduct('${product.code_no}')" style="position: absolute; top: 10px; right: 10px; background: rgba(255, 0, 0, 0.8); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; z-index: 10; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'" title="Delete Product">&times;</button>
                <img id="main-img-${product.code_no}" src="${mainImg}"
                     alt="${product.item_name}"
                     onerror="this.src='https://via.placeholder.com/300?text=No+Image'">
                ${thumbnailsHtml}
                <div class="card-body">
                    <span style="font-size:0.78rem; color:var(--accent-gold); display:block; margin-bottom:0.4rem; font-weight:700; letter-spacing:1px;">${product.code_no}</span>
                    <h4 style="color:var(--primary-green); margin-bottom:0.3rem; font-size:1.1rem; font-family:'Playfair Display',serif;">${product.item_name}</h4>
                    <p style="color:var(--text-muted); font-size:0.82rem; margin-bottom:0.4rem;">${product.category} · ${product.sub_category}</p>
                    ${product.weight_range || product.weight
                        ? `<span style="display:inline-block; background:#f0f9f4; color:var(--primary-green); border:1px solid #c5e8d5; border-radius:50px; padding:0.2rem 0.8rem; font-size:0.78rem; font-weight:700; margin-bottom:1rem;">⚖ ${product.weight_range || (product.weight + ' gms')}</span>`
                        : `<div style="margin-bottom:1rem;"></div>`
                    }
                    <div id="action-${product.code_no}">
                        ${window.generateProductActionHTML(product)}
                    </div>
                </div>
            </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error fetching products:', error);
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:2rem; color:#721c24; background:#f8d7da; border-radius:10px;">
                <p style="font-weight:bold; margin-bottom:0.4rem;">Connection Error</p>
                <p style="font-size:0.9rem;">${error.message}</p>
            </div>
        `;
    }
}

// ── Dynamic Add To Cart UI ──
window.generateProductActionHTML = function(product) {
    const qty = window.getCartQuantity ? window.getCartQuantity(product.code_no) : 0;
    const prodJson = JSON.stringify(product).replace(/'/g, "&apos;").replace(/"/g, "&quot;");
    
    if (qty > 0) {
        return `
            <div style="display:flex; align-items:center; justify-content:space-between; background:var(--bg-off-white); border:1px solid #ddd; border-radius:4px; padding:0.3rem;">
                <button onclick='updateCartItemQuantity(${prodJson}, -1)' style="background:var(--primary-green); color:var(--accent-gold); border:none; width:36px; height:36px; border-radius:4px; font-weight:bold; cursor:pointer; font-size:1.2rem; transition:all 0.2s;">-</button>
                <span style="font-weight:bold; font-size:1.1rem; color:var(--primary-green);">${qty}</span>
                <button onclick='updateCartItemQuantity(${prodJson}, 1)' style="background:var(--primary-green); color:var(--accent-gold); border:none; width:36px; height:36px; border-radius:4px; font-weight:bold; cursor:pointer; font-size:1.2rem; transition:all 0.2s;">+</button>
            </div>
        `;
    } else {
        return `<button class="cta-btn" onclick='addToCart(${prodJson})' style="width:100%; padding:0.8rem; font-size:0.9rem;">Add to Cart</button>`;
    }
};

window.updateProductActionUI = function(product) {
    const container = document.getElementById('action-' + product.code_no);
    if (container) {
        container.innerHTML = window.generateProductActionHTML(product);
    }
};

window.deleteProduct = async function(code_no) {
    const pin = prompt("Enter Admin PIN to delete this product:");
    if (pin === "1234") {
        if (!confirm("Are you sure you want to permanently delete this product?")) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/products/${code_no}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (result.success) {
                alert("Product deleted successfully!");
                // Refresh the current product list
                const weightRange = document.querySelector('#weightFilterBar button[style*="var(--accent-gold)"]')?.innerText.trim() === 'All' ? '' : document.querySelector('#weightFilterBar button[style*="var(--accent-gold)"]')?.innerText.trim();
                fetchProducts(_currentShopCategory, _currentSubCategory, weightRange || '');
            } else {
                alert("Failed to delete product: " + result.error);
            }
        } catch (error) {
            alert("Error deleting product: " + error.message);
        }
    } else if (pin !== null) {
        alert("Incorrect PIN! Deletion cancelled.");
    }
};
