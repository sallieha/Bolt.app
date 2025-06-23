import { createClient } from '@supabase/supabase-js';

// Add debugging to help identify connection issues
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase Configuration Missing:', {
    url: supabaseUrl ? 'Present' : 'Missing',
    key: supabaseKey ? 'Present' : 'Missing'
  });
  throw new Error(
    'Supabase configuration is missing. Please make sure you have clicked "Connect to Supabase" ' +
    'in the top right corner and wait for the connection to complete.'
  );
}

// Create client with automatic retries and better error handling
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'habit-tracker-auth'
  },
  global: {
    headers: { 
      'x-application-name': 'habit-tracker',
      'Content-Type': 'application/json'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Add connection health check with enhanced error handling
let isHealthy = true;
let retryCount = 0;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Check if we have network connectivity
const checkNetworkConnectivity = () => {
  return navigator.onLine;
};

// Calculate retry delay with exponential backoff and jitter
const getRetryDelay = (attempt: number) => {
  const baseDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
  const jitter = Math.random() * 1000; // Add up to 1 second of jitter
  return Math.min(baseDelay + jitter, 10000); // Cap at 10 seconds
};

const checkHealth = async () => {
  // First check network connectivity
  if (!checkNetworkConnectivity()) {
    console.warn('No network connectivity detected. Will retry when connection is restored.');
    isHealthy = false;
    return;
  }

  try {
    // Use a more reliable health check endpoint
    const { data, error } = await supabase.auth.getSession();
    
    if (!error) {
      if (!isHealthy) {
        console.log('Supabase connection restored');
      }
      isHealthy = true;
      retryCount = 0; // Reset retry count on successful connection
      return;
    }

    throw error;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const timestamp = new Date().toISOString();
    
    // Enhanced error logging
    console.error('Supabase connection error:', {
      timestamp,
      error: errorMessage,
      url: supabaseUrl,
      networkStatus: navigator.onLine ? 'online' : 'offline',
      retryAttempt: retryCount + 1,
      details: err
    });
    
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      const retryDelay = getRetryDelay(retryCount);
      console.log(`Retrying connection (attempt ${retryCount}/${MAX_RETRIES}) in ${Math.round(retryDelay/1000)}s...`);
      await delay(retryDelay);
      await checkHealth();
      return;
    }

    isHealthy = false;
    console.error('Supabase health check failed after max retries. Please check your credentials and network connection.');
  }
};

// Listen for online/offline events
window.addEventListener('online', () => {
  console.log('Network connection restored. Checking Supabase connection...');
  retryCount = 0; // Reset retry count when network is restored
  checkHealth();
});

window.addEventListener('offline', () => {
  console.warn('Network connection lost. Supabase operations will be unavailable.');
  isHealthy = false;
});

// Check health periodically (every 30 seconds)
const healthCheckInterval = setInterval(checkHealth, 30000);

// Cleanup interval on page unload
window.addEventListener('unload', () => {
  clearInterval(healthCheckInterval);
});

// Initial health check
checkHealth().catch(err => {
  console.error('Initial health check failed:', err);
});

export const getConnectionStatus = () => isHealthy;

// Export a function to manually trigger a health check
export const checkConnection = () => checkHealth();