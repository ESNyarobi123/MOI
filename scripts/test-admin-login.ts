#!/usr/bin/env tsx
/**
 * Test admin login via API directly
 * Run: npx tsx scripts/test-admin-login.ts
 */

const ADMIN_EMAIL = "admin@moidate.com";
const ADMIN_PASSWORD = "Moidate@2026";
const API_URL = process.env.API_URL || "http://localhost:3000";

async function testLogin(description: string, body: object) {
  console.log(`\n=== ${description} ===`);
  console.log("Request body:", JSON.stringify(body, null, 2));

  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-request-id": `test-${Date.now()}`
    },
    body: JSON.stringify(body)
  });

  const json = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(json, null, 2));
  return { ok: res.ok && json.ok, status: res.status, data: json };
}

async function main() {
  console.log("Testing admin login variations...\n");

  // Test 1: Exact match (like curl)
  const test1 = await testLogin("Test 1: Exact password (like curl)", {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });

  // Test 2: With spaces around password
  const test2 = await testLogin("Test 2: Password with leading/trailing space", {
    email: ADMIN_EMAIL,
    password: " " + ADMIN_PASSWORD + " "
  });

  // Test 3: With newline in password
  const test3 = await testLogin("Test 3: Password with newline", {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD + "\n"
  });

  // Test 4: Wrong password
  const test4 = await testLogin("Test 4: Wrong password", {
    email: ADMIN_EMAIL,
    password: "wrongpassword"
  });

  console.log("\n=== Summary ===");
  console.log("Test 1 (exact):", test1.ok ? "✓ PASS" : "✗ FAIL");
  console.log("Test 2 (spaces):", test2.ok ? "✓ PASS" : "✗ FAIL");
  console.log("Test 3 (newline):", test3.ok ? "✓ PASS" : "✗ FAIL");
  console.log("Test 4 (wrong):", !test4.ok ? "✓ Correctly rejected" : "✗ Should have failed");

  if (!test1.ok) {
    console.log("\n⚠️  Test 1 failed - check server logs for debug output");
    process.exit(1);
  }
}

main().catch(console.error);
