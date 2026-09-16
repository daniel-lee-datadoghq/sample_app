package com.angularbank.api.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

/** A holding in a single security, scoped to the account that funded it. */
@Entity
@Table(
        name = "positions",
        uniqueConstraints = @UniqueConstraint(name = "uk_position_account_symbol", columnNames = {"account_id", "symbol"})
)
public class Position {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(nullable = false, length = 12)
    private String symbol;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 3)
    private String currency = "USD";

    /** Fractional shares are supported, so quantity keeps five decimal places. */
    @Column(nullable = false, precision = 18, scale = 5)
    private BigDecimal quantity;

    @Column(name = "average_cost", nullable = false, precision = 14, scale = 4)
    private BigDecimal averageCost;

    @Version
    private Long version;

    public Position() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getAccountId() { return accountId; }
    public void setAccountId(Long accountId) { this.accountId = accountId; }

    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }

    public BigDecimal getAverageCost() { return averageCost; }
    public void setAverageCost(BigDecimal averageCost) { this.averageCost = averageCost; }

    public Long getVersion() { return version; }
}
