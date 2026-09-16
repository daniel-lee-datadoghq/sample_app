package com.angularbank.api.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public enum OrderSide {
    BUY("buy"),
    SELL("sell");

    private final String value;

    OrderSide(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static OrderSide fromValue(String value) {
        for (OrderSide side : values()) {
            if (side.value.equalsIgnoreCase(value)) {
                return side;
            }
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid order side: " + value);
    }
}
