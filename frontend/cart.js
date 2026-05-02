// cart.js - Handles Cart view, Checkout, and Bill Generation

function renderCartView() {
    const cartView = document.getElementById('cart-view');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    cartView.innerHTML = `
        <div class="shop-page-container">
            <div class="shop-header">
                <h2>Your Shopping Cart</h2>
                <p>Manage your selected items before checkout</p>
            </div>
            
            <div style="max-width: 1000px; margin: 0 auto; background: white; padding: 3rem; border-radius: 20px; box-shadow: var(--shadow-md);">
                ${cart.length === 0 ? `
                    <div style="text-align:center; padding: 4rem 0;">
                        <p style="font-size: 1.4rem; color: var(--text-muted); margin-bottom: 2.5rem; font-family: 'Playfair Display', serif;">Your cart is empty.</p>
                        <button class="cta-btn" onclick="navigateTo('shop')">Go Shopping</button>
                    </div>
                ` : `
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 3rem;">
                        <thead>
                            <tr style="border-bottom: 2px solid #f0f0f0; text-align: left;">
                                <th style="padding: 1.5rem 1rem; color: var(--primary-green); font-weight: 700; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px;">Item</th>
                                <th style="padding: 1.5rem 1rem; color: var(--primary-green); font-weight: 700; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px;">Code</th>
                                <th style="padding: 1.5rem 1rem; color: var(--primary-green); font-weight: 700; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; text-align: center;">Quantity</th>
                                <th style="padding: 1.5rem 1rem; color: var(--primary-green); font-weight: 700; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; text-align: right;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${cart.map((item, index) => `
                                <tr style="border-bottom: 1px solid #f9f9f9;">
                                    <td style="padding: 1.5rem 1rem; display: flex; align-items: center; gap: 1.5rem;">
                                        <img src="${item.image_url ? item.image_url.split(',')[0] : 'https://via.placeholder.com/70'}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 10px; box-shadow: var(--shadow-sm);">
                                        <span style="font-weight: 600; color: var(--primary-green); font-size: 1.1rem;">${item.item_name}</span>
                                    </td>
                                    <td style="padding: 1.5rem 1rem; color: var(--accent-gold); font-weight: 700; font-size: 0.9rem;">${item.code_no}</td>
                                    <td style="padding: 1.5rem 1rem;">
                                        <div style="display: flex; align-items: center; justify-content: center; gap: 1rem;">
                                            <button onclick="updateQty(${index}, -1)" style="width: 30px; height: 30px; border-radius: 50%; border: 1px solid #ddd; background: none; cursor: pointer; transition: var(--transition);">-</button>
                                            <span style="font-weight: 700; min-width: 20px; text-align: center;">${item.quantity}</span>
                                            <button onclick="updateQty(${index}, 1)" style="width: 30px; height: 30px; border-radius: 50%; border: 1px solid #ddd; background: none; cursor: pointer; transition: var(--transition);">+</button>
                                        </div>
                                    </td>
                                    <td style="padding: 1.5rem 1rem; text-align: right;">
                                        <button onclick="removeFromCart(${index})" style="color: #ff4444; background: none; border: none; cursor: pointer; font-weight: 600; font-size: 0.9rem; text-decoration: underline;">Remove</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #f0f0f0; padding-top: 2rem;">
                        <button onclick="clearCart()" style="color: var(--text-muted); background: none; border: 1px solid #ddd; padding: 0.8rem 2rem; border-radius: 5px; cursor: pointer; font-weight: 600; transition: var(--transition);">Clear Cart</button>
                        <button class="cta-btn" onclick="navigateTo('checkout')" style="padding: 1.2rem 4rem;">Proceed to Checkout</button>
                    </div>
                `}
            </div>
        </div>
    `;
}

window.updateQty = function(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity < 1) cart[index].quantity = 1;
    saveCart();
    renderCartView();
    updateCartCount();
};

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    saveCart();
    renderCartView();
    updateCartCount();
};

window.clearCart = function() {
    if (confirm('Are you sure you want to clear your cart?')) {
        cart = [];
        saveCart();
        renderCartView();
        updateCartCount();
    }
};

function renderCheckoutView() {
    const checkoutView = document.getElementById('checkout-view');
    
    checkoutView.innerHTML = `
        <div class="shop-page-container">
            <div class="shop-header">
                <h2>Checkout & Billing</h2>
                <p>Verify items and generate the final bill</p>
            </div>
            
            <div style="max-width: 900px; margin: 0 auto; background: #fff; padding: 3.5rem; border-radius: 20px; box-shadow: var(--shadow-lg);">
                <div style="margin-bottom: 3rem;">
                    <h3 style="color: var(--primary-green); font-family: 'Playfair Display', serif; font-size: 2rem; border-bottom: 2px solid var(--accent-gold); display: inline-block; padding-bottom: 0.5rem; margin-bottom: 2rem;">Order Summary</h3>
                    <table id="checkout-table" style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: var(--bg-off-white);">
                                <th style="padding: 1.2rem; border: 1px solid #eee; text-align: left; color: var(--primary-green); font-weight: 700;">Item Detail</th>
                                <th style="padding: 1.2rem; border: 1px solid #eee; text-align: center; color: var(--primary-green); font-weight: 700;">Qty</th>
                                <th style="padding: 1.2rem; border: 1px solid #eee; text-align: left; color: var(--primary-green); font-weight: 700;">Rate (per unit)</th>
                                <th style="padding: 1.2rem; border: 1px solid #eee; text-align: right; color: var(--primary-green); font-weight: 700;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${cart.map((item, index) => `
                                <tr>
                                    <td style="padding: 1.2rem; border: 1px solid #eee;">
                                        <div style="font-weight: 600;">${item.item_name}</div>
                                        <div style="font-size: 0.8rem; color: var(--accent-gold); font-weight: 700;">${item.code_no}</div>
                                    </td>
                                    <td style="padding: 1.2rem; border: 1px solid #eee; text-align: center; font-weight: 600;">${item.quantity}</td>
                                    <td style="padding: 1.2rem; border: 1px solid #eee;">
                                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                                            <span style="color: #999;">₹</span>
                                            <input type="number" value="${item.rate || ''}" oninput="updateRate(${index}, this.value)" placeholder="0.00" style="width: 120px; padding: 0.6rem; border: 1px solid #ddd; border-radius: 6px; font-family: 'Outfit', sans-serif; font-weight: 600;">
                                        </div>
                                    </td>
                                    <td id="total-${index}" style="padding: 1.2rem; border: 1px solid #eee; text-align: right; font-weight: 800; color: var(--primary-green); font-size: 1.1rem;">
                                        ₹${((item.rate || 0) * item.quantity).toLocaleString()}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr style="background: var(--primary-green); color: var(--bg-white);">
                                <td colspan="3" style="padding: 1.5rem; text-align: right; font-size: 1.3rem; font-family: 'Playfair Display', serif;">Grand Total:</td>
                                <td id="grand-total" style="padding: 1.5rem; text-align: right; color: var(--accent-gold); font-size: 1.5rem; font-weight: 800;">
                                    ₹${cart.reduce((sum, item) => sum + ((item.rate || 0) * item.quantity), 0).toLocaleString()}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 1.5rem; align-items: center;">
                    <button class="cta-btn" onclick="handleBillGeneration()" style="width: 100%; padding: 1.5rem; font-size: 1.3rem;">
                        Generate Final Bill (PDF)
                    </button>
                    <button onclick="navigateTo('cart')" style="background: none; border: none; color: var(--text-muted); cursor: pointer; text-decoration: underline; font-weight: 500;">&larr; Back to Shopping Cart</button>
                </div>
            </div>
        </div>
    `;
}

window.updateRate = function(index, rate) {
    cart[index].rate = parseFloat(rate) || 0;
    saveCart();
    
    // Update individual total
    const totalEl = document.getElementById(`total-${index}`);
    if (totalEl) {
        totalEl.innerText = `₹${(cart[index].rate * cart[index].quantity).toLocaleString()}`;
    }
    
    // Update grand total
    const grandTotalEl = document.getElementById('grand-total');
    if (grandTotalEl) {
        const grandTotal = cart.reduce((sum, item) => sum + ((item.rate || 0) * item.quantity), 0);
        grandTotalEl.innerText = `₹${grandTotal.toLocaleString()}`;
    }
};

window.handleBillGeneration = function() {
    const pin = prompt("Enter Admin PIN to generate bill:");
    if (pin === "1234") {
        generatePDF();
    } else {
        alert("Incorrect PIN! Bill generation cancelled.");
    }
};

async function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add Header
    doc.setFontSize(22);
    doc.setTextColor(6, 70, 53); // Primary Green
    doc.text("SILVER PALACE", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Premium Jewelry & Fine Collections", 105, 28, { align: "center" });
    
    doc.line(20, 35, 190, 35); // Horizontal line
    
    // Bill Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Bill Date: ${new Date().toLocaleDateString()}`, 20, 45);
    doc.text(`Invoice No: #INV-${Math.floor(Math.random() * 90000) + 10000}`, 20, 52);
    
    // Table Headers and Data
    const tableData = cart.map(item => [
        item.item_name,
        item.code_no,
        item.quantity,
        `Rs. ${item.rate.toLocaleString()}`,
        `Rs. ${(item.rate * item.quantity).toLocaleString()}`
    ]);
    
    const grandTotal = cart.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
    
    doc.autoTable({
        startY: 65,
        head: [['Item Name', 'Code', 'Qty', 'Rate', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillStyle: [6, 70, 53], textColor: [212, 175, 55] }, // Green with Gold text
        foot: [['', '', '', 'Grand Total:', `Rs. ${grandTotal.toLocaleString()}`]],
        footStyles: { fillStyle: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });
    
    const finalY = doc.lastAutoTable.finalY + 20;
    
    // Footer
    doc.setFontSize(10);
    doc.text("Thank you for shopping at Silver Palace!", 105, finalY, { align: "center" });
    doc.text("This is a computer generated invoice.", 105, finalY + 7, { align: "center" });

    // Save PDF
    doc.save(`Silver_Palace_Bill_${new Date().getTime()}.pdf`);
    alert("Bill generated and downloaded successfully!");
    
    // Clear cart and reload/navigate
    cart = [];
    saveCart();
    updateCartCount();
    navigateTo('shop');
}
