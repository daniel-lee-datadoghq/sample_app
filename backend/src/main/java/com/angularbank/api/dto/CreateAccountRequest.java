package com.angularbank.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class CreateAccountRequest {
    @NotBlank
    @Size(max = 100)
    private String name;

    @NotBlank
    private String type;

    @NotBlank
    @Size(max = 20)
    private String accountNumber;

    @NotNull
    private BigDecimal balance;

    @NotBlank
    @Size(max = 3)
    private String currency = "USD";

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
