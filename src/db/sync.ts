import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from './index';
import { supabase } from '../services/supabase';

export async function sync() {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
      // If lastPulledAt is null, it's the first time syncing
      // WatermelonDB uses Unix timestamps in milliseconds, Supabase uses ISO strings
      const timestamp = lastPulledAt 
        ? new Date(lastPulledAt).toISOString() 
        : new Date(0).toISOString();

      try {
        // Fetch updated/new products from Supabase
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .gt('updated_at', timestamp);

        if (productsError) throw productsError;

        // Fetch updated/new transactions from Supabase
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .gt('updated_at', timestamp);

        if (txError) throw txError;

        // Helper to convert ISO strings from Supabase back to Unix timestamps for local SQLite
        const formatForLocal = (data: any[]) => {
          return (data || []).map((item: any) => {
            const copy = { ...item };
            if (copy.created_at) {
              copy.created_at = new Date(copy.created_at).getTime();
            }
            return copy;
          });
        };

        const formattedProducts = formatForLocal(productsData);
        const formattedTx = formatForLocal(txData);

        const changes = {
          products: {
            created: lastPulledAt ? [] : formattedProducts,
            updated: lastPulledAt ? formattedProducts : [],
            deleted: [], 
          },
          transactions: {
            created: lastPulledAt ? [] : formattedTx,
            updated: lastPulledAt ? formattedTx : [],
            deleted: [], 
          },
        };

        // Return the changes and the current timestamp from the server
        return { changes, timestamp: Date.now() };
      } catch (error) {
        console.error("Pull Sync Error:", error);
        throw error;
      }
    },
    pushChanges: async ({ changes, lastPulledAt }) => {
      try {
        // --- SYNC PRODUCTS ---
        const productChanges = (changes as any).products;
        if (productChanges) {
          const { created, updated, deleted } = productChanges;
          
          // 1. Push New Records
          if (created.length > 0) {
            // Strip out WatermelonDB internal fields like _status, _changed
            // Convert Unix millisecond timestamp to ISO string for Supabase timestamptz
            const safeCreated = created.map((r: any) => {
              const copy = { ...r };
              delete copy._status;
              delete copy._changed;
              if (copy.created_at) {
                copy.created_at = new Date(copy.created_at).toISOString();
              }
              return copy;
            });
            const { error } = await supabase.from('products').insert(safeCreated);
            if (error) throw error;
          }

          // 2. Push Updated Records
          if (updated.length > 0) {
            for (const record of updated) {
              const safeRecord = { ...record };
              delete safeRecord._status;
              delete safeRecord._changed;
              if (safeRecord.created_at) {
                safeRecord.created_at = new Date(safeRecord.created_at).toISOString();
              }
              const { error } = await supabase.from('products').update(safeRecord).eq('id', record.id);
              if (error) throw error;
            }
          }
          
          // 3. Push Deleted Records (Delete by IDs)
          if (deleted.length > 0) {
             const { error } = await supabase.from('products').delete().in('id', deleted);
             if (error) throw error;
          }
        }

        // --- SYNC TRANSACTIONS ---
        const transactionChanges = (changes as any).transactions;
        if (transactionChanges) {
          const { created, updated, deleted } = transactionChanges;
          
          if (created.length > 0) {
            const safeCreated = created.map((r: any) => {
              const copy = { ...r };
              delete copy._status;
              delete copy._changed;
              if (copy.created_at) {
                copy.created_at = new Date(copy.created_at).toISOString();
              }
              return copy;
            });
            const { error } = await supabase.from('transactions').insert(safeCreated);
            if (error) throw error;
          }

          if (updated.length > 0) {
            for (const record of updated) {
              const safeRecord = { ...record };
              delete safeRecord._status;
              delete safeRecord._changed;
              if (safeRecord.created_at) {
                safeRecord.created_at = new Date(safeRecord.created_at).toISOString();
              }
              const { error } = await supabase.from('transactions').update(safeRecord).eq('id', record.id);
              if (error) throw error;
            }
          }
          
          if (deleted.length > 0) {
             const { error } = await supabase.from('transactions').delete().in('id', deleted);
             if (error) throw error;
          }
        }
      } catch (error) {
        console.error("Push Sync Error:", error);
        throw error;
      }
    },
  });
}
