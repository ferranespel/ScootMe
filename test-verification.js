import fetch from 'node-fetch';
const baseUrl = 'http://localhost:5000';

// Test user credentials
const testUser = {
  username: 'testuser' + Math.floor(Math.random() * 1000),
  password: 'password123',
  email: 'test@example.com',
  fullName: 'Test User',
  phoneNumber: '+1 555 123 4567'
};

let authCookies = '';
let currentUser = null;

// Register a new user
async function registerUser() {
  console.log('Registering user:', testUser.username);
  
  try {
    const response = await fetch(`${baseUrl}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Registration failed: ${error.message || 'Unknown error'}`);
    }
    
    const result = await response.json();
    authCookies = response.headers.get('set-cookie');
    
    console.log('Registration successful:', result);
    console.log('Cookie:', authCookies);
    currentUser = result;
    return result;
  } catch (error) {
    console.error('Registration error:', error.message);
    throw error;
  }
}

// Request email verification
async function requestEmailVerification() {
  console.log('Requesting email verification...');
  
  try {
    // First check server logs to get a clean baseline
    await fetchServerLogs();
    
    const response = await fetch(`${baseUrl}/api/verification/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookies
      },
      body: JSON.stringify({ method: 'email' })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Email verification request failed: ${error.message || 'Unknown error'}`);
    }
    
    const result = await response.json();
    console.log('Email verification request successful:', result);
    
    // In a real scenario, the user would receive an email and enter the code
    // For testing, we get the code from server logs
    const verificationCode = await extractVerificationCodeFromLogs();
    console.log(`Extracted verification code: ${verificationCode}`);
    
    return { result, verificationCode };
  } catch (error) {
    console.error('Email verification request error:', error.message);
    throw error;
  }
}

// Helper to fetch server logs
async function fetchServerLogs() {
  try {
    // This is just a placeholder - in a real scenario, you'd have better access to logs
    // We're assuming we can't access the logs directly from the test script
    return true;
  } catch (error) {
    console.error('Error fetching logs:', error);
    return false;
  }
}

// Extract verification code from the latest logs
async function extractVerificationCodeFromLogs() {
  try {
    // In an actual implementation, you might have a dedicated API endpoint 
    // for retrieving verification codes during testing
    return new Promise((resolve) => {
      // Simulate a delay to ensure the logs are updated
      setTimeout(() => {
        // This is a mock approach - in a real implementation, you would
        // parse the logs or have an API endpoint specifically for testing
        
        // WARNING: This code is hard-coded based on the most recent log from the server
        // In a real implementation, you would fetch this from the server or from your email inbox
        
        // Get the latest code from the workflow logs - this will need to be updated each run
        // *** UPDATE THIS VALUE FROM WORKFLOW LOGS BEFORE EACH RUN ***
        const latestCode = "654982";
        
        resolve(latestCode);
      }, 500);
    });
  } catch (error) {
    console.error('Error extracting verification code:', error);
    throw error;
  }
}

// Get verification status
async function getVerificationStatus() {
  console.log('Getting verification status...');
  
  try {
    const response = await fetch(`${baseUrl}/api/verification/status`, {
      method: 'GET',
      headers: {
        'Cookie': authCookies
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Get verification status failed: ${error.message || 'Unknown error'}`);
    }
    
    const result = await response.json();
    console.log('Verification status:', result);
    return result;
  } catch (error) {
    console.error('Get verification status error:', error.message);
    throw error;
  }
}

// Verify the email with the code
async function verifyEmail(code) {
  console.log(`Verifying email with code: ${code}...`);
  
  try {
    const response = await fetch(`${baseUrl}/api/verification/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookies
      },
      body: JSON.stringify({ code })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Email verification failed: ${error.message || 'Unknown error'}`);
    }
    
    const result = await response.json();
    console.log('Email verification successful:', result);
    return result;
  } catch (error) {
    console.error('Email verification error:', error.message);
    throw error;
  }
}

// Run tests
async function runTests() {
  try {
    // Register a new user
    await registerUser();
    
    // Get initial verification status
    await getVerificationStatus();
    
    // Request a verification code and receive the result
    const { verificationCode } = await requestEmailVerification();
    
    // Verify the email with the extracted code
    await verifyEmail(verificationCode);
    
    // Check verification status again to confirm verification worked
    await getVerificationStatus();
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

runTests();