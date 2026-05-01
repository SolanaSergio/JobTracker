import { useState, useEffect, useCallback } from 'react';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

export function useSupabaseQuery(table, options = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { orderBy = 'created_at', ascending = false, filters = {} } = options;

  const fetch = useCallback(async () => {
    if (!isSupabaseConfigured()) { setLoading(false); return; }
    const sb = getSupabase();
    if (!sb) { setLoading(false); return; }

    setLoading(true);
    try {
      let query = sb.from(table).select('*');
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') query = query.eq(key, val);
      });
      if (orderBy) query = query.order(orderBy, { ascending });
      const { data: result, error: err } = await query;
      if (err) throw err;
      setData(result || []);
      setError(null);
    } catch (e) {
      setError(e.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [table, orderBy, ascending, JSON.stringify(filters)]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useSupabaseCrud(table) {
  const insert = async (record) => {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase not configured');
    const { data, error } = await sb.from(table).insert(record).select().single();
    if (error) throw error;
    return data;
  };

  const update = async (id, updates) => {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase not configured');
    const { data, error } = await sb.from(table).update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  };

  const remove = async (id) => {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase not configured');
    const { error } = await sb.from(table).delete().eq('id', id);
    if (error) throw error;
  };

  return { insert, update, remove };
}

export function useActivityLog() {
  const { insert } = useSupabaseCrud('activity_log');

  const log = async (action, entityType, entityId, description) => {
    try {
      await insert({ action, entity_type: entityType, entity_id: entityId, description });
    } catch (e) {
      console.warn('Activity log failed:', e);
    }
  };

  return log;
}
