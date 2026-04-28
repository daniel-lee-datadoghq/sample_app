package com.angularbank.api.repository;

import com.angularbank.api.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AccountRepository extends JpaRepository<Account, Long> {
    List<Account> findByUserId(Long userId);

    @Query("SELECT COALESCE(SUM(a.balance), 0), COUNT(a) FROM Account a WHERE a.userId = :userId")
    List<Object[]> getBalanceAndCountByUserId(Long userId);
}
