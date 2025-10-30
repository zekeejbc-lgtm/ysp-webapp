# Testing Guide: Route Persistence & Frontend Caching

## 🎯 Features to Test

### 1. **Route Persistence** (Page Memory on Refresh)
### 2. **Frontend Caching** (Lightning Fast Repeat Loads)

---

## ✅ Test 1: Route Persistence

### What It Does:
- Remembers which page you were on when you refresh
- No more being kicked back to homepage after F5!

### How to Test:

1. **Login to the app** at `localhost:3000`

2. **Navigate to any page** (e.g., My Profile, Officer Search, Announcements)

3. **Press F5 or click browser refresh**

4. **Expected Result:** ✅ You should stay on the same page!
   - Before: Always went to Homepage
   - After: Stays on the page you were viewing

### Test Cases:
```
✓ Homepage → Refresh → Homepage
✓ My Profile → Refresh → My Profile  
✓ Officer Search → Refresh → Officer Search
✓ Announcements → Refresh → Announcements
✓ Attendance Dashboard → Refresh → Attendance Dashboard
✓ System Tools → Refresh → System Tools
```

### Edge Case:
- **Logout → Login again** → Should go to Homepage (not last page)

---

## ⚡ Test 2: Frontend Caching

### What It Does:
- Caches API responses in browser localStorage
- Second load is **instant** (no backend call)
- Auto-expires after set time

### How to Test:

#### Step 1: First Load (Cache MISS)
1. Open DevTools → **Console tab**
2. Navigate to **Officer Search**
3. In Console, look for:
   ```
   [Cache MISS] profiles_search_
   ```
4. Check **Network tab** → Should see API request to `/api/gas-proxy`
5. **Time it**: Should take ~2-3 seconds

#### Step 2: Second Load (Cache HIT)
1. **Refresh the page** (F5)
2. Navigate to **Officer Search** again  
3. In Console, look for:
   ```
   [Cache HIT] profiles_search_
   ```
4. Check **Network tab** → **NO** API request!
5. **Time it**: Should take ~200-500ms ⚡

### Cached Endpoints:
| Feature | Cache Key | Duration | Test Location |
|---------|-----------|----------|---------------|
| Homepage Content | `homepage_content` | 30 min | Homepage |
| Officer Search | `profiles_search_*` | 10 min | Officer Search |
| Events List | `events_all` | 5 min | Manage Events |

### Cache Test Matrix:

```
Test 1: Homepage
┌─────────────────┬──────────┬────────────┐
│ Action          │ Time     │ Network    │
├─────────────────┼──────────┼────────────┤
│ First Load      │ 2-4s     │ API Call   │
│ Refresh         │ 0.2-0.5s │ No Call ✅ │
│ Wait 30min      │ 2-4s     │ API Call   │
└─────────────────┴──────────┴────────────┘

Test 2: Officer Search  
┌─────────────────┬──────────┬────────────┐
│ Action          │ Time     │ Network    │
├─────────────────┼──────────┼────────────┤
│ First Search    │ 2-3s     │ API Call   │
│ Same Search     │ 0.2-0.5s │ No Call ✅ │
│ Different Term  │ 2-3s     │ API Call   │
│ Back to First   │ 0.2-0.5s │ No Call ✅ │
└─────────────────┴──────────┴────────────┘

Test 3: Events
┌─────────────────┬──────────┬────────────┐
│ Action          │ Time     │ Network    │
├─────────────────┼──────────┼────────────┤
│ First Load      │ 1-2s     │ API Call   │
│ Refresh         │ 0.1-0.3s │ No Call ✅ │
│ Create Event    │ -        │ Cache ⚠️   │
│ View Events     │ 1-2s     │ API Call   │
└─────────────────┴──────────┴────────────┘
Note: Creating event invalidates cache
```

---

## 🔍 Cache Inspection

### View Cache in Browser:

1. Open **DevTools** → **Application** tab
2. Expand **Local Storage** → `http://localhost:3000`
3. Look for keys starting with `cache_`:
   ```
   cache_homepage_content
   cache_events_all
   cache_profiles_search_john
   ```

### Manual Cache Stats:

Open Console and run:
```javascript
// View cache stats
const stats = JSON.parse(localStorage.getItem('cache_homepage_content'));
console.log('Cached at:', new Date(stats.timestamp));
console.log('Expires in:', stats.expiresIn / 1000, 'seconds');
console.log('Data:', stats.data);
```

---

## 🧪 Advanced Testing

### Test Cache Expiration:

1. **Load Homepage** (creates cache with 30min expiry)
2. Open Console:
   ```javascript
   // Get cache entry
   const cache = JSON.parse(localStorage.getItem('cache_homepage_content'));
   
   // Manually expire it
   cache.timestamp = Date.now() - (31 * 60 * 1000); // 31 minutes ago
   localStorage.setItem('cache_homepage_content', JSON.stringify(cache));
   ```
3. **Refresh page**
4. Should see `[Cache EXPIRED]` in console
5. New API call should be made

### Test Cache Invalidation:

1. **Load Manage Events** page
2. Console shows: `[Cache HIT] events_all`
3. **Create a new event**
4. Cache should be automatically cleared
5. **Refresh page**
6. Console shows: `[Cache MISS] events_all`
7. New API call fetches updated events

### Test Cache Size Limit:

- Browser localStorage has ~5-10MB limit
- Each cache entry is limited by size
- Old entries auto-clear when storage full
- Check Console for warnings:
  ```
  [Cache] Storage full, clearing old entries
  [Cache] Cleared 5 expired entries
  ```

---

## 📊 Performance Metrics

### Expected Improvements:

| Metric | Before | After (Cached) | Improvement |
|--------|--------|----------------|-------------|
| Homepage Load | 2-4s | 0.2-0.5s | **90% faster** |
| Officer Search | 2-3s | 0.2-0.5s | **85% faster** |
| Events List | 1-2s | 0.1-0.3s | **92% faster** |
| Page Switch | 0.5-1s | 0.1-0.2s | **80% faster** |

### How to Measure:

1. Open DevTools → **Network** tab
2. Check "Disable cache" (to test first load)
3. Navigate to page
4. Note time in "Finish" column
5. Uncheck "Disable cache"
6. Refresh page
7. Note time again
8. Calculate improvement

---

## ✅ Success Criteria

### Route Persistence:
- ✅ Refresh keeps you on current page
- ✅ Logout resets to homepage
- ✅ Works across all pages
- ✅ No errors in console

### Frontend Caching:
- ✅ Console shows Cache HIT/MISS messages
- ✅ Second load 80-90% faster
- ✅ No API calls on cached data
- ✅ Cache invalidates on data changes
- ✅ Expired cache auto-refreshes

---

## 🐛 Troubleshooting

### Route persistence not working?
- Check localStorage: `localStorage.getItem('currentPage')`
- Should see page name like `"my-profile"`
- Clear if corrupted: `localStorage.removeItem('currentPage')`

### Cache not working?
- Check Console for cache messages
- Verify localStorage has `cache_` keys
- Clear all cache: `localStorage.clear()`
- Disable browser cache in DevTools to test fresh loads

### Still seeing API calls?
- Check Network tab for actual requests
- Cache might be expired (check timestamp)
- First load always hits API
- Different search terms aren't cached

---

## 🎯 What to Report

After testing, report:

1. **Route Persistence:**
   - ✅ Works / ❌ Doesn't work
   - Which pages tested?
   - Any pages that don't persist?

2. **Caching Performance:**
   - First load time: ___ seconds
   - Cached load time: ___ seconds
   - Improvement: ___ %
   - Console shows cache messages? Y/N

3. **Any Issues:**
   - Errors in console?
   - Unexpected behavior?
   - Performance worse?

---

## 💡 Tips

- **Test in Incognito** to verify fresh cache behavior
- **Use DevTools Network throttling** to simulate slow connections
- **Check Console** for detailed cache logging
- **Compare with production** (Vercel) after deploying

