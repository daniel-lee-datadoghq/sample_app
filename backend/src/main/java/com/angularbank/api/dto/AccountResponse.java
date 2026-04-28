package com.angularbank.api.dto;

import com.angularbank.api.model.Account;

import java.math.BigDecimal;

public class AccountResponse {
    private final Long id;
    private final String name;
    private final String type;
    private final String accountNumber;
    private final BigDecimal balance;
    private final String currency;

    public AccountResponse(Account account) {
        this.id = account.getId();
        this.name = account.getName();
        this.type = account.getType().getValue();
        this.accountNumber = account.getAccountNumber();
        this.balance = account.getBalance();
        this.currency = account.getCurrency();
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getType() { return type; }
    public String getAccountNumber() { return accountNumber; }
    public BigDecimal getBalance() { return balance; }
    public String getCurrency() { return currency; }
}
