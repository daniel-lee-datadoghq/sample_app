package com.angularbank.api.controller;

import com.angularbank.api.dto.FeatureFlagsResponse;
import com.angularbank.api.service.FeatureFlagService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/feature-flags")
public class FeatureFlagController {

    private final FeatureFlagService featureFlagService;

    public FeatureFlagController(FeatureFlagService featureFlagService) {
        this.featureFlagService = featureFlagService;
    }

    @GetMapping
    public FeatureFlagsResponse getFlags() {
        return featureFlagService.getFlagsForCurrentUser();
    }
}
