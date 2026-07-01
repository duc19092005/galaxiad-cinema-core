# Групповое бронирование — Social Booking

> Многопользовательское групповое бронирование с голосованием за фильмы, выбором мест, чатом и гибкой оплатой.

## Обзор

Функция позволяет группам друзей:
1. **Создать сессию** — Один создаёт, остальные присоединяются по QR/ссылке
2. **Голосовать за фильмы** — Участники выбирают фильм
3. **Выбирать места** — В реальном времени через **WebSocket**
4. **Система пар** — Автоматическое создание пар для парных мест
5. **Голосовать за способ оплаты** — Индивидуально, за всех или парами
6. **Групповой чат** — Общение в реальном времени
7. **Оплата VNPay** — Поддержка всех 3 способов оплаты
8. **Обработка ошибок оплаты** — 3 варианта + таймер

## Frontend

### Routes
| Маршрут | Компонент | Описание |
|---|---|---|
| `/group-booking/:groupCode` | `GroupBookingPage` | Страница группового бронирования |
| `/group-booking/:groupCode/seat-selection` | `SeatSelectionPage` | Выбор мест в группе |

## Backend

### API Endpoints
| Метод | Endpoint | Описание |
|---|---|---|
| POST | `api/v1/social-booking/create` | Создать сессию |
| POST | `api/v1/social-booking/join` | Присоединиться по коду |
| POST | `api/v1/social-booking/{id}/leave` | Покинуть группу |
| GET | `api/v1/social-booking/{id}` | Детали сессии |
| POST | `api/v1/social-booking/{id}/vote-movie` | Голосовать за фильм |
| POST | `api/v1/social-booking/{id}/confirm-movie` | Подтвердить фильм |
| POST | `api/v1/social-booking/{id}/seats/select` | Выбрать места |
| POST | `api/v1/social-booking/{id}/seats/confirm` | Подтвердить места |
| POST | `api/v1/social-booking/{id}/vote-payment` | Голосовать за оплату |
| POST | `api/v1/social-booking/{id}/confirm-payment` | Подтвердить оплату |
| POST | `api/v1/social-booking/{id}/pair` | Создать пары |
| GET | `api/v1/social-booking/{id}/payment-status` | Статус оплаты |
| POST | `api/v1/social-booking/{id}/retry-payment` | Повторить оплату |

### WebSocket Endpoints
| Endpoint | Назначение |
|---|---|
| `ws/social-booking/{groupCode}` | Обновления сессии |
| `ws/social-booking/{groupCode}/chat` | Чат группы |
| `ws/social-booking/{groupCode}/payment` | Статус оплаты |

### Use Cases (18)
| Use Case | Описание |
|---|---|
| `CreateGroupSessionUseCase` | Создать сессию с уникальным кодом |
| `JoinGroupSessionUseCase` | Присоединиться к сессии |
| `VoteMovieUseCase` | Голосовать за фильм |
| `ConfirmMovieUseCase` | Подтвердить выбранный фильм |
| `SelectSeatsUseCase` | Выбрать места (WebSocket) |
| `VotePaymentMethodUseCase` | Голосовать за способ оплаты |
| `PairMembersUseCase` | Автоматическое создание пар |
| `ProcessPaymentUseCase` | Обработать платеж VNPay |
| `HandlePaymentFailureUseCase` | Обработать ошибку оплаты (3 варианта) |

### Domain Entities
| Сущность | Описание |
|---|---|
| `GroupBookingSession` | Сессия (GroupCode, Status, SelectedMovieId, PaymentMethod) |
| `GroupBookingMember` | Участник (UserId, Role, SeatId, PaymentStatus) |
| `GroupChatMessage` | Сообщение чата (SessionId, UserId, Content, Timestamp) |

### Enums
| Enum | Значения |
|---|---|
| `GroupBookingStatus` | Open, SeatsSelected, Confirming, VotingPaymentMethod, Pairing, PayingAll, PayingIndividual, PayingPair, PaymentFailed, Completed, Cancelled |
| `PaymentMethod` | Individual, HostPaysAll, Pair |

## Описание потока данных

### Создание группы → Оплата
```
Хост создаёт → POST create → Получает код и QR →
Делится ссылкой → Участники присоединяются →
Голосование за фильм → Подтверждение → Выбор мест (WebSocket) →
Подтверждение мест → Выбор способа оплаты →
Создание пар (если выбрана парная оплата) →
Оплата → WebSocket обновления → Сессия завершена
```
