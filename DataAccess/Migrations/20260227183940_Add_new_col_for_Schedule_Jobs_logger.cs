using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class Add_new_col_for_Schedule_Jobs_logger : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ScheduleJobStatus",
                table: "BackGroundJobLoggerEntity",
                newName: "ScheduleJobStatusType");

            migrationBuilder.AddColumn<string>(
                name: "FailedReason",
                table: "BackGroundJobLoggerEntity",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FailedReason",
                table: "BackGroundJobLoggerEntity");

            migrationBuilder.RenameColumn(
                name: "ScheduleJobStatusType",
                table: "BackGroundJobLoggerEntity",
                newName: "ScheduleJobStatus");
        }
    }
}
