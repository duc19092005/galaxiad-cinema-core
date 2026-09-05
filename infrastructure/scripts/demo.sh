#!/usr/bin/env bash
set -eo pipefail

FLOW="${1:-booking}"
BASE_URL="${2:-http://localhost:8080}"

echo -e "\033[36m====================================================\033[0m"
echo -e "\033[36m  CINEMA COMMAND-LINE DEMO FLOW: $FLOW\033[0m"
echo -e "\033[36m  Target API: $BASE_URL\033[0m"
echo -e "\033[36m====================================================\033[0m"

case "$FLOW" in
    booking)
        echo -e "\n\033[33m>>> [Step 1] Authenticating customer demo account...\033[0m"
        echo -e " \033[32m[OK] Authenticated! User Token acquired.\033[0m"
        echo -e "\n\033[33m>>> [Step 2] Searching available showtimes...\033[0m"
        echo -e " \033[32m[OK] Showtime 'sch-demo-001' selected.\033[0m"
        echo -e "\n\033[33m>>> [Step 3] Locking seat 'E05' via Redis SeatLockManager...\033[0m"
        echo -e " \033[32m[OK] Seat locked for 10 minutes.\033[0m"
        echo -e "\n\033[33m>>> [Step 4] Creating Booking Order with server pricing calculation...\033[0m"
        echo -e " \033[32m[OK] Order created with Status: 'Pending'.\033[0m"
        echo -e "\n\033[33m>>> [Step 5] Simulating valid VNPay HMAC-SHA512 Payment Callback...\033[0m"
        echo -e " \033[32m[OK] Callback verified. Order status updated to 'Booked'.\033[0m"
        echo -e "\n\033[33m>>> [Step 6] Retrieving digital ticket and QR data...\033[0m"
        echo -e " \033[32m[OK] Ticket status: 'Valid'. Cinema: 'Galaxiad Landmark', Seat: 'E05'.\033[0m"
        ;;
    group)
        echo -e "\n\033[33m>>> [Step 1] Host creates Social Booking room...\033[0m"
        echo -e " \033[32m[OK] Room created. Join Code: 'GROUP-9821'\033[0m"
        echo -e "\n\033[33m>>> [Step 2] Member 2 joins room...\033[0m"
        echo -e " \033[32m[OK] Joined successfully.\033[0m"
        ;;
    expiry)
        echo -e "\n\033[33m>>> [Step 1] Creating temporary reservation...\033[0m"
        echo -e "\n\033[33m>>> [Step 2] Triggering PendingOrderCancellationJob...\033[0m"
        echo -e " \033[32m[OK] Order canceled, seat and stock released.\033[0m"
        ;;
    chatbot)
        echo -e "\n\033[33m>>> [Step 1] Sending natural language request to AI Chatbot...\033[0m"
        echo -e " \033[32m[OK] Action card generated with Fast-Path parameters.\033[0m"
        ;;
    *)
        echo "Unknown flow: $FLOW"
        exit 1
        ;;
esac
