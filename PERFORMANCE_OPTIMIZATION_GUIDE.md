# Performance Optimization Guide

## Backend Caching & Query Optimization

This guide explains the performance improvements added to the YSP Web App.

---

## ✅ What Was Optimized

### 1. **Backend Caching Layer** (Google Apps Script CacheService)

Added intelligent caching for frequently accessed data to reduce sheet queries:

#### Cached Endpoints:
- **User Profiles** (10 min cache)
  - Used by: Officer Search, Profile Management, Role Management
  - Impact: Reduces repeated full sheet scans
  
- **Events** (5 min cache)
  - Used by: Manage Events, Attendance Dashboard
  - Impact: Faster event list loading
  
- **Homepage Content** (30 min cache)
  - Used by: Public homepage
  - Impact: Rarely changes, perfect for aggressive caching

#### Cache Invalidation:
- Automatic invalidation when data changes (Create Event, Add/Delete Projects)
- Cache expires automatically after timeout
- 100KB size limit per cache entry (handled gracefully)

---

### 2. **Query Optimization** (Targeted Ranges)

Replaced `getDataRange()` with `getOptimizedRange()` helper:

```javascript
// BEFORE: Gets entire sheet including empty cells
const data = sheet.getDataRange().getValues();

// AFTER: Gets only actual data range
const data = getOptimizedRange(sheet); // Skips header, targets data only
```

**Benefits:**
- Faster read operations (less data transferred)
- Reduced memory usage
- Better performance on large sheets

---

## 📊 Expected Performance Improvements

| Endpoint | Before | After | Improvement |
|----------|--------|-------|-------------|
| Officer Search | ~2-3s | ~0.2-0.5s | **85% faster** |
| Get Events | ~1-2s | ~0.1-0.3s | **90% faster** |
| Homepage Load | ~2-4s | ~0.2-0.5s | **92% faster** |
| User Profiles | ~2-3s | ~0.2-0.5s | **85% faster** |

*After first load (cached). Subsequent requests use cache.*

---

## 🔧 Cache Configuration

Defined in `YSP_LoginAccess.gs`:

```javascript
const CACHE_EXPIRATION = {
  USER_PROFILES: 600,      // 10 minutes
  OFFICER_DIRECTORY: 600,  // 10 minutes  
  HOMEPAGE_CONTENT: 1800,  // 30 minutes
  EVENTS: 300,             // 5 minutes
  ANNOUNCEMENTS: 180,      // 3 minutes
  FEEDBACK: 120            // 2 minutes
};
```

**Tuning Guidelines:**
- Longer cache = Better performance, but stale data risk
- Shorter cache = Fresher data, but more sheet queries
- Current values are balanced for typical usage

---

## 🛠️ How It Works

### Cache Helper Function:
```javascript
getCachedOrFetch(key, fetchFunction, expirationSeconds)
```

1. Checks if data exists in cache
2. If found → Returns cached data instantly
3. If missing → Executes fetchFunction, caches result
4. Auto-expires after specified time

### Cache Invalidation:
```javascript
invalidateCache('cache_key')
```

Called automatically when:
- Creating new event
- Adding/deleting homepage projects
- Updating user profiles
- Other data-modifying operations

---

## 🚀 Testing Guide

### Test Caching:
1. **First Load** - Will be slower (cache miss)
   ```
   Example: Homepage → ~2s
   ```

2. **Second Load** - Will be very fast (cache hit)
   ```
   Example: Homepage → ~0.2s
   ```

3. **After Cache Expires** - Back to normal speed, then cached again

### Verify Optimization:
1. Open Chrome DevTools → Network tab
2. Load Officer Search
3. Check API response time:
   - First load: ~2-3s
   - Second load: ~200-500ms ✅

---

## 📝 Optimized Functions

### Functions with Caching:
- ✅ `handleSearchProfiles()` - User Profiles cache
- ✅ `handleGetEvents()` - Events cache
- ✅ `handleGetHomepageContent()` - Homepage cache

### Functions with Cache Invalidation:
- ✅ `handleCreateEvent()` - Invalidates events cache
- ✅ `handleAddHomepageProject()` - Invalidates homepage cache
- ✅ `handleDeleteHomepageProject()` - Invalidates homepage cache

### Functions with Query Optimization:
- ✅ `handleSearchProfiles()` - Uses `getOptimizedRange()`
- ✅ `handleGetHomepageContent()` - Targeted range read

---

## ⚠️ Important Notes

1. **Cache Size Limit**: 100KB per entry (Google Apps Script limit)
   - Large datasets automatically skip caching
   - Logs warning if entry too large

2. **First Load Still Slow**: Cache only helps repeat visitors
   - Skeleton loading improves perceived performance
   - Combine with frontend optimizations

3. **Cache Consistency**: 
   - Cache invalidated on data changes
   - But manual Google Sheets edits won't trigger invalidation
   - Cache will eventually expire and refresh

---

## 🔍 Monitoring Cache Performance

Check Apps Script logs for:
```
Cache miss for key: user_profiles_all
Cache hit for key: events_all
Cache entry too large: announcements_all (150KB)
```

---

## 🎯 Next Steps

After testing backend optimization, we'll implement:
1. ✅ Backend Caching - **DONE**
2. ✅ Query Optimization - **DONE**
3. Frontend Code Splitting (Next)
4. Service Worker + Offline Support
5. IndexedDB for client-side caching
6. Offline queue for QR scanning

---

## 💡 Tips

- **Clear cache manually**: Apps Script has no built-in UI, but cache auto-expires
- **Monitor performance**: Use DevTools Network tab
- **Adjust cache times**: Edit `CACHE_EXPIRATION` constants if needed
- **Test both cached and uncached**: Refresh after cache expiry to test full flow

