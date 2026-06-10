import { appSchema, tableSchema } from '@nozbe/watermelondb'

export default appSchema({
  version: 2,
  tables: [
    tableSchema({
      name: 'products',
      columns: [
        { name: 'name',          type: 'string' },
        { name: 'sku',           type: 'string' },
        { name: 'barcode',       type: 'string', isOptional: true },
        { name: 'category',      type: 'string' },
        { name: 'quantity',      type: 'number' },
        { name: 'buying_price',  type: 'number' },
        { name: 'selling_price', type: 'number' },
        { name: 'supplier',      type: 'string', isOptional: true },
        { name: 'warehouse',     type: 'string', isOptional: true },
        { name: 'location',      type: 'string', isOptional: true },
        { name: 'image_url',     type: 'string', isOptional: true },
        { name: 'low_stock_threshold', type: 'number' },
        { name: 'server_id',     type: 'string', isOptional: true },
        { name: 'business_name', type: 'string', isOptional: true },
        { name: 'created_at',    type: 'number' },
      ]
    }),
    tableSchema({
      name: 'transactions',
      columns: [
        { name: 'product_id',   type: 'string', isIndexed: true },
        { name: 'product_name', type: 'string' },
        { name: 'type',         type: 'string' }, // added|removed|sold|returned
        { name: 'quantity',     type: 'number' },
        { name: 'note',         type: 'string', isOptional: true },
        { name: 'by_user',      type: 'string' },
        { name: 'server_id',    type: 'string', isOptional: true },
        { name: 'business_name', type: 'string', isOptional: true },
        { name: 'created_at',   type: 'number' },
      ]
    }),
  ]
})
