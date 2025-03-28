// Simple verification test script
import { setTimeout } from 'timers/promises';

// Test constants
const TEST_USERNAME = `test_${Date.now()}`;
const PASSWORD = 'Test123!';
const FULLNAME = 'Test User';
const EMAIL = 'ferransson@gmail.com';
const PHONE = '+354 774 12 74'; // User's requested test phone number
const BASE_URL = 'http://localhost:5000';
let sessionCookie = '';

// We will parse verification codes from the logs
let EMAIL_VERIFICATION_CODE = '';
let PHONE_VERIFICATION_CODE = '';

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
    username: TEST_USERNAME,
    password: PASSWORD,
    fullName: FULLNAME,
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
    console.error('Registration failed:', error.message);
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
  
  // Get the verification code from the test endpoint
  console.log('Getting verification code from test endpoint...');
  const codes = await fetchAPI('/api/verification/test/codes');
  console.log('Verification codes:', codes);
  
  EMAIL_VERIFICATION_CODE = codes.email;
  console.log(`Using email verification code: ${EMAIL_VERIFICATION_CODE}`);
  return EMAIL_VERIFICATION_CODE;
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
  
  // Get the verification code from the test endpoint
  console.log('Getting verification code from test endpoint...');
  const codes = await fetchAPI('/api/verification/test/codes');
  console.log('Verification codes:', codes);
  
  PHONE_VERIFICATION_CODE = codes.phone;
  console.log(`Using phone verification code: ${PHONE_VERIFICATION_CODE}`);
  return PHONE_VERIFICATION_CODE;
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
    console.log('Final verification status:', JSON.stringify(status, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the tests
runTests();