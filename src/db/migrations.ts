import { schemaMigrations, addColumns } from '@nozbe/watermelondb/Schema/migrations'

export default schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: 'products',
          columns: [
            { name: 'business_name', type: 'string', isOptional: true },
          ],
        }),
        addColumns({
          table: 'transactions',
          columns: [
            { name: 'business_name', type: 'string', isOptional: true },
          ],
        }),
      ],
    },
  ],
})
