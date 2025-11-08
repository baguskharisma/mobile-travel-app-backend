#!/bin/bash

# Test Payment Proof Upload Endpoint
# This script tests the multipart form-data upload with JSON passengers field

echo "=========================================="
echo "Testing Payment Proof Upload Endpoint"
echo "=========================================="

# Replace with actual values
SCHEDULE_ID="b64af5f7-ff1d-40c0-9e47-ef75de191270"
BOOKER_PHONE="082174714419"
PICKUP_ADDRESS="Jalan Merpati"
DROPOFF_ADDRESS="Jalan Sudirman"
PASSENGERS='[{"name":"Bagus Kharisma","phone":"082174714419","seatNumber":"1"}]'
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MzEyY2Y5Ni0xNTczLTRjMTUtYWE5OC0wMTNmYzQyMDQ3NzAiLCJwaG9uZSI6Iis2MjgxMjM0NTY3ODk2Iiwicm9sZSI6IkNVU1RPTUVSIiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTc2MjYxNDk2NywiZXhwIjoxNzYyNjE4NTY3fQ.gL_wi4ANG6MaeRchWOe-_9Xod89BL9GaFVqt9ppbsTE"

# Create a test image file if not exists
if [ ! -f "test-image.png" ]; then
  echo "Creating test image..."
  # Create a 1x1 pixel PNG (base64 encoded)
  echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > test-image.png
fi

echo ""
echo "Sending request to: http://localhost:3000/api/v1/payment-proofs"
echo ""
echo "Passengers JSON: $PASSENGERS"
echo ""

# Send the request
curl -X POST http://localhost:3000/api/v1/payment-proofs \
  -H "Authorization: Bearer $TOKEN" \
  -F "scheduleId=$SCHEDULE_ID" \
  -F "bookerPhone=$BOOKER_PHONE" \
  -F "pickupAddress=$PICKUP_ADDRESS" \
  -F "dropoffAddress=$DROPOFF_ADDRESS" \
  -F "passengers=$PASSENGERS" \
  -F "paymentProof=@test-image.png" \
  -v

echo ""
echo "=========================================="
echo "Test completed"
echo "=========================================="
