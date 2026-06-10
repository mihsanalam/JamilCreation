import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'

import schema from './schema'
import migrations from './migrations'
import Product from './models/Product'
import Transaction from './models/Transaction'

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: false, // JSI is true only if using custom prebuilds. Expo Go requires jsi: false
  onSetUpError: error => {
    console.error('WatermelonDB setup failed', error)
  }
})

export const database = new Database({
  adapter,
  modelClasses: [
    Product,
    Transaction,
  ],
})
