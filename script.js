const bar = document.getElementById('bar');
const nav = document.getElementById('navbar');
const close = document.getElementById('close');

if (bar) {
    bar.addEventListener('click', () => {
        nav.classList.add('active');
    })
}

if (close) {
    close.addEventListener('click', () => {
        nav.classList.remove('active');
    })
}

// --- Initialize Premium Toastify Library & Cart Badge ---
const toastifyCss = document.createElement('link');
toastifyCss.rel = 'stylesheet';
toastifyCss.href = 'https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css';
document.head.appendChild(toastifyCss);

const toastifyJs = document.createElement('script');
toastifyJs.src = 'https://cdn.jsdelivr.net/npm/toastify-js';
document.body.appendChild(toastifyJs);

function showToast(message) {
    if (typeof Toastify !== 'undefined') {
        Toastify({
            text: message,
            duration: 3000,
            close: true,
            gravity: "bottom",
            position: "right",
            style: {
                background: "linear-gradient(135deg, #0B1E3C, #1E90FF)",
                border: "1px solid #00E5FF",
                color: "#fff",
                borderRadius: "8px",
                boxShadow: "0 4px 15px rgba(0, 229, 255, 0.3)",
                fontFamily: "'Oswald', sans-serif",
                textTransform: "uppercase"
            }
        }).showToast();
    } else {
        alert(message);
    }
}

function updateCartIcon() {
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    let totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const cartLinks = document.querySelectorAll('#lg-bag a, #mobile a[href="cart.html"]');
    cartLinks.forEach(link => {
        link.style.position = 'relative';
        let badge = link.querySelector('.cart-qty-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'cart-qty-badge';

            badge.style.position = 'absolute';
            badge.style.top = '-8px';
            badge.style.right = '-12px';
            badge.style.backgroundColor = '#ff4757';
            badge.style.color = '#fff';
            badge.style.fontSize = '12px';
            badge.style.fontWeight = '700';
            badge.style.padding = '2px 6px';
            badge.style.borderRadius = '50%';
            badge.style.boxShadow = '0 0 8px rgba(255, 71, 87, 0.6)';

            link.appendChild(badge);
        }
        badge.innerText = totalQty;
        badge.style.display = totalQty > 0 ? 'inline-block' : 'none';
    });
}

document.addEventListener('DOMContentLoaded', () => { updateCartIcon(); });
updateCartIcon();

// --- Globals & Init ---
let allProducts = [];

async function initStore() {
    try {
        const response = await fetch('products.json');
        if (!response.ok) throw new Error('Không thể tải file products.json');

        allProducts = await response.json();

        const homeContainer = document.getElementById('home-product-container');
        if (homeContainer) {
            renderProducts(allProducts.slice(0, 4), homeContainer);
        }

        const featuredContainer = document.getElementById('featured-product-container');
        if (featuredContainer) {
            renderProducts(allProducts.slice(4, 8), featuredContainer);
        }

        const shopContainer = document.getElementById('shop-product-container');
        if (shopContainer) {
            renderProducts(allProducts, shopContainer);
            setupFilters(shopContainer);
        }

        const spDetails = document.getElementById('prodetails');
        if (spDetails) {
            renderSingleProduct();
        }

    } catch (error) {
        console.error("Fetch API bị chặn do CORS (Local File) hoặc thiếu products.json:", error);
    }
}

// Bắt đầu khởi tạo dữ liệu tự động
document.addEventListener('DOMContentLoaded', initStore);
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initStore, 1);
}

function renderProducts(products, container) {
    container.innerHTML = '';
    products.forEach(p => {
        const proDiv = document.createElement('div');
        proDiv.className = 'pro';
        proDiv.onclick = () => { window.location.href = `sproduct.html?id=${p.id}`; };

        let stars = '';
        for (let i = 0; i < p.rating; i++) stars += '<i class="fas fa-star"></i>';

        proDiv.innerHTML = `
            <div class="img-wrapper">
                <img src="${p.main_img}" class="img-main" alt="${p.name}">
                <img src="${p.hover_img}" class="img-hover" alt="${p.name}">
            </div>
            <div class="des">
                <span>${p.category}</span>
                <h5>${p.name}</h5>
                <div class="star">${stars}</div>
                <h4>$${p.price}</h4>
            </div>
            <a href="#" class="cart" data-id="${p.id}"><i class="fa-solid fa-cart-shopping"></i></a>
        `;
        container.appendChild(proDiv);
    });

    // Gán nút thêm giỏ hàng nhưng chặn sự kiện chuyển trang của cha (.pro)
    container.querySelectorAll('.cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const productId = parseInt(e.currentTarget.getAttribute('data-id'));
            addToCart(productId, 1);
        });
    });
}

function addToCart(productId, qty = 1) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    let existingItemIndex = cartItems.findIndex(item => item.name === product.name);

    if (existingItemIndex !== -1) {
        cartItems[existingItemIndex].quantity += qty;
    } else {
        cartItems.push({
            img: product.main_img,
            name: product.name,
            price: product.price,
            quantity: qty
        });
    }

    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    updateCartIcon();
    showToast(`Đã thêm ${qty} x ${product.name} vào giỏ hàng!`);
}

// --- Pagination State ---
let currentFilteredProducts = [];
let currentPage = 1;
const itemsPerPage = 12;

function renderPagination(totalItems, container) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const a = document.createElement('a');
        a.href = '#';
        a.innerText = i;
        if (i === currentPage) a.classList.add('active');

        a.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = i;
            renderProducts(currentFilteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), container);
            renderPagination(totalItems, container);

            const shopTop = document.getElementById('product1');
            if (shopTop) window.scrollTo({ top: shopTop.offsetTop - 50, behavior: 'smooth' });
        });

        paginationContainer.appendChild(a);
    }
}

function setupFilters(container) {
    const catFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');

    function applyFilters() {
        let filtered = [...allProducts];

        if (catFilter && catFilter.value !== 'All') {
            filtered = filtered.filter(p => p.category === catFilter.value);
        }

        if (priceFilter) {
            if (priceFilter.value === 'LowToHigh') {
                filtered.sort((a, b) => a.price - b.price);
            } else if (priceFilter.value === 'HighToLow') {
                filtered.sort((a, b) => b.price - a.price);
            }
        }

        currentFilteredProducts = filtered;
        currentPage = 1;

        renderProducts(currentFilteredProducts.slice(0, itemsPerPage), container);
        renderPagination(filtered.length, container);
    }

    if (catFilter) catFilter.addEventListener('change', applyFilters);
    if (priceFilter) priceFilter.addEventListener('change', applyFilters);

    applyFilters(); // Initialize paginated view automatically
}

function renderSingleProduct() {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    const productId = idParam ? parseInt(idParam) : 1; // Load Product 1 if missing

    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const imgContainer = document.querySelector('.single-pro-image');
    if (imgContainer) {
        imgContainer.innerHTML = `<img src="${product.main_img}" width="100%" id="MainImg" alt="${product.name}">`;
    }

    document.getElementById('sp-category').innerText = `Home / ${product.category}`;
    document.getElementById('sp-name').innerText = product.name;
    document.getElementById('sp-price').innerText = `$${product.price}`;

    const spDesc = document.getElementById('sp-desc');
    if (spDesc) spDesc.innerText = product.description;

    const addToCartBtn = document.getElementById('sp-add-to-cart');
    if (addToCartBtn) {
        addToCartBtn.onclick = () => {
            const qtyInput = document.getElementById('sp-qty');
            let qty = 1;
            if (qtyInput) {
                qty = parseInt(qtyInput.value);
                if (isNaN(qty) || qty <= 0) qty = 1;
            }
            addToCart(product.id, qty);
        };
    }
}

// --- Cart Page Dynamic Rendering & Logic ---
const cartTableBody = document.querySelector('#cart tbody');
const cartSubtotalElement = document.querySelector('#subtotal table tr:nth-child(1) td:nth-child(2)');
const cartTotalElement = document.querySelector('#subtotal table tr:nth-child(3) td:nth-child(2) strong');
const couponInput = document.querySelector('#coupon input');
const couponBtn = document.querySelector('#coupon button');
const checkoutBtn = document.querySelector('#subtotal button.normal');
let discountPercent = 0;

function renderCartPage() {
    if (!cartTableBody) return;
    cartTableBody.innerHTML = '';

    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

    if (cartItems.length === 0) {
        cartTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; font-size:16px;">Giỏ hàng trống. Hãy tiếp tục mua sắm!</td></tr>';
        updateCartPageTotals();
        return;
    }

    cartItems.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><a href="#" class="remove-btn" data-index="${index}"><i class="far fa-times-circle"></i></a></td>
            <td><img src="${item.img}" alt="Product Image"></td>
            <td>${item.name}</td>
            <td>$${item.price}</td>
            <td><input type="number" class="qty-input" value="${item.quantity}" min="1" data-index="${index}"></td>
            <td>$${item.price * item.quantity}</td>
        `;
        cartTableBody.appendChild(tr);
    });

    updateCartPageTotals();
}

function updateCartPageTotals() {
    if (!cartTableBody) return;

    let subtotal = 0;
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

    cartItems.forEach((item) => {
        subtotal += item.price * item.quantity;
    });

    if (cartSubtotalElement && cartTotalElement) {
        cartSubtotalElement.innerText = '$' + subtotal;

        let totalAfterDiscount = subtotal * (1 - discountPercent);
        totalAfterDiscount = Math.round(totalAfterDiscount * 100) / 100;
        cartTotalElement.innerText = '$' + totalAfterDiscount;
    }
}

if (cartTableBody) {
    renderCartPage();

    cartTableBody.addEventListener('change', (e) => {
        if (e.target.classList.contains('qty-input')) {
            let index = parseInt(e.target.getAttribute('data-index'));
            let newQty = parseInt(e.target.value);

            let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
            if (cartItems[index]) {
                cartItems[index].quantity = (isNaN(newQty) || newQty <= 0) ? 1 : newQty;
                localStorage.setItem('cartItems', JSON.stringify(cartItems));
                renderCartPage();
                updateCartIcon();
            }
        }
    });

    cartTableBody.addEventListener('keyup', (e) => {
        if (e.target.classList.contains('qty-input')) {
            let index = parseInt(e.target.getAttribute('data-index'));
            let newQty = parseInt(e.target.value);

            let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
            if (cartItems[index]) {
                cartItems[index].quantity = (isNaN(newQty) || newQty <= 0) ? 1 : newQty;
                localStorage.setItem('cartItems', JSON.stringify(cartItems));

                e.target.closest('tr').children[5].innerText = '$' + (cartItems[index].price * cartItems[index].quantity);
                updateCartPageTotals();
                updateCartIcon();
            }
        }
    });

    cartTableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('fa-times-circle') || e.target.closest('.remove-btn')) {
            e.preventDefault();
            const removeBtn = e.target.closest('.remove-btn');
            if (removeBtn) {
                let index = parseInt(removeBtn.getAttribute('data-index'));
                let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
                cartItems.splice(index, 1);
                localStorage.setItem('cartItems', JSON.stringify(cartItems));
                renderCartPage();
                updateCartIcon();
            }
        }
    });
}

if (couponBtn) {
    couponBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const code = couponInput.value.trim().toUpperCase();
        if (code === 'METEOR10') {
            discountPercent = 0.1;
            showToast('Áp dụng thành công mã giảm 10% (METEOR10)!');
        } else if (code === 'METEOR20') {
            discountPercent = 0.2;
            showToast('Áp dụng thành công mã giảm 20% (METEOR20)!');
        } else if (code === '') {
            discountPercent = 0;
            showToast('Vui lòng nhập mã giảm giá.');
        } else {
            discountPercent = 0;
            showToast('Mã giảm giá không hợp lệ!');
        }
        updateCartPageTotals();
    });
}

if (checkoutBtn) {
    checkoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

        if (cartItems.length === 0) {
            showToast('Giỏ hàng trống! Vui lòng thêm sản phẩm trước khi thanh toán.');
            return;
        }

        const cachedUser = JSON.parse(localStorage.getItem('meteor_user'));
        if (!cachedUser) {
            showToast('Vui lòng đăng nhập trước khi thanh toán!');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            return;
        }

        // Redirect to checkout page
        window.location.href = 'checkout.html';
    });
}

// --- Checkout Page Logic ---
const checkoutPageContainer = document.getElementById('checkout-page');
if (checkoutPageContainer) {
    const checkoutItemsContainer = document.getElementById('checkout-items');
    const checkoutSubtotal = document.getElementById('checkout-subtotal');
    const checkoutShipping = document.getElementById('checkout-shipping');
    const checkoutTotal = document.getElementById('checkout-total');
    const placeOrderBtn = document.getElementById('place-order-btn');
    const shippingRadios = document.querySelectorAll('input[name="shipping"]');

    function renderCheckoutPage() {
        let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        if (cartItems.length === 0) {
            showToast('Giỏ hàng trống! Đang chuyển về trang giỏ hàng.');
            setTimeout(() => { window.location.href = 'cart.html'; }, 1500);
            return;
        }

        let subtotal = 0;
        let itemsHTML = '';
        cartItems.forEach(item => {
            subtotal += item.price * item.quantity;
            itemsHTML += `
                <div style="display: flex; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #E2E8F0; padding-bottom: 10px;">
                    <img src="${item.img}" style="width: 50px; border-radius: 8px; margin-right: 15px;">
                    <div style="flex: 1;">
                        <span style="display: block; font-weight: 700; color: #0F172A; text-transform: uppercase;">${item.name}</span>
                        <span style="font-size: 12px; color: #64748B;">Số lượng: ${item.quantity}</span>
                    </div>
                    <div style="font-weight: 700; color: #000000; font-size: 16px;">$${item.price * item.quantity}</div>
                </div>
            `;
        });
        
        if (checkoutItemsContainer) checkoutItemsContainer.innerHTML = itemsHTML;
        
        let shippingCost = Array.from(shippingRadios).find(r => r.checked)?.value === 'express' ? 5 : 0;

        if (checkoutSubtotal) checkoutSubtotal.innerText = '$' + subtotal;
        if (checkoutShipping) checkoutShipping.innerText = shippingCost > 0 ? '$' + shippingCost : 'Miễn phí';
        if (checkoutTotal) checkoutTotal.innerText = '$' + (subtotal + shippingCost);
    }

    if (shippingRadios) {
        shippingRadios.forEach(radio => radio.addEventListener('change', renderCheckoutPage));
    }

    renderCheckoutPage();

    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const form = document.getElementById('order-form');
            if (form && !form.checkValidity()) {
                form.reportValidity();
                return;
            }

            placeOrderBtn.innerText = 'Đang xử lý...';
            placeOrderBtn.style.opacity = '0.7';
            placeOrderBtn.disabled = true;

            setTimeout(() => {
                // Save order to history
                let orderHistory = JSON.parse(localStorage.getItem('meteor_orders')) || [];
                let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
                let subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                let shippingCost = Array.from(shippingRadios).find(r => r.checked)?.value === 'express' ? 5 : 0;
                let total = subtotal + shippingCost;
                
                let productList = cartItems.map(item => item.name).join(', ');
                if (productList.length > 30) productList = productList.substring(0, 30) + '...';

                let dateObj = new Date();
                let dateStr = dateObj.toLocaleDateString('vi-VN');

                let order = {
                    id: '#' + Math.floor(Math.random() * 1000000),
                    items: productList,
                    total: total,
                    date: dateStr,
                    status: 'Đang xử lý'
                };
                orderHistory.push(order);
                localStorage.setItem('meteor_orders', JSON.stringify(orderHistory));

                showToast('Đặt hàng thành công! Đơn hàng của bạn đang được chuẩn bị.');
                localStorage.removeItem('cartItems');
                updateCartIcon();
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            }, 2000);
        });
    }
}

// --- Authentication Logic (Login/Register) ---
document.addEventListener('DOMContentLoaded', () => {
    const loginBox = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');
    const btnGoToRegister = document.getElementById('go-to-register');
    const btnGoToLogin = document.getElementById('go-to-login');

    if (btnGoToRegister && btnGoToLogin) {
        btnGoToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginBox) loginBox.classList.add('hidden');
            if (registerBox) registerBox.classList.remove('hidden');
        });

        btnGoToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            if (registerBox) registerBox.classList.add('hidden');
            if (loginBox) loginBox.classList.remove('hidden');
        });
    }

    const formRegister = document.getElementById('form-register');
    if (formRegister) {
        formRegister.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = document.getElementById('reg-user').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const pass = document.getElementById('reg-password').value.trim();

            try {
                const res = await fetch('http://localhost:3000/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user, email, password: pass })
                });
                const data = await res.json();

                if (!res.ok) throw new Error(data.error || 'Lỗi từ máy chủ');
                showToast('Đăng ký thành công! Hãy tiến hành đăng nhập.');
                btnGoToLogin.click();
            } catch (err) {
                showToast('Lỗi: ' + err.message);
            }
        });
    }

    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const pass = document.getElementById('login-password').value.trim();

            try {
                const res = await fetch('http://localhost:3000/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password: pass })
                });
                const data = await res.json();

                if (!res.ok) throw new Error(data.error || 'Sai thông tin');

                // Store user session info & JWT token
                localStorage.setItem('meteor_user', JSON.stringify(data.user));
                if (data.token) localStorage.setItem('meteor_token', data.token);

                showToast(`Xin chào ${data.user.username}! Kết nối thành công.`);

                // Redirect home after 1 second
                setTimeout(() => window.location.href = 'index.html', 1200);
            } catch (err) {
                showToast('Lỗi: ' + err.message);
            }
        });
    }

    // Update UI if logged in
    const cachedUser = JSON.parse(localStorage.getItem('meteor_user'));
    const loginNavLinks = document.querySelectorAll('a[href="login.html"]');

    if (cachedUser && loginNavLinks.length > 0) {
        loginNavLinks.forEach(link => {
            link.innerHTML = `<i class="fa-solid fa-user"></i> ${cachedUser.username}`;
            link.href = "profile.html";
        });
    }

    // --- Profile Page Logic ---
    const profilePageContainer = document.getElementById('profile-page');
    if (profilePageContainer) {
        const orderHistoryTbody = document.getElementById('order-history-tbody');
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        const logoutBtn = document.getElementById('profile-logout-btn');

        if (cachedUser) {
            if (profileName) profileName.innerText = cachedUser.username;
            if (profileEmail) profileEmail.innerText = cachedUser.email || 'Không có email';
        } else {
            showToast('Bạn chưa đăng nhập!');
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm("Bạn có muốn đăng xuất khỏi Trạm Không Gian không?")) {
                    localStorage.removeItem('meteor_user');
                    localStorage.removeItem('meteor_token');
                    window.location.href = "index.html";
                }
            });
        }

        if (orderHistoryTbody) {
            let orderHistory = JSON.parse(localStorage.getItem('meteor_orders')) || [];
            if (orderHistory.length === 0) {
                orderHistoryTbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px;">Bạn chưa thực hiện đơn hàng nào.</td></tr>';
            } else {
                let tbodyHTML = '';
                orderHistory.reverse().forEach(order => {
                    tbodyHTML += `
                        <tr>
                            <td><strong>${order.id}</strong></td>
                            <td>${order.date}</td>
                            <td>${order.items}</td>
                            <td><strong>$${order.total}</strong></td>
                            <td><span class="status-badge success">${order.status}</span></td>
                        </tr>
                    `;
                });
                orderHistoryTbody.innerHTML = tbodyHTML;
            }
        }
    }
});