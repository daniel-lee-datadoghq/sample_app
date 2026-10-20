package com.angularbank.api.repository;

import com.angularbank.api.model.FeatureFlag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeatureFlagRepository extends JpaRepository<FeatureFlag, String> {
    List<FeatureFlag> findAllByOrderByKeyAsc();
}
