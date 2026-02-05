/**
 * Centralized test IDs for e2e selectors.
 * Add new test IDs here when introducing new flows.
 */
export const TEST_IDS = {
  // Auth
  LOGIN_FORM: 'login-form',
  LOGIN_EMAIL: 'login-email',
  LOGIN_PASSWORD: 'login-password',
  SIGNUP_FORM: 'signup-form',
  SIGNUP_NAME: 'signup-name',
  SIGNUP_EMAIL: 'signup-email',
  SIGNUP_PASSWORD: 'signup-password',
  LOGOUT_BUTTON: 'logout-button',

  // Layout
  NAV_LINK_HOME: 'nav-link-home',
  NAV_LINK_LOGIN: 'nav-link-login',
  NAV_LINK_SIGNUP: 'nav-link-signup',
  NAV_LINK_DASHBOARD: 'nav-link-dashboard',
  NAV_LINK_PROFILE: 'nav-link-profile',
  NAV_LINK_PRICING: 'nav-link-pricing',
  NAV_LINK_BLOG: 'nav-link-blog',

  // Protected
  DASHBOARD_CONTENT: 'dashboard-content',
  WIZARD_FORM: 'wizard-form',
  WIZARD_NEXT: 'wizard-next',
  WIZARD_BACK: 'wizard-back',
  WIZARD_GENERATE: 'wizard-generate',
  ROADMAP_LIST: 'roadmap-list',
  PROFILE_FORM: 'profile-form',

  // Chat
  CHAT_INPUT: 'chat-input',
  CHAT_SEND: 'chat-send',
  CHAT_MESSAGE_LIST: 'chat-message-list',

  // Pricing
  CHECKOUT_BUTTON: 'checkout-button',
  BILLING_TAB_MONTHLY: 'billing-tab-monthly',
  BILLING_TAB_YEARLY: 'billing-tab-yearly',

  // Contact
  CONTACT_FORM: 'contact-form',
  CONTACT_SUBMIT: 'contact-submit',

  // Newsletter
  NEWSLETTER_FORM: 'newsletter-form',
  NEWSLETTER_EMAIL: 'newsletter-email',
  NEWSLETTER_SUBMIT: 'newsletter-submit',

  // Language
  LANG_TOGGLE: 'lang-toggle',

  // Blog
  BLOG_CARD: (slug: string) => `blog-card-${slug}`,
} as const;
