# Group Booking System — Social Booking

> Multi-user group booking with movie voting, seating, chat, and flexible payment options.

## Overview

The Social Booking feature allows groups of friends to:
1. **Create a group session** — One person creates, others join via QR/link
2. **Vote for movies** — Group members vote on which movie to watch
3. **Select seats** — Real-time seat selection via **WebSocket**
4. **Pair system** — Automatic pairing for couple seats
5. **Vote for payment method** — Individual, host-pays-all, or pair payment
6. **Group chat** — Real-time chat during the booking process
7. **VNPay payment** — Supports all 3 payment methods
8. **Payment failure handling** — 3 vote options + countdown timer

## Frontend

### Routes
| Route | Component | Description |
|---|---|---|
| `/group-booking/:groupCode` | `GroupBookingPage` | Main group booking page |
| `/group-booking/:groupCode/seat-selection` | `SeatSelectionPage` | Group seat selection |

### Components
- **`GroupBookingCreator`**: Create a new group session
- **`GroupBookingJoin`**: Join via QR code or invite link
- **`GroupMemberList`**: List of group members with status
- **`MovieVotingPanel`**: Vote for movies (show suggestions based on now-showing)
- **`SeatGridGroup`**: Real-time seat selection (WebSocket)
- **`PairingPanel`**: Auto-pair members for couple seats
- **`PaymentMethodVoting`**: Vote for payment method
- **`GroupChat`**: Real-time chat
- **`PaymentStatusGroup`**: Payment status for each member

### Custom Hooks
- **`useGroupBookingWs`**: WebSocket for group state
- **`useGroupChatWs`**: WebSocket for group chat
- **`useGroupPaymentWs`**: WebSocket for payment status

## Backend

### API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| POST | `api/v1/social-booking/create` | Create group session |
| POST | `api/v1/social-booking/join` | Join group by code |
| POST | `api/v1/social-booking/{id}/leave` | Leave group |
| GET | `api/v1/social-booking/{id}` | Get group session details |
| POST | `api/v1/social-booking/{id}/vote-movie` | Vote for a movie |
| GET | `api/v1/social-booking/{id}/movie-votes` | Get movie voting results |
| POST | `api/v1/social-booking/{id}/confirm-movie` | Confirm selected movie |
| POST | `api/v1/social-booking/{id}/seats/select` | Select seats |
| POST | `api/v1/social-booking/{id}/seats/confirm` | Confirm seat selection |
| POST | `api/v1/social-booking/{id}/vote-payment` | Vote for payment method |
| POST | `api/v1/social-booking/{id}/confirm-payment` | Confirm payment method |
| POST | `api/v1/social-booking/{id}/pair` | Pair members |
| GET | `api/v1/social-booking/{id}/payment-status` | Check payment status |
| POST | `api/v1/social-booking/{id}/retry-payment` | Retry failed payment |
| POST | `api/v1/social-booking/{id}/cancel` | Cancel group session |
| POST | `api/v1/social-booking/{id}/complete` | Complete session |

### WebSocket Endpoints
| Endpoint | Purpose |
|---|---|
| `ws/social-booking/{groupCode}` | Group state updates |
| `ws/social-booking/{groupCode}/chat` | Group chat messages |
| `ws/social-booking/{groupCode}/payment` | Payment status updates |

### Use Cases (18 use cases)
| Use Case | Description |
|---|---|
| `CreateGroupSessionUseCase` | Create new session with unique group code |
| `JoinGroupSessionUseCase` | Join existing session |
| `LeaveGroupSessionUseCase` | Leave session |
| `VoteMovieUseCase` | Vote for a movie |
| `ConfirmMovieUseCase` | Lock in selected movie |
| `SelectSeatsUseCase` | Select seats via WebSocket |
| `ConfirmSeatsUseCase` | Confirm seat selections |
| `VotePaymentMethodUseCase` | Vote for payment method (Individual/Host/Pair) |
| `ConfirmPaymentMethodUseCase` | Lock in payment method |
| `PairMembersUseCase` | Auto-pair members |
| `ProcessPaymentUseCase` | Process VNPay payment |
| `HandlePaymentFailureUseCase` | Handle failed payment (3 options) |
| `RetryPaymentUseCase` | Retry payment |
| `SendChatMessageUseCase` | Send chat message |
| `GetGroupChatHistoryUseCase` | Load chat history |
| `CancelGroupSessionUseCase` | Cancel entire session |
| `CompleteGroupSessionUseCase` | Mark session as completed |
| `GetGroupSessionStatusUseCase` | Get current session state |

### Domain Entities
| Entity | Description |
|---|---|
| `GroupBookingSession` | Session (GroupCode, Status, SelectedMovieId, PaymentMethod, CreatedAt) |
| `GroupBookingMember` | Member (UserId, Role, SeatId, PaymentStatus) |
| `GroupBookingSeat` | Seat reservation (SessionId, MemberId, SeatId) |
| `GroupChatMessage` | Chat message (SessionId, UserId, Content, Timestamp) |

### Enums
| Enum | Values |
|---|---|
| `GroupBookingStatus` | Open, SeatsSelected, Confirming, VotingPaymentMethod, Pairing, PayingAll, PayingIndividual, PayingPair, PaymentFailed, PaymentPartial, Completed, Cancelled |
| `PaymentMethod` | Individual, HostPaysAll, Pair |
| `PaymentStatus` | Pending, Success, Failed |
| `MemberRole` | Host, Member |

## Data Flow

### Group Creation → Payment
```
Host creates session → POST create → Get group code & QR →
Share link with friends → Members join via code →
Vote for movies → POST vote-movie → Confirm movie →
Enter seat selection → WebSocket real-time selection →
Confirm seats → Vote payment method →
Pair members (if pair payment) →
Process payments (individual/host/pair) → WebSocket status updates →
All paid → Session completed
```

### Payment Failure Handling
```
Payment fails → Status = PaymentFailed →
3 options appear + countdown timer:
  1. Retry payment (try again)
  2. Change payment method (switch to different method)
  3. Split affected seats (remove unpaid members)
→ If timer expires → Auto-cancel session
```
