/**
 * Email Verification Integration & Unit Test Suite
 *
 * Tests the complete email verification lifecycle:
 * 1. Email delivery service & template generation
 * 2. User registration with auto-generated 6-digit OTP
 * 3. Login blocking for unverified users (403 / EmailNotVerified)
 * 4. Invalid OTP rejection
 * 5. OTP resend functionality
 * 6. Successful verification & account activation
 * 7. Login success for verified users
 * 8. Automatic test data cleanup
 *
 * Usage:
 *   node test/testEmailVerification.js
 */

import db from "../config/db.js";
import {
  registerStudentService,
  loginUserService,
  verifyEmailService,
  resendVerificationService,
  deleteUserService,
} from "../services/user.service.js";
import { sendVerificationEmail } from "../services/email.service.js";
import { getUserVerificationStatus } from "../model/userModel.js";

const TEST_EMAIL = `verify_test_${Date.now()}@nexus-test.edu`;
const TEST_PASSWORD = "Password123!";

const logHeader = (title) => {
  console.log("\n=======================================================");
  console.log(`🧪 ${title}`);
  console.log("=======================================================");
};

const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASSED: ${message}`);
};

async function runEmailVerificationTests() {
  let createdUserId = null;

  try {
    logHeader("TEST 1: Email Dispatch Service & Template");
    const emailResult = await sendVerificationEmail({
      to: "sample@student.nexus.edu",
      firstName: "Alex",
      code: "849201",
      expiresMinutes: 15,
    });
    assert(emailResult !== null, "sendVerificationEmail executed successfully");
    console.log(`   Email dispatch mode: ${emailResult.mode}`);

    logHeader("TEST 2: Register Student with Verification Code Generation");
    const registrationResult = await registerStudentService({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      firstName: "Test",
      lastName: "Student",
      academicYear: "2025-2026",
      semester: "1st Semester",
      courseProgram: "BS Information Technology",
      yearLevel: "1st Year",
    });

    createdUserId = registrationResult.userId;
    assert(createdUserId > 0, `Student created with user_id: ${createdUserId}`);
    assert(registrationResult.requireVerification === true, "Registration requires email verification");

    // Verify DB state
    const userDbState = await getUserVerificationStatus(TEST_EMAIL);
    assert(userDbState.is_verified === 0 || userDbState.is_verified === false, "User is_verified is initially 0 (false)");
    assert(typeof userDbState.verification_code === "string" && userDbState.verification_code.length === 6, `6-digit OTP code generated in DB: ${userDbState.verification_code}`);
    assert(new Date(userDbState.verification_expires_at) > new Date(), "Verification code expiration is in the future");

    logHeader("TEST 3: Login Blocked for Unverified Account");
    let loginBlocked = false;
    try {
      await loginUserService(TEST_EMAIL, TEST_PASSWORD);
    } catch (err) {
      if (err.name === "EmailNotVerifiedError" || err.message.includes("Email not verified")) {
        loginBlocked = true;
      }
    }
    assert(loginBlocked, "Unverified user login is blocked with EmailNotVerifiedError");

    logHeader("TEST 4: Invalid Verification Code Rejection");
    let invalidCodeRejected = false;
    try {
      await verifyEmailService(TEST_EMAIL, "000000"); // Wrong code
    } catch (err) {
      if (err.message.includes("Invalid")) {
        invalidCodeRejected = true;
      }
    }
    assert(invalidCodeRejected, "Invalid verification code '000000' is correctly rejected");

    logHeader("TEST 5: Resend Verification Code");
    const originalCode = userDbState.verification_code;
    const resendResult = await resendVerificationService(TEST_EMAIL);
    assert(resendResult.success === true, "resendVerificationService returned success: true");

    const refreshedUserDb = await getUserVerificationStatus(TEST_EMAIL);
    assert(typeof refreshedUserDb.verification_code === "string" && refreshedUserDb.verification_code.length === 6, `New 6-digit OTP generated: ${refreshedUserDb.verification_code}`);

    logHeader("TEST 6: Successful Verification & Account Activation");
    const activeCode = refreshedUserDb.verification_code;
    const verifyResult = await verifyEmailService(TEST_EMAIL, activeCode);
    assert(verifyResult.success === true, "verifyEmailService succeeded with correct code");

    const verifiedUserDb = await getUserVerificationStatus(TEST_EMAIL);
    assert(verifiedUserDb.is_verified === 1 || verifiedUserDb.is_verified === true, "Database is_verified is now 1 (true)");
    assert(verifiedUserDb.verification_code === null, "verification_code is cleared after verification");
    assert(verifiedUserDb.email_verified_at !== null, "email_verified_at timestamp is populated");

    logHeader("TEST 7: Login Allowed for Verified Account");
    const loginUser = await loginUserService(TEST_EMAIL, TEST_PASSWORD);
    assert(loginUser.userId === createdUserId, "Verified user can successfully log in");
    assert(loginUser.email === TEST_EMAIL, "Logged in user email matches registered email");

    logHeader("ALL TESTS COMPLETED SUCCESSFULLY! 🎉");
  } catch (error) {
    console.error("\n❌ TEST SUITE FAILED WITH ERROR:", error);
    process.exitCode = 1;
  } finally {
    // Clean up test record from DB
    if (createdUserId) {
      try {
        console.log(`\n🧹 Cleaning up test user ${createdUserId}...`);
        await deleteUserService(createdUserId);
        console.log("✅ Test user cleaned up successfully.");
      } catch (cleanupErr) {
        console.warn("⚠️ Cleanup notice:", cleanupErr.message);
      }
    }
    await db.end();
  }
}

runEmailVerificationTests();
