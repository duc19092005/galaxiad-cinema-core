using System.Linq.Expressions;

namespace Shared.Interfaces.Persistence;

public interface IRepository<TEntity> where TEntity : class
{
    IQueryable<TEntity> Query();

    Task<TEntity?> FindAsync(params object[] keyValues);

    Task AddAsync(TEntity entity, CancellationToken cancellationToken = default);

    Task AddRangeAsync(IEnumerable<TEntity> entities, CancellationToken cancellationToken = default);

    void Update(TEntity entity);

    void Remove(TEntity entity);

    void RemoveRange(IEnumerable<TEntity> entities);

    Task<bool> AnyAsync(Expression<Func<TEntity, bool>> predicate, CancellationToken cancellationToken = default);
}
