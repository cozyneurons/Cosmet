#!/bin/bash

# AishIngAnalyzer Integration Tests
# Automatically runs against the local backend server

BASE_URL="http://127.0.0.1:8000"
API_URL="${BASE_URL}/api/v1"

echo "============================================================"
echo "🚀 Starting E2E Backend Integration Tests"
echo "============================================================"

# Test 1: Health check
echo -n "Test 1: Health check... "
HEALTH_RES=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/health")
if [ "$HEALTH_RES" -eq 200 ]; then
  echo "✅ Passed (200)"
else
  echo "❌ Failed (status $HEALTH_RES)"
  exit 1
fi

# Generate unique registration email to avoid conflict
UNIQUE_SUFFIX=$(date +%s)
EMAIL="integrator_${UNIQUE_SUFFIX}@example.com"
NAME="Integration Test User"
PASSWORD="securepassword123"

# Test 2: Register user
echo -n "Test 2: Register user ($EMAIL)... "
REG_RES=$(curl -s -X POST "${API_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"name\":\"$NAME\",\"age_group\":\"26-35\",\"password\":\"$PASSWORD\"}")

if echo "$REG_RES" | grep -q "id"; then
  echo "✅ Passed"
else
  echo "❌ Failed"
  echo "Response: $REG_RES"
  exit 1
fi

# Test 3: Login user
echo -n "Test 3: Login user... "
LOGIN_RES=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$EMAIL&password=$PASSWORD")

TOKEN=$(echo "$LOGIN_RES" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  echo "✅ Passed"
else
  echo "❌ Failed to retrieve JWT access token"
  echo "Response: $LOGIN_RES"
  exit 1
fi

# Test 4: Protected GET /me
echo -n "Test 4: Retrieve authenticated user (/auth/me)... "
ME_RES=$(curl -s -X GET "${API_URL}/auth/me" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ME_RES" | grep -q "$EMAIL"; then
  echo "✅ Passed"
else
  echo "❌ Failed"
  echo "Response: $ME_RES"
  exit 1
fi

# Test 5: Analyze endpoint
echo -n "Test 5: Run compliance analysis (/analysis/analyze)... "
ANALYSIS_RES=$(curl -s -X POST "${API_URL}/analysis/analyze" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ingredients":["Water","Glycerin","Niacinamide"],"session_id":null}')

if echo "$ANALYSIS_RES" | grep -q "safety_analysis"; then
  echo "✅ Passed"
else
  echo "❌ Failed"
  echo "Response: $ANALYSIS_RES"
  exit 1
fi

echo "============================================================"
echo "🎉 All backend integration tests passed successfully!"
echo "============================================================"
exit 0
