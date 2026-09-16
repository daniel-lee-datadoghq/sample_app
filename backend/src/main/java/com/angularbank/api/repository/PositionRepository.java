package com.angularbank.api.repository;

import com.angularbank.api.model.Position;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PositionRepository extends JpaRepository<Position, Long> {
    Optional<Position> findByAccountIdAndSymbol(Long accountId, String symbol);
    List<Position> findByAccountIdOrderBySymbolAsc(Long accountId);
    List<Position> findByAccountIdInOrderBySymbolAsc(List<Long> accountIds);
    void deleteByAccountId(Long accountId);
}
