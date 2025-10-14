import { relations } from "drizzle-orm/relations"
import {
  customers,
  countries,
  customerAddresses,
  regions,
  taxRates,
  productOptionValues,
  productVariantOptions,
  productVariants,
  productOptionValueImages,
  products,
  productOptions,
  dataTypes,
  productVariantMetafields,
  productImages,
  productVariantImages,
  productMetafields,
  productCollections,
  carts,
  cartItems,
  orders,
  promotions,
  promotionRedemptions,
  orderShipments,
  shippingMethods,
  orderProducts,
  payments,
  refunds,
  locales,
  translations,
} from "./schema"
import { authUsers } from "drizzle-orm/supabase"

export const customerAddressesRelations = relations(
  customerAddresses,
  ({ one }) => ({
    country: one(countries, {
      fields: [customerAddresses.countryId],
      references: [countries.id],
    }),
    customer: one(customers, {
      fields: [customerAddresses.customerId],
      references: [customers.id],
    }),
  }),
)

export const countriesRelations = relations(countries, ({ many }) => ({
  customerAddresses: many(customerAddresses),
  regions: many(regions),
  taxRates: many(taxRates),
}))

export const customersRelations = relations(customers, ({ one, many }) => ({
  customerAddresses: many(customerAddresses),
  usersInAuth: one(authUsers, {
    fields: [customers.authUserId],
    references: [authUsers.id],
  }),
  orders: many(orders),
  carts: many(carts),
}))

export const regionsRelations = relations(regions, ({ one, many }) => ({
  country: one(countries, {
    fields: [regions.countryId],
    references: [countries.id],
  }),
  taxRates: many(taxRates),
}))

export const taxRatesRelations = relations(taxRates, ({ one }) => ({
  country: one(countries, {
    fields: [taxRates.countryId],
    references: [countries.id],
  }),
  region: one(regions, {
    fields: [taxRates.regionId],
    references: [regions.id],
  }),
}))

export const productVariantOptionsRelations = relations(
  productVariantOptions,
  ({ one }) => ({
    productOptionValue: one(productOptionValues, {
      fields: [productVariantOptions.productOptionValueId],
      references: [productOptionValues.id],
    }),
    productVariant: one(productVariants, {
      fields: [productVariantOptions.productVariantId],
      references: [productVariants.id],
    }),
  }),
)

export const productOptionValuesRelations = relations(
  productOptionValues,
  ({ one, many }) => ({
    productVariantOptions: many(productVariantOptions),
    productOptionValueImages: many(productOptionValueImages),
    productOption: one(productOptions, {
      fields: [productOptionValues.productOptionId],
      references: [productOptions.id],
    }),
  }),
)

export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    productVariantOptions: many(productVariantOptions),
    productVariantMetafields: many(productVariantMetafields),
    productVariantImages: many(productVariantImages),
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
    orderProducts: many(orderProducts),
    cartItems: many(cartItems),
  }),
)

export const productOptionValueImagesRelations = relations(
  productOptionValueImages,
  ({ one }) => ({
    productOptionValue: one(productOptionValues, {
      fields: [productOptionValueImages.productOptionValueId],
      references: [productOptionValues.id],
    }),
  }),
)

export const productOptionsRelations = relations(
  productOptions,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productOptions.productId],
      references: [products.id],
    }),
    productOptionValues: many(productOptionValues),
  }),
)

export const productsRelations = relations(products, ({ one, many }) => ({
  productOptions: many(productOptions),
  productVariants: many(productVariants),
  productMetafields: many(productMetafields),
  productCollection: one(productCollections, {
    fields: [products.productCollectionId],
    references: [productCollections.id],
  }),
  productImage: one(productImages, {
    fields: [products.productImageId],
    references: [productImages.id],
  }),
}))

export const productVariantMetafieldsRelations = relations(
  productVariantMetafields,
  ({ one }) => ({
    dataType: one(dataTypes, {
      fields: [productVariantMetafields.dataTypeId],
      references: [dataTypes.id],
    }),
    productVariant: one(productVariants, {
      fields: [productVariantMetafields.productVariantId],
      references: [productVariants.id],
    }),
  }),
)

export const dataTypesRelations = relations(dataTypes, ({ many }) => ({
  productVariantMetafields: many(productVariantMetafields),
  productMetafields: many(productMetafields),
}))

export const productVariantImagesRelations = relations(
  productVariantImages,
  ({ one }) => ({
    productImage: one(productImages, {
      fields: [productVariantImages.productImageId],
      references: [productImages.id],
    }),
    productVariant: one(productVariants, {
      fields: [productVariantImages.productVariantId],
      references: [productVariants.id],
    }),
  }),
)

export const productImagesRelations = relations(productImages, ({ many }) => ({
  productVariantImages: many(productVariantImages),
  products: many(products),
}))

export const productMetafieldsRelations = relations(
  productMetafields,
  ({ one }) => ({
    dataType: one(dataTypes, {
      fields: [productMetafields.dataTypeId],
      references: [dataTypes.id],
    }),
    product: one(products, {
      fields: [productMetafields.productId],
      references: [products.id],
    }),
  }),
)

export const productCollectionsRelations = relations(
  productCollections,
  ({ one, many }) => ({
    products: many(products),
    productCollection: one(productCollections, {
      fields: [productCollections.parentProductCollectionId],
      references: [productCollections.id],
      relationName:
        "productCollections_parentProductCollectionId_productCollections_id",
    }),
    productCollections: many(productCollections, {
      relationName:
        "productCollections_parentProductCollectionId_productCollections_id",
    }),
  }),
)

export const usersInAuthRelations = relations(authUsers, ({ many }) => ({
  customers: many(customers),
  orders: many(orders),
  promotionRedemptions: many(promotionRedemptions),
  refunds: many(refunds),
  carts: many(carts),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  usersInAuth: one(authUsers, {
    fields: [orders.authUserId],
    references: [authUsers.id],
  }),
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  promotion: one(promotions, {
    fields: [orders.promotionId],
    references: [promotions.id],
  }),
  promotionRedemptions: many(promotionRedemptions),
  orderShipments: many(orderShipments),
  orderProducts: many(orderProducts),
  payments: many(payments),
  refunds: many(refunds),
}))

export const promotionsRelations = relations(promotions, ({ many }) => ({
  orders: many(orders),
  promotionRedemptions: many(promotionRedemptions),
}))

export const promotionRedemptionsRelations = relations(
  promotionRedemptions,
  ({ one }) => ({
    usersInAuth: one(authUsers, {
      fields: [promotionRedemptions.authUserId],
      references: [authUsers.id],
    }),
    order: one(orders, {
      fields: [promotionRedemptions.orderId],
      references: [orders.id],
    }),
    promotion: one(promotions, {
      fields: [promotionRedemptions.promotionId],
      references: [promotions.id],
    }),
  }),
)

export const orderShipmentsRelations = relations(orderShipments, ({ one }) => ({
  order: one(orders, {
    fields: [orderShipments.orderId],
    references: [orders.id],
  }),
  shippingMethod: one(shippingMethods, {
    fields: [orderShipments.shippingMethodId],
    references: [shippingMethods.id],
  }),
}))

export const shippingMethodsRelations = relations(
  shippingMethods,
  ({ many }) => ({
    orderShipments: many(orderShipments),
  }),
)

export const orderProductsRelations = relations(orderProducts, ({ one }) => ({
  order: one(orders, {
    fields: [orderProducts.orderId],
    references: [orders.id],
  }),
  productVariant: one(productVariants, {
    fields: [orderProducts.productVariantId],
    references: [productVariants.id],
  }),
}))

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
  refunds: many(refunds),
}))

export const refundsRelations = relations(refunds, ({ one }) => ({
  order: one(orders, {
    fields: [refunds.orderId],
    references: [orders.id],
  }),
  payment: one(payments, {
    fields: [refunds.paymentId],
    references: [payments.id],
  }),
  usersInAuth: one(authUsers, {
    fields: [refunds.refundedByAuthUserId],
    references: [authUsers.id],
  }),
}))

export const cartsRelations = relations(carts, ({ one, many }) => ({
  usersInAuth: one(authUsers, {
    fields: [carts.authUserId],
    references: [authUsers.id],
  }),
  customer: one(customers, {
    fields: [carts.customerId],
    references: [customers.id],
  }),
  cartItems: many(cartItems),
}))

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  productVariant: one(productVariants, {
    fields: [cartItems.productVariantId],
    references: [productVariants.id],
  }),
}))

export const translationsRelations = relations(translations, ({ one }) => ({
  locale: one(locales, {
    fields: [translations.localeId],
    references: [locales.id],
  }),
}))

export const localesRelations = relations(locales, ({ many }) => ({
  translations: many(translations),
}))
