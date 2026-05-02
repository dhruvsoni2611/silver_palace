// admin.js - Handles Admin Dashboard and Product Management



function renderAdminView() {
    const adminView = document.getElementById('admin-view');
    
    adminView.innerHTML = `
        <div class="shop-page-container">
            <div class="shop-header">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem;">
                    <button onclick="navigateTo('home')" style="background: none; border: 1px solid var(--primary-green); color: var(--primary-green); padding: 0.8rem 1.5rem; border-radius: 50px; cursor: pointer; font-weight: 600; font-family: 'Outfit', sans-serif;">&larr; Back to Site</button>
                </div>
                <h2>Admin Dashboard</h2>
                <p>Manage the Silver Palace digital inventory</p>
            </div>
            
            <div style="max-width: 700px; margin: 4rem auto; background: #ffffff; padding: 4rem; border-radius: 20px; box-shadow: var(--shadow-lg); border: 1px solid #eee;">
                <h3 style="margin-bottom: 2.5rem; color: var(--primary-green); font-family: 'Playfair Display', serif; font-size: 1.8rem; text-align: center;">Add New Product</h3>
                <form id="addProductForm" onsubmit="handleProductSubmit(event)">
                    <div style="margin-bottom: 2rem;">
                        <label style="display:block; margin-bottom: 0.8rem; font-weight:600; color: var(--primary-green); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Item Name *</label>
                        <input type="text" id="admin_item_name" required placeholder="Ex: Diamond Stud Earrings" style="width:100%; padding: 1.2rem; border: 1px solid #ddd; border-radius: 10px; font-family: 'Outfit', sans-serif;">
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                        <div>
                            <label style="display:block; margin-bottom: 0.8rem; font-weight:600; color: var(--primary-green); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Category *</label>
                            <select id="admin_category" onchange="updateSubCategoryDropdown()" required style="width:100%; padding: 1.2rem; border: 1px solid #ddd; border-radius: 10px; font-family: 'Outfit', sans-serif; background: #fff;">
                                <option value="MEN">MEN</option>
                                <option value="WOMEN">WOMEN</option>
                                <option value="KIDS">KIDS</option>
                                <option value="IDOLS">IDOLS</option>
                            </select>
                        </div>
                        <div>
                            <label style="display:block; margin-bottom: 0.8rem; font-weight:600; color: var(--primary-green); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Sub-Category *</label>
                            <select id="admin_sub_category" required style="width:100%; padding: 1.2rem; border: 1px solid #ddd; border-radius: 10px; font-family: 'Outfit', sans-serif; background: #fff;">
                                <!-- Options populated by JS -->
                            </select>
                        </div>
                    </div>

                    <div style="margin-bottom: 2rem;">
                        <label style="display:block; margin-bottom: 0.8rem; font-weight:600; color: var(--primary-green); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Weight Range *</label>
                        <select id="admin_weight_range" required style="width:100%; padding: 1.2rem; border: 1px solid #ddd; border-radius: 10px; font-family: 'Outfit', sans-serif; background: #fff;">
                            <option value="" disabled selected>Select Weight Range</option>
                            <option value="5-10 gms">5-10 gms</option>
                            <option value="10-15 gms">10-15 gms</option>
                            <option value="15-25 gms">15-25 gms</option>
                            <option value="25+ gms">25+ gms</option>
                        </select>
                    </div>

                    <div style="margin-bottom: 3rem;">
                        <label style="display:block; margin-bottom: 0.8rem; font-weight:600; color: var(--primary-green); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Product Images (Bulk Upload) *</label>
                        <div style="border: 2px dashed #ddd; padding: 2rem; border-radius: 10px; text-align: center;">
                            <input type="file" id="admin_image" accept="image/*" multiple required style="width:100%;">
                            <p style="font-size: 0.8rem; color: #888; margin-top: 0.5rem;">Select multiple images. Each image will be created as a SEPARATE product.</p>
                        </div>
                    </div>

                    <button type="submit" id="submitBtn" class="cta-btn" style="width:100%; padding: 1.2rem;">
                        Save Product to Vault
                    </button>
                    
                    <div id="adminMessage" style="margin-top: 2rem; text-align: center; font-weight: 600; min-height: 24px;"></div>
                </form>
            </div>
        </div>
    `;

    // Initialize the sub-category dropdown
    updateSubCategoryDropdown();
}

function updateSubCategoryDropdown() {
    const categoryEl = document.getElementById('admin_category');
    const subCategorySelect = document.getElementById('admin_sub_category');
    if (!categoryEl || !subCategorySelect) return;

    const category = categoryEl.value;
    const options = SUB_CATEGORIES[category] || [];
    
    subCategorySelect.innerHTML = options.map(sub => `<option value="${sub}">${sub}</option>`).join('');
}

async function handleProductSubmit(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const messageDiv = document.getElementById('adminMessage');
    
    const formData = new FormData();
    formData.append('item_name', document.getElementById('admin_item_name').value);
    formData.append('category', document.getElementById('admin_category').value);
    formData.append('sub_category', document.getElementById('admin_sub_category').value);
    formData.append('weight_range', document.getElementById('admin_weight_range').value);

    const imageFiles = document.getElementById('admin_image').files;
    for (let i = 0; i < imageFiles.length; i++) {
        formData.append('images', imageFiles[i]);
    }

    submitBtn.disabled = true;
    submitBtn.innerText = "Uploading & Saving...";
    messageDiv.innerText = "Sending to database...";
    messageDiv.style.color = "blue";

    try {
        const response = await fetch(`${API_BASE_URL}/api/products`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            messageDiv.innerText = "✅ Product added successfully!";
            messageDiv.style.color = "green";
            document.getElementById('addProductForm').reset();
            updateSubCategoryDropdown(); // Reset sub-category dropdown
        } else {
            throw new Error(result.error || "Failed to add product");
        }
    } catch (error) {
        console.error('Admin Error:', error);
        messageDiv.innerText = "❌ Error: " + error.message;
        messageDiv.style.color = "red";
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Add Product to Database";
    }
}
