const products = [
  {
    id: "classic-gold-rose",
    name: "Classic 24K Gold Rose",
    price: 7900,
    image: "src/89687017963f3e0b266be3fb6665e83f.JPG",
    description: "A real rose preserved in a polished gold finish with display stand.",
    options: ["Brown gift box", "Red gift wrap", "No wrap"],
  },
  {
    id: "boxed-keepsake-rose",
    name: "Boxed Keepsake Rose",
    price: 8900,
    image: "src/5d71ebbc3777cccbc9f752be6adf7d76.JPG",
    description: "The core gift-ready rose packaged for anniversaries and special dates.",
    options: ["Valentine card", "Anniversary card", "No card"],
  },
  {
    id: "premium-gift-bundle",
    name: "Premium Gift Bundle",
    price: 9900,
    image: "src/5cdaa6cbd380d638e78c6c9b30619e5b.JPG",
    description: "A higher-value bundle framed around material detail and premium finish.",
    options: ["Gift message", "Standard insert", "No insert"],
  },
];

const cart = new Map();
const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const productGrid = document.querySelector("[data-products]");
const cartDrawer = document.querySelector("[data-cart-drawer]");
const cartItems = document.querySelector("[data-cart-items]");
const cartCount = document.querySelector("[data-cart-count]");
const cartSubtotal = document.querySelector("[data-cart-subtotal]");

function money(cents) {
  return formatter.format(cents / 100);
}

function renderProducts() {
  productGrid.innerHTML = products
    .map(
      (product) => `
        <article class="product-card">
          <div class="product-image">
            <img src="${product.image}" alt="${product.name}" loading="lazy">
          </div>
          <div class="product-content">
            <div class="product-meta">
              <div>
                <h3>${product.name}</h3>
                <p>${product.description}</p>
              </div>
              <strong class="price">${money(product.price)}</strong>
            </div>
            <div class="option-row">
              <label for="${product.id}-option">Gift option</label>
              <select id="${product.id}-option" data-option="${product.id}">
                ${product.options.map((option) => `<option>${option}</option>`).join("")}
              </select>
            </div>
            <button class="button primary" type="button" data-add="${product.id}">
              Add to cart
            </button>
          </div>
        </article>
      `,
    )
    .join("");
}

function getCartLineKey(productId, option) {
  return `${productId}::${option}`;
}

function addToCart(productId) {
  const product = products.find((item) => item.id === productId);
  const option = document.querySelector(`[data-option="${productId}"]`).value;
  const key = getCartLineKey(productId, option);
  const existingLine = cart.get(key);

  cart.set(key, {
    product,
    option,
    quantity: existingLine ? existingLine.quantity + 1 : 1,
  });

  renderCart();
  openCart();
}

function changeQuantity(key, amount) {
  const line = cart.get(key);

  if (!line) {
    return;
  }

  const nextQuantity = line.quantity + amount;

  if (nextQuantity <= 0) {
    cart.delete(key);
  } else {
    cart.set(key, { ...line, quantity: nextQuantity });
  }

  renderCart();
}

function removeLine(key) {
  cart.delete(key);
  renderCart();
}

function renderCart() {
  const lines = [...cart.entries()];
  const totalQuantity = lines.reduce((sum, [, line]) => sum + line.quantity, 0);
  const subtotal = lines.reduce(
    (sum, [, line]) => sum + line.product.price * line.quantity,
    0,
  );

  cartCount.textContent = totalQuantity;
  cartSubtotal.textContent = money(subtotal);

  if (lines.length === 0) {
    cartItems.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
    return;
  }

  cartItems.innerHTML = lines
    .map(
      ([key, line]) => `
        <article class="cart-line">
          <img src="${line.product.image}" alt="${line.product.name}">
          <div>
            <h3>${line.product.name}</h3>
            <p>${line.option}</p>
            <div class="line-actions">
              <div class="qty-controls" aria-label="Quantity controls">
                <button type="button" data-qty="${key}" data-amount="-1" aria-label="Decrease quantity">-</button>
                <span>${line.quantity}</span>
                <button type="button" data-qty="${key}" data-amount="1" aria-label="Increase quantity">+</button>
              </div>
              <strong>${money(line.product.price * line.quantity)}</strong>
            </div>
            <button class="remove-button" type="button" data-remove="${key}">Remove</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function openCart() {
  cartDrawer.classList.add("is-open");
  cartDrawer.setAttribute("aria-hidden", "false");
}

function closeCart() {
  cartDrawer.classList.remove("is-open");
  cartDrawer.setAttribute("aria-hidden", "true");
}

document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");
  const quantityButton = event.target.closest("[data-qty]");
  const removeButton = event.target.closest("[data-remove]");

  if (addButton) {
    addToCart(addButton.dataset.add);
  }

  if (quantityButton) {
    changeQuantity(quantityButton.dataset.qty, Number(quantityButton.dataset.amount));
  }

  if (removeButton) {
    removeLine(removeButton.dataset.remove);
  }
});

document.querySelector("[data-cart-open]").addEventListener("click", openCart);
document.querySelector("[data-cart-close]").addEventListener("click", closeCart);

cartDrawer.addEventListener("click", (event) => {
  if (event.target === cartDrawer) {
    closeCart();
  }
});

document.querySelector("[data-checkout]").addEventListener("click", () => {
  alert("Checkout is not connected yet. Next step: Stripe, Shopify, or another payment provider.");
});

renderProducts();
renderCart();
