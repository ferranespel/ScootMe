// Test script for verification system using real email and phone number
import fetch from 'node-fetch';

// Base URL for API requests
const baseUrl = 'http://localhost:3000';

// Store auth cookie for authenticated requests
let authCookies = '';

// Test email and phone number
const testEmail = 'ferransson@gmail.com';
const testPhone = '+354 774 12 74';

// Register a new user with the provided email and phone
async function registerUser() {
  const username = 'ferransson_test';
  console.log(`Registering user: ${username}`);
  
  try {
    const response = await fetch(`${baseUrl}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        password: 'Test123!',
        fullName: 'Ferransson Test',
        email: testEmail,
        phoneNumber: testPhone
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Registration failed: ${error.message || 'Unknown error'}`);
    }
    
    // Store the session cookie for authenticated requests
    const cookies = response.headers.get('set-cookie');
    authCookies = cookies;
    console.log(`Cookie: ${authCookies}`);
    
    const user = await response.json();
    console.log('Registration successful:', user);
    return user;
  } catch (error) {
    console.error('Registration error:', error.message);
    throw error;
  }
}

// Get current verification status
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

// Request email verification
async function requestEmailVerification() {
  console.log('Requesting email verification...');
  
  try {
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
    
    // Get the verification code using the testing endpoint
    const code = await getVerificationCode(testEmail);
    return { result, verificationCode: code };
  } catch (error) {
    console.error('Email verification request error:', error.message);
    throw error;
  }
}

// Request phone verification
async function requestPhoneVerification() {
  console.log('Requesting phone verification...');
  
  try {
    const response = await fetch(`${baseUrl}/api/verification/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookies
      },
      body: JSON.stringify({ method: 'phone' })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Phone verification request failed: ${error.message || 'Unknown error'}`);
    }
    
    const result = await response.json();
    console.log('Phone verification request successful:', result);
    
    // Get the verification code using the testing endpoint
    const code = await getVerificationCode(testPhone);
    return { result, verificationCode: code };
  } catch (error) {
    console.error('Phone verification request error:', error.message);
    throw error;
  }
}

// Get verification code using the testing endpoint
async function getVerificationCode(contact) {
  console.log(`Getting verification code for ${contact}...`);
  
  try {
    const response = await fetch(`${baseUrl}/api/testing/verification-code?contact=${encodeURIComponent(contact)}`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Get verification code failed: ${error.message || 'Unknown error'}`);
    }
    
    const result = await response.json();
    console.log('Retrieved verification code:', result.code);
    return result.code;
  } catch (error) {
    console.error('Get verification code error:', error.message);
    throw error;
  }
}

// Verify email with code
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

// Verify phone with code
async function verifyPhone(code) {
  console.log(`Verifying phone with code: ${code}...`);
  
  try {
    const response = await fetch(`${baseUrl}/api/verification/phone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookies
      },
      body: JSON.stringify({ code })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Phone verification failed: ${error.message || 'Unknown error'}`);
    }
    
    const result = await response.json();
    console.log('Phone verification successful:', result);
    return result;
  } catch (error) {
    console.error('Phone verification error:', error.message);
    throw error;
  }
}

// Run email verification test
async function testEmailVerification() {
  try {
    console.log('\n=== TESTING EMAIL VERIFICATION ===\n');
    
    // Register test user if needed
    await registerUser();
    
    // Get initial verification status
    await getVerificationStatus();
    
    // Request email verification
    const { verificationCode } = await requestEmailVerification();
    
    // Verify email with the code
    await verifyEmail(verificationCode);
    
    // Check verification status again to confirm it worked
    const finalStatus = await getVerificationStatus();
    
    if (finalStatus.email.verified) {
      console.log('\n✅ EMAIL VERIFICATION TEST PASSED!\n');
    } else {
      console.log('\n❌ EMAIL VERIFICATION TEST FAILED: Email still not verified\n');
    }
  } catch (error) {
    console.error('\n❌ EMAIL VERIFICATION TEST FAILED:', error.message, '\n');
  }
}

// Run phone verification test
async function testPhoneVerification() {
  try {
    console.log('\n=== TESTING PHONE VERIFICATION ===\n');
    
    // Get initial verification status (use existing session)
    await getVerificationStatus();
    
    // Request phone verification
    const { verificationCode } = await requestPhoneVerification();
    
    // Verify phone with the code
    await verifyPhone(verificationCode);
    
    // Check verification status again to confirm it worked
    const finalStatus = await getVerificationStatus();
    
    if (finalStatus.phone.verified) {
      console.log('\n✅ PHONE VERIFICATION TEST PASSED!\n');
    } else {
      console.log('\n❌ PHONE VERIFICATION TEST FAILED: Phone still not verified\n');
    }
  } catch (error) {
    console.error('\n❌ PHONE VERIFICATION TEST FAILED:', error.message, '\n');
  }
}

// Run tests
async function runTests() {
  try {
    // First test email verification
    await testEmailVerification();
    
    // Then test phone verification (uses the same session)
    await testPhoneVerification();
    
    console.log('\n=== ALL TESTS COMPLETED ===\n');
  } catch (error) {
    console.error('Tests failed:', error.message);
  }
}

// Start the tests
runTests();