import { Model } from '@nozbe/watermelondb'
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators'
import Product from './Product'

export default class Transaction extends Model {
  static table = 'transactions'

  @field('product_id') product_id: string
  @field('product_name') product_name: string
  @field('type') type: string // added|removed|sold|returned
  @field('quantity') quantity: number
  @field('note') note?: string
  @field('by_user') by_user: string
  @field('server_id') server_id?: string
  @field('business_name') business_name?: string
  
  @readonly @date('created_at') createdAt: Date

  @relation('products', 'product_id') product: Product
}
