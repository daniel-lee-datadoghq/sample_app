package com.angularbank.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class PlaceOrderRequest {
    @NotNull
    private Long accountId;

    @NotBlank
    @Size(max = 12)
    private String symbol;

    @NotBlank
    @Size(max = 120)
    private String name;

    @Size(max = 3)
    private String currency;

    /** "buy" or "sell". */
    @NotBlank
    private String side;

    @NotNull
    @DecimalMin(value = "0.00001")
    private BigDecimal quantity;

    /** Execution price used to settle the order. */
    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal price;

    /** market, limit, stop or trailing-stop-limit; recorded on the transaction. */
    @NotBlank
    @Size(max = 40)
    private String priceType;

    public Long getAccountId() { return accountId; }
    public void setAccountId(Long accountId) { this.accountId = accountId; }

    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getSide() { return side; }
    public void setSide(String side) { this.side = side; }

    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public String getPriceType() { return priceType; }
    public void setPriceType(String priceType) { this.priceType = priceType; }
}
