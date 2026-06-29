# Dynamic Pricing Promotions

This document explains the automatic ticket pricing algorithm. It covers only pricing promotions, not voucher wallet, loyalty tiers, or snack combos.

## Source Of Truth

SQL Server remains the source of truth for movie schedules, formats, cinemas, seats, orders, and promotion rules.

`MovieFormatPrice` is the base ticket price. The backend calculates the final ticket price every time the booking page requests pricing and again when the order is created. The frontend only displays the calculated result.

## Data Model

`PricingPromotionEntity` stores the public/admin campaign:

- `Name`: internal campaign name.
- `Slug`: public URL slug.
- `Title`: public title shown to customers.
- `ShortDescription`, `Description`, `TermsAndConditions`: customer-facing policy text.
- `ImageUrl`: customer-facing offer image.
- `IsActive`: campaign switch.
- `ExcludeHolidays`: blocks matching when the Vietnam local schedule date exists in `HolidayCalendarEntity`.
- `StartDate`, `EndDate`: campaign validity window.

`PricingPromotionRuleEntity` stores calculation rules:

- `MovieFormatId`: optional format scope. Null means all formats.
- `CinemaId`: optional cinema scope. Null means all cinemas.
- `AuditoriumId`: optional auditorium scope. Null means all auditoriums.
- `RequiredMembershipTierId`: optional customer segment scope. Null means all segments.
- `PromotionType`: `FixedTicketPrice`, `PercentDiscount`, `FixedDiscount`, or `Surcharge`.
- `AdjustmentValue`: exact price, discount value, discount percent, or surcharge percent depending on type.
- `StartDate`, `EndDate`: optional rule-level validity window.
- `TimeFrom`, `TimeTo`: Vietnam local clock-time window.
- `DaysOfWeekMask`: bitmask for allowed Vietnam local weekdays.
- `Priority`: higher value wins for fixed-price conflicts and controls discount/surcharge order.
- `IsActive`: rule switch.

`HolidayCalendarEntity` stores Vietnam holiday dates used by campaigns with `ExcludeHolidays = true`.

## Days Of Week Bitmask

The frontend sends day arrays such as:

```json
["Monday", "Tuesday"]
```

The backend stores them as an integer bitmask:

| Day | Value |
| --- | ---: |
| Monday | 1 |
| Tuesday | 2 |
| Wednesday | 4 |
| Thursday | 8 |
| Friday | 16 |
| Saturday | 32 |
| Sunday | 64 |

Examples:

| Days | Stored Mask |
| --- | ---: |
| Monday, Tuesday | 3 |
| Tuesday, Wednesday, Thursday | 14 |
| Sunday | 64 |
| All days | 127 |

Matching uses bitwise AND:

```csharp
var matches = (rule.DaysOfWeekMask & scheduleDayMask) != 0;
```

Example: if a rule is stored as `66`, that means `Tuesday + Sunday` because `2 + 64 = 66`.

- Tuesday check: `66 & 2 = 2`, so it matches.
- Monday check: `66 & 1 = 0`, so it does not match.
- Sunday check: `66 & 64 = 64`, so it matches.

For display, the backend decodes the mask back to `["Tuesday", "Sunday"]` and `"Tue, Sun"`.

## Timezone Rule

Schedule `StartTime` is stored in UTC. Pricing rule matching uses Vietnam local time.

Flow:

1. Load schedule by `scheduleId`.
2. Convert `schedule.StartTime` from UTC to Vietnam time with the existing timezone helper.
3. Use UTC schedule time for campaign/rule date ranges because `StartDate` and `EndDate` follow the existing UTC storage rule.
4. Use the Vietnam local clock time to check `TimeFrom` and `TimeTo`.
5. Use the Vietnam local date to check holidays and weekday bitmask.

This follows `apps/backend/docs/dev/timezone_rules.md`.

## Matching Flow

For each customer segment price:

1. Start with `MovieFormatPrice`.
2. Apply existing cinema/format/customer segment surcharge, if configured.
3. Find active campaigns and rules where:
   - campaign and rule are active;
   - campaign date range matches;
   - rule date range matches;
   - holiday exclusion does not block the schedule date;
   - format/cinema/auditorium scopes match or are null;
   - membership/customer segment scope matches or is null;
   - Vietnam local weekday matches `DaysOfWeekMask`;
   - Vietnam local clock time matches `TimeFrom` and `TimeTo`.
4. If any matching rule is `FixedTicketPrice`, choose only one fixed rule:
   - highest `Priority` wins;
   - if priority ties, lowest fixed price wins.
5. If no fixed-price rule matches, apply matching discount/surcharge rules in priority order.
6. Clamp final price to at least zero.

## Promotion Types

`FixedTicketPrice` sets the ticket price to `AdjustmentValue`.

Example: base 90,000 VND, fixed price 45,000 VND -> final 45,000 VND.

`PercentDiscount` subtracts a percentage from the current price.

Example: current 90,000 VND, value 10 -> final 81,000 VND.

`FixedDiscount` subtracts a fixed VND amount.

Example: current 90,000 VND, value 20,000 -> final 70,000 VND.

`Surcharge` adds a percentage to the current price.

Example: current 90,000 VND, value 10 -> final 99,000 VND.

## Booking Snapshot

The booking page calls `GET /api/v1/public/movies/schedules/{scheduleId}/prices`.

The response includes:

- base format price;
- customer segment prices;
- price before promotion;
- promotion adjustment amount;
- final ticket price;
- applied promotion rows.

When `CreateBooking` runs, the backend recalculates pricing instead of trusting the frontend. It stores snapshots on the order/order detail so old paid orders keep their historical price even if the admin later edits or deletes a promotion.

## Admin Flow & Cartesian Product Expansion

Admin uses `/admin/pricing-promotions` to manage campaigns:

1. Create campaign info and policy text.
2. Add one or more rules.
3. Select day checkboxes. The frontend sends day names; backend stores `DaysOfWeekMask`.
4. Select format/cinema/auditorium/customer segment scopes. 
   - **Cartesian Product Generation**: To support selecting multiple formats and cinemas in the UI, the frontend sends arrays of `MovieFormatIds` and `CinemaIds`. The C# backend (`PricingPromotionHelper.BuildRules`) then expands this input into a Cartesian product, creating and persisting a separate `PricingPromotionRuleEntity` for each combination of `MovieFormatId` and `CinemaId` in the database.
5. Toggle campaign/rule active state.

## Public Flow

Customers see active campaigns on `/offers`. These are informational and auto-applied. They do not need to buy or redeem anything.

During booking, eligible automatic pricing promotions appear in the price breakdown. Voucher selection remains separate and is still validated by the backend during order creation.
