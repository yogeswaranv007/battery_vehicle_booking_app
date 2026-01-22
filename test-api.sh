#!/bin/bash

# Test script for Battery Vehicle Booking System

echo "========================================="
echo "Testing Battery Vehicle Booking System"
echo "========================================="
echo ""

# Admin login
echo "1. Testing Admin Login..."
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bitsathy.ac.in","password":"Admin@123"}')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Admin login failed"
  echo "Response: $ADMIN_RESPONSE"
  exit 1
else
  echo "✅ Admin login successful"
fi

# Get locations
echo ""
echo "2. Getting all locations..."
LOCATIONS=$(curl -s -X GET http://localhost:5000/api/admin/locations \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "✅ Locations: $(echo $LOCATIONS | grep -o '"name":"[^"]*' | wc -l) locations found"

# Create a new location
echo ""
echo "3. Creating a new location..."
LOC_RESPONSE=$(curl -s -X POST http://localhost:5000/api/admin/locations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"Testing Location","description":"For testing purposes"}')

if echo $LOC_RESPONSE | grep -q "Testing Location"; then
  echo "✅ Location created successfully"
else
  echo "⚠️  Location creation response: $LOC_RESPONSE"
fi

# Student login
echo ""
echo "4. Testing Student Login..."
STUDENT_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@bitsathy.ac.in","password":"Student@123"}')

STUDENT_TOKEN=$(echo $STUDENT_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$STUDENT_TOKEN" ]; then
  echo "⚠️  Student may not exist yet (this is expected if not registered)"
else
  echo "✅ Student login successful"
fi

# Get available locations for booking
echo ""
echo "5. Getting available locations for student booking form..."
LOC_LIST=$(curl -s -X GET http://localhost:5000/api/bookings/locations/list)
LOC_COUNT=$(echo $LOC_LIST | grep -o '"name":"[^"]*' | wc -l)
echo "✅ Found $LOC_COUNT locations for dropdown"

echo ""
echo "========================================="
echo "Testing Complete!"
echo "========================================="
