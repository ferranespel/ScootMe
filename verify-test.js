// Simple verification test script
import { setTimeout } from 'timers/promises';

// Test constants
const EMAIL = 'ferransson@gmail.com';
const PHONE = '+3547741274';
const BASE_URL = 'http://localhost:5000'; // Note: Express runs on 5000 not 3000
let sessionCookie = '';

// Helper function for fetch requests
async function fetchAPI(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  // Add session cookie if we have one
  if (sessionCookie && !options.headers) {
    options.headers = { 'Cookie': sessionCookie };
  } else if (sessionCookie && options.headers) {
    options.headers = { ...options.headers, 'Cookie': sessionCookie };
  }
  
  const response = await fetch(url, options);
  
  // Save cookies from response
  const cookies = response.headers.get('set-cookie');
  if (cookies) {
    sessionCookie = cookies;
    console.log('Got new session cookie');
  }
  
  // Parse JSON response
  let data;
  try {
    data = await response.json();
  } catch (e) {
    console.log('No JSON response');
  }
  
  if (!response.ok) {
    throw new Error(data?.message || `API error: ${response.status}`);
  }
  
  return data;
}

// Test functions
async function register() {
  console.log('Registering test user...');
  const userData = {
    username: `test_${Date.now()}`,
    password: 'Test123!',
    fullName: 'Test User',
    email: EMAIL,
    phoneNumber: PHONE
  };
  
  try {
    const user = await fetchAPI('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    console.log('Registration successful!');
    return user;
  } catch (error) {
    if (error.message.includes('Username already exists')) {
      console.log('User already exists, continuing...');
      return null;
    }
    throw error;
  }
}

async function login() {
  console.log('Logging in...');
  try {
    const user = await fetchAPI('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'test_user',
        password: 'Test123!'
      })
    });
    
    console.log('Login successful!');
    return user;
  } catch (error) {
    console.error('Login failed:', error.message);
    throw error;
  }
}

async function getVerificationStatus() {
  console.log('Getting verification status...');
  const status = await fetchAPI('/api/verification/status');
  console.log('Current verification status:', JSON.stringify(status, null, 2));
  return status;
}

async function requestEmailVerification() {
  console.log('Requesting email verification...');
  await fetchAPI('/api/verification/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method: 'email' })
  });
  
  // Wait a moment for code to be processed
  await setTimeout(1000);
  
  // Get the verification code using our test endpoint
  const response = await fetchAPI(`/api/testing/verification-code?contact=${encodeURIComponent(EMAIL)}`);
  console.log(`Verification code for email: ${response.code}`);
  return response.code;
}

async function requestPhoneVerification() {
  console.log('Requesting phone verification...');
  await fetchAPI('/api/verification/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method: 'phone' })
  });
  
  // Wait a moment for code to be processed
  await setTimeout(1000);
  
  // Get the verification code using our test endpoint
  const response = await fetchAPI(`/api/testing/verification-code?contact=${encodeURIComponent(PHONE)}`);
  console.log(`Verification code for phone: ${response.code}`);
  return response.code;
}

async function verifyEmail(code) {
  console.log(`Verifying email with code: ${code}`);
  const result = await fetchAPI('/api/verification/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  
  console.log('Email verification result:', result);
  return result;
}

async function verifyPhone(code) {
  console.log(`Verifying phone with code: ${code}`);
  const result = await fetchAPI('/api/verification/phone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  
  console.log('Phone verification result:', result);
  return result;
}

// Main test function
async function runTests() {
  try {
    // Step 1: Register user
    await register();
    
    // Step 2: Get initial verification status
    let status = await getVerificationStatus();
    
    // Step 3: Verify email
    console.log('\n--- Email Verification Test ---');
    if (!status.email.verified) {
      const emailCode = await requestEmailVerification();
      await verifyEmail(emailCode);
      status = await getVerificationStatus();
      
      if (status.email.verified) {
        console.log('✅ Email verification successful!');
      } else {
        console.log('❌ Email verification failed!');
      }
    } else {
      console.log('Email already verified, skipping...');
    }
    
    // Step 4: Verify phone
    console.log('\n--- Phone Verification Test ---');
    if (!status.phone.verified) {
      const phoneCode = await requestPhoneVerification();
      await verifyPhone(phoneCode);
      status = await getVerificationStatus();
      
      if (status.phone.verified) {
        console.log('✅ Phone verification successful!');
      } else {
        console.log('❌ Phone verification failed!');
      }
    } else {
      console.log('Phone already verified, skipping...');
    }
    
    console.log('\n--- All Tests Completed ---');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the tests
runTests();