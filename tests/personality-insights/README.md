# Enhanced Personality Insights - Test Suite

This test suite validates the fully restored personality reflection endpoint with all memory intelligence systems active.

## What Gets Tested

✅ **Endpoint Connectivity** - API is reachable and responding  
✅ **Response Structure** - All required fields present  
✅ **Data Sources** - All 9 data sources being collected  
✅ **Memory Intelligence** - Memory systems operational  
✅ **Comprehensive Profile** - 190+ personality dimensions analyzed  
✅ **Therapeutic Statistics** - Emotional journey, progress, behaviors  
✅ **Emotional Analysis** - Timeline, trends, breakthroughs  
✅ **Breakthrough Detection** - Significant moments identified  
✅ **Analysis Depth** - Psychological frameworks & analytics layers  
✅ **Personality Mirroring** - Communication & trait reflection  
✅ **Conversation Continuity** - Session tracking & follow-ups  
✅ **Reflection Summary** - Therapeutic insights & recommendations  

## Prerequisites

1. **Node.js** installed
2. **Chakrai API running** (on localhost:3001 by default)
3. **chalk** package installed for colored output

```bash
npm install chalk
```

## Running the Tests

### Basic Usage

```bash
node test-enhanced-endpoint.js
```

### With Custom Configuration

```bash
# Test against different host/port
API_HOST=example.com API_PORT=8080 node test-enhanced-endpoint.js

# Test with different user ID
TEST_USER_ID=42 node test-enhanced-endpoint.js

# Test with authentication token
AUTH_TOKEN=your-token-here node test-enhanced-endpoint.js

# All together
API_HOST=api.example.com API_PORT=3001 TEST_USER_ID=1 AUTH_TOKEN=token node test-enhanced-endpoint.js
```

### HTTPS

```bash
API_PROTOCOL=https node test-enhanced-endpoint.js
```

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `API_HOST` | localhost | API server hostname |
| `API_PORT` | 3001 | API server port |
| `API_PROTOCOL` | http | http or https |
| `TEST_USER_ID` | 1 | User ID to test with |
| `AUTH_TOKEN` | test-token | Authentication token |

## What Each Test Checks

### 1. Endpoint Connectivity
- Verifies the API is running and responding
- Checks for 200 status code
- Detects auth errors (401) or missing endpoints (404)

### 2. Response Structure
- Validates all required top-level fields exist:
  - `analysisStatus`
  - `analysisTimestamp`
  - `dataQuality`
  - `dataSources`
  - `analysisDepth`

### 3. Data Sources
- Checks all 9 data sources are being tracked:
  - Journal entries
  - Conversation messages
  - Mood data points
  - Extracted memories
  - Extracted facts
  - Semantic memories
  - Generated insights
  - Identified breakthroughs
  - Total data points

### 4. Memory Intelligence Systems
- Verifies memory processing is active
- Validates all memory system components:
  - Extracted memories count
  - Extracted facts count
  - Semantic memories count
  - Relevant insights count
  - Memory gaps identification
  - Emotional context

### 5. Comprehensive Profile
- Checks 190+ personality dimension analysis
- Validates personality profile generation
- Warns if profile is still processing

### 6. Therapeutic Statistics
- Validates statistics section contains:
  - Conversation metrics
  - Emotional journey data
  - Therapeutic progress
  - Behavioral patterns
  - Memory analytics

### 7. Emotional Journey Analysis
- Checks emotional timeline tracking
- Validates dominant mood identification
- Verifies mood trends analysis
- Confirms emotional breakthrough detection

### 8. Breakthrough Detection
- Validates breakthrough counting
- Checks recent breakthrough identification
- Verifies breakthrough pattern analysis

### 9. Analysis Depth & Frameworks
- Confirms 190+ dimensions being analyzed
- Validates 10 psychological frameworks:
  - Big Five Personality
  - Attachment Style
  - Cognitive Patterns
  - Emotional Intelligence
  - Defense Mechanisms
  - Communication Style
  - Core Values
  - Shadow Work
  - Relational Patterns
  - Existential Themes
  
- Validates 5 memory systems active:
  - Semantic Memory Service
  - Memory Analytics Service
  - Memory Retrieval Service
  - Conversation Continuity Service
  - Memory Connection Service

### 10. Mirrored Personality Profile
- Checks personality mirroring is active
- Validates key profile fields populated

### 11. Conversation Continuity
- Verifies active session tracking
- Confirms emotional tone tracking
- Validates unresolved topics tracking
- Checks follow-up suggestion generation

### 12. Reflection Summary
- Validates all reflection sections present:
  - Personality reflection
  - Emotional journey reflection
  - Therapeutic insights
  - Growth analysis
  - Therapeutic recommendations

## Understanding Test Results

### ✅ PASS
- Test completed successfully
- System component is working as expected

### ❌ FAIL
- Critical test failed
- System component may not be working
- Review the error message for details

### ⚠️ WARN
- Non-critical issue detected
- System is working but operating in degraded mode
- Typically due to insufficient data or optional features

## Test Results Output

After running, the test script outputs:

1. **Console output** - Colored, human-readable results
2. **Summary** - Pass/fail/warn counts
3. **Detailed JSON export** - Full test results for logging/parsing

Example output snippet:

```
✅ PASS: Endpoint is reachable (Status: 200)
✅ PASS: Response has field: analysisStatus
✅ PASS: Data source collected: journalEntries (Count: 25)
⚠️  WARN: Comprehensive profile (Analysis still in progress)
✅ PASS: Memory system active: extractedMemories (Items: 15)
```

## Troubleshooting

### Connection Failed
```
❌ FAIL: Endpoint connectivity
Error: ECONNREFUSED - connect ECONNREFUSED 127.0.0.1:3001
```

**Solution:** Make sure the Chakrai API is running:
```bash
npm run dev
```

### Authentication Failed
```
❌ FAIL: Authentication failed
Error: Got 401 - check AUTH_TOKEN
```

**Solution:** Verify the authentication token or user ID:
```bash
TEST_USER_ID=1 AUTH_TOKEN=valid-token node test-enhanced-endpoint.js
```

### Insufficient Data
```
⚠️  WARN: Limited data (Only 1 data points (need 3+))
```

**Solution:** This is normal for new users. The test user needs to have:
- At least 1 journal entry
- At least 1 message
- At least 1 mood entry

### Missing Memory Systems
```
⚠️  WARN: System offline: Semantic Memory Service
```

**Solution:** Check that memory services are properly imported in the endpoint file.

## Integration with CI/CD

To integrate with CI/CD pipelines:

```bash
# Run tests and exit with proper code
npm test -- node tests/personality-insights/test-enhanced-endpoint.js

# Check exit code
if [ $? -eq 0 ]; then
  echo "All tests passed!"
else
  echo "Tests failed - check output above"
  exit 1
fi
```

## Performance Expectations

- **Typical test duration:** 10-30 seconds (API calls + analysis)
- **Timeout:** 30 seconds per request
- **Expected response size:** 50-200 KB JSON

## API Endpoint Details

**Endpoint:** `GET /api/personality-insights`

**Headers Required:**
```
x-user-id: {userId}
Authorization: Bearer {token}
Content-Type: application/json
```

**Response Structure:**
```json
{
  "analysisStatus": "complete|insufficient_data|error",
  "analysisTimestamp": "ISO 8601 timestamp",
  "dataQuality": {
    "totalDataPoints": number,
    "confidence": 0-95,
    "richness": 0-100
  },
  "dataSources": {
    "journalEntries": number,
    "conversationMessages": number,
    "moodDataPoints": number,
    "extractedMemories": number,
    "extractedFacts": number,
    "semanticMemories": number,
    "generatedInsights": number,
    "identifiedBreakthroughs": number,
    "total": number
  },
  "comprehensiveProfile": {...},
  "therapeuticStatistics": {...},
  "reflectionSummary": {...},
  "memoryIntelligence": {...},
  "emotionalJourney": {...},
  "therapeuticBreakthroughs": {...},
  "therapeuticProgress": {...},
  "mirroredProfile": {...},
  "conversationContext": {...},
  "analysisDepth": {...}
}
```

## Next Steps After Testing

1. ✅ Verify all tests pass
2. Review the response structure for accuracy
3. Test with real user data
4. Monitor API performance
5. Collect user feedback on analysis quality
6. Adjust thresholds/parameters as needed

## Support

For issues with the test suite or endpoint, check:
- `.env` configuration
- Memory service imports
- Database connectivity
- API error logs

Run with verbose logging:
```bash
DEBUG=* node test-enhanced-endpoint.js
```
