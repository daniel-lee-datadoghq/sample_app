package com.angularbank.api.dto;

import com.angularbank.api.model.Transaction;

import java.math.BigDecimal;
import java.time.LocalDate;

public class TransactionResponse {
    private final Long id;
    private final Long accountId;
    private final LocalDate date;
    private final String description;
    private final BigDecimal amount;
    private final String type;

    public TransactionResponse(Transaction transaction) {
        this.id = transaction.getId();
        this.accountId = transaction.getAccountId();
        this.date = transaction.getDate();
        this.description = transaction.getDescription();
        this.amount = transaction.getAmount();
        this.type = transaction.getType().getValue();
    }

    public Long getId() { return id; }
    public Long getAccountId() { return accountId; }
    public LocalDate getDate() { return date; }
    public String getDescription() { return description; }
    public BigDecimal getAmount() { return amount; }
    public String getType() { return type; }
}
