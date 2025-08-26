# Test Runner Script for Unified UID System

Write-Host "🧪 Starting Unified UID System Tests..."
Write-Host ""

# Ensure server is running
Write-Host "1. Testing server availability..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/debug/whoami" -Method Get -UseBasicParsing
    Write-Host "✅ Server is running and responding"
} catch {
    Write-Host "❌ Server not responding. Please run 'npm run dev' first."
    exit 1
}

Write-Host ""
Write-Host "2. Running automated tests..."
npm run test:uid

Write-Host ""
Write-Host "3. Manual verification with curl..."

# Manual test sequence
Write-Host "Testing UID persistence with curl..."

# Clean cookies
if (Test-Path "cookies-test.txt") { Remove-Item "cookies-test.txt" }

# Test 1: Post mood
Write-Host "🎭 Test 1: Posting mood entry..."
$mood1 = curl.exe -sS -c cookies-test.txt -b cookies-test.txt -X POST -H "Content-Type: application/json" -d "{\"mood\":\"test\",\"intensity\":7}" http://localhost:5000/api/mood | ConvertFrom-Json
$uid1 = $mood1.moodEntry.uid
Write-Host "   UID: $($uid1.Substring(0,20))..."

# Test 2: Check whoami
Write-Host "🔍 Test 2: Checking whoami..."
$whoami = curl.exe -sS -b cookies-test.txt http://localhost:5000/api/debug/whoami | ConvertFrom-Json
$uid2 = $whoami.uid
Write-Host "   UID: $($uid2.Substring(0,20))..."

# Test 3: Second mood
Write-Host "🎭 Test 3: Posting second mood entry..."
$mood2 = curl.exe -sS -b cookies-test.txt -X POST -H "Content-Type: application/json" -d "{\"mood\":\"happy\",\"intensity\":9}" http://localhost:5000/api/mood | ConvertFrom-Json
$uid3 = $mood2.moodEntry.uid
Write-Host "   UID: $($uid3.Substring(0,20))..."

Write-Host ""
Write-Host "🎯 VERIFICATION RESULTS:"
if ($uid1 -eq $uid2 -and $uid2 -eq $uid3) {
    Write-Host "✅ SUCCESS: All UIDs match! Unified system working."
    Write-Host "   Consistent UID: $($uid1.Substring(0,30))..."
} else {
    Write-Host "❌ FAILURE: UIDs don't match!"
    Write-Host "   Mood 1: $uid1"
    Write-Host "   Whoami: $uid2" 
    Write-Host "   Mood 2: $uid3"
    exit 1
}

# Cleanup
if (Test-Path "cookies-test.txt") { Remove-Item "cookies-test.txt" }

Write-Host ""
Write-Host "🎉 All tests passed! Unified UID system is working perfectly."