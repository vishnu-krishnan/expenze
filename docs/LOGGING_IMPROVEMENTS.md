# Logging Improvements - Trace ID Tracking

## Overview
This document explains the logging enhancements made to support thread tracking via trace IDs and fix Logback warnings.

---

## 1. Fixed Logback Warnings

### Issues Resolved:
1. **Layout deprecated in ConsoleAppender**
   - **Old**: Used `<layout>` tag
   - **New**: Using `<encoder>` tag as recommended
   
2. **SizeAndTimeBasedFNATP deprecated**
   - **Old**: Used `TimeBasedRollingPolicy` + nested `SizeAndTimeBasedFNATP`
   - **New**: Using `SizeAndTimeBasedRollingPolicy` directly

### Additional Improvements:
- Added `maxHistory` (30 days) for automatic cleanup
- Added `totalSizeCap` (1GB) to prevent unlimited log storage

---

## 2. Trace ID for Thread Tracking

### What is a Trace ID?
A **trace ID** (also called breadcrumb ID or correlation ID) is a unique identifier assigned to each HTTP request. It appears in all log entries for that request, making it easy to trace the entire flow of a request through your application.

### Implementation

#### Components:
1. **TraceIdFilter.java** - Servlet filter that:
   - Generates a unique 8-character trace ID for each request
   - Accepts trace ID from `X-Trace-Id` header if provided
   - Stores the ID in MDC (Mapped Diagnostic Context)
   - Cleans up after request completes

2. **logback.xml** - Updated pattern to include trace ID:
   - Console: `[%magenta(%X{traceId})]` - Shows trace ID in magenta
   - File: `[%X{traceId}]` - Includes trace ID in log files

### Log Format

#### Console Output:
```
2026-01-19 15:54:21 INFO [http-nio-8080-exec-1] [a3b7c9d2] MonthPlanController: Fetching month plan for 2026-01
2026-01-19 15:54:21 DEBUG [http-nio-8080-exec-1] [a3b7c9d2] MonthPlanServiceImpl: Found 5 items for month 2026-01
2026-01-19 15:54:21 INFO [http-nio-8080-exec-1] [a3b7c9d2] MonthPlanController: Returning month plan successfully
```

#### File Output:
```
2026-01-19 15:54:21 INFO MonthPlanController [http-nio-8080-exec-1] [a3b7c9d2] Fetching month plan for 2026-01
```

### Benefits

1. **Easy Debugging**
   - Filter logs by trace ID to see all operations for a single request
   - Example: `grep "a3b7c9d2" backend.log`

2. **Multi-threaded Tracking**
   - When async operations spawn new threads, you can trace them back to the original request

3. **Production Troubleshooting**
   - Users can provide trace ID when reporting issues
   - You can quickly find all related logs

4. **Distributed Tracing Ready**
   - If/when you add microservices, trace ID can be propagated between services

### Usage Examples

#### Client-Side (Optional):
Frontend can send trace ID in header:
```javascript
fetch('/api/v1/month/2026-01', {
    headers: {
        'X-Trace-Id': 'frontend-xyz123',
        'Authorization': `Bearer ${token}`
    }
});
```

#### Server-Side:
No code changes needed! The filter automatically handles everything.

#### Log Analysis:
```bash
# Find all logs for a specific request
grep "a3b7c9d2" logs/backend.log

# Count requests per hour
grep "2026-01-19 15:" logs/backend.log | cut -d'[' -f3 | cut -d']' -f1 | sort | uniq -c

# Find slow requests (if you add timing logs)
grep "a3b7c9d2" logs/backend.log | grep "took"
```

---

## Configuration

### Logback Pattern Variables

| Variable | Description | Example Output |
|----------|-------------|----------------|
| `%d{ISO8601}` | Timestamp | `2026-01-19 15:54:21` |
| `%-5level` | Log level (padded) | `INFO ` |
| `%t` | Thread name | `http-nio-8080-exec-1` |
| `%X{traceId}` | MDC trace ID | `a3b7c9d2` |
| `%C{1}` | Class name (simple) | `MonthPlanController` |
| `%msg` | Log message | `Fetching month plan` |

### Color Codes (Console Only)
- `%blue()` - Thread name
- `%magenta()` - Trace ID
- `%yellow()` - Class name
- `%highlight()` - Error levels (red for ERROR, yellow for WARN)

---

## Migration Notes

### Before (Old Logs):
```
2026-01-19 15:54:21 INFO  [http-nio-8080-exec-1] MonthPlanController: Fetching month plan
2026-01-19 15:54:21 DEBUG [http-nio-8080-exec-2] UserController: Loading user profile
2026-01-19 15:54:21 INFO  [http-nio-8080-exec-1] MonthPlanController: Returning data
```
**Problem**: Hard to tell which logs belong to the same request.

### After (New Logs):
```
2026-01-19 15:54:21 INFO  [http-nio-8080-exec-1] [a3b7c9d2] MonthPlanController: Fetching month plan
2026-01-19 15:54:21 DEBUG [http-nio-8080-exec-2] [x9y2z1k4] UserController: Loading user profile
2026-01-19 15:54:21 INFO  [http-nio-8080-exec-1] [a3b7c9d2] MonthPlanController: Returning data
```
**Solution**: Same trace ID (`a3b7c9d2`) = Same request. Easy to track!

---

## Testing

### Start Application:
```bash
cd backend
mvn spring-boot:run
```

### Check Logs:
You should see:
- ✅ No more warnings about layout/encoder
- ✅ No more warnings about SizeAndTimeBasedFNATP
- ✅ Trace IDs appearing in brackets for each request

### Example Test Request:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8080/api/v1/profile
```

Check console output for trace ID like `[a3b7c9d2]`.

---

## Files Modified

1. **backend/src/main/resources/logback.xml**
   - Fixed deprecated configurations
   - Added trace ID to log patterns
   - Added retention policies

2. **backend/src/main/java/com/expenze/config/TraceIdFilter.java** (NEW)
   - Servlet filter for automatic trace ID generation
   - MDC management

---

## Performance Impact

- **Minimal**: UUID generation is ~1 microsecond
- **Memory**: MDC uses ThreadLocal, cleaned up after each request
- **Storage**: Adds ~12 characters per log line (`[a3b7c9d2] `)

---

## Future Enhancements

1. **Async Logging**: Consider `AsyncAppender` for high-traffic scenarios
2. **Structured Logging**: Use JSON format for better parsing
3. **Log Aggregation**: Integrate with ELK stack or Splunk
4. **Request Timing**: Add timing metrics with trace ID
5. **User Context**: Add user ID to MDC alongside trace ID

---

**Last Updated**: January 19, 2026, 3:54 PM IST
**Status**: ✅ Implemented and Ready
