package com.angularbank.api.repository;

import com.angularbank.api.model.Transaction;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByAccountIdOrderByDateDesc(Long accountId);
    List<Transaction> findByAccountIdInOrderByDateDesc(List<Long> accountIds, Pageable pageable);
    void deleteByAccountId(Long accountId);
}
