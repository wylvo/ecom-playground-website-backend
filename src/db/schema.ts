import {
  pgTable,
  serial,
  text,
  bigint,
  uniqueIndex,
  foreignKey,
  uuid,
  boolean,
  timestamp,
  unique,
  pgPolicy,
  char,
  integer,
  numeric,
  index,
  check,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { authUsers } from "drizzle-orm/supabase"

export const orderFinancialStatusEnum = pgEnum("order_financial_status_enum", [
  "pending",
  "authorized",
  "paid",
  "partially_paid",
  "refunded",
  "partially_refunded",
  "voided",
  "failed",
])
export const orderFulfillmentStatusEnum = pgEnum(
  "order_fulfillment_status_enum",
  ["unfulfilled", "partial", "fulfilled", "returned", "cancelled"],
)
export const orderRiskLevelEnum = pgEnum("order_risk_level_enum", [
  "low",
  "medium",
  "high",
])
export const orderStatusEnum = pgEnum("order_status_enum", [
  "cancelled",
  "fulfilled",
  "paid",
  "pending",
  "refunded",
])
export const paymentMethodEnum = pgEnum("payment_method_enum", [
  "cash",
  "credit_card",
  "gift_card",
])
export const paymentProviderEnum = pgEnum("payment_provider_enum", [
  "stripe",
  "paypal",
  "affirm",
  "klarna",
])
export const paymentStatusEnum = pgEnum("payment_status_enum", [
  "authorized",
  "expired",
  "paid",
  "partially_paid",
  "partially_refunded",
  "pending",
  "refunded",
  "voided",
  "failed",
])
export const promotionTypeEnum = pgEnum("promotion_type_enum", [
  "percentage",
  "fixed_amount",
])
export const refundStatusEnum = pgEnum("refund_status_enum", [
  "pending",
  "completed",
  "failed",
])
export const shippingStatusEnum = pgEnum("shipping_status_enum", [
  "cancelled",
  "delivered",
  "pending",
  "returned",
  "shipped",
])
export const translationEntityEnum = pgEnum("translation_entity_enum", [
  "country",
  "region",
  "tax_rate",
  "product",
  "product_collection",
  "product_variant",
  "product_option",
  "product_option_value",
  "product_metafield",
  "product_variant_metafield",
  "order_status",
  "order_financial_status",
  "order_fulfillment_status",
  "order_risk_level",
  "shipping_method",
  "payment_status",
  "payment_method",
  "refund_status",
])

export const drizzleMigrationsLog = pgTable("__drizzle_migrations_log", {
  id: serial().primaryKey().notNull(),
  hash: text().notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  createdAt: bigint("created_at", { mode: "number" }),
})

export const orders = pgTable(
  "orders",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    customerId: bigint("customer_id", { mode: "number" }),
    authUserId: uuid("auth_user_id"),
    status: orderStatusEnum().notNull(),
    financialStatus: orderFinancialStatusEnum("financial_status").notNull(),
    fulfillmentStatus:
      orderFulfillmentStatusEnum("fulfillment_status").notNull(),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    stripePaymentStatus: text("stripe_payment_status"),
    idempotencyKey: text("idempotency_key"),
    email: text().notNull(),
    phoneNumber: text("phone_number"),
    acceptsMarketing: boolean("accepts_marketing").default(false).notNull(),
    shippingFullName: text("shipping_full_name"),
    shippingCompany: text("shipping_company"),
    shippingAddressLine1: text("shipping_address_line_1"),
    shippingAddressLine2: text("shipping_address_line_2"),
    shippingCity: text("shipping_city"),
    shippingRegionName: text("shipping_region_name"),
    shippingRegionCode: text("shipping_region_code"),
    shippingZip: text("shipping_zip"),
    shippingCountryName: text("shipping_country_name"),
    shippingCountryCode: text("shipping_country_code"),
    billingAddressMatchesShippingAddress: boolean(
      "billing_address_matches_shipping_address",
    ),
    billingFullName: text("billing_full_name"),
    billingCompany: text("billing_company"),
    billingAddressLine1: text("billing_address_line_1"),
    billingAddressLine2: text("billing_address_line_2"),
    billingCity: text("billing_city"),
    billingRegionName: text("billing_region_name"),
    billingRegionCode: text("billing_region_code"),
    billingZip: text("billing_zip"),
    billingCountryName: text("billing_country_name"),
    billingCountryCode: text("billing_country_code"),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    promotionId: bigint("promotion_id", { mode: "number" }),
    promotionCode: text("promotion_code"),
    promotionType: promotionTypeEnum("promotion_type"),
    promotionValue: integer("promotion_value"),
    promotionCurrencyCode: text("promotion_currency_code"),
    locale: text().notNull(),
    purchaseOrderNumber: text("purchase_order_number"),
    orderNumber: text("order_number").notNull(),
    notes: text(),
    shippingNotes: text("shipping_notes"),
    source: text(),
    isTest: boolean("is_test").default(false),
    subtotalPrice: integer("subtotal_price").notNull(),
    discountTotal: integer("discount_total").default(0).notNull(),
    taxTotal: integer("tax_total").default(0).notNull(),
    shippingTotal: integer("shipping_total").default(0).notNull(),
    totalPrice: integer("total_price").notNull(),
    refundedTotal: integer("refunded_total").default(0).notNull(),
    additionalFeesTotal: integer("additional_fees_total").default(0).notNull(),
    currencyCode: text("currency_code").notNull(),
    taxesIncluded: boolean("taxes_included").default(false).notNull(),
    riskLevel: orderRiskLevelEnum("risk_level"),
    riskReason: text("risk_reason"),
    clientIp: text("client_ip"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true, mode: "string" }),
    fulfilledAt: timestamp("fulfilled_at", {
      withTimezone: true,
      mode: "string",
    }),
    cancelledAt: timestamp("cancelled_at", {
      withTimezone: true,
      mode: "string",
    }),
    refundedAt: timestamp("refunded_at", {
      withTimezone: true,
      mode: "string",
    }),
  },
  (table) => [
    uniqueIndex("uniq_stripe_checkout_session_id")
      .using(
        "btree",
        table.stripeCheckoutSessionId.asc().nullsLast().op("text_ops"),
      )
      .where(sql`(stripe_checkout_session_id IS NOT NULL)`),
    foreignKey({
      columns: [table.authUserId],
      foreignColumns: [authUsers.id],
      name: "orders_auth_user_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.customerId],
      foreignColumns: [customers.id],
      name: "orders_customer_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.promotionId],
      foreignColumns: [promotions.id],
      name: "orders_promotion_id_fkey",
    }).onDelete("set null"),
    unique("orders_idempotency_key_key").on(table.idempotencyKey),
    unique("orders_order_number_key").on(table.orderNumber),
    pgPolicy("Allow user to view own orders", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
      using: sql`(auth.uid() = auth_user_id)`,
    }),
  ],
)

export const promotionRedemptions = pgTable(
  "promotion_redemptions",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
      name: "promotion_redemptions_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    promotionId: bigint("promotion_id", { mode: "number" }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    customerId: bigint("customer_id", { mode: "number" }).notNull(),
    orderId: uuid("order_id"),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.customerId],
      foreignColumns: [customers.id],
      name: "promotion_redemptions_customer_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
      name: "promotion_redemptions_order_id_fkey",
    }),
    foreignKey({
      columns: [table.promotionId],
      foreignColumns: [promotions.id],
      name: "promotion_redemptions_promotion_id_fkey",
    }).onDelete("cascade"),
    unique("promotion_redemptions_uniq").on(
      table.promotionId,
      table.customerId,
    ),
  ],
)

export const refunds = pgTable(
  "refunds",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
      name: "refunds_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    refundedByAuthUserId: uuid("refunded_by_auth_user_id"),
    orderId: uuid("order_id").notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    paymentId: bigint("payment_id", { mode: "number" }),
    transactionId: text("transaction_id").notNull(),
    status: refundStatusEnum().notNull(),
    amount: integer().notNull(),
    currencyCode: text("currency_code").notNull(),
    reason: text(),
    isManual: boolean("is_manual").default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    refundedAt: timestamp("refunded_at", {
      withTimezone: true,
      mode: "string",
    }),
  },
  (table) => [
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
      name: "refunds_order_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.paymentId],
      foreignColumns: [payments.id],
      name: "refunds_payment_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.refundedByAuthUserId],
      foreignColumns: [authUsers.id],
      name: "refunds_refunded_by_auth_user_id_fkey",
    }).onDelete("set null"),
    unique("refunds_transaction_id_key").on(table.transactionId),
  ],
)

export const carts = pgTable(
  "carts",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    customerId: bigint("customer_id", { mode: "number" }),
    authUserId: uuid("auth_user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.authUserId],
      foreignColumns: [authUsers.id],
      name: "carts_auth_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.customerId],
      foreignColumns: [customers.id],
      name: "carts_customer_id_fkey",
    }).onDelete("set null"),
    pgPolicy("Allow user to view own cart", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
      using: sql`(auth.uid() = auth_user_id)`,
    }),
  ],
)

export const customers = pgTable(
  "customers",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
      name: "customers_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    stripeCustomerId: text("stripe_customer_id"),
    authUserId: uuid("auth_user_id").notNull(),
    email: text(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    phoneNumber: text("phone_number"),
    isActive: boolean("is_active").default(true).notNull(),
    isEmailVerified: boolean("is_email_verified").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("uniq_customers_email")
      .using("btree", table.email.asc().nullsLast().op("text_ops"))
      .where(sql`(email IS NOT NULL)`),
    uniqueIndex("uniq_customers_stripe_customer_id")
      .using("btree", table.stripeCustomerId.asc().nullsLast().op("text_ops"))
      .where(sql`(stripe_customer_id IS NOT NULL)`),
    foreignKey({
      columns: [table.authUserId],
      foreignColumns: [authUsers.id],
      name: "customers_auth_user_id_fkey",
    }).onDelete("cascade"),
  ],
)

export const orderShipments = pgTable(
  "order_shipments",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
      name: "order_shipments_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    orderId: uuid("order_id").notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    shippingMethodId: bigint("shipping_method_id", { mode: "number" }),
    shippingMethodName: text("shipping_method_name").notNull(),
    shippingMethodCarrier: text("shipping_method_carrier").notNull(),
    shippingMethodServiceCode: text("shipping_method_service_code"),
    status: shippingStatusEnum().notNull(),
    shippingTotal: integer("shipping_total").notNull(),
    trackingNumber: text("tracking_number"),
    trackingUrl: text("tracking_url"),
    isReturn: boolean("is_return").default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    shippedAt: timestamp("shipped_at", { withTimezone: true, mode: "string" }),
    deliveredAt: timestamp("delivered_at", {
      withTimezone: true,
      mode: "string",
    }),
  },
  (table) => [
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
      name: "order_shipments_order_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.shippingMethodId],
      foreignColumns: [shippingMethods.id],
      name: "order_shipments_shipping_method_id_fkey",
    }).onDelete("set null"),
  ],
)

export const orderProducts = pgTable(
  "order_products",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
      name: "order_products_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    orderId: uuid("order_id").notNull(),
    productVariantId: uuid("product_variant_id"),
    productVariantName: text("product_variant_name").notNull(),
    productVariantSku: text("product_variant_sku"),
    productVariantImageUrl: text("product_variant_image_url"),
    productVariantImageAltText: text("product_variant_image_alt_text"),
    quantity: integer().notNull(),
    price: integer().notNull(),
    totalPrice: integer("total_price")
      .notNull()
      .generatedAlwaysAs(sql`(quantity * price)`),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
      name: "order_products_order_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.productVariantId],
      foreignColumns: [productVariants.id],
      name: "order_products_product_variant_id_fkey",
    }).onDelete("set null"),
  ],
)

export const shippingMethods = pgTable(
  "shipping_methods",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
      name: "shipping_methods_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    name: text().notNull(),
    carrier: text().notNull(),
    serviceCode: text("service_code"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
  },
  (table) => [
    pgPolicy("Allow everyone to view shipping_methods", {
      as: "permissive",
      for: "select",
      to: ["public"],
      using: sql`true`,
    }),
  ],
)

export const payments = pgTable(
  "payments",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
      name: "payments_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    orderId: uuid("order_id").notNull(),
    transactionId: text("transaction_id").notNull(),
    status: paymentStatusEnum().notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    provider: paymentProviderEnum().notNull(),
    providerResponseCode: text("provider_response_code"),
    amount: integer().notNull(),
    amountRefunded: integer("amount_refunded").default(0).notNull(),
    currencyCode: text("currency_code").notNull(),
    failureReason: text("failure_reason"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
      name: "payments_order_id_fkey",
    }).onDelete("cascade"),
    unique("payments_transaction_id_key").on(table.transactionId),
  ],
)

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    productVariantId: uuid("product_variant_id").notNull(),
    cartId: uuid("cart_id").notNull(),
    quantity: integer().default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.cartId],
      foreignColumns: [carts.id],
      name: "cart_items_cart_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.productVariantId],
      foreignColumns: [productVariants.id],
      name: "cart_items_product_variant_id_fkey",
    }),
    unique("cart_items_uniq").on(table.productVariantId, table.cartId),
    pgPolicy("Allow user to insert items into own cart", {
      as: "permissive",
      for: "insert",
      to: ["authenticated"],
      withCheck: sql`(EXISTS ( SELECT 1
   FROM carts
  WHERE ((carts.id = cart_items.cart_id) AND (carts.auth_user_id = auth.uid()))))`,
    }),
    pgPolicy("Allow user to delete own cart items", {
      as: "permissive",
      for: "delete",
      to: ["authenticated"],
    }),
    pgPolicy("Allow user to update own cart items", {
      as: "permissive",
      for: "update",
      to: ["authenticated"],
    }),
    pgPolicy("Allow user to view own cart items", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
    }),
    check("cart_items_quantity_check", sql`quantity >= 1`),
  ],
)

export const translations = pgTable(
  "translations",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
      name: "translations_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    entity: translationEntityEnum().notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    localeId: bigint("locale_id", { mode: "number" }).notNull(),
    key: text().notNull(),
    value: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
  },
  (table) => [
    index("idx_translations_entity_entity_id_locale_id_key").using(
      "btree",
      table.entity.asc().nullsLast().op("int8_ops"),
      table.entityId.asc().nullsLast().op("int8_ops"),
      table.localeId.asc().nullsLast().op("enum_ops"),
      table.key.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.localeId],
      foreignColumns: [locales.id],
      name: "translations_locale_id_fkey",
    }),
    unique("translations_uniq").on(
      table.entity,
      table.entityId,
      table.localeId,
      table.key,
    ),
  ],
)

export const locales = pgTable(
  "locales",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
      name: "locales_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    code: text().notNull(),
    name: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
  },
  (table) => [
    unique("locales_code_key").on(table.code),
    pgPolicy("Allow everyone to view locales", {
      as: "permissive",
      for: "select",
      to: ["public"],
      using: sql`true`,
    }),
  ],
)

export const stripeWebhookEvents = pgTable("stripe_webhook_events", {
  id: text().primaryKey().notNull(),
  type: text().notNull(),
  data: jsonb().notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true, mode: "string" })
    .default(sql`(now() AT TIME ZONE 'utc'::text)`)
    .notNull(),
  processed: boolean().default(false).notNull(),
})

export const customerAddresses = pgTable(
  "customer_addresses",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
      name: "customer_addresses_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    customerId: bigint("customer_id", { mode: "number" }).notNull(),
    fullName: text("full_name").notNull(),
    companyName: text("company_name"),
    addressLine1: text("address_line_1").notNull(),
    addressLine2: text("address_line_2"),
    city: text().notNull(),
    region: text().notNull(),
    regionCode: text("region_code"),
    zip: text().notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    countryId: bigint("country_id", { mode: "number" }).notNull(),
    phoneNumber: text("phone_number"),
    isDefault: boolean("is_default").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.countryId],
      foreignColumns: [countries.id],
      name: "customer_adresses_country_id_fkey",
    }),
    foreignKey({
      columns: [table.customerId],
      foreignColumns: [customers.id],
      name: "customer_adresses_customer_id_fkey",
    }).onDelete("cascade"),
  ],
)

export const countries = pgTable(
  "countries",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
      name: "countries_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    name: text().notNull(),
    code: char({ length: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
  },
  (table) => [
    unique("countries_name_key").on(table.name),
    unique("countries_code_key").on(table.code),
    pgPolicy("Allow everyone to view countries", {
      as: "permissive",
      for: "select",
      to: ["public"],
      using: sql`true`,
    }),
  ],
)

export const regions = pgTable(
  "regions",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
      name: "regions_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    countryId: bigint("country_id", { mode: "number" }).notNull(),
    name: text().notNull(),
    code: char({ length: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.countryId],
      foreignColumns: [countries.id],
      name: "regions_country_id_fkey",
    }).onDelete("cascade"),
    unique("regions_code_key").on(table.code),
    pgPolicy("Allow everyone to view regions", {
      as: "permissive",
      for: "select",
      to: ["public"],
      using: sql`true`,
    }),
  ],
)

export const taxRates = pgTable(
  "tax_rates",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
      name: "tax_rates_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    countryId: integer("country_id").notNull(),
    regionId: integer("region_id"),
    rate: numeric({ precision: 6, scale: 3 }).notNull(),
    taxName: text("tax_name"),
    isInclusive: boolean("is_inclusive").default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.countryId],
      foreignColumns: [countries.id],
      name: "tax_rates_country_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.regionId],
      foreignColumns: [regions.id],
      name: "tax_rates_region_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Allow everyone to view tax_rates", {
      as: "permissive",
      for: "select",
      to: ["public"],
      using: sql`true`,
    }),
  ],
)

export const dataTypes = pgTable("data_types", {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
    name: "data_types_id_seq",
    startWith: 1,
    increment: 1,
    minValue: 1,
    maxValue: 9223372036854775807,
    cache: 1,
  }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .default(sql`(now() AT TIME ZONE 'utc'::text)`)
    .notNull(),
  value: text().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
})

export const productVariantOptions = pgTable(
  "product_variant_options",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
      name: "product_variant_options_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    productVariantId: uuid("product_variant_id").notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    productOptionValueId: bigint("product_option_value_id", {
      mode: "number",
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
  },
  (table) => [
    index("idx_product_variant_options_product_option_value_id").using(
      "btree",
      table.productOptionValueId.asc().nullsLast().op("int8_ops"),
    ),
    index("idx_product_variant_options_product_variant_id").using(
      "btree",
      table.productVariantId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.productOptionValueId],
      foreignColumns: [productOptionValues.id],
      name: "product_variant_options_product_option_value_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.productVariantId],
      foreignColumns: [productVariants.id],
      name: "product_variant_options_product_variant_id_fkey",
    }).onDelete("cascade"),
    unique("product_variant_options_uniq").on(
      table.productVariantId,
      table.productOptionValueId,
    ),
    pgPolicy("Allow everyone to view product_variant_options", {
      as: "permissive",
      for: "select",
      to: ["public"],
      using: sql`true`,
    }),
  ],
)

export const productOptionValueImages = pgTable(
  "product_option_value_images",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
      name: "product_option_value_images_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    productOptionValueId: bigint("product_option_value_id", {
      mode: "number",
    }).notNull(),
    url: text().notNull(),
    altText: text("alt_text"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.productOptionValueId],
      foreignColumns: [productOptionValues.id],
      name: "product_option_value_images_product_option_value_id_fkey",
    }).onDelete("cascade"),
    unique("product_option_value_images_uniq").on(table.productOptionValueId),
  ],
)

export const productOptions = pgTable(
  "product_options",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
      name: "product_options_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    productId: bigint("product_id", { mode: "number" }).notNull(),
    name: text().notNull(),
    sortOrder: integer("sort_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: "product_options_product_id_fkey",
    }),
    pgPolicy("Allow everyone to view product_options", {
      as: "permissive",
      for: "select",
      to: ["public"],
      using: sql`true`,
    }),
  ],
)

export const productOptionValues = pgTable(
  "product_option_values",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
      name: "product_option_values_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    productOptionId: bigint("product_option_id", { mode: "number" }).notNull(),
    value: text().notNull(),
    sortOrder: integer("sort_order"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.productOptionId],
      foreignColumns: [productOptions.id],
      name: "product_option_values_product_option_id",
    }),
    unique("product_option_values_uniq").on(table.productOptionId, table.value),
    pgPolicy("Allow everyone to view product_option_values", {
      as: "permissive",
      for: "select",
      to: ["public"],
      using: sql`true`,
    }),
  ],
)

export const productVariantMetafields = pgTable(
  "product_variant_metafields",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
      name: "product_variant_metafields_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    productVariantId: uuid("product_variant_id").notNull(),
    namespace: text().notNull(),
    key: text().notNull(),
    value: text().notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    dataTypeId: bigint("data_type_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.dataTypeId],
      foreignColumns: [dataTypes.id],
      name: "product_variant_metafields_data_type_id_fkey",
    }),
    foreignKey({
      columns: [table.productVariantId],
      foreignColumns: [productVariants.id],
      name: "product_variant_metafields_product_variant_id_fkey",
    }),
    unique("product_variant_metafields_uniq").on(
      table.productVariantId,
      table.namespace,
      table.key,
    ),
  ],
)

export const productVariantImages = pgTable(
  "product_variant_images",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
      name: "product_variant_images_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    productVariantId: uuid("product_variant_id").notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    productImageId: bigint("product_image_id", { mode: "number" }).notNull(),
    sortOrder: integer("sort_order"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
  },
  (table) => [
    index("idx_product_variant_images_product_image_id").using(
      "btree",
      table.productImageId.asc().nullsLast().op("int8_ops"),
    ),
    index("idx_product_variant_images_product_variant_id").using(
      "btree",
      table.productVariantId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.productImageId],
      foreignColumns: [productImages.id],
      name: "product_variant_images_product_image_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.productVariantId],
      foreignColumns: [productVariants.id],
      name: "product_variant_images_product_variant_id_fkey",
    }).onDelete("cascade"),
    unique("product_variant_images_uniq").on(
      table.productVariantId,
      table.productImageId,
    ),
    pgPolicy("Allow everyone to view product_variant_images", {
      as: "permissive",
      for: "select",
      to: ["public"],
      using: sql`true`,
    }),
  ],
)

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    productId: bigint("product_id", { mode: "number" }).notNull(),
    stripeProductId: text("stripe_product_id"),
    stripePriceId: text("stripe_price_id"),
    name: text().notNull(),
    price: integer().notNull(),
    discountPrice: integer("discount_price"),
    inventoryQuantity: integer("inventory_quantity").notNull(),
    sku: text().notNull(),
    barcode: text().notNull(),
    weight: integer(),
    weightUnit: text("weight_unit"),
    grams: integer(),
    isShippingRequired: boolean("is_shipping_required").default(false),
    isActive: boolean("is_active").default(true),
    isVisible: boolean("is_visible").default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
  },
  (table) => [
    index("idx_product_variants_product_id").using(
      "btree",
      table.productId.asc().nullsLast().op("int8_ops"),
    ),
    uniqueIndex("uniq_stripe_price_id")
      .using("btree", table.stripePriceId.asc().nullsLast().op("text_ops"))
      .where(sql`(stripe_price_id IS NOT NULL)`),
    uniqueIndex("uniq_stripe_product_id")
      .using("btree", table.stripeProductId.asc().nullsLast().op("text_ops"))
      .where(sql`(stripe_product_id IS NOT NULL)`),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: "product_variants_product_id_fkey",
    }),
    unique("product_variants_uniq").on(table.productId, table.name),
    unique("product_variants_sku_key").on(table.sku),
    unique("product_variants_barcode_key").on(table.barcode),
    pgPolicy("Allow everyone to view product_variants", {
      as: "permissive",
      for: "select",
      to: ["public"],
      using: sql`true`,
    }),
    check(
      "product_variants_check",
      sql`(discount_price IS NULL) OR (discount_price <= price)`,
    ),
  ],
)

export const productMetafields = pgTable(
  "product_metafields",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
      name: "product_metafields_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    productId: bigint("product_id", { mode: "number" }).notNull(),
    namespace: text().notNull(),
    key: text().notNull(),
    value: text().notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    dataTypeId: bigint("data_type_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.dataTypeId],
      foreignColumns: [dataTypes.id],
      name: "product_metafields_data_type_id_fkey",
    }),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: "product_metafields_product_id_fkey",
    }),
    unique("product_metafields_uniq").on(
      table.productId,
      table.namespace,
      table.key,
    ),
  ],
)

export const productImages = pgTable(
  "product_images",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
      name: "product_images_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    url: text().notNull(),
    altText: text("alt_text"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
  },
  (table) => [
    pgPolicy("Allow everyone to view product_images", {
      as: "permissive",
      for: "select",
      to: ["public"],
      using: sql`true`,
    }),
  ],
)

export const products = pgTable(
  "products",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
      name: "products_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    productCollectionId: bigint("product_collection_id", { mode: "number" }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    productImageId: bigint("product_image_id", { mode: "number" }),
    name: text().notNull(),
    nameSeo: text("name_seo"),
    description: text(),
    descriptionHtml: text("description_html"),
    descriptionSeo: text("description_seo"),
    handle: text().notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
  },
  (table) => [
    index("idx_products_handle").using(
      "btree",
      table.handle.asc().nullsLast().op("text_ops"),
    ),
    index("idx_products_product_collection_id").using(
      "btree",
      table.productCollectionId.asc().nullsLast().op("int8_ops"),
    ),
    foreignKey({
      columns: [table.productCollectionId],
      foreignColumns: [productCollections.id],
      name: "products_product_collection_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.productImageId],
      foreignColumns: [productImages.id],
      name: "products_product_image_id_fkey",
    }).onDelete("set null"),
    unique("products_name_key").on(table.name),
    unique("products_handle_key").on(table.handle),
    pgPolicy("Allow everyone to view products", {
      as: "permissive",
      for: "select",
      to: ["public"],
      using: sql`true`,
    }),
  ],
)

export const productCollections = pgTable(
  "product_collections",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
      name: "product_collections_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    parentProductCollectionId: bigint("parent_product_collection_id", {
      mode: "number",
    }),
    name: text().notNull(),
    imageUrl: text("image_url"),
    handle: text().notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
  },
  (table) => [
    index("idx_product_collections_handle").using(
      "btree",
      table.handle.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.parentProductCollectionId],
      foreignColumns: [table.id],
      name: "product_collections_parent_product_collection_id_fkey",
    }),
    unique("product_collections_name_key").on(table.name),
    unique("product_collections_handle_key").on(table.handle),
    pgPolicy("Allow everyone to view product_collections", {
      as: "permissive",
      for: "select",
      to: ["public"],
      using: sql`true`,
    }),
  ],
)

export const promotions = pgTable(
  "promotions",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
      name: "promotions_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    code: text().notNull(),
    description: text(),
    type: promotionTypeEnum().notNull(),
    value: integer().notNull(),
    currencyCode: text("currency_code"),
    usageLimit: integer("usage_limit"),
    usageLimitPerCustomer: integer("usage_limit_per_customer"),
    startsAt: timestamp("starts_at", { withTimezone: true, mode: "string" }),
    endsAt: timestamp("ends_at", { withTimezone: true, mode: "string" }),
    isActive: boolean("is_active").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() AT TIME ZONE 'utc'::text)`)
      .notNull(),
  },
  (table) => [unique("promotions_code_key").on(table.code)],
)
