namespace Cinema.Domain.Enums;

public enum ContractStatus
{
    Draft = 0,
    PendingReview = 1,
    ReadyToSign = 2,
    Signed = 3,
    Activated = 4,
    Suspended = 5,
    Terminated = 6,
    Cancelled = 7
}

public enum ContractTemplateStatus { Draft = 0, Published = 1, Retired = 2 }
public enum ContractProcessingStatus { NotStarted = 0, Queued = 1, Processing = 2, AwaitingDataApproval = 3, Applied = 4, Failed = 5 }
public enum ContractScopeState { Unresolved = 0, Specified = 1, NoAdditionalRestrictionConfirmed = 2 }
public enum ContractDocumentKind { Original = 0, Annex = 1, CounterpartySigned = 2, InternalSignedCopy = 3 }
public enum RevenueSettlementCycle { Weekly = 0, Monthly = 1 }
public enum MovieChangeRequestStatus { Draft = 0, PendingReview = 1, Approved = 2, Returned = 3, Rejected = 4 }
