using System;
using DataAccess;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Migrations
{
    [DbContext(typeof(CinemaDbContext))]
    [Migration("20260610170000_AddAuditLogs")]
    public partial class AddAuditLogs : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AuditLogEntity]') AND type in (N'U'))
                BEGIN
                    CREATE TABLE [dbo].[AuditLogEntity] (
                        [AuditLogId] uniqueidentifier NOT NULL,
                        [Action] varchar(50) NOT NULL,
                        [EntityType] varchar(80) NOT NULL,
                        [EntityId] uniqueidentifier NULL,
                        [EntityName] nvarchar(300) NOT NULL,
                        [Description] nvarchar(1000) NOT NULL,
                        [ActorUserId] uniqueidentifier NOT NULL,
                        [ActorName] nvarchar(100) NOT NULL,
                        [ActorPrimaryRole] varchar(50) NOT NULL,
                        [IsAdminAction] bit NOT NULL,
                        [CinemaId] uniqueidentifier NULL,
                        [CreatedAt] datetime2 NOT NULL,
                        CONSTRAINT [PK_AuditLogEntity] PRIMARY KEY ([AuditLogId]),
                        CONSTRAINT [FK_AuditLogEntity_UserInfoEntity_ActorUserId] FOREIGN KEY ([ActorUserId]) REFERENCES [dbo].[UserInfoEntity] ([UserId])
                    );
                    CREATE INDEX [IX_AuditLogEntity_ActorUserId] ON [dbo].[AuditLogEntity] ([ActorUserId]);
                    CREATE INDEX [IX_AuditLogEntity_CinemaId] ON [dbo].[AuditLogEntity] ([CinemaId]);
                    CREATE INDEX [IX_AuditLogEntity_CreatedAt] ON [dbo].[AuditLogEntity] ([CreatedAt]);
                    CREATE INDEX [IX_AuditLogEntity_EntityType_EntityId] ON [dbo].[AuditLogEntity] ([EntityType], [EntityId]);
                END
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AuditLogEntity]') AND type in (N'U'))
                BEGIN
                    DROP TABLE [dbo].[AuditLogEntity];
                END
            ");
        }
    }
}
