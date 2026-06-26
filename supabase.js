const SUPABASE_URL = "https://drqwmmtfohrzavfszrde.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRycXdtbXRmb2hyemF2ZnN6cmRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MzMwODcsImV4cCI6MjA5ODAwOTA4N30.zeh58DFss2O_Ot2Z6V_pDNKPQQ1XyyPxtoyQEiqhblk";

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);