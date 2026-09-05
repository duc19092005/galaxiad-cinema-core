# Seat selection rules

At checkout (online or cashier) and when a group member confirms their seats:

- A selection contains 1–10 unique seats in the auditorium.
- Do not create a new single empty seat between two unavailable adjacent seats.
  Existing single gaps may be filled; row-edge empties remain allowed.
- A multi-seat selection must be contiguous in one row if a legal available block
  of the requested size exists anywhere in the auditorium.
- Allow split seating if no such block remains, including when all alternatives
  are occupied, held by another customer, or would create a new single-seat gap.
- Missing grid columns represent an aisle and break adjacency.
- Apply this rule per order or group member, not across all members of a social group.
- Evaluate against the current booking/hold snapshot. This is an allocation policy,
  not a guarantee of global optimal seating under concurrent requests.

Customers may add/remove seats before confirming; the existing no-new-gap rule
still applies during seat selection. Final validation runs in both frontend and
backend, including API callers such as the chatbot.

Examples: on an empty eight-seat row, A1+A6 is rejected and A4+A5 is accepted.
If only A1 and A8 remain available, A1+A8 is accepted.
If columns 2 and 4 contain seats but column 3 is an aisle, those seats are not adjacent.

Validation:
- Backend: dotnet test Cinema.Tests/Cinema.Tests.csproj --filter FullyQualifiedName~BookingSeatSelectionPolicyTests
- Frontend: npm test -- --run src/__tests__/utils/seatSelectionPolicy.test.ts

Business objective: preserve contiguous inventory for later group purchases,
while allowing remaining scattered seats to sell. No revenue uplift is claimed
without measurement.
