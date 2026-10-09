import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
  jsonb,
  index
} from 'drizzle-orm/pg-core';

// 1. Roles
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(), // SUPER_ADMIN, ADMIN, MANAGER, ACCOUNTANT, ORDER_MANAGER, VIEWER
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Permissions
export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(), // e.g. orders.view, customer_payments.create
  name: text('name').notNull(),
  module: text('module').notNull(),
});

// 3. Role Permissions Join Table
export const rolePermissions = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  roleId: integer('role_id').references(() => roles.id).notNull(),
  permissionId: integer('permission_id').references(() => permissions.id).notNull(),
});

// 4. Admin Users
export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  salt: text('salt').notNull(),
  fullName: text('full_name').notNull(),
  phone: text('phone').default('01284484868').notNull(),
  roleId: integer('role_id').references(() => roles.id).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  isLocked: boolean('is_locked').default(false).notNull(),
  failedAttempts: integer('failed_attempts').default(0).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 5. OTP Tokens for Admin WhatsApp 2FA
export const otpTokens = pgTable('otp_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => adminUsers.id),
  phone: text('phone').notNull(),
  tokenHash: text('token_hash').notNull(),
  purpose: text('purpose').default('login').notNull(), // login, password_reset
  expiresAt: timestamp('expires_at').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  isUsed: boolean('is_used').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. Customers
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull().unique(),
  whatsapp: text('whatsapp'),
  email: text('email'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('customer_phone_idx').on(table.phone),
]);

// 7. Menu Items (The 18 Sales packages)
export const menuItems = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(), // Sale-01, Sale-02, ... Sale-18
  name: text('name').notNull(),
  description: text('description').notNull(),
  distributorPrice: numeric('distributor_price', { precision: 10, scale: 2 }).notNull(),
  supplierPrice: numeric('supplier_price', { precision: 10, scale: 2 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 8. Menu Item Components (Ingredients / contents of box)
export const menuItemComponents = pgTable('menu_item_components', {
  id: serial('id').primaryKey(),
  menuItemId: integer('menu_item_id').references(() => menuItems.id, { onDelete: 'cascade' }).notNull(),
  componentName: text('component_name').notNull(),
  quantity: numeric('quantity', { precision: 8, scale: 2 }).default('1.00').notNull(),
  unit: text('unit').default('قطعة').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
});

// 9. Menu Price History
export const menuPriceHistory = pgTable('menu_price_history', {
  id: serial('id').primaryKey(),
  menuItemId: integer('menu_item_id').references(() => menuItems.id).notNull(),
  distributorPrice: numeric('distributor_price', { precision: 10, scale: 2 }).notNull(),
  supplierPrice: numeric('supplier_price', { precision: 10, scale: 2 }).notNull(),
  validFrom: timestamp('valid_from').defaultNow().notNull(),
  validTo: timestamp('valid_to'),
  createdBy: text('created_by').default('system'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 10. Orders
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(), // CB-YYYYMMDD-XXXX
  customerId: integer('customer_id').references(() => customers.id).notNull(),
  orderStatus: text('order_status').default('PENDING_BOOKING').notNull(), // PENDING_BOOKING, CONFIRMED, SENT_TO_SUPPLIER, IN_PRODUCTION, READY, DELIVERED, COMPLETED, CANCELLED
  cancelReason: text('cancel_reason'),
  pickupDate: text('pickup_date').notNull(), // YYYY-MM-DD
  pickupTime: text('pickup_time').notNull(), // e.g. 7:00 PM
  pickupLocation: text('pickup_location').notNull(),
  customerNotes: text('customer_notes'),

  // Financials - Customer Account (Celebre <-> Customer)
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  discount: numeric('discount', { precision: 12, scale: 2 }).default('0.00').notNull(),
  adjustments: numeric('adjustments', { precision: 12, scale: 2 }).default('0.00').notNull(),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(), // Customer Total
  customerPaid: numeric('customer_paid', { precision: 12, scale: 2 }).default('0.00').notNull(),
  customerRemaining: numeric('customer_remaining', { precision: 12, scale: 2 }).notNull(),

  // Financials - Supplier Account (Celebre <-> Supplier/Factory)
  supplierTotal: numeric('supplier_total', { precision: 12, scale: 2 }).notNull(),
  supplierPaid: numeric('supplier_paid', { precision: 12, scale: 2 }).default('0.00').notNull(),
  supplierRemaining: numeric('supplier_remaining', { precision: 12, scale: 2 }).notNull(),

  // Profit Snapshot
  distributorProfit: numeric('distributor_profit', { precision: 12, scale: 2 }).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  cancelledAt: timestamp('cancelled_at'),

  // WhatsApp Messaging Layer Tracking
  lastMessageAt: timestamp('last_message_at'),
  lastMessageBy: text('last_message_by'),
  lastMessageType: text('last_message_type'),
  lastMessageRecipient: text('last_message_recipient'),
}, (table) => [
  index('order_number_idx').on(table.orderNumber),
  index('order_status_idx').on(table.orderStatus),
  index('order_customer_idx').on(table.customerId),
  index('order_pickup_date_idx').on(table.pickupDate),
]);

// 11. Order Items (Preserving exact price snapshots)
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  menuItemId: integer('menu_item_id').references(() => menuItems.id).notNull(),
  menuCode: text('menu_code').notNull(),
  menuName: text('menu_name').notNull(),
  quantity: integer('quantity').notNull(),

  // Unit Price Snapshots at order creation time
  distributorUnitPrice: numeric('distributor_unit_price', { precision: 10, scale: 2 }).notNull(),
  supplierUnitPrice: numeric('supplier_unit_price', { precision: 10, scale: 2 }).notNull(),

  distributorTotal: numeric('distributor_total', { precision: 12, scale: 2 }).notNull(),
  supplierTotal: numeric('supplier_total', { precision: 12, scale: 2 }).notNull(),

  customerAdjustment: numeric('customer_adjustment', { precision: 10, scale: 2 }).default('0.00').notNull(),
  supplierAdjustment: numeric('supplier_adjustment', { precision: 10, scale: 2 }).default('0.00').notNull(),

  customerTotal: numeric('customer_total', { precision: 12, scale: 2 }).notNull(),
  supplierTotalFinal: numeric('supplier_total_final', { precision: 12, scale: 2 }).notNull(),
  profit: numeric('profit', { precision: 12, scale: 2 }).notNull(),
});

// 12. Order Item Options (Drink selections: exclusion -5 EGP, Pepsi replacement +10 EGP)
export const orderItemOptions = pgTable('order_item_options', {
  id: serial('id').primaryKey(),
  orderItemId: integer('order_item_id').references(() => orderItems.id, { onDelete: 'cascade' }).notNull(),
  optionType: text('option_type').notNull(), // juice_exclusion, pepsi_replacement, custom
  optionName: text('option_name').notNull(),
  distributorAdjustment: numeric('distributor_adjustment', { precision: 10, scale: 2 }).notNull(),
  supplierAdjustment: numeric('supplier_adjustment', { precision: 10, scale: 2 }).default('0.00').notNull(),
});

// 13. Customer Payments (Recorded manually by Admin - Offline InstaPay / Cash)
export const customerPayments = pgTable('customer_payments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  customerId: integer('customer_id').references(() => customers.id).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text('payment_method').default('INSTAPAY').notNull(), // INSTAPAY, CASH, BANK_TRANSFER, OTHER
  paymentStatus: text('payment_status').default('VERIFIED').notNull(), // PENDING_REVIEW, VERIFIED, REJECTED
  paymentReference: text('payment_reference'), // InstaPay Tx ID, receipt ref
  notes: text('notes'),
  receivedBy: text('received_by').default('admin').notNull(),
  paidAt: timestamp('paid_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 14. Suppliers (Factories)
export const suppliers = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  companyName: text('company_name').notNull(),
  phone: text('phone').notNull(),
  whatsapp: text('whatsapp'),
  email: text('email'),
  address: text('address'),
  taxNumber: text('tax_number'),
  notes: text('notes'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 15. Supplier Orders (Independent factory order linked to client order)
export const supplierOrders = pgTable('supplier_orders', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  supplierId: integer('supplier_id').references(() => suppliers.id).notNull(),
  supplierOrderNumber: text('supplier_order_number').notNull().unique(), // SUP-YYYYMMDD-XXXX
  supplierTotal: numeric('supplier_total', { precision: 12, scale: 2 }).notNull(),
  supplierPaid: numeric('supplier_paid', { precision: 12, scale: 2 }).default('0.00').notNull(),
  supplierRemaining: numeric('supplier_remaining', { precision: 12, scale: 2 }).notNull(),
  status: text('status').default('PENDING_CONFIRMATION').notNull(), // PENDING_CONFIRMATION, IN_PRODUCTION, READY, DELIVERED, CANCELLED
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 16. Supplier Payments (Payments from Celebre to the Factory)
export const supplierPayments = pgTable('supplier_payments', {
  id: serial('id').primaryKey(),
  supplierOrderId: integer('supplier_order_id').references(() => supplierOrders.id).notNull(),
  supplierId: integer('supplier_id').references(() => suppliers.id).notNull(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text('payment_method').default('BANK_TRANSFER').notNull(), // INSTAPAY, CASH, BANK_TRANSFER, OTHER
  reference: text('reference'),
  notes: text('notes'),
  paidBy: text('paid_by').default('admin').notNull(),
  paidAt: timestamp('paid_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 17. Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  userName: text('user_name').default('system').notNull(),
  action: text('action').notNull(), // ORDER_CREATED, PAYMENT_ADDED, STATUS_CHANGED, etc.
  entity: text('entity').notNull(), // orders, customer_payments, supplier_payments, etc.
  entityId: text('entity_id').notNull(),
  oldData: jsonb('old_data'),
  newData: jsonb('new_data'),
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('audit_entity_idx').on(table.entity, table.entityId),
  index('audit_created_idx').on(table.createdAt),
]);

// 18. Application Dynamic Settings (e.g. juice discount = 5 EGP, pepsi markup = 10 EGP)
export const appSettings = pgTable('app_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
  payments: many(customerPayments),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
  customerPayments: many(customerPayments),
  supplierOrders: many(supplierOrders),
}));

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
  options: many(orderItemOptions),
}));

export const orderItemOptionsRelations = relations(orderItemOptions, ({ one }) => ({
  orderItem: one(orderItems, {
    fields: [orderItemOptions.orderItemId],
    references: [orderItems.id],
  }),
}));

export const menuItemsRelations = relations(menuItems, ({ many }) => ({
  components: many(menuItemComponents),
  priceHistory: many(menuPriceHistory),
}));

export const menuItemComponentsRelations = relations(menuItemComponents, ({ one }) => ({
  menuItem: one(menuItems, {
    fields: [menuItemComponents.menuItemId],
    references: [menuItems.id],
  }),
}));

export const supplierOrdersRelations = relations(supplierOrders, ({ one, many }) => ({
  order: one(orders, {
    fields: [supplierOrders.orderId],
    references: [orders.id],
  }),
  supplier: one(suppliers, {
    fields: [supplierOrders.supplierId],
    references: [suppliers.id],
  }),
  payments: many(supplierPayments),
}));
