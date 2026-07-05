import json
import time
from typing import Any

from loguru import logger

from core.tools import (
    confirm_booking_tool,
    get_available_vouchers_tool,
    get_pricing_tool,
    list_active_cinemas_tool,
    list_nearest_cinemas_tool,
    list_active_movies_tool,
    list_genres_tool,
    list_schedule_dates_tool,
    search_showtimes_tool,
    suggest_seats_tool,
)

SELECTION_PREFIX = "[USER_SELECTION]"
_CACHE: dict[str, tuple[float, dict[str, Any]]] = {}


def parse_user_selection(message: str) -> dict[str, Any] | None:
    if not message or not message.strip().startswith(SELECTION_PREFIX):
        return None

    raw = message.strip()[len(SELECTION_PREFIX):].strip()
    try:
        data = json.loads(raw)
        if isinstance(data, dict) and isinstance(data.get("type"), str):
            return data
    except Exception as exc:
        logger.warning(f"Could not parse structured user selection: {exc}")
    return None


def is_user_selection(message: str) -> bool:
    return parse_user_selection(message) is not None


def _json(data: Any) -> str:
    return json.dumps(data, ensure_ascii=False)


def _decode_tool_result(value: Any) -> dict[str, Any]:
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, dict) else {}
        except Exception:
            return {}
    return value if isinstance(value, dict) else {}


def _field(data: dict[str, Any] | None, key: str, default: Any = None) -> Any:
    if not isinstance(data, dict):
        return default
    pascal = key[:1].upper() + key[1:]
    return data.get(key, data.get(pascal, default))


def _state(selection: dict[str, Any]) -> dict[str, Any]:
    state = selection.get("bookingState")
    if isinstance(state, dict):
        return state

    payload = selection.get("payload")
    if isinstance(payload, dict) and isinstance(payload.get("bookingState"), dict):
        return payload["bookingState"]

    return {}


def _payload(selection: dict[str, Any]) -> dict[str, Any]:
    payload = selection.get("payload")
    return payload if isinstance(payload, dict) else {}


def _current_user(tool_context: str) -> dict[str, Any]:
    try:
        data = json.loads(tool_context or "{}")
        user = data.get("currentUser") or data.get("CurrentUser") or {}
        return user if isinstance(user, dict) else {}
    except Exception:
        return {}


def _is_authenticated(tool_context: str, user_id: str) -> bool:
    user = _current_user(tool_context)
    auth = user.get("isAuthenticated", user.get("IsAuthenticated"))
    return bool(auth) or bool(user_id and user_id not in ["N/A", "Guest"])


def _action(action_type: str, title: str, payload: dict[str, Any]) -> str:
    return f"[UI_ACTION: {_json({'type': action_type, 'title': title, 'payload': payload})}]"


def _reply(text: str, action_type: str, title: str, payload: dict[str, Any]) -> str:
    return f"{text}\n{_action(action_type, title, payload)}"


def _showtime_params(state: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    movie = _field(state, "movie", {}) or {}
    cinema = _field(state, "cinema", {}) or {}
    genre = _field(state, "genre", {}) or {}

    return {
        "date": payload.get("date") or _field(state, "date", ""),
        "movie_id": payload.get("movieId") or _field(movie, "movieId", ""),
        "cinema_id": payload.get("cinemaId") or _field(cinema, "cinemaId", ""),
        "genre_name": payload.get("genreName") or _field(genre, "genreName", ""),
    }


async def _tool(tool: Any, args: dict[str, Any]) -> dict[str, Any]:
    return _decode_tool_result(await tool.ainvoke(args))


async def _cached_tool(name: str, tool: Any, args: dict[str, Any], ttl_seconds: float) -> dict[str, Any]:
    cache_key = f"{name}:{json.dumps(args, sort_keys=True, ensure_ascii=False)}"
    now = time.monotonic()
    cached = _CACHE.get(cache_key)
    if cached and cached[0] > now:
        return cached[1]

    result = await _tool(tool, args)
    _CACHE[cache_key] = (now + ttl_seconds, result)
    return result


async def try_booking_fast_path(
    message: str,
    tool_context: str = "",
    user_id: str = "N/A",
) -> str | None:
    selection = parse_user_selection(message)
    if selection is None:
        return None

    selection_type = selection["type"]
    payload = _payload(selection)
    state = _state(selection)

    try:
        if selection_type == "locationProvided":
            lat = float(payload.get("latitude") or 0.0)
            lng = float(payload.get("longitude") or 0.0)
            result = await _tool(list_nearest_cinemas_tool, {"latitude": lat, "longitude": lng})
            return _reply(
                "Mình tìm thấy các rạp chiếu phim gần bạn nhất.",
                "cinemaPicker",
                "Select Cinema",
                {"cinemas": result.get("cinemas", [])},
            )

        if selection_type == "bookingPathSelected":
            path = payload.get("bookingPath")
            if path == "cinemaFirst":
                result = await _cached_tool("active_cinemas", list_active_cinemas_tool, {}, 300)
                return _reply(
                    "Mình đã hiểu. Bạn chọn rạp trước nhé.",
                    "cinemaPicker",
                    "Select Cinema",
                    {"cinemas": result.get("cinemas", [])},
                )

            result = await _cached_tool("active_movies", list_active_movies_tool, {}, 300)
            return _reply(
                "Mình đã hiểu. Bạn chọn phim trước nhé.",
                "moviePicker",
                "Select Movie",
                {"movies": result.get("movies", [])},
            )

        if selection_type == "discoveryModeSelected":
            mode = payload.get("discoveryMode")
            if mode == "genreFirst":
                result = await _cached_tool("genres", list_genres_tool, {}, 300)
                return _reply(
                    "Bạn muốn lọc theo thể loại nào?",
                    "genrePicker",
                    "Select Genre",
                    {"genres": result.get("genres", [])},
                )

            cinema = _field(state, "cinema", {}) or {}
            result = await _cached_tool("schedule_dates", list_schedule_dates_tool, {"cinema_id": _field(cinema, "cinemaId", "")}, 120)
            return _reply(
                "Bạn muốn xem vào ngày nào?",
                "datePicker",
                "Select Date",
                {"dates": result.get("dates", [])},
            )

        if selection_type == "genreSelected":
            cinema = _field(state, "cinema", {}) or {}
            result = await _cached_tool("schedule_dates", list_schedule_dates_tool, {"cinema_id": _field(cinema, "cinemaId", "")}, 120)
            return _reply(
                "Mình đã ghi nhận thể loại. Bạn chọn ngày xem nhé.",
                "datePicker",
                "Select Date",
                {"dates": result.get("dates", [])},
            )

        if selection_type == "movieSelected":
            chosen_date = _field(state, "date", "")
            cinema_id = _field(state, "cinemaId", "") or _field(state, "cinema", {}).get("cinemaId", "") or payload.get("cinemaId", "")
            movie_id = payload.get("movieId", "")

            if chosen_date and cinema_id:
                format_pref = _field(state, "formatName", "") or _field(payload, "formatName", "")
                result = await _cached_tool(
                    "showtimes",
                    search_showtimes_tool,
                    {"date": chosen_date, "movie_id": movie_id, "cinema_id": cinema_id},
                    60,
                )
                showtimes = result.get("showtimes", [])
                if format_pref:
                    filtered_showtimes = [st for st in showtimes if format_pref.lower() in str(st.get("formatName", "")).lower()]
                    return _reply(
                        f"Đây là các suất chiếu định dạng {format_pref} phù hợp.",
                        "showtimePicker",
                        "Select Showtime",
                        {"mode": "time", "showtimes": filtered_showtimes},
                    )
                return _reply(
                    "Bạn muốn chọn suất theo giờ hay theo định dạng?",
                    "showtimePreferencePicker",
                    "Showtime choice",
                    {"showtimes": showtimes},
                )

            if chosen_date:
                # If date is already selected, let's search showtimes for this movie and date, then render cinemaPicker
                result = await _cached_tool(
                    "showtimes",
                    search_showtimes_tool,
                    {"date": chosen_date, "movie_id": movie_id},
                    60,
                )
                return _reply(
                    "Ngày này có các rạp sau còn suất chiếu.",
                    "cinemaPicker",
                    "Select Cinema",
                    {"cinemas": result.get("cinemas", [])},
                )

            result = await _cached_tool("schedule_dates", list_schedule_dates_tool, {"movie_id": payload.get("movieId", "")}, 120)
            return _reply(
                "Phim này đang có các ngày chiếu sau.",
                "datePicker",
                "Select Date",
                {"dates": result.get("dates", [])},
            )

        if selection_type == "dateSelected":
            params = _showtime_params(state, payload)
            result = await _cached_tool("showtimes", search_showtimes_tool, params, 60)
            showtimes = result.get("showtimes", [])
            if params.get("movie_id") and not params.get("cinema_id"):
                return _reply(
                    "Ngày này có các rạp sau còn suất chiếu.",
                    "cinemaPicker",
                    "Select Cinema",
                    {"cinemas": result.get("cinemas", [])},
                )

            if params.get("cinema_id") and not params.get("movie_id") and result.get("movies"):
                return _reply(
                    "Mình tìm thấy các phim phù hợp trong ngày này.",
                    "moviePicker",
                    "Select Movie",
                    {"movies": result.get("movies", [])},
                )

            return _reply(
                "Mình tìm thấy các suất chiếu phù hợp.",
                "showtimePicker",
                "Select Showtime",
                {"mode": "time", "showtimes": showtimes},
            )

        if selection_type == "cinemaSelected":
            params = _showtime_params(state, payload)
            format_pref = _field(state, "formatName", "") or _field(payload, "formatName", "")

            if params.get("movie_id") and params.get("date") and params.get("cinema_id"):
                result = await _cached_tool("showtimes", search_showtimes_tool, params, 60)
                showtimes = result.get("showtimes", [])
                if format_pref:
                    filtered_showtimes = [st for st in showtimes if format_pref.lower() in str(st.get("formatName", "")).lower()]
                    return _reply(
                        f"Đây là các suất chiếu định dạng {format_pref} phù hợp.",
                        "showtimePicker",
                        "Select Showtime",
                        {"mode": "time", "showtimes": filtered_showtimes},
                    )
                return _reply(
                    "Bạn muốn chọn suất theo giờ hay theo định dạng?",
                    "showtimePreferencePicker",
                    "Showtime choice",
                    {"showtimes": showtimes},
                )

            # If format is already known (from initial prompt), skip discoveryModePicker →
            # go straight to datePicker for the cinema-first path
            cinema = _field(state, "cinema", {}) or {}
            cinema_id_for_dates = _field(cinema, "cinemaId", "") or params.get("cinema_id", "")
            if format_pref and cinema_id_for_dates:
                result = await _cached_tool(
                    "schedule_dates",
                    list_schedule_dates_tool,
                    {"cinema_id": cinema_id_for_dates},
                    120,
                )
                return _reply(
                    f"Bạn muốn xem định dạng {format_pref}. Bạn chọn ngày xem nhé!",
                    "datePicker",
                    "Select Date",
                    {"dates": result.get("dates", [])},
                )

            return _reply(
                "Bạn muốn mình gợi ý theo thể loại hay theo giờ chiếu?",
                "discoveryModePicker",
                "Discovery mode",
                {
                    "options": [
                        {"value": "genreFirst", "label": "Chọn thể loại trước"},
                        {"value": "timeFirst", "label": "Chọn giờ chiếu trước"},
                    ]
                },
            )

        if selection_type == "showtimePreferenceSelected":
            params = _showtime_params(state, payload)
            params["mode"] = payload.get("mode") or _field(state, "showtimePreference", "time")
            result = await _cached_tool("showtimes", search_showtimes_tool, params, 60)
            return _reply(
                "Đây là các suất phù hợp với lựa chọn của bạn.",
                "showtimePicker",
                "Select Showtime",
                {"mode": params["mode"], "showtimes": result.get("showtimes", [])},
            )

        if selection_type == "showtimeSelected":
            schedule_id = payload.get("scheduleId")
            result = await _cached_tool("pricing", get_pricing_tool, {"schedule_id": schedule_id}, 120)
            return _reply(
                "Mình lấy bảng giá vé cho suất này rồi.",
                "segmentQuantityPicker",
                "Ticket Type & Quantity",
                {"pricing": result.get("pricing")},
            )

        if selection_type == "ticketSegmentSelected":
            showtime = _field(state, "showtime", {}) or {}
            schedule_id = _field(showtime, "scheduleId", "")
            quantity = int(payload.get("quantity") or _field(state, "quantity", 1) or 1)
            result = await _tool(suggest_seats_tool, {"schedule_id": schedule_id, "quantity": quantity})
            return _reply(
                "Mình đã gợi ý cụm ghế phù hợp cho bạn.",
                "seatSuggestion",
                "Suggested Seats",
                result,
            )

        if selection_type == "seatsSelected":
            if _is_authenticated(tool_context, user_id):
                return _reply(
                    "Bạn muốn dùng voucher theo cách nào?",
                    "voucherPicker",
                    "Voucher",
                    {"mode": "mode", "vouchers": [], "redeemableVouchers": []},
                )

            return _reply(
                "Bạn nhập thông tin nhận vé để mình tạo đơn nhé.",
                "guestContact",
                "Contact Info",
                {},
            )

        if selection_type == "voucherModeSelected":
            mode = payload.get("mode")
            if mode == "owned":
                result = await _tool(get_available_vouchers_tool, {"user_id": user_id})
                return _reply(
                    "Đây là các voucher bạn có thể áp dụng.",
                    "voucherPicker",
                    "Voucher",
                    {"mode": "owned", "vouchers": result.get("vouchers", []), "redeemableVouchers": []},
                )

            if mode == "redeem":
                return _reply(
                    "Hiện chưa có voucher đổi điểm phù hợp để hiển thị.",
                    "voucherPicker",
                    "Voucher",
                    {"mode": "redeem", "vouchers": [], "redeemableVouchers": [], "rewardPoints": 0},
                )

            return _reply(
                "Mình tóm tắt đơn hàng để bạn kiểm tra nhé.",
                "bookingSummary",
                "Booking Summary",
                {"bookingState": state},
            )

        if selection_type in ["ownedVoucherSelected", "redeemVoucherSelected", "guestContactSubmitted"]:
            return _reply(
                "Mình tóm tắt đơn hàng để bạn kiểm tra nhé.",
                "bookingSummary",
                "Booking Summary",
                {"bookingState": state},
            )

        if selection_type == "bookingConfirmed":
            showtime = _field(state, "showtime", {}) or {}
            segment = _field(state, "segment", {}) or {}
            contact = _field(state, "guestContact", {}) or {}
            user = _current_user(tool_context)
            seats = _field(state, "selectedSeats", []) or _field(state, "suggestedSeats", []) or []
            seat_ids = [_field(seat, "seatId") for seat in seats if _field(seat, "seatId")]
            voucher_id = _field(state, "voucherId", "") or ""
            result = await _tool(
                confirm_booking_tool,
                {
                    "schedule_id": _field(showtime, "scheduleId", ""),
                    "seat_ids": seat_ids,
                    "user_segment_id": _field(segment, "userSegmentId", ""),
                    "customer_email": _field(contact, "email", "") or _field(user, "email", ""),
                    "customer_name": _field(contact, "name", "") or _field(user, "name", "") or "Chatbot Customer",
                    "customer_phone": _field(contact, "phone", ""),
                    "payment_method": 0,
                    "voucher_id": voucher_id,
                },
            )
            if not result.get("ok"):
                return None
            return _reply(
                "Đơn hàng đã được tạo. Bạn thanh toán để hoàn tất nhé.",
                "paymentAction",
                "Payment",
                {"paymentUrl": result.get("paymentUrl"), "orderId": result.get("orderId")},
            )
    except Exception as exc:
        logger.warning(f"Booking fast path failed for {selection_type}: {exc}")

    return None
