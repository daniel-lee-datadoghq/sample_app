package com.angularbank.api.dto;

import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class UpdateAccountRequest {
    @Size(min = 1, max = 100)
    private String name;

    @Size(min = 1)
    private String type;

    @Size(min = 1, max = 20)
    private String accountNumber;

    private BigDecimal balance;

    @Size(min = 1, max = 3)
    private String currency;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }

    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
}
