package com.angularbank.api.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Entitlement tier a user belongs to. Feature flags are switched on per role. */
public enum UserRole {
    RETAIL("retail"),
    PREMIUM("premium"),
    ADVISOR("advisor");

    private final String value;

    UserRole(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static UserRole fromValue(String value) {
        for (UserRole role : values()) {
            if (role.value.equalsIgnoreCase(value)) {
                return role;
            }
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid user role: " + value);
    }
}
