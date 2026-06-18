using System.Data;
using Application.Common;
using DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace Infrastructure.Common;

/// <summary>
/// Unit of Work trên CinemaDbContext. Bọc SaveChanges để ánh xạ lỗi unique-violation
/// sang ConcurrencyConflictException (phục vụ fix race-condition B2).
/// </summary>
public class EfUnitOfWork : IUnitOfWork
{
    private readonly CinemaDbContext _dbContext;

    public EfUnitOfWork(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            throw new ConcurrencyConflictException("Ghi trùng dữ liệu (ghế vừa bị đặt).", ex);
        }
    }

    public async Task<IAppTransaction> BeginTransactionAsync(
        IsolationLevel isolationLevel = IsolationLevel.ReadCommitted,
        CancellationToken cancellationToken = default)
    {
        var tx = await _dbContext.Database.BeginTransactionAsync(isolationLevel, cancellationToken);
        return new EfTransaction(tx);
    }

    private static bool IsUniqueViolation(DbUpdateException ex)
    {
        // SQL Server: 2627 (PK/unique constraint), 2601 (unique index).
        var inner = ex.InnerException;
        var number = inner?.GetType().GetProperty("Number")?.GetValue(inner) as int?;
        return number is 2627 or 2601;
    }

    private sealed class EfTransaction : IAppTransaction
    {
        private readonly IDbContextTransaction _tx;

        public EfTransaction(IDbContextTransaction tx) => _tx = tx;

        public Task CommitAsync(CancellationToken cancellationToken = default) => _tx.CommitAsync(cancellationToken);

        public Task RollbackAsync(CancellationToken cancellationToken = default) => _tx.RollbackAsync(cancellationToken);

        public ValueTask DisposeAsync() => _tx.DisposeAsync();
    }
}
