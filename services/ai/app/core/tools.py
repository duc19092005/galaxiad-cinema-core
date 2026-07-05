import json
from typing import Any

import httpx
from langchain_core.tools import tool
from loguru import logger

from config import BACKEND_API_URL


def _json_result(payload: dict[str, Any]) -> str:
    return json.dumps(payload, ensure_ascii=False)


def _response_data(response_json: dict[str, Any]) -> Any:
    return response_json.get("data", response_json.get("Data", {}))


def _field(data: dict[str, Any], camel_name: str, default: Any = None) -> Any:
    pascal_name = camel_name[:1].upper() + camel_name[1:]
    return data.get(camel_name, data.get(pascal_name, default))


async def _get_backend(path: str, params: dict[str, Any] | None = None, timeout: float = 10.0) -> dict[str, Any]:
    url = f"{BACKEND_API_URL}{path}"
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.get(url, params={key: value for key, value in (params or {}).items() if value not in [None, ""]})

    response_json = response.json() if response.content else {}
    if response.status_code >= 400:
        return {
            "ok": False,
            "statusCode": response.status_code,
            "message": response_json.get("message") or response_json.get("Message") or "Backend request failed.",
            "data": None,
        }

    return {
        "ok": True,
        "statusCode": response.status_code,
        "message": response_json.get("message") or response_json.get("Message") or "OK",
        "data": _response_data(response_json),
    }


def _normalize_movie(movie: dict[str, Any]) -> dict[str, Any]:
    return {
        "movieId": _field(movie, "movieId"),
        "movieName": _field(movie, "movieName"),
        "movieImageUrl": _field(movie, "movieImageUrl") or _field(movie, "moviePosterURL"),
        "movieDescription": _field(movie, "movieDescription", ""),
        "movieDuration": _field(movie, "movieDuration"),
        "movieGenres": _field(movie, "movieGenres", []) or _field(movie, "movieCategoryInfos", []),
    }


def _normalize_cinema(cinema: dict[str, Any]) -> dict[str, Any]:
    return {
        "cinemaId": _field(cinema, "cinemaId"),
        "cinemaName": _field(cinema, "cinemaName"),
        "cinemaCity": _field(cinema, "cinemaCity", ""),
        "cinemaLocation": _field(cinema, "cinemaLocation", ""),
        "latitude": _field(cinema, "latitude"),
        "longitude": _field(cinema, "longitude"),
        "distanceInKm": _field(cinema, "distanceInKm"),
    }


def _normalize_seat(seat: dict[str, Any]) -> dict[str, Any]:
    return {
        "seatId": _field(seat, "seatId"),
        "seatNumber": _field(seat, "seatNumber") or _field(seat, "seatName"),
        "seatName": _field(seat, "seatName") or _field(seat, "seatNumber"),
        "rowIndex": _field(seat, "rowIndex", _field(seat, "coordY", 0)),
        "colIndex": _field(seat, "colIndex", _field(seat, "coordX", 0)),
        "isBooked": _field(seat, "isBooked", False),
        "isOccupied": _field(seat, "isOccupied", _field(seat, "isBooked", False)),
    }


def _flatten_showtimes(results: list[dict[str, Any]], genre: str = "", mode: str = "time") -> list[dict[str, Any]]:
    showtimes: list[dict[str, Any]] = []
    genre_query = genre.strip().lower()

    for movie in results:
        movie_genres = _field(movie, "movieGenres", []) or []
        if genre_query and not any(genre_query in str(item).lower() for item in movie_genres):
            continue

        for cinema in _field(movie, "cinemas", []) or []:
            for format_group in _field(cinema, "formatShowtimes", []) or []:
                for showtime in _field(format_group, "showtimes", []) or []:
                    showtimes.append({
                        "scheduleId": _field(showtime, "scheduleId"),
                        "movieId": _field(movie, "movieId"),
                        "movieName": _field(movie, "movieName"),
                        "cinemaId": _field(cinema, "cinemaId"),
                        "cinemaName": _field(cinema, "cinemaName"),
                        "cinemaLocation": _field(cinema, "cinemaLocation", ""),
                        "cinemaCity": _field(cinema, "cinemaCity", ""),
                        "formatId": _field(format_group, "formatId"),
                        "formatName": _field(format_group, "formatName"),
                        "auditoriumId": _field(showtime, "auditoriumId"),
                        "auditoriumNumber": _field(showtime, "auditoriumNumber"),
                        "startTime": _field(showtime, "startTime"),
                        "endedTime": _field(showtime, "endedTime"),
                        "movieGenres": movie_genres,
                    })

    return sorted(showtimes, key=lambda item: (item.get("startTime") or "", item.get("formatName") or "")) if mode == "time" else showtimes


@tool
async def list_active_movies_tool() -> str:
    """Return active movies that can be selected for the booking flow."""
    try:
        result = await _get_backend("/public/movies/active-movies")
        movies = [_normalize_movie(movie) for movie in (result.get("data") or [])]
        return _json_result({"ok": result["ok"], "type": "movie_list", "movies": movies})
    except Exception as exc:
        logger.error(f"Error loading active movies: {exc}")
        return _json_result({"ok": False, "type": "movie_list", "message": str(exc), "movies": []})


@tool
async def list_active_cinemas_tool() -> str:
    """Return active cinemas that can be selected for the booking flow."""
    try:
        result = await _get_backend("/public/movies/active-cinemas")
        cinemas = [_normalize_cinema(cinema) for cinema in (result.get("data") or [])]
        return _json_result({"ok": result["ok"], "type": "cinema_list", "cinemas": cinemas})
    except Exception as exc:
        logger.error(f"Error loading active cinemas: {exc}")
        return _json_result({"ok": False, "type": "cinema_list", "message": str(exc), "cinemas": []})


@tool
async def list_genres_tool() -> str:
    """Return movie genres that can be selected before filtering movies/showtimes."""
    try:
        result = await _get_backend("/public/movies/genres")
        genres = [
            {
                "genreId": _field(genre, "genreId"),
                "genreName": _field(genre, "genreName"),
                "description": _field(genre, "description", ""),
            }
            for genre in (result.get("data") or [])
        ]
        return _json_result({"ok": result["ok"], "type": "genre_list", "genres": genres})
    except Exception as exc:
        logger.error(f"Error loading genres: {exc}")
        return _json_result({"ok": False, "type": "genre_list", "message": str(exc), "genres": []})


@tool
async def list_schedule_dates_tool(movie_id: str = "", cinema_id: str = "", city: str = "") -> str:
    """Return upcoming schedule dates for a selected movie or cinema."""
    try:
        if movie_id:
            result = await _get_backend(f"/public/ScheduleDates/{movie_id}", {"city": city})
        else:
            result = await _get_backend("/public/UpcomingDates", {"city": city, "cinemaId": cinema_id})
        dates = result.get("data") or []
        return _json_result({"ok": result["ok"], "type": "date_list", "dates": dates})
    except Exception as exc:
        logger.error(f"Error loading schedule dates: {exc}")
        return _json_result({"ok": False, "type": "date_list", "message": str(exc), "dates": []})


@tool
async def search_showtimes_tool(
    date: str = "",
    movie_id: str = "",
    cinema_id: str = "",
    genre_name: str = "",
    mode: str = "time",
) -> str:
    """
    Search available showtimes by date, movie, cinema, and optional genre.
    Use mode='time' to sort by start time, or mode='format' before rendering a format-first picker.
    """
    try:
        result = await _get_backend(
            "/public/movies/search-schedules",
            {"date": date, "movieId": movie_id, "cinemaId": cinema_id},
        )
        raw_results = result.get("data") or []
        showtimes = _flatten_showtimes(raw_results, genre=genre_name, mode=mode)
        movies_by_id: dict[str, dict[str, Any]] = {}
        cinemas_by_id: dict[str, dict[str, Any]] = {}
        for movie in raw_results:
            if genre_name:
                movie_genres = _field(movie, "movieGenres", []) or []
                if not any(genre_name.lower() in str(item).lower() for item in movie_genres):
                    continue
            movie_id_value = _field(movie, "movieId")
            if movie_id_value:
                movies_by_id[movie_id_value] = _normalize_movie(movie)
            for cinema in _field(movie, "cinemas", []) or []:
                cinema_id_value = _field(cinema, "cinemaId")
                if cinema_id_value:
                    cinemas_by_id[cinema_id_value] = _normalize_cinema(cinema)

        return _json_result({
            "ok": result["ok"],
            "type": "showtime_search",
            "movies": list(movies_by_id.values()),
            "cinemas": list(cinemas_by_id.values()),
            "showtimes": showtimes,
        })
    except Exception as exc:
        logger.error(f"Error searching showtimes: {exc}")
        return _json_result({"ok": False, "type": "showtime_search", "message": str(exc), "movies": [], "cinemas": [], "showtimes": []})


@tool
async def get_pricing_tool(schedule_id: str) -> str:
    """Return ticket segment prices for a selected showtime."""
    try:
        result = await _get_backend(f"/public/movies/schedules/{schedule_id}/prices")
        pricing = result.get("data") or {}
        return _json_result({"ok": result["ok"], "type": "pricing", "pricing": pricing})
    except Exception as exc:
        logger.error(f"Error loading pricing: {exc}")
        return _json_result({"ok": False, "type": "pricing", "message": str(exc), "pricing": None})


@tool
async def get_seat_map_tool(schedule_id: str) -> str:
    """Return the full seat map for a selected showtime."""
    try:
        result = await _get_backend(f"/public/movies/schedules/{schedule_id}/seats")
        seat_map = result.get("data") or {}
        seats = [_normalize_seat(seat) for seat in (seat_map.get("seatMap") or seat_map.get("seats") or [])]
        seat_map["seatMap"] = seats
        return _json_result({"ok": result["ok"], "type": "seat_map", "seatMap": seat_map, "seats": seats})
    except Exception as exc:
        logger.error(f"Error loading seat map: {exc}")
        return _json_result({"ok": False, "type": "seat_map", "message": str(exc), "seatMap": None, "seats": []})


@tool
async def get_available_vouchers_tool(user_id: str) -> str:
    """
    Return available vouchers for a logged-in customer as structured JSON.
    Guest users must skip voucher selection.
    """
    if not user_id or user_id in ["", "N/A", "Guest"]:
        return _json_result({
            "ok": True,
            "type": "voucher_list",
            "message": "Guest user: skip voucher selection.",
            "vouchers": [],
            "isGuest": True,
        })

    url = f"{BACKEND_API_URL}/public/vouchers/available-for-user"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params={"userId": user_id})

        if response.status_code != 200:
            return _json_result({
                "ok": False,
                "type": "voucher_list",
                "message": "Could not load vouchers from backend.",
                "statusCode": response.status_code,
                "vouchers": [],
            })

        vouchers = _response_data(response.json()) or []
        normalized = [
            {
                "voucherId": _field(voucher, "voucherId"),
                "code": _field(voucher, "code") or _field(voucher, "voucherName"),
                "discountPercent": _field(voucher, "discountAmount") or _field(voucher, "voucherDiscountPercent"),
                "description": _field(voucher, "description", ""),
            }
            for voucher in vouchers
        ]

        return _json_result({
            "ok": True,
            "type": "voucher_list",
            "message": "Available vouchers loaded.",
            "vouchers": normalized,
            "bestVoucher": max(normalized, key=lambda item: item.get("discountPercent") or 0) if normalized else None,
            "isGuest": False,
        })
    except Exception as exc:
        logger.error(f"Error fetching vouchers: {exc}")
        return _json_result({
            "ok": False,
            "type": "voucher_list",
            "message": f"Voucher lookup failed: {exc}",
            "vouchers": [],
        })


@tool
async def suggest_seats_tool(schedule_id: str, quantity: int) -> str:
    """
    Suggest available seats near the configured auditorium center.
    Prefer consecutive seats in one row; fall back to individual seats nearest center.
    """
    if quantity <= 0:
        return _json_result({
            "ok": False,
            "type": "seat_suggestion",
            "message": "Quantity must be greater than zero.",
            "seats": [],
        })

    url = f"{BACKEND_API_URL}/public/movies/schedules/{schedule_id}/seats"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)

        if response.status_code != 200:
            return _json_result({
                "ok": False,
                "type": "seat_suggestion",
                "message": "Could not load seat map from backend.",
                "statusCode": response.status_code,
                "seats": [],
            })

        data = _response_data(response.json()) or {}
        seats = data.get("seats") or data.get("Seats") or data.get("seatMap") or []
        if not seats:
            return _json_result({
                "ok": False,
                "type": "seat_suggestion",
                "message": "Seat map is empty.",
                "seats": [],
            })

        all_rows = [_field(seat, "rowIndex", 0) for seat in seats]
        all_cols = [_field(seat, "colIndex", 0) for seat in seats]
        max_row = max(all_rows) if all_rows else 10
        max_col = max(all_cols) if all_cols else 15

        center_row_start = _field(data, "centerRowStart") or max_row // 3
        center_row_end = _field(data, "centerRowEnd") or 2 * (max_row // 3)
        center_col_start = _field(data, "centerColStart") or max_col // 3
        center_col_end = _field(data, "centerColEnd") or 2 * (max_col // 3)
        target_row = (center_row_start + center_row_end) / 2.0
        target_col = (center_col_start + center_col_end) / 2.0

        available = [
            seat for seat in seats
            if not (_field(seat, "isOccupied", False) or _field(seat, "isBooked", False))
        ]
        if len(available) < quantity:
            return _json_result({
                "ok": False,
                "type": "seat_suggestion",
                "message": f"Only {len(available)} available seats remain.",
                "availableCount": len(available),
                "seats": [],
            })

        seats_by_row: dict[int, list[dict[str, Any]]] = {}
        for seat in available:
            row = int(_field(seat, "rowIndex", 0))
            seats_by_row.setdefault(row, []).append(seat)

        clusters: list[tuple[list[dict[str, Any]], float]] = []
        for row_seats in seats_by_row.values():
            row_seats.sort(key=lambda item: _field(item, "colIndex", 0))
            for index in range(len(row_seats) - quantity + 1):
                subset = row_seats[index:index + quantity]
                consecutive = all(
                    _field(subset[i], "colIndex", 0) == _field(subset[i - 1], "colIndex", 0) + 1
                    for i in range(1, quantity)
                )
                if consecutive:
                    avg_row = sum(_field(seat, "rowIndex", 0) for seat in subset) / quantity
                    avg_col = sum(_field(seat, "colIndex", 0) for seat in subset) / quantity
                    score = (avg_row - target_row) ** 2 + (avg_col - target_col) ** 2
                    clusters.append((subset, score))

        strategy = "center_consecutive"
        if clusters:
            clusters.sort(key=lambda item: item[1])
            selected = clusters[0][0]
        else:
            strategy = "center_individual"
            available.sort(
                key=lambda seat: (_field(seat, "rowIndex", 0) - target_row) ** 2
                + (_field(seat, "colIndex", 0) - target_col) ** 2
            )
            selected = available[:quantity]

        normalized = [
            {
                "seatId": _field(seat, "seatId"),
                "seatNumber": _field(seat, "seatNumber") or _field(seat, "seatName"),
                "rowIndex": _field(seat, "rowIndex", 0),
                "colIndex": _field(seat, "colIndex", 0),
            }
            for seat in selected
        ]

        return _json_result({
            "ok": True,
            "type": "seat_suggestion",
            "message": "Seat suggestion generated.",
            "strategy": strategy,
            "quantity": quantity,
            "availableCount": len(available),
            "center": {"row": target_row, "col": target_col},
            "seatIds": [seat["seatId"] for seat in normalized],
            "seatNumbers": [seat["seatNumber"] for seat in normalized],
            "seats": normalized,
            "suggestedSeats": normalized,
            "seatMap": {
                **data,
                "seatMap": [_normalize_seat(seat) for seat in seats],
            },
        })
    except Exception as exc:
        logger.error(f"Error suggesting seats: {exc}")
        return _json_result({
            "ok": False,
            "type": "seat_suggestion",
            "message": f"Seat suggestion failed: {exc}",
            "seats": [],
        })


@tool
async def confirm_booking_tool(
    schedule_id: str,
    seat_ids: list,
    customer_email: str,
    user_segment_id: str = "",
    customer_name: str = "",
    customer_phone: str = "",
    payment_method: int = 0,
    voucher_id: str = "",
) -> str:
    """
    Create a booking order and return structured JSON with the VNPay payment URL.
    Every selected seat must include user_segment_id because the booking API prices by segment.
    """
    if not user_segment_id:
        return _json_result({
            "ok": False,
            "type": "booking_confirmation",
            "message": "Missing user_segment_id. Ask the customer to choose ticket type first.",
        })

    payload: dict[str, Any] = {
        "scheduleId": schedule_id,
        "seatSelections": [{"seatId": seat_id, "userSegmentId": user_segment_id} for seat_id in seat_ids],
        "customerEmail": customer_email,
        "customerName": customer_name or "Chatbot Customer",
        "customerPhone": customer_phone,
        "paymentMethod": payment_method,
    }

    if voucher_id and voucher_id.strip() not in ["", "null", "None", "undefined"]:
        payload["voucherId"] = voucher_id

    url = f"{BACKEND_API_URL}/booking/create"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, json=payload)

        response_json = response.json() if response.content else {}
        data = _response_data(response_json) or {}
        is_success = response_json.get("isSuccess", response_json.get("IsSuccess", response.status_code < 400))
        if response.status_code == 200 and is_success:
            return _json_result({
                "ok": True,
                "type": "booking_confirmation",
                "message": "Booking order created.",
                "orderId": _field(data, "orderId"),
                "paymentUrl": _field(data, "paymentUrl"),
                "totalPrice": _field(data, "totalPrice"),
                "totalQuantity": _field(data, "totalQuantity"),
                "orderDate": _field(data, "orderDate"),
            })

        return _json_result({
            "ok": False,
            "type": "booking_confirmation",
            "message": response_json.get("message") or response_json.get("Message") or "Booking creation failed.",
            "statusCode": response.status_code,
        })
    except Exception as exc:
        logger.error(f"Error confirming booking: {exc}")
        return _json_result({
            "ok": False,
            "type": "booking_confirmation",
            "message": f"Booking confirmation failed: {exc}",
        })
