package com.angularbank.api.dto;

import java.math.BigDecimal;

public class AccountSummaryResponse {
    private final BigDecimal totalBalance;
    private final long accountCount;

    public AccountSummaryResponse(BigDecimal totalBalance, long accountCount) {
        this.totalBalance = totalBalance;
        this.accountCount = accountCount;
    }

    public BigDecimal getTotalBalance() { return totalBalance; }
    public long getAccountCount() { return accountCount; }
}
