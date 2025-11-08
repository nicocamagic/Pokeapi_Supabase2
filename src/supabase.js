import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://nhrardcdhxdbssqofkjk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ocmFyZGNkaHhkYnNzcW9ma2prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzQ1NDMsImV4cCI6MjA3ODExMDU0M30.6SReoIQpfuAXWrqvqjs8kvRzs_NdC7gJOCSWvqG7u8A'
);
