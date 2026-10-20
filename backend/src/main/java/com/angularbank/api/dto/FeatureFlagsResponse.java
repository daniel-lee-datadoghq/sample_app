package com.angularbank.api.dto;

import java.util.List;
import java.util.Map;

public class FeatureFlagsResponse {

    private final Map<String, Boolean> flags;
    private final List<String> roles;

    public FeatureFlagsResponse(Map<String, Boolean> flags, List<String> roles) {
        this.flags = flags;
        this.roles = roles;
    }

    public Map<String, Boolean> getFlags() { return flags; }
    public List<String> getRoles() { return roles; }
}
