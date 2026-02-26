import { type Page, type ElementHandle } from 'puppeteer';

// Base page class with common functionality
export abstract class BasePage {
  protected page: Page;
  protected url: string;
  
  constructor(page: Page, url: string) {
    this.page = page;
    this.url = url;
  }
  
  async navigate(): Promise<void> {
    await this.page.goto(this.url, { waitUntil: 'networkidle0' });
  }
  
  async getTitle(): Promise<string> {
    return this.page.title();
  }
  
  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }
  
  async waitForElement(selector: string, timeout: number = 10000): Promise<ElementHandle> {
    const element = await this.page.waitForSelector(selector, { timeout });
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    return element;
  }
  
  async clickElement(selector: string): Promise<void> {
    await this.page.click(selector);
  }
  
  async typeText(selector: string, text: string): Promise<void> {
    await this.page.type(selector, text);
  }
  
  async getText(selector: string): Promise<string> {
    return this.page.$eval(selector, el => el.textContent || '');
  }
  
  async isElementVisible(selector: string): Promise<boolean> {
    const element = await this.page.$(selector);
    return element !== null && await element.isVisible();
  }
  
  async takeScreenshot(filename: string): Promise<void> {
    await this.page.screenshot({ path: filename, fullPage: true });
  }
}

// Login page object
export class LoginPage extends BasePage {
  private selectors = {
    usernameInput: 'input[name="username"]',
    passwordInput: 'input[name="password"]',
    loginButton: 'button[type="submit"]',
    errorMessage: '.error-message',
    forgotPasswordLink: 'a[href="/forgot-password"]'
  };
  
  constructor(page: Page) {
    super(page, '/login');
  }
  
  async login(username: string, password: string): Promise<void> {
    await this.typeText(this.selectors.usernameInput, username);
    await this.typeText(this.selectors.passwordInput, password);
    await this.clickElement(this.selectors.loginButton);
    
    // Wait for navigation or error
    await Promise.race([
      this.page.waitForNavigation(),
      this.waitForElement(this.selectors.errorMessage)
    ]);
  }
  
  async isLoginSuccessful(): Promise<boolean> {
    return this.page.url().includes('/dashboard') || this.page.url().includes('/home');
  }
  
  async getErrorMessage(): Promise<string | null> {
    const isVisible = await this.isElementVisible(this.selectors.errorMessage);
    if (isVisible) {
      return this.getText(this.selectors.errorMessage);
    }
    return null;
  }
  
  async clickForgotPassword(): Promise<void> {
    await this.clickElement(this.selectors.forgotPasswordLink);
    await this.page.waitForNavigation();
  }
}

// Dashboard page object
export class DashboardPage extends BasePage {
  private selectors = {
    welcomeMessage: '.welcome-message',
    userProfile: '.user-profile',
    navigationMenu: '.nav-menu',
    logoutButton: 'button[data-action="logout"]',
    searchBox: 'input[type="search"]',
    notificationsBell: '.notifications-bell',
    sidebar: '.sidebar'
  };
  
  constructor(page: Page) {
    super(page, '/dashboard');
  }
  
  async getWelcomeMessage(): Promise<string> {
    return this.getText(this.selectors.welcomeMessage);
  }
  
  async isUserLoggedIn(): Promise<boolean> {
    return this.isElementVisible(this.selectors.userProfile);
  }
  
  async logout(): Promise<void> {
    await this.clickElement(this.selectors.logoutButton);
    await this.page.waitForNavigation();
  }
  
  async search(query: string): Promise<void> {
    await this.typeText(this.selectors.searchBox, query);
    await this.page.keyboard.press('Enter');
    await this.page.waitForNavigation();
  }
  
  async getNotificationCount(): Promise<number> {
    const notificationElement = await this.page.$(this.selectors.notificationsBell);
    if (notificationElement) {
      const countText = await this.page.$eval(
        `${this.selectors.notificationsBell} .count`,
        el => el.textContent || '0'
      );
      return parseInt(countText, 10) || 0;
    }
    return 0;
  }
  
  async navigateToSection(sectionName: string): Promise<void> {
    const linkSelector = `${this.selectors.navigationMenu} a[href*="${sectionName.toLowerCase()}"]`;
    await this.clickElement(linkSelector);
    await this.page.waitForNavigation();
  }
}

// Product page object
export class ProductPage extends BasePage {
  private selectors = {
    productTitle: 'h1.product-title',
    productPrice: '.product-price',
    addToCartButton: 'button[data-action="add-to-cart"]',
    quantityInput: 'input[name="quantity"]',
    productImages: '.product-images img',
    productDescription: '.product-description',
    reviewsSection: '.reviews-section',
    ratingStars: '.rating-stars'
  };
  
  constructor(page: Page, productId?: string) {
    super(page, productId ? `/product/${productId}` : '/product');
  }
  
  async getProductTitle(): Promise<string> {
    return this.getText(this.selectors.productTitle);
  }
  
  async getProductPrice(): Promise<string> {
    return this.getText(this.selectors.productPrice);
  }
  
  async addToCart(quantity: number = 1): Promise<void> {
    if (quantity > 1) {
      await this.page.fill(this.selectors.quantityInput, quantity.toString());
    }
    
    await this.clickElement(this.selectors.addToCartButton);
    
    // Wait for cart update or confirmation
    await this.page.waitForSelector('.cart-updated, .added-to-cart-message', { timeout: 5000 });
  }
  
  async getProductImages(): Promise<string[]> {
    return this.page.$$eval(this.selectors.productImages, imgs => 
      imgs.map(img => (img as HTMLImageElement).src)
    );
  }
  
  async getProductRating(): Promise<number> {
    const ratingElement = await this.page.$(this.selectors.ratingStars);
    if (ratingElement) {
      const ratingText = await this.page.$eval(
        this.selectors.ratingStars,
        el => el.getAttribute('data-rating') || '0'
      );
      return parseFloat(ratingText);
    }
    return 0;
  }
  
  async scrollToReviews(): Promise<void> {
    await this.page.locator(this.selectors.reviewsSection).scrollIntoViewIfNeeded();
  }
}

// Shopping cart page object
export class CartPage extends BasePage {
  private selectors = {
    cartItems: '.cart-item',
    itemName: '.item-name',
    itemPrice: '.item-price',
    itemQuantity: '.item-quantity input',
    removeButton: '.remove-item',
    subtotal: '.subtotal',
    tax: '.tax',
    total: '.total',
    checkoutButton: 'button[data-action="checkout"]',
    continueShoppingButton: 'button[data-action="continue-shopping"]'
  };
  
  constructor(page: Page) {
    super(page, '/cart');
  }
  
  async getCartItems(): Promise<Array<{name: string, price: string, quantity: number}>> {
    const items = await this.page.$$(this.selectors.cartItems);
    const cartItems = [];
    
    for (const item of items) {
      const name = await item.$eval(this.selectors.itemName, el => el.textContent || '');
      const price = await item.$eval(this.selectors.itemPrice, el => el.textContent || '');
      const quantityElement = await item.$(this.selectors.itemQuantity);
      const quantity = quantityElement ? 
        parseInt(await quantityElement.evaluate(el => (el as HTMLInputElement).value), 10) : 0;
      
      cartItems.push({ name, price, quantity });
    }
    
    return cartItems;
  }
  
  async updateQuantity(itemIndex: number, quantity: number): Promise<void> {
    const items = await this.page.$$(this.selectors.cartItems);
    if (items[itemIndex]) {
      const quantityInput = await items[itemIndex].$(this.selectors.itemQuantity);
      if (quantityInput) {
        await quantityInput.fill(quantity.toString());
        await quantityInput.press('Enter');
        
        // Wait for cart to update
        await this.page.waitForTimeout(1000);
      }
    }
  }
  
  async removeItem(itemIndex: number): Promise<void> {
    const items = await this.page.$$(this.selectors.cartItems);
    if (items[itemIndex]) {
      const removeButton = await items[itemIndex].$(this.selectors.removeButton);
      if (removeButton) {
        await removeButton.click();
        
        // Wait for item to be removed
        await this.page.waitForTimeout(1000);
      }
    }
  }
  
  async getTotal(): Promise<string> {
    return this.getText(this.selectors.total);
  }
  
  async proceedToCheckout(): Promise<void> {
    await this.clickElement(this.selectors.checkoutButton);
    await this.page.waitForNavigation();
  }
  
  async continueShopping(): Promise<void> {
    await this.clickElement(this.selectors.continueShoppingButton);
    await this.page.waitForNavigation();
  }
}

// Page factory for easier page creation
export class PageFactory {
  private page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }
  
  createLoginPage(): LoginPage {
    return new LoginPage(this.page);
  }
  
  createDashboardPage(): DashboardPage {
    return new DashboardPage(this.page);
  }
  
  createProductPage(productId?: string): ProductPage {
    return new ProductPage(this.page, productId);
  }
  
  createCartPage(): CartPage {
    return new CartPage(this.page);
  }
}

// Usage example
export async function examplePageObjectUsage(page: Page) {
  const pageFactory = new PageFactory(page);
  
  // Login flow
  const loginPage = pageFactory.createLoginPage();
  await loginPage.navigate();
  await loginPage.login('testuser', 'password123');
  
  if (await loginPage.isLoginSuccessful()) {
    // Dashboard interaction
    const dashboardPage = pageFactory.createDashboardPage();
    const welcomeMessage = await dashboardPage.getWelcomeMessage();
    console.log('Welcome message:', welcomeMessage);
    
    // Navigate to product
    const productPage = pageFactory.createProductPage('123');
    await productPage.navigate();
    await productPage.addToCart(2);
    
    // Check cart
    const cartPage = pageFactory.createCartPage();
    await cartPage.navigate();
    const items = await cartPage.getCartItems();
    console.log('Cart items:', items);
    
    // Logout
    await dashboardPage.navigate();
    await dashboardPage.logout();
  }
}