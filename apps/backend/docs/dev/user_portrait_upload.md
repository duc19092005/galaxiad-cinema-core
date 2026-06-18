# User Portrait Upload API

## Regular Register Response

`POST /api/v1/IdentityAccess/regular-register` now returns the newly created `userId` in `data`.

```json
{
  "isSuccess": true,
  "message": "Register successfully",
  "data": "e9c8f615-3a01-42f5-b28f-f9c3b8a18d24"
}
```

FE Admin uses this `userId` to upload an employee portrait immediately after creating the account.

## Upload User Portrait

- Endpoint: `PUT /api/v1/AdminManageUsers/{userId}/portrait`
- Permission: `Admin`
- Content-Type: `multipart/form-data`
- Form field: `portrait` with an `image/*` file.

```json
{
  "isSuccess": true,
  "message": "Portrait image updated successfully.",
  "data": "https://res.cloudinary.com/.../portrait.jpg"
}
```

The uploaded URL is stored in `UserInfoEntity.PortraitImageUrl`.

## Responses That Include Portraits

These responses now expose `portraitImageUrl`:

- `GET /api/v1/AdminManageUsers`
- `GET /api/v1/IdentityAccess/get-profile`
- `GET /api/v1/TheaterManager/Shifts/staff-profiles`

