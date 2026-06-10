import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Product extends Model {
  static table = 'products'

  @field('name') name: string
  @field('sku') sku: string
  @field('barcode') barcode?: string
  @field('category') category: string
  @field('quantity') quantity: number
  @field('buying_price') buying_price: number
  @field('selling_price') selling_price: number
  @field('supplier') supplier?: string
  @field('warehouse') warehouse?: string
  @field('location') location?: string
  @field('image_url') image_url?: string
  @field('low_stock_threshold') low_stock_threshold: number
  @field('server_id') server_id?: string
  @field('business_name') business_name?: string
  
  @readonly @date('created_at') createdAt: Date
}
