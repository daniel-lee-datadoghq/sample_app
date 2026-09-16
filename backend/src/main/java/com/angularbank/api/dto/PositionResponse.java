package com.angularbank.api.dto;

import com.angularbank.api.model.Account;
import com.angularbank.api.model.Position;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class PositionResponse {
    private final Long id;
    private final Long accountId;
    private final String accountName;
    private final String accountNumber;
    private final String symbol;
    private final String name;
    private final String currency;
    private final BigDecimal quantity;
    private final BigDecimal averageCost;
    private final BigDecimal costBasis;

    public PositionResponse(Position position, Account account) {
        this.id = position.getId();
        this.accountId = position.getAccountId();
        this.accountName = account.getName();
        this.accountNumber = account.getAccountNumber();
        this.symbol = position.getSymbol();
        this.name = position.getName();
        this.currency = position.getCurrency();
        this.quantity = position.getQuantity();
        this.averageCost = position.getAverageCost();
        this.costBasis = position.getQuantity().multiply(position.getAverageCost()).setScale(2, RoundingMode.HALF_UP);
    }

    public Long getId() { return id; }
    public Long getAccountId() { return accountId; }
    public String getAccountName() { return accountName; }
    public String getAccountNumber() { return accountNumber; }
    public String getSymbol() { return symbol; }
    public String getName() { return name; }
    public String getCurrency() { return currency; }
    public BigDecimal getQuantity() { return quantity; }
    public BigDecimal getAverageCost() { return averageCost; }
    public BigDecimal getCostBasis() { return costBasis; }
}
