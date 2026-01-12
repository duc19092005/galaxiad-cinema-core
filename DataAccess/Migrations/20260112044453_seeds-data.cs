using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class seedsdata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "user_info_entity",
                columns: new[] { "userId", "accoutStatus", "password", "refreshToken", "registerMethod", "subId", "userEmail" },
                values: new object[,]
                {
                    { new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), 0, "$2a$12$FeLXQjfW3gfNFfELxTJS3.gH8o9Y2CB5WSGcDZxKMrPEJiR2RcxIS", null, 0, null, "theater@example.com" },
                    { new Guid("a1b2c3d4-e5f6-7a8b-c9d0-e1f2a3b4c5d6"), 0, "$2a$12$CkugZHMrWhxG0h6hUqOAf.fX9QQFkLnfnLlI.xWCNZ1y/PivtfN2O", null, 0, null, "cashier@example.com" },
                    { new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"), 0, "$2a$12$ADqBiSquthm1g7bLZvg6UulJ5QJFQQ6olUQzf66AQfJDGbQ2W1wlG", null, 0, null, "user@example.com" },
                    { new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), 0, "$2a$12$91JfhncA5t3ssFtiaoKjSOrbMj7zON.wtL/n3cjme/wvK2kDCgZ7K", null, 0, null, "admin@example.com" },
                    { new Guid("f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e"), 0, "$2a$12$CkugZHMrWhxG0h6hUqOAf.fX9QQFkLnfnLlI.xWCNZ1y/PivtfN2O", null, 0, null, "facilities@example.com" }
                });

            migrationBuilder.InsertData(
                table: "user_profile_entity",
                columns: new[] { "userID", "dateOfBirth", "identityCode", "phoneNumber", "userName" },
                values: new object[,]
                {
                    { new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), new DateTime(1990, 5, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), "Pk3VcB5Kk2xdhHerF74zBg==", "0977234567", "Theater Manager" },
                    { new Guid("a1b2c3d4-e5f6-7a8b-c9d0-e1f2a3b4c5d6"), new DateTime(1995, 12, 12, 0, 0, 0, 0, DateTimeKind.Unspecified), "pFoBRlv4RT1kyqKE1Ch3Hw==", "0944456789", "Cashier" },
                    { new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"), new DateTime(2005, 10, 10, 0, 0, 0, 0, DateTimeKind.Unspecified), "NjItl/uAfIOjjzvtWPbnzg==", "0123456789", "Movie Manager 1" },
                    { new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), new DateTime(1985, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "pxc5zG8sfEcsJrHg1AjV3w==", "0988123456", "Admin" },
                    { new Guid("f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e"), new DateTime(1992, 8, 20, 0, 0, 0, 0, DateTimeKind.Unspecified), "cFobMOQzli9Um8tWi/vJZg==", "0966345678", "Facilities Manager" }
                });

            migrationBuilder.InsertData(
                table: "user_role_info_entity",
                columns: new[] { "roleId", "userId" },
                values: new object[,]
                {
                    { new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c"), new Guid("a1b2c3d4-e5f6-7a8b-c9d0-e1f2a3b4c5d6") },
                    { new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f"), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c") },
                    { new Guid("4d1e0f2a-b7c8-d9e0-f1a2-3b4c5d6e7f8a"), new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7") },
                    { new Guid("5e2f1a3b-c8d9-e0f1-a2b3-4c5d6e7f8a9b"), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5") },
                    { new Guid("6f3a2b4c-d9e0-f1a2-b3c4-d5e6f7a8b9c0"), new Guid("f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e") }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "user_profile_entity",
                keyColumn: "userID",
                keyValue: new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"));

            migrationBuilder.DeleteData(
                table: "user_profile_entity",
                keyColumn: "userID",
                keyValue: new Guid("a1b2c3d4-e5f6-7a8b-c9d0-e1f2a3b4c5d6"));

            migrationBuilder.DeleteData(
                table: "user_profile_entity",
                keyColumn: "userID",
                keyValue: new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"));

            migrationBuilder.DeleteData(
                table: "user_profile_entity",
                keyColumn: "userID",
                keyValue: new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"));

            migrationBuilder.DeleteData(
                table: "user_profile_entity",
                keyColumn: "userID",
                keyValue: new Guid("f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e"));

            migrationBuilder.DeleteData(
                table: "user_role_info_entity",
                keyColumns: new[] { "roleId", "userId" },
                keyValues: new object[] { new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c"), new Guid("a1b2c3d4-e5f6-7a8b-c9d0-e1f2a3b4c5d6") });

            migrationBuilder.DeleteData(
                table: "user_role_info_entity",
                keyColumns: new[] { "roleId", "userId" },
                keyValues: new object[] { new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f"), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c") });

            migrationBuilder.DeleteData(
                table: "user_role_info_entity",
                keyColumns: new[] { "roleId", "userId" },
                keyValues: new object[] { new Guid("4d1e0f2a-b7c8-d9e0-f1a2-3b4c5d6e7f8a"), new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7") });

            migrationBuilder.DeleteData(
                table: "user_role_info_entity",
                keyColumns: new[] { "roleId", "userId" },
                keyValues: new object[] { new Guid("5e2f1a3b-c8d9-e0f1-a2b3-4c5d6e7f8a9b"), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5") });

            migrationBuilder.DeleteData(
                table: "user_role_info_entity",
                keyColumns: new[] { "roleId", "userId" },
                keyValues: new object[] { new Guid("6f3a2b4c-d9e0-f1a2-b3c4-d5e6f7a8b9c0"), new Guid("f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e") });

            migrationBuilder.DeleteData(
                table: "user_info_entity",
                keyColumn: "userId",
                keyValue: new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"));

            migrationBuilder.DeleteData(
                table: "user_info_entity",
                keyColumn: "userId",
                keyValue: new Guid("a1b2c3d4-e5f6-7a8b-c9d0-e1f2a3b4c5d6"));

            migrationBuilder.DeleteData(
                table: "user_info_entity",
                keyColumn: "userId",
                keyValue: new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"));

            migrationBuilder.DeleteData(
                table: "user_info_entity",
                keyColumn: "userId",
                keyValue: new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"));

            migrationBuilder.DeleteData(
                table: "user_info_entity",
                keyColumn: "userId",
                keyValue: new Guid("f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e"));
        }
    }
}
