export type TaxRates = {
  id: number
  rate: string
  taxName: string
  isInclusive: boolean
  country: {
    id: number
    code: string
    name: string
  }
  region: {
    id: number
    code: string
    name: string
  }
}[]
