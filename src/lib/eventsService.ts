import { getSupabase } from './supabase';
import { CalendarEvent } from '../types';

export const addEventToFirestore = async (event: CalendarEvent) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return;

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;
    
    await supabase
      .from('events')
      .insert([{ ...event, ownerId: userId }]);
  } catch (e) {
    console.warn("Supabase add failed", e);
  }
};

export const updateEventInFirestore = async (id: string, updates: Partial<CalendarEvent>) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return;

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;

    await supabase
      .from('events')
      .update({ ...updates, ownerId: userId })
      .eq('id', id);
  } catch (e) {
    console.warn("Supabase update failed", e);
  }
};

export const deleteEventFromFirestore = async (id: string) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return;

    await supabase
      .from('events')
      .delete()
      .eq('id', id);
  } catch (e) {
    console.warn("Supabase delete failed", e);
  }
};

export const deleteEventsBatchFromFirestore = async (ids: string[]) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return;
    if (ids.length === 0) return;

    await supabase
      .from('events')
      .delete()
      .in('id', ids);
  } catch (e) {
    console.warn("Supabase bulk delete failed", e);
  }
};
