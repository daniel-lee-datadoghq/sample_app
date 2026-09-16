package com.angularbank.api.dto;

import java.math.BigDecimal;

public class OrderResponse {
    private final String confirmationNumber;
    private final String placedAt;
    private final String side;
    private final String symbol;
    private final BigDecimal quantity;
    private final BigDecimal price;
    private final BigDecimal grossAmount;
    private final BigDecimal commission;
    private final BigDecimal netAmount;
    private final TransactionResponse transaction;
    /** The resulting holding, or null when a sell closed the position. */
    private final PositionResponse position;

    public OrderResponse(
            String confirmationNumber,
            String placedAt,
            String side,
            String symbol,
            BigDecimal quantity,
            BigDecimal price,
            BigDecimal grossAmount,
            BigDecimal commission,
            BigDecimal netAmount,
            TransactionResponse transaction,
            PositionResponse position
    ) {
        this.confirmationNumber = confirmationNumber;
        this.placedAt = placedAt;
        this.side = side;
        this.symbol = symbol;
        this.quantity = quantity;
        this.price = price;
        this.grossAmount = grossAmount;
        this.commission = commission;
        this.netAmount = netAmount;
        this.transaction = transaction;
        this.position = position;
    }

    public String getConfirmationNumber() { return confirmationNumber; }
    public String getPlacedAt() { return placedAt; }
    public String getSide() { return side; }
    public String getSymbol() { return symbol; }
    public BigDecimal getQuantity() { return quantity; }
    public BigDecimal getPrice() { return price; }
    public BigDecimal getGrossAmount() { return grossAmount; }
    public BigDecimal getCommission() { return commission; }
    public BigDecimal getNetAmount() { return netAmount; }
    public TransactionResponse getTransaction() { return transaction; }
    public PositionResponse getPosition() { return position; }
}
