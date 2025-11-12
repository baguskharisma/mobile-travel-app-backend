/**
 * Twilio Credentials Test Script
 *
 * This script verifies your Twilio credentials and tests WhatsApp connectivity.
 * Run: node scripts/test-twilio.js
 */

require('dotenv').config();
const twilio = require('twilio');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log('\n' + '='.repeat(60));
  log(message, colors.bright + colors.cyan);
  console.log('='.repeat(60) + '\n');
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

async function testTwilioCredentials() {
  logHeader('TWILIO CREDENTIALS TEST');

  // Step 1: Check environment variables
  logInfo('Step 1: Checking environment variables...');

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid) {
    logError('TWILIO_ACCOUNT_SID not found in .env');
    return false;
  }
  if (!authToken) {
    logError('TWILIO_AUTH_TOKEN not found in .env');
    return false;
  }
  if (!whatsappNumber) {
    logError('TWILIO_WHATSAPP_NUMBER not found in .env');
    return false;
  }

  logSuccess('All environment variables found');
  console.log('');

  // Step 2: Validate credential format
  logInfo('Step 2: Validating credential format...');

  if (!accountSid.startsWith('AC') || accountSid.length !== 34) {
    logError(`Invalid Account SID format: ${accountSid}`);
    logWarning('Account SID should start with "AC" and be 34 characters long');
    return false;
  }
  logSuccess(`Account SID format valid: ${accountSid.substring(0, 10)}...`);

  if (authToken.length !== 32) {
    logError(`Invalid Auth Token length: ${authToken.length} characters`);
    logWarning('Auth Token should be exactly 32 characters long');
    return false;
  }
  logSuccess(`Auth Token format valid: ${authToken.substring(0, 8)}...`);

  if (!whatsappNumber.startsWith('+')) {
    logError(`WhatsApp number should start with "+": ${whatsappNumber}`);
    return false;
  }
  logSuccess(`WhatsApp number format valid: ${whatsappNumber}`);
  console.log('');

  // Step 3: Test Twilio client initialization
  logInfo('Step 3: Initializing Twilio client...');

  let client;
  try {
    client = twilio(accountSid, authToken);
    logSuccess('Twilio client initialized');
  } catch (error) {
    logError(`Failed to initialize Twilio client: ${error.message}`);
    return false;
  }
  console.log('');

  // Step 4: Verify credentials with Twilio API
  logInfo('Step 4: Verifying credentials with Twilio API...');

  try {
    const account = await client.api.accounts(accountSid).fetch();
    logSuccess('Credentials verified successfully!');
    console.log('');
    logInfo('Account Details:');
    console.log(`  Account SID: ${account.sid}`);
    console.log(`  Friendly Name: ${account.friendlyName || 'N/A'}`);
    console.log(`  Status: ${account.status}`);
    console.log(`  Type: ${account.type}`);
  } catch (error) {
    logError(`Credential verification failed: ${error.message}`);
    console.log('');

    if (error.message.includes('Authenticate') || error.code === 20003) {
      logError('AUTHENTICATION FAILED!');
      console.log('');
      logWarning('Possible causes:');
      console.log('  1. Invalid Account SID');
      console.log('  2. Invalid Auth Token');
      console.log('  3. Credentials expired or revoked');
      console.log('');
      logInfo('How to fix:');
      console.log('  1. Login to Twilio Console: https://console.twilio.com');
      console.log('  2. Go to Account > Account Info');
      console.log('  3. Copy the correct Account SID and Auth Token');
      console.log('  4. Update your .env file');
      console.log('  5. Restart the application');
    }
    return false;
  }
  console.log('');

  // Step 5: Check WhatsApp Sandbox status
  logInfo('Step 5: Checking WhatsApp configuration...');

  try {
    // Try to list incoming phone numbers to verify setup
    const phoneNumbers = await client.incomingPhoneNumbers.list({ limit: 1 });

    if (phoneNumbers.length === 0) {
      logWarning('No phone numbers found in your Twilio account');
      logInfo('You are likely using WhatsApp Sandbox for testing');
      console.log('');
      logInfo('To use WhatsApp Sandbox:');
      console.log('  1. Open WhatsApp on your phone');
      console.log(`  2. Send a message to: ${whatsappNumber}`);
      console.log('  3. Message content: join <your-sandbox-code>');
      console.log('  4. Wait for confirmation');
      console.log('  5. Your phone number is now authorized');
      console.log('');
      logWarning('Note: Sandbox authorization expires after 3 days of inactivity');
    } else {
      logSuccess('Phone numbers configured');
    }
  } catch (error) {
    logWarning(`Could not check phone numbers: ${error.message}`);
  }
  console.log('');

  return true;
}

async function testWhatsAppSend(testPhone) {
  if (!testPhone) {
    logWarning('No test phone number provided. Skipping send test.');
    console.log('');
    logInfo('To test sending:');
    console.log('  node scripts/test-twilio.js +6281234567890');
    return;
  }

  logHeader('WHATSAPP SEND TEST');

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

  const client = twilio(accountSid, authToken);

  logInfo(`Attempting to send test message to: ${testPhone}`);
  console.log('');

  try {
    const message = await client.messages.create({
      from: `whatsapp:${whatsappNumber}`,
      to: `whatsapp:${testPhone}`,
      body: 'Test message from Mobile Travel App\n\nIf you receive this, OTP system is working correctly! ✅',
    });

    logSuccess('Message sent successfully!');
    console.log('');
    logInfo('Message Details:');
    console.log(`  Message SID: ${message.sid}`);
    console.log(`  Status: ${message.status}`);
    console.log(`  To: ${message.to}`);
    console.log(`  From: ${message.from}`);
    console.log('');
    logSuccess('Check your WhatsApp for the test message!');
  } catch (error) {
    logError(`Failed to send message: ${error.message}`);
    console.log('');

    if (error.code === 21608) {
      logError('SANDBOX NOT JOINED!');
      console.log('');
      logInfo('Your phone number has not joined the Twilio Sandbox.');
      console.log('');
      logInfo('To join:');
      console.log('  1. Open WhatsApp');
      console.log(`  2. Send to: ${whatsappNumber}`);
      console.log('  3. Message: join <sandbox-code>');
      console.log('  4. Wait for confirmation');
      console.log('  5. Retry this test');
    } else if (error.code === 21211) {
      logError('INVALID PHONE NUMBER!');
      console.log('');
      logInfo('Use international format with country code:');
      console.log('  Example: +6281234567890');
    }
  }
  console.log('');
}

// Main execution
async function main() {
  const testPhone = process.argv[2]; // Optional test phone number from command line

  console.log('\n');
  log('╔═══════════════════════════════════════════════════════════╗', colors.bright);
  log('║       MOBILE TRAVEL APP - TWILIO CREDENTIALS TEST        ║', colors.bright);
  log('╚═══════════════════════════════════════════════════════════╝', colors.bright);
  console.log('');

  // Test credentials
  const credentialsValid = await testTwilioCredentials();

  if (!credentialsValid) {
    logError('Credentials test failed. Please fix the issues above.');
    process.exit(1);
  }

  // Test WhatsApp send if phone number provided
  if (testPhone) {
    await testWhatsAppSend(testPhone);
  } else {
    logInfo('Credentials test passed! ✅');
    console.log('');
    logInfo('To test sending a message:');
    console.log('  node scripts/test-twilio.js +6281234567890');
    console.log('');
  }

  logSuccess('All tests completed!');
  console.log('');
}

main().catch((error) => {
  console.error('');
  logError(`Unexpected error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
