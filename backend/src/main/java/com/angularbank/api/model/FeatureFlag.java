package com.angularbank.api.model;

import jakarta.persistence.*;

import java.util.LinkedHashSet;
import java.util.Set;

/**
 * A server-side feature flag. A flag is on for a user when it is enabled for everyone, or when
 * the user holds one of the roles listed against it.
 */
@Entity
@Table(name = "feature_flags")
public class FeatureFlag {

    /** Named `flag_key` because `key` is a reserved word. */
    @Id
    @Column(name = "flag_key", length = 64)
    private String key;

    @Column(nullable = false)
    private String description;

    @Column(name = "enabled_for_all", nullable = false)
    private boolean enabledForAll = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "feature_flag_roles", joinColumns = @JoinColumn(name = "flag_key"))
    @Column(name = "role", nullable = false)
    @Enumerated(EnumType.STRING)
    private Set<UserRole> enabledRoles = new LinkedHashSet<>();

    public FeatureFlag() {}

    public boolean isEnabledFor(Set<UserRole> roles) {
        return enabledForAll || roles.stream().anyMatch(enabledRoles::contains);
    }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isEnabledForAll() { return enabledForAll; }
    public void setEnabledForAll(boolean enabledForAll) { this.enabledForAll = enabledForAll; }

    public Set<UserRole> getEnabledRoles() { return enabledRoles; }
    public void setEnabledRoles(Set<UserRole> enabledRoles) { this.enabledRoles = enabledRoles; }
}
