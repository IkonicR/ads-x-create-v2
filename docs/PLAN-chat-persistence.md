# Plan: Chat Image Persistence (Scalable Foundation)

## Problem Statement

Images generated in the Creative Director chat:
1. ❌ Disappear on page refresh
2. ❌ Don't appear in other browser tabs viewing the same chat
3. ✅ Appear in the Generator page (fixed in previous session)

This is a **foundational persistence bug**, not just a sync issue.

---

## 🔍 Root Cause Analysis

### Issue 1: Singular vs Plural Property Mismatch

**Cache structure** (`chatService.ts:27-36`):
```typescript
interface ChatCache {
  messages: Array<{
    attachment?: { type: string; content: string };  // ← SINGULAR
  }>;
}
```

**Database hydration** (`ChatInterface.tsx:121-122`):
```typescript
attachments: attachments.length > 0
  ? attachments.map(a => ({ type: 'image' as const, content: a.url }))  // ← PLURAL
  : undefined
```

**`updateCache()` function** (`ChatInterface.tsx:79-85`):
```typescript
messages: msgs.map(m => ({
  attachment: m.attachment  // ← Only saves SINGULAR, ignores attachments[]
})),
```

**Result:** When saving to cache, we only store `attachment` (singular). The `attachments[]` array is dropped.

---

### Issue 2: Cache Short-Circuit

**Lines 103-106:**
```typescript
if (cached?.sessionId === session.id) {
  return;  // ← EXITS EARLY, doesn't reload attachments from DB!
}
```

If the cache exists for this session, we assume it's complete and skip the database reload. But the cache might be stale or missing attachments.

---

### Issue 3: Initial Load From Cache Loses Data

**Lines 55-61:**
```typescript
return cached.messages.map(m => ({
  ...
  attachment: m.attachment  // ← Only reads SINGULAR, attachments are lost
}));
```

---

## 🏗️ Scalable Architecture (Proposed)

### Principle: **Database is Source of Truth, Cache is Optimization**

```
┌─────────────────────────────────────────────────────────────────────┐
│  SUPABASE (Source of Truth)                                         │
│  ├── chat_sessions                                                  │
│  ├── chat_messages                                                  │
│  └── chat_attachments (1-to-many per message)                       │
└─────────────────────────────────────────────────────────────────────┘
            ↑
            │ Load on mount / cross-tab signal
            ↓
┌─────────────────────────────────────────────────────────────────────┐
│  localStorage Cache (Optimization Layer)                            │
│  - Message text for instant display                                 │
│  - Session ID for identity check                                    │
│  - NOT authoritative for attachments                                │
└─────────────────────────────────────────────────────────────────────┘
            ↑
            │ BroadcastChannel (cross-tab)
            ↓
┌─────────────────────────────────────────────────────────────────────┐
│  React State (UI)                                                    │
│  - Always hydrated from DB with attachments                          │
│  - Cache used only for skeleton/optimistic display                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Proposed Changes

### Phase 1: Fix Cache Structure (Alignment)

#### [MODIFY] chatService.ts

Update `ChatCache` interface to support `attachments[]` (plural):

```diff
interface ChatCache {
    sessionId: string;
    messages: Array<{
        id: string;
        role: 'user' | 'ai';
        text: string;
        timestamp: string;
-       attachment?: { type: string; content: string };
+       attachments?: { type: string; content: string }[];
    }>;
    lastSyncedAt: string;
}
```

---

### Phase 2: Fix Cache Save/Load

#### [MODIFY] ChatInterface.tsx

**Fix `updateCache()` to save `attachments[]`:**

```diff
const updateCache = useCallback((msgs: ChatMessage[], sessId: string | null) => {
    if (!sessId) return;
    chatService.setCachedChat(business.id, {
      sessionId: sessId,
      messages: msgs.map(m => ({
        id: m.id,
        role: m.role,
        text: m.text,
        timestamp: m.timestamp.toISOString(),
-       attachment: m.attachment
+       attachments: m.attachments
      })),
      lastSyncedAt: new Date().toISOString()
    });
  }, [business.id]);
```

**Fix initial load to read `attachments[]`:**

```diff
const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const cached = chatService.getCachedChat(business.id);
    if (cached?.messages?.length) {
      return cached.messages.map(m => ({
        id: m.id,
        role: m.role,
        text: m.text,
        timestamp: new Date(m.timestamp),
-       attachment: m.attachment
+       attachments: m.attachments
      }));
    }
    return [getWelcomeMessage()];
  });
```

---

### Phase 3: Remove Cache Short-Circuit (Force DB Reload)

#### [MODIFY] ChatInterface.tsx

**Remove the premature return that skips DB reload:**

```diff
const syncWithDatabase = async () => {
    try {
      const session = await chatService.findActiveSession(business.id);
      if (!session) return;

      setSessionId(session.id);

-     // Check if cache matches this session
-     const cached = chatService.getCachedChat(business.id);
-     if (cached?.sessionId === session.id) {
-       return;  // ← THIS CAUSES THE BUG
-     }

      // Always load from DB to ensure attachments are current
      const dbMessages = await chatService.loadMessages(session.id);
      // ... rest of hydration logic
    }
  };
```

---

### Phase 4: Scalability & Future-Proofing

#### Option A: BroadcastChannel (Current - Same Browser Only)

Already implemented. Works for same-browser cross-tab sync.

#### Option B: Supabase Realtime (Recommended for Production)

Replace BroadcastChannel with Supabase Realtime subscription for true multi-device sync:

```typescript
useEffect(() => {
  const channel = supabase
    .channel('chat_attachments')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'chat_attachments', filter: `business_id=eq.${business.id}` },
      async (payload) => {
        // Reload messages when new attachment appears
        if (sessionId) {
          const dbMessages = await chatService.loadMessages(sessionId);
          const loadedMessages = await hydrateWithAttachments(dbMessages);
          setMessages(loadedMessages);
        }
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [business.id, sessionId]);
```

---

## Implementation Order

| Phase | Task | Risk | Effort |
|-------|------|------|--------|
| 1 | Fix ChatCache interface | Low | 5 min |
| 2 | Fix updateCache() and initial load | Low | 10 min |
| 3 | Remove cache short-circuit | Medium | 10 min |
| 4 | (Optional) Supabase Realtime | Medium | 30 min |

**Estimated Total:** 25-55 minutes

---

## Verification

1. **Refresh test:**
   - Generate 3 images in Chat
   - Refresh page
   - ✓ All 3 images should still be visible

2. **Cross-tab test:**
   - Open Chat in Tab A and Tab B
   - Generate image in Tab A
   - ✓ Image should appear in Tab B within 3 seconds

3. **Session recovery test:**
   - Generate images, close browser completely
   - Reopen browser, navigate to Chat
   - ✓ Images should load from database

---

## Decision Required

**Before implementing:** Do you want to go with:

**Option A:** BroadcastChannel (same-browser only, simpler, already partially implemented)  
**Option B:** Supabase Realtime (cross-device, more robust, recommended for production)
