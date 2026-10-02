export type AdminOption = {
  id: number;
  slug: string;
  title: string;
  description: string;
  section: "Operations" | "Commerce" | "Inventory" | "Engagement" | "Finance" | "System";
  href: string;
  status: "live" | "workspace";
};

export const adminOptions: AdminOption[] = [
  { id: 1, slug: "dashboard", title: "Dashboard", description: "Sales, orders, analytics", section: "Operations", href: "/admin", status: "live" },
  { id: 2, slug: "sales-overview", title: "Sales Overview", description: "Daily, monthly, yearly", section: "Commerce", href: "/admin/tools/sales-overview", status: "workspace" },
  { id: 3, slug: "orders-overview", title: "Orders Overview", description: "Recent orders, status", section: "Commerce", href: "/admin/orders", status: "live" },
  { id: 4, slug: "profit-overview", title: "Profit Overview", description: "Revenue and profit", section: "Finance", href: "/admin/tools/profit-overview", status: "workspace" },
  { id: 5, slug: "customer-overview", title: "Customer Overview", description: "Customers, segments", section: "Engagement", href: "/admin/tools/customer-overview", status: "workspace" },
  { id: 6, slug: "manage-products", title: "Manage Products", description: "Add, edit, delete", section: "Operations", href: "/admin/products", status: "live" },
  { id: 7, slug: "categories-and-subcategories", title: "Categories and Subcategories", description: "Organize products", section: "Operations", href: "/admin/tools/categories-and-subcategories", status: "workspace" },
  { id: 8, slug: "product-images", title: "Product Images", description: "Upload and manage", section: "Operations", href: "/admin/tools/product-images", status: "workspace" },
  { id: 9, slug: "product-pricing", title: "Product Pricing", description: "Set prices, currency", section: "Commerce", href: "/admin/products", status: "live" },
  { id: 10, slug: "product-variants-and-weight", title: "Product Variants and Weight", description: "10g, 25g, 50g variants", section: "Operations", href: "/admin/tools/product-variants-and-weight", status: "workspace" },
  { id: 11, slug: "batch-and-expiry", title: "Batch and Expiry", description: "Batch number and expiry tracking", section: "Inventory", href: "/admin/inventory/batches", status: "live" },
  { id: 12, slug: "barcode-and-qr", title: "Barcode and QR", description: "Generate and manage", section: "Inventory", href: "/admin/tools/barcode-and-qr", status: "workspace" },
  { id: 13, slug: "inventory-and-stock", title: "Inventory and Stock", description: "Stock levels and alerts", section: "Inventory", href: "/admin/inventory", status: "live" },
  { id: 14, slug: "stock-adjustment", title: "Stock Adjustment", description: "Manual adjustments", section: "Inventory", href: "/admin/inventory/adjustments", status: "live" },
  { id: 15, slug: "near-expiry-alerts", title: "Near Expiry Alerts", description: "Expiry notifications", section: "Inventory", href: "/admin/tools/near-expiry-alerts", status: "workspace" },
  { id: 16, slug: "purchase-management", title: "Purchase Management", description: "Supplier purchases", section: "Inventory", href: "/admin/tools/purchase-management", status: "workspace" },
  { id: 17, slug: "stock-transfer", title: "Stock Transfer", description: "Between locations and bins", section: "Inventory", href: "/admin/tools/stock-transfer", status: "workspace" },
  { id: 18, slug: "online-orders", title: "Online Orders", description: "Website orders", section: "Commerce", href: "/admin/orders", status: "live" },
  { id: 19, slug: "pos-orders", title: "POS Orders", description: "Walk-in store orders", section: "Commerce", href: "/admin/tools/pos-orders", status: "workspace" },
  { id: 20, slug: "order-details", title: "Order Details", description: "View and manage", section: "Commerce", href: "/admin/orders", status: "live" },
  { id: 21, slug: "returns-and-refunds", title: "Returns and Refunds", description: "Manage return requests", section: "Commerce", href: "/admin/returns", status: "live" },
  { id: 22, slug: "cancelled-orders", title: "Cancelled Orders", description: "View cancelled orders", section: "Commerce", href: "/admin/orders", status: "live" },
  { id: 23, slug: "customers", title: "Customers", description: "Customer list and details", section: "Engagement", href: "/admin/customers", status: "live" },
  { id: 24, slug: "customer-reviews", title: "Customer Reviews", description: "Manage reviews", section: "Engagement", href: "/admin/tools/customer-reviews", status: "workspace" },
  { id: 25, slug: "wishlist-data", title: "Wishlist Data", description: "View customer wishlists", section: "Engagement", href: "/admin/tools/wishlist-data", status: "workspace" },
  { id: 26, slug: "offers-and-discounts", title: "Offers and Discounts", description: "Create and manage", section: "Commerce", href: "/admin/offers", status: "live" },
  { id: 27, slug: "coupons", title: "Coupons", description: "Coupon codes", section: "Commerce", href: "/admin/coupons", status: "live" },
  { id: 28, slug: "combo-packs", title: "Combo Packs", description: "Manage combo packs", section: "Commerce", href: "/admin/tools/combo-packs", status: "workspace" },
  { id: 29, slug: "gift-packs", title: "Gift Packs", description: "Manage gift packs", section: "Commerce", href: "/admin/tools/gift-packs", status: "workspace" },
  { id: 30, slug: "banners", title: "Banners", description: "Homepage banners", section: "Engagement", href: "/admin/tools/banners", status: "workspace" },
  { id: 31, slug: "homepage-content", title: "Homepage Content", description: "Edit sections", section: "Engagement", href: "/admin/tools/homepage-content", status: "workspace" },
  { id: 32, slug: "email-and-whatsapp-marketing", title: "Email and WhatsApp Marketing", description: "Send campaigns", section: "Engagement", href: "/admin/tools/email-and-whatsapp-marketing", status: "workspace" },
  { id: 33, slug: "suppliers", title: "Suppliers", description: "Manage suppliers", section: "Inventory", href: "/admin/inventory/suppliers", status: "live" },
  { id: 34, slug: "expenses", title: "Expenses", description: "Business expenses", section: "Finance", href: "/admin/tools/expenses", status: "workspace" },
  { id: 35, slug: "payments", title: "Payments", description: "Track payments", section: "Finance", href: "/admin/tools/payments", status: "workspace" },
  { id: 36, slug: "gst-and-tax", title: "GST and Tax", description: "Tax configuration", section: "Finance", href: "/admin/tools/gst-and-tax", status: "workspace" },
  { id: 37, slug: "shipping-and-delivery", title: "Shipping and Delivery", description: "Delivery settings", section: "Operations", href: "/admin/tools/shipping-and-delivery", status: "workspace" },
  { id: 38, slug: "reports-and-analytics", title: "Reports and Analytics", description: "Sales, inventory, customers", section: "Finance", href: "/admin/reports", status: "live" },
  { id: 39, slug: "staff-and-users", title: "Staff and Users", description: "Add and manage users", section: "System", href: "/admin/tools/staff-and-users", status: "workspace" },
  { id: 40, slug: "roles-and-permissions", title: "Roles and Permissions", description: "Set access levels", section: "System", href: "/admin/tools/roles-and-permissions", status: "workspace" },
  { id: 41, slug: "activity-logs", title: "Activity Logs", description: "User activity history", section: "System", href: "/admin/tools/activity-logs", status: "workspace" },
  { id: 42, slug: "settings", title: "Settings", description: "General, currency, tax", section: "System", href: "/admin/tools/settings", status: "workspace" },
  { id: 43, slug: "backup-and-cloud-sync", title: "Backup and Cloud Sync", description: "Data backup", section: "System", href: "/admin/tools/backup-and-cloud-sync", status: "workspace" },
  { id: 44, slug: "notifications", title: "Notifications", description: "System alerts", section: "System", href: "/admin/tools/notifications", status: "workspace" },
  { id: 45, slug: "logout", title: "Logout", description: "Secure logout", section: "System", href: "/account", status: "live" },
];

export const adminSections = ["Operations", "Commerce", "Inventory", "Engagement", "Finance", "System"] as const;

export function getAdminOptionBySlug(slug: string) {
  return adminOptions.find((option) => option.slug === slug);
}
