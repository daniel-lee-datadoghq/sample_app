package com.angularbank.api.service;

import com.angularbank.api.dto.FeatureFlagsResponse;
import com.angularbank.api.model.FeatureFlag;
import com.angularbank.api.model.User;
import com.angularbank.api.model.UserRole;
import com.angularbank.api.repository.FeatureFlagRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Resolves the flag set for the caller. Flags are stored server-side and switched on per role,
 * so the client never decides what it is entitled to see.
 */
@Service
public class FeatureFlagService {

    private final FeatureFlagRepository featureFlagRepository;
    private final CurrentUserService currentUserService;

    public FeatureFlagService(FeatureFlagRepository featureFlagRepository, CurrentUserService currentUserService) {
        this.featureFlagRepository = featureFlagRepository;
        this.currentUserService = currentUserService;
    }

    public FeatureFlagsResponse getFlagsForCurrentUser() {
        User user = currentUserService.requireCurrentUser();
        Set<UserRole> roles = user.getRoles();

        Map<String, Boolean> flags = new LinkedHashMap<>();
        for (FeatureFlag flag : featureFlagRepository.findAllByOrderByKeyAsc()) {
            flags.put(flag.getKey(), flag.isEnabledFor(roles));
        }

        List<String> roleValues = roles.stream().map(UserRole::getValue).sorted().toList();
        return new FeatureFlagsResponse(flags, roleValues);
    }
}
