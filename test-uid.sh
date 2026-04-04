#!/bin/bash

echo "🧪 Starting Unified UID System Tests..."
echo ""

# Test server availability
echo "1. Testing server availability..."
if curl -s http://localhost:5000/api/debug/whoami > /dev/null; then
    echo "✅ Server is running and responding"
else
    echo "❌ Server not responding. Please run 'npm run dev' first."
    exit 1
fi

echo ""
echo "2. Running manual verification with curl..."

# Clean cookies
rm -f cookies-test.txt

# Test sequence
echo "🎭 Test 1: Posting mood entry..."
MOOD1=$(curl -sS -c cookies-test.txt -b cookies-test.txt -X POST -H "Content-Type: application/json" -d '{"mood":"test","intensity":7}' http://localhost:5000/api/mood)
UID1=$(echo $MOOD1 | jq -r '.moodEntry.uid')
echo "   UID: ${UID1:0:20}..."

echo "🔍 Test 2: Checking whoami..."
WHOAMI=$(curl -sS -b cookies-test.txt http://localhost:5000/api/debug/whoami)
UID2=$(echo $WHOAMI | jq -r '.uid')
echo "   UID: ${UID2:0:20}..."

echo "🎭 Test 3: Posting second mood entry..."
MOOD2=$(curl -sS -b cookies-test.txt -X POST -H "Content-Type: application/json" -d '{"mood":"happy","intensity":9}' http://localhost:5000/api/mood)
UID3=$(echo $MOOD2 | jq -r '.moodEntry.uid')
echo "   UID: ${UID3:0:20}..."

echo ""
echo "🎯 VERIFICATION RESULTS:"
if [ "$UID1" = "$UID2" ] && [ "$UID2" = "$UID3" ]; then
    echo "✅ SUCCESS: All UIDs match! Unified system working."
    echo "   Consistent UID: ${UID1:0:30}..."
else
    echo "❌ FAILURE: UIDs don't match!"
    echo "   Mood 1: $UID1"
    echo "   Whoami: $UID2"
    echo "   Mood 2: $UID3"
    exit 1
fi

# Cleanup
rm -f cookies-test.txt

echo ""
echo "🎉 All tests passed! Unified UID system is working perfectly."