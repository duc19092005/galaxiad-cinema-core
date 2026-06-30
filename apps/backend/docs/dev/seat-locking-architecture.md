# Seat Locking Architecture — Design Decision Record

> **Document Status:** Completed (V1)
> **Last Updated:** 2026-06-30

---

## 1. Problem Statement

We need a **real-time seat locking mechanism** for the cinema booking flow. When a customer selects seats and starts checkout, those seats must be temporarily reserved so that other customers cannot select them. The mechanism must:

1. **Lock instantly** — other users see the seat as occupied immediately
2. **Auto-release** — seats unlock if payment is not completed within a timeout
3. **Handle disconnects** — browser tab closes → seats are released
4. **Be simple to maintain** — avoid over-engineering for a temporary lock

---

## 2. Considered Options

### Option A: SSE + HTTP POST ✅ (Selected)

- **Server → Client:** SSE (Server-Sent Events) — native browser API, one-way push
- **Client → Server:** HTTP POST — standard REST API
- **State:** In-memory (ConcurrentDictionary in Singleton)

### Option B: SignalR (WebSocket)

- Full-duplex communication channel
- Requires WebSocket negotiation with fallback transports
- Needs Redis backplane for multi-instance scaling

### Option C: Polling (setInterval)

- Frontend polls server every X seconds for lock state
- Simple to implement but wasteful (redundant network calls)
- Delayed updates (no real-time)

### Option D: Database-based locking

- Lock state stored in SQL Server
- Most reliable but slowest (database round-trip for every lock/unlock)
- DB connection pool exhaustion risk

---

## 3. Decision: SSE + HTTP POST

### Why we chose this

| Criteria | SSE + POST | SignalR | Polling | DB Lock |
|---------|-----------|---------|---------|---------|
| Real-time | ✅ Instant | ✅ Instant | ❌ Delayed | ❌ Slow |
| Complexity | ✅ Low | ❌ High | ✅ Low | ❌ Medium |
| Auto-reconnect | ✅ Built-in | ⚠️ Manual | ✅ Natural | N/A |
| CDN friendly | ✅ Yes | ⚠️ Partial | ✅ Yes | ✅ Yes |
| State persistence | ⚠️ RAM only | ⚠️ RAM only | ⚠️ DB/Redis | ✅ Reliable |
| Maintenance cost | ✅ Very low | ❌ Medium | ✅ Low | ❌ Medium |
| **Overall** | **✅ Best** | ❌ | ⚠️ | ❌ |

### Key Trade-offs Accepted

| Trade-off | Why Acceptable |
|-----------|---------------|
| **In-memory state** (lost on restart) | Locks are temporary (max 10 min). Clients reconnect automatically and receive fresh state. |
| **No HTTP-only isolation** (can't send via POST) | We use POST for lock/unlock. SSE only receives — this separation is cleaner. |
| **SSE one-directional** | Intentional — lock/unlock are discrete RESTful actions with immediate HTTP response (200/409). |

---

## 4. Architecture Overview

### Core Components

```
┌─────────────────────────────────────────────────────┐
│                    SeatSseManager                     │
│                  (Singleton Service)                   │
│                                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │  _scheduleSeatLocks                             │  │
│  │  ConcurrentDictionary<scheduleId,               │  │
│  │    ConcurrentDictionary<seatId, (userName, clientId)>> │
│  └────────────────────────────────────────────────┘  │
│                                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │  _scheduleSubscribers                          │  │
│  │  ConcurrentDictionary<scheduleId,               │  │
│  │    ConcurrentDictionary<subscriberId, callback>> │  │
│  └────────────────────────────────────────────────┘  │
│                                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │  _scheduleEventCounters                        │  │
│  │  ConcurrentDictionary<scheduleId, int>          │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Thread Safety

All data structures use `ConcurrentDictionary` — thread-safe by default. The `LockSeat()` method uses atomic `TryAdd` to prevent race conditions when two users attempt to lock the same seat simultaneously.

### Data Flow

```
POST /seats/lock  ──►  LockSeat() ──►  TryAdd to dictionary
                        │
                        ├─► Success? ──► BroadcastEvent("seat-locked")
                        │                    │
                        │              SSE subscribers receive update
                        │
                        └─► Fail? ──► Return 409 Conflict

SSE disconnect ──►  ReleaseSeatsByClient()
                        │
                        └─► For each seat held by client:
                              TryRemove → BroadcastEvent("seat-unlocked")

Hangfire job ────►  ReleaseSeatsForSchedule()
                        │
                        └─► For each seatId:
                              TryRemove → BroadcastEvent("seat-unlocked")
```

---

## 5. SSE Protocol Details

### Event Format

```
id: {eventId}
event: {eventType}
data: {jsonPayload}

```

### Event Types

| Event | Trigger | Payload |
|-------|---------|---------|
| `initial-state` | New subscriber | `{ "lockedSeats": { "A1": "UserA" } }` |
| `seat-locked` | Someone locked a seat | `{ "seatId": "A1", "userName": "UserA", "lockedSeats": {...} }` |
| `seat-unlocked` | Someone released a seat | `{ "seatId": "A1", "lockedSeats": {...} }` |

### Heartbeat Mechanism

A comment line (`: heartbeat\n\n`) is sent every 15 seconds to prevent proxy/load balancer timeout.

### Reconnection

`EventSource` (browser native) automatically handles reconnection. When the server sends `Last-Event-ID`, the browser sends it back on reconnect, allowing the server to replay missed events. In our current V1 implementation, we provide the full `lockedSeats` state on every `initial-state` event, so reconnection always gives the latest snapshot.

---

## 6. Known Limitations (V1)

| Limitation | Impact | Future Improvement |
|-----------|--------|-------------------|
| **No Redis backplane** | Multi-instance deployment would have split state | Add Redis pub/sub for cross-instance sync |
| **No expiry on individual locks** | Lock stays in memory if client disconnects without SSE cleanup | Add background sweep job with timestamps |
| **No persistent state** | Locks lost on server restart | Acceptable (max 10 min locks) |
| **Single-box memory** | Memory scales with number of active schedules | Monitor and set concurrency limits |

---

## 7. Comparison: SSE vs SignalR (Detailed)

| Aspect | SSE | SignalR |
|--------|-----|---------|
| Transport | Native HTTP (long-poll or streams) | WebSocket + fallbacks (SSE, long-polling) |
| Browser support | All modern browsers | Requires `@microsoft/signalr` client library |
| Auto-reconnect | Built-in `EventSource` | Configurable auto-reconnect |
| Max connections (browser) | 6 per domain (HTTP/1.1) | Unlimited (WebSocket) |
| Binary data | No (text only) | Yes |
| Custom headers | No (via URL params only) | Yes (via negotiate) |
| Chunked transfer | Yes (streaming) | Yes |
| Proxy traversal | Works through HTTP proxies | Some proxies block WebSocket |
| CDN caching | Works | WebSocket upgrade fails |
| Server cost | Minimal (one thread per connection) | Higher (state machine per connection) |
| Protocol complexity | Simple (text/event-stream) | Complex (negotiation, hub protocol) |
| Client library | None (native browser API) | `@microsoft/signalr` npm package |

---

## 8. Related Files

| File | Path |
|------|------|
| `SeatSseManager` | `apps/backend/Cinema.Infrastructure/ExternalServices/Notifications/SeatSseManager.cs` |
| `BookingController` (lock/unlock/events) | `apps/backend/Cinema.Api/Controllers/Customer/Booking/BookingController.cs` |
| `SeatLockerNotificationService` | `apps/backend/Cinema.Api/Hubs/SeatLockerNotificationService.cs` |
| `PendingOrderCancellationJob` | `apps/backend/Cinema.Infrastructure/BackgroundJobs/Bookings/PendingOrderCancellationJob.cs` |
| `ISeatLockerNotificationService` | `apps/backend/Cinema.Application/Interfaces/Booking/ISeatLockerNotificationService.cs` |
| `useSeatSse` hook | `apps/frontend/src/hooks/useSeatSse.ts` |
| `bookingApi.ts` (lock/unlock client) | `apps/frontend/src/api/bookingApi.ts` |
