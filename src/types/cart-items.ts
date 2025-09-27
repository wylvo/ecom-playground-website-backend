export type CartItems = {
  id: string
  quantity: number
  productVariant: {
    id: string
    stripeProductId: string
    stripePriceId: string
    name: string
    price: number
    discountPrice: number
    inventoryQuantity: number
    weight: number
    weightUnit: string
    grams: number
    isShippingRequired: boolean
    isActive: boolean
    isVisible: boolean
  }
}[]
